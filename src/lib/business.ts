import { addDays, differenceInCalendarDays, startOfDay, subDays, subHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  addMinutesToTime,
  dateFromInput,
  dateTimeFromParts,
  isOverlapping,
  toMinutes
} from "@/lib/time";
import { DEFAULT_FOLLOW_UP_TEMPLATE, DEFAULT_WINBACK_TEMPLATE } from "@/lib/constants";

type ProfileForSchedule = {
  workStartTime: string;
  workEndTime: string;
  workDays: string;
};

const ACTIVE_APPOINTMENT_STATUSES = ["New", "Confirmed"] as const;
const PAID_PAYMENT_STATUSES = ["Paid", "Partial"] as const;

export function buildFollowUpMessage(clientName: string, serviceName?: string | null) {
  const template = serviceName ? DEFAULT_FOLLOW_UP_TEMPLATE : DEFAULT_WINBACK_TEMPLATE;

  return template
    .replaceAll("{{clientName}}", clientName)
    .replaceAll("{{serviceName}}", serviceName || "");
}

export function ensureWorkingTime(
  profile: ProfileForSchedule | null,
  date: Date,
  startTime: string,
  endTime: string
) {
  const safeProfile = profile ?? {
    workStartTime: "09:00",
    workEndTime: "19:00",
    workDays: "1,2,3,4,5"
  };
  const workDays = safeProfile.workDays.split(",");
  const day = date.getUTCDay().toString();

  if (!workDays.includes(day)) {
    throw new Error("Выбранное время вне рабочего графика.");
  }

  if (
    toMinutes(startTime) < toMinutes(safeProfile.workStartTime) ||
    toMinutes(endTime) > toMinutes(safeProfile.workEndTime) ||
    toMinutes(endTime) <= toMinutes(startTime)
  ) {
    throw new Error("Выбранное время вне рабочего графика.");
  }
}

export async function ensureNoAppointmentOverlap({
  userId,
  date,
  startTime,
  endTime,
  excludeAppointmentId
}: {
  userId: string;
  date: Date;
  startTime: string;
  endTime: string;
  excludeAppointmentId?: string;
}) {
  const appointments = await prisma.appointment.findMany({
    where: {
      userId,
      date,
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {})
    },
    select: {
      id: true,
      startTime: true,
      endTime: true
    }
  });

  const overlaps = appointments.some((appointment) =>
    isOverlapping(startTime, endTime, appointment.startTime, appointment.endTime)
  );

  if (overlaps) {
    throw new Error("На это время уже есть запись.");
  }
}

export async function createAppointmentWithRules({
  userId,
  clientId,
  serviceId,
  date,
  startTime,
  price,
  comment
}: {
  userId: string;
  clientId: string;
  serviceId: string;
  date: string;
  startTime: string;
  price?: number;
  comment?: string;
}) {
  const [client, service, profile] = await Promise.all([
    prisma.client.findFirst({
      where: { id: clientId, userId, isArchived: false }
    }),
    prisma.service.findFirst({
      where: { id: serviceId, userId, isActive: true }
    }),
    prisma.masterProfile.findUnique({
      where: { userId }
    })
  ]);

  if (!client) throw new Error("Клиент не найден.");
  if (!service) throw new Error("Услуга не найдена.");

  const appointmentDate = dateFromInput(date);
  const endTime = addMinutesToTime(startTime, service.durationMinutes);

  ensureWorkingTime(profile, appointmentDate, startTime, endTime);
  await ensureNoAppointmentOverlap({
    userId,
    date: appointmentDate,
    startTime,
    endTime
  });

  const appointment = await prisma.appointment.create({
    data: {
      userId,
      clientId,
      serviceId,
      date: appointmentDate,
      startTime,
      endTime,
      price: price ?? Number(service.price),
      comment
    },
    include: {
      client: true,
      service: true
    }
  });

  await createAppointmentReminders(appointment.id, userId);
  return appointment;
}

export async function rescheduleAppointmentWithRules({
  userId,
  appointmentId,
  date,
  startTime
}: {
  userId: string;
  appointmentId: string;
  date: string;
  startTime: string;
}) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
    include: {
      service: true
    }
  });

  if (!appointment) throw new Error("Запись не найдена.");

  const profile = await prisma.masterProfile.findUnique({ where: { userId } });
  const appointmentDate = dateFromInput(date);
  const endTime = addMinutesToTime(startTime, appointment.service.durationMinutes);

  ensureWorkingTime(profile, appointmentDate, startTime, endTime);
  await ensureNoAppointmentOverlap({
    userId,
    date: appointmentDate,
    startTime,
    endTime,
    excludeAppointmentId: appointmentId
  });

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      date: appointmentDate,
      startTime,
      endTime,
      status: "Rescheduled"
    }
  });
}

export async function createAppointmentReminders(appointmentId: string, userId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
    include: {
      client: true,
      service: true
    }
  });

  if (!appointment) return;

  const startsAt = dateTimeFromParts(appointment.date, appointment.startTime);

  await prisma.reminder.createMany({
    data: [
      {
        userId,
        clientId: appointment.clientId,
        appointmentId,
        type: "AppointmentClient",
        message: `Напомнить клиенту ${appointment.client.name} о записи на ${appointment.service.name}.`,
        remindAt: subDays(startsAt, 1)
      },
      {
        userId,
        clientId: appointment.clientId,
        appointmentId,
        type: "AppointmentMaster",
        message: `Скоро запись: ${appointment.client.name}, ${appointment.service.name}.`,
        remindAt: subHours(startsAt, 2)
      }
    ]
  });
}

export async function createFollowUpReminder(appointmentId: string, userId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
    include: {
      client: true,
      service: true
    }
  });

  if (!appointment) return;

  const remindAt = addDays(dateTimeFromParts(appointment.date, appointment.startTime), 25);

  await prisma.reminder.upsert({
    where: {
      id: `${appointmentId}-follow-up`
    },
    create: {
      id: `${appointmentId}-follow-up`,
      userId,
      clientId: appointment.clientId,
      appointmentId,
      type: "FollowUp",
      message: buildFollowUpMessage(appointment.client.name, appointment.service.name),
      remindAt
    },
    update: {
      message: buildFollowUpMessage(appointment.client.name, appointment.service.name),
      remindAt,
      status: "Pending"
    }
  });
}

export async function recalculateAppointmentPaymentStatus(appointmentId: string, userId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
    include: {
      payments: true
    }
  });

  if (!appointment) return null;

  const paidTotal = appointment.payments
    .filter((payment) => PAID_PAYMENT_STATUSES.includes(payment.status as "Paid" | "Partial"))
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const refundedTotal = appointment.payments
    .filter((payment) => payment.status === "Refunded")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const price = Number(appointment.price);
  const netPaid = Math.max(0, paidTotal - refundedTotal);

  const paymentStatus =
    refundedTotal > 0 && netPaid === 0
      ? "Refunded"
      : netPaid >= price
        ? "Paid"
        : netPaid > 0
          ? "PartiallyPaid"
          : "Unpaid";

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { paymentStatus }
  });
}

export async function recalculateClientStatus(clientId: string, userId: string) {
  const [completedAppointments, noShowCount, payments] = await Promise.all([
    prisma.appointment.findMany({
      where: { clientId, userId, status: "Completed" },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      select: {
        date: true
      }
    }),
    prisma.appointment.count({
      where: { clientId, userId, status: "NoShow" }
    }),
    prisma.payment.findMany({
      where: {
        clientId,
        userId,
        status: { in: [...PAID_PAYMENT_STATUSES] }
      },
      select: {
        amount: true
      }
    })
  ]);

  const completedCount = completedAppointments.length;
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const lastCompleted = completedAppointments[0]?.date;

  let status: "New" | "Active" | "Regular" | "Sleeping" | "VIP" | "Problem" = "New";

  if (noShowCount >= 2) {
    status = "Problem";
  } else if (totalPaid > 100000) {
    status = "VIP";
  } else if (lastCompleted && differenceInCalendarDays(new Date(), lastCompleted) > 60) {
    status = "Sleeping";
  } else if (completedCount >= 5) {
    status = "Regular";
  } else if (completedCount >= 2) {
    status = "Active";
  }

  return prisma.client.update({
    where: { id: clientId },
    data: { status }
  });
}

export async function getFollowUpCandidates(userId: string) {
  const clients = await prisma.client.findMany({
    where: {
      userId,
      isArchived: false
    },
    include: {
      appointments: {
        where: { status: "Completed" },
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
        take: 1,
        include: {
          service: true
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  const candidateClients = clients.filter((client) => {
    const lastVisit = client.appointments[0];
    if (!lastVisit) return false;
    return differenceInCalendarDays(startOfDay(new Date()), lastVisit.date) >= 25;
  });

  if (candidateClients.length === 0) return [];

  const futureAppointments = await prisma.appointment.findMany({
    where: {
      userId,
      clientId: { in: candidateClients.map((client) => client.id) },
      date: { gte: startOfDay(new Date()) },
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] }
    },
    select: {
      clientId: true
    }
  });
  const clientsWithFutureAppointment = new Set(futureAppointments.map((appointment) => appointment.clientId));

  return candidateClients
    .filter((client) => !clientsWithFutureAppointment.has(client.id))
    .map((client) => {
      const lastVisit = client.appointments[0];
      return {
        id: client.id,
        name: client.name,
        phone: client.phone,
        lastVisitDate: lastVisit.date,
        serviceName: lastVisit.service?.name ?? null,
        message: buildFollowUpMessage(client.name, lastVisit.service?.name)
      };
    });
}
