"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clearSession,
  hashPassword,
  requireUser,
  setSession,
  verifyPassword
} from "@/lib/auth";
import {
  appointmentSchema,
  appointmentStatusSchema,
  authSchema,
  clientSchema,
  noteSchema,
  paymentSchema,
  profileSchema,
  registerSchema,
  reminderStatusSchema,
  serviceSchema,
  templateSchema,
  type ActionResult
} from "@/lib/validations";
import {
  createAppointmentWithRules,
  createFollowUpReminder,
  recalculateAppointmentPaymentStatus,
  recalculateClientStatus,
  rescheduleAppointmentWithRules
} from "@/lib/business";
import { dateFromInput } from "@/lib/time";

type AuthResult = ActionResult & {
  redirectTo?: string;
};

function getActionError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.errors[0]?.message ?? "Заполните обязательные поля.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Что-то пошло не так. Попробуйте еще раз.";
}

function revalidateCrm() {
  [
    "/dashboard",
    "/calendar",
    "/clients",
    "/services",
    "/finance",
    "/analytics",
    "/settings"
  ].forEach((path) => revalidatePath(path));
}

async function createDefaultProfileAndTemplates(userId: string) {
  await prisma.masterProfile.upsert({
    where: { userId },
    create: {
      userId,
      currency: "KZT",
      workStartTime: "09:00",
      workEndTime: "19:00",
      workDays: "1,2,3,4,5"
    },
    update: {}
  });

  const templateCount = await prisma.messageTemplate.count({ where: { userId } });

  if (templateCount === 0) {
    await prisma.messageTemplate.createMany({
      data: [
        {
          userId,
          name: "Напоминание о записи",
          type: "AppointmentReminder",
          body: "Здравствуйте, {{clientName}}! Напоминаю, что вы записаны на {{serviceName}} {{date}} в {{time}}."
        },
        {
          userId,
          name: "Повторная запись",
          type: "FollowUp",
          body: "Здравствуйте, {{clientName}}! У вас уже прошло около месяца после последнего визита. Могу предложить удобное время на этой неделе, чтобы обновить {{serviceName}}."
        }
      ]
    });
  }
}

export async function registerAction(values: unknown): Promise<AuthResult> {
  try {
    const data = registerSchema.parse(values);
    const email = data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return { ok: false, error: "Пользователь с таким email уже существует." };
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        passwordHash: await hashPassword(data.password)
      }
    });

    await createDefaultProfileAndTemplates(user.id);
    await setSession(user.id);

    return { ok: true, redirectTo: "/settings" };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function loginAction(values: unknown): Promise<AuthResult> {
  try {
    const data = authSchema.parse(values);
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      return { ok: false, error: "Неверный email или пароль." };
    }

    await createDefaultProfileAndTemplates(user.id);
    await setSession(user.id);

    return { ok: true, redirectTo: "/dashboard" };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function saveProfileAction(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = profileSchema.parse(values);

    await prisma.masterProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...data,
        workDays: data.workDays.join(",")
      },
      update: {
        ...data,
        workDays: data.workDays.join(",")
      }
    });

    revalidateCrm();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function saveServiceAction(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = serviceSchema.parse(values);

    if (data.id) {
      const service = await prisma.service.findFirst({
        where: { id: data.id, userId: user.id }
      });
      if (!service) throw new Error("Услуга не найдена.");

      await prisma.service.update({
        where: { id: data.id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          durationMinutes: data.durationMinutes,
          price: data.price
        }
      });
    } else {
      await prisma.service.create({
        data: {
          userId: user.id,
          name: data.name,
          description: data.description,
          category: data.category,
          durationMinutes: data.durationMinutes,
          price: data.price
        }
      });
    }

    revalidateCrm();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function archiveServiceAction(id: string) {
  const user = await requireUser();
  await prisma.service.updateMany({
    where: { id, userId: user.id },
    data: { isActive: false }
  });
  revalidateCrm();
}

export async function restoreServiceAction(id: string) {
  const user = await requireUser();
  await prisma.service.updateMany({
    where: { id, userId: user.id },
    data: { isActive: true }
  });
  revalidateCrm();
}

export async function saveClientAction(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = clientSchema.parse(values);

    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email,
      birthDate: data.birthDate ? dateFromInput(data.birthDate) : null,
      instagram: data.instagram,
      telegram: data.telegram,
      source: data.source,
      notes: data.notes,
      allergies: data.allergies,
      preferences: data.preferences,
      status: data.status ?? "New"
    };

    if (data.id) {
      const client = await prisma.client.findFirst({
        where: { id: data.id, userId: user.id }
      });
      if (!client) throw new Error("Клиент не найден.");

      await prisma.client.update({
        where: { id: data.id },
        data: payload
      });
    } else {
      await prisma.client.create({
        data: {
          userId: user.id,
          ...payload
        }
      });
    }

    revalidateCrm();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function archiveClientAction(id: string) {
  const user = await requireUser();
  await prisma.client.updateMany({
    where: { id, userId: user.id },
    data: { isArchived: true }
  });
  revalidateCrm();
}

export async function restoreClientAction(id: string) {
  const user = await requireUser();
  await prisma.client.updateMany({
    where: { id, userId: user.id },
    data: { isArchived: false }
  });
  revalidateCrm();
}

export async function saveAppointmentAction(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = appointmentSchema.parse(values);

    if (data.id) {
      await rescheduleAppointmentWithRules({
        userId: user.id,
        appointmentId: data.id,
        date: data.date,
        startTime: data.startTime
      });
    } else {
      await createAppointmentWithRules({
        userId: user.id,
        clientId: data.clientId,
        serviceId: data.serviceId,
        date: data.date,
        startTime: data.startTime,
        price: data.price,
        comment: data.comment
      });
    }

    revalidateCrm();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function updateAppointmentStatusAction(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = appointmentStatusSchema.parse(values);
    const appointment = await prisma.appointment.findFirst({
      where: { id: data.id, userId: user.id }
    });

    if (!appointment) throw new Error("Запись не найдена.");

    await prisma.appointment.update({
      where: { id: data.id },
      data: { status: data.status }
    });

    if (data.status === "Completed") {
      await createFollowUpReminder(data.id, user.id);
    }

    await recalculateClientStatus(appointment.clientId, user.id);
    revalidateCrm();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function cancelAppointmentAction(id: string) {
  const user = await requireUser();
  const appointment = await prisma.appointment.findFirst({ where: { id, userId: user.id } });
  if (!appointment) return;

  await prisma.appointment.update({
    where: { id },
    data: { status: "Cancelled" }
  });
  await recalculateClientStatus(appointment.clientId, user.id);
  revalidateCrm();
}

export async function savePaymentAction(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = paymentSchema.parse(values);
    const appointment = await prisma.appointment.findFirst({
      where: { id: data.appointmentId, userId: user.id }
    });

    if (!appointment) throw new Error("Запись не найдена.");

    if (data.id) {
      const payment = await prisma.payment.findFirst({
        where: { id: data.id, userId: user.id }
      });
      if (!payment) throw new Error("Оплата не найдена.");

      await prisma.payment.update({
        where: { id: data.id },
        data: {
          appointmentId: data.appointmentId,
          clientId: appointment.clientId,
          amount: data.amount,
          method: data.method,
          status: data.status,
          paidAt: new Date(`${data.paidAt}T12:00:00.000Z`),
          comment: data.comment
        }
      });
    } else {
      await prisma.payment.create({
        data: {
          userId: user.id,
          appointmentId: data.appointmentId,
          clientId: appointment.clientId,
          amount: data.amount,
          method: data.method,
          status: data.status,
          paidAt: new Date(`${data.paidAt}T12:00:00.000Z`),
          comment: data.comment
        }
      });
    }

    await recalculateAppointmentPaymentStatus(data.appointmentId, user.id);
    await recalculateClientStatus(appointment.clientId, user.id);
    revalidateCrm();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function deletePaymentAction(id: string) {
  const user = await requireUser();
  const payment = await prisma.payment.findFirst({
    where: { id, userId: user.id }
  });
  if (!payment) return;

  await prisma.payment.delete({ where: { id } });
  await recalculateAppointmentPaymentStatus(payment.appointmentId, user.id);
  await recalculateClientStatus(payment.clientId, user.id);
  revalidateCrm();
}

export async function saveNoteAction(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = noteSchema.parse(values);
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, userId: user.id }
    });

    if (!client) throw new Error("Клиент не найден.");

    await prisma.clientNote.create({
      data: {
        userId: user.id,
        clientId: data.clientId,
        note: data.note
      }
    });

    revalidatePath(`/clients/${data.clientId}`);
    revalidateCrm();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function deleteNoteAction(id: string) {
  const user = await requireUser();
  const note = await prisma.clientNote.findFirst({
    where: { id, userId: user.id }
  });
  if (!note) return;

  await prisma.clientNote.delete({ where: { id } });
  revalidatePath(`/clients/${note.clientId}`);
}

export async function updateReminderStatusAction(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = reminderStatusSchema.parse(values);
    await prisma.reminder.updateMany({
      where: { id: data.id, userId: user.id },
      data: { status: data.status }
    });
    revalidateCrm();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function saveTemplateAction(values: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = templateSchema.parse(values);

    if (data.id) {
      await prisma.messageTemplate.updateMany({
        where: { id: data.id, userId: user.id },
        data: {
          name: data.name,
          type: data.type,
          body: data.body
        }
      });
    } else {
      await prisma.messageTemplate.create({
        data: {
          userId: user.id,
          name: data.name,
          type: data.type,
          body: data.body
        }
      });
    }

    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}

export async function deleteTemplateAction(id: string) {
  const user = await requireUser();
  await prisma.messageTemplate.deleteMany({
    where: { id, userId: user.id }
  });
  revalidatePath("/settings");
}
