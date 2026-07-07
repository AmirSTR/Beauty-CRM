import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

function dateOnly(offsetDays: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
}

function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

async function main() {
  const email = "master@example.com";
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    await prisma.payment.deleteMany({ where: { userId: existingUser.id } });
    await prisma.reminder.deleteMany({ where: { userId: existingUser.id } });
    await prisma.clientNote.deleteMany({ where: { userId: existingUser.id } });
    await prisma.appointment.deleteMany({ where: { userId: existingUser.id } });
    await prisma.messageTemplate.deleteMany({ where: { userId: existingUser.id } });
    await prisma.client.deleteMany({ where: { userId: existingUser.id } });
    await prisma.service.deleteMany({ where: { userId: existingUser.id } });
    await prisma.masterProfile.deleteMany({ where: { userId: existingUser.id } });
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const user = await prisma.user.create({
    data: {
      name: "Master",
      email,
      passwordHash: await hashPassword("password123"),
      profile: {
        create: {
          specialization: "Маникюр, брови, макияж",
          city: "Алматы",
          address: "ул. Абая, 10",
          phone: "+7 700 000 00 00",
          instagram: "@beauty_master",
          telegram: "@beauty_master",
          whatsapp: "+77000000000",
          currency: "KZT",
          workStartTime: "09:00",
          workEndTime: "19:00",
          workDays: "1,2,3,4,5,6"
        }
      }
    }
  });

  const serviceData = [
    ["Маникюр с покрытием", "Ногти", 120, 15000],
    ["Педикюр", "Ногти", 90, 14000],
    ["Брови коррекция", "Брови", 30, 5000],
    ["Брови окрашивание", "Брови", 45, 7000],
    ["Макияж", "Макияж", 90, 25000],
    ["Укладка", "Волосы", 60, 18000]
  ] as const;

  const services = await Promise.all(
    serviceData.map(([name, category, durationMinutes, price]) =>
      prisma.service.create({
        data: {
          userId: user.id,
          name,
          category,
          durationMinutes,
          price,
          description: `${name}: пример услуги.`
        }
      })
    )
  );

  const clientData = [
    ["Алия Нур", "+7 701 111 11 11", "Instagram", "Regular"],
    ["Марина Соколова", "+7 702 222 22 22", "Referral", "Sleeping"],
    ["Дина Ермек", "+7 703 333 33 33", "WhatsApp", "Active"],
    ["Ольга Белова", "+7 704 444 44 44", "GoogleMaps", "VIP"],
    ["Сауле Ким", "+7 705 555 55 55", "Telegram", "New"],
    ["Екатерина Ли", "+7 706 666 66 66", "TikTok", "Active"],
    ["Жанна Алиева", "+7 707 777 77 77", "TwoGIS", "Problem"],
    ["Ирина Морозова", "+7 708 888 88 88", "Ads", "New"]
  ] as const;

  const clients = await Promise.all(
    clientData.map(([name, phone, source, status], index) =>
      prisma.client.create({
        data: {
          userId: user.id,
          name,
          phone,
          email: `client${index + 1}@example.com`,
          instagram: `client_${index + 1}`,
          telegram: `client_${index + 1}`,
          source,
          status,
          preferences: index % 2 === 0 ? "Любит утренние слоты" : "Предпочитает вечер",
          allergies: index === 2 ? "Чувствительность к красителю" : null,
          notes: "Клиент из начального набора данных."
        }
      })
    )
  );

  const appointmentPlan = [
    [0, 0, -45, "10:00", "Completed"],
    [1, 1, -40, "12:00", "Completed"],
    [2, 2, -32, "11:00", "Completed"],
    [3, 4, -25, "15:00", "Completed"],
    [4, 0, -18, "09:30", "Completed"],
    [5, 5, -12, "16:00", "Completed"],
    [6, 3, -10, "13:00", "NoShow"],
    [6, 2, -7, "14:00", "NoShow"],
    [7, 1, -4, "10:00", "Cancelled"],
    [0, 0, 0, "10:00", "Confirmed"],
    [2, 3, 0, "13:00", "New"],
    [4, 2, 1, "11:00", "Confirmed"],
    [5, 5, 3, "15:00", "New"],
    [1, 0, 7, "12:00", "Confirmed"],
    [3, 4, 12, "10:00", "New"]
  ] as const;

  const appointments = await Promise.all(
    appointmentPlan.map(([clientIndex, serviceIndex, offset, startTime, status]) => {
      const service = services[serviceIndex];
      const price = Number(service.price);
      return prisma.appointment.create({
        data: {
          userId: user.id,
          clientId: clients[clientIndex].id,
          serviceId: service.id,
          date: dateOnly(offset),
          startTime,
          endTime: addMinutes(startTime, service.durationMinutes),
          price,
          status,
          paymentStatus: status === "Completed" ? "Paid" : "Unpaid",
          comment: status === "NoShow" ? "Не пришла без предупреждения" : null
        }
      });
    })
  );

  const paidAppointments = appointments.filter((appointment) => appointment.status === "Completed");
  await Promise.all(
    paidAppointments.map((appointment, index) =>
      prisma.payment.create({
        data: {
          userId: user.id,
          appointmentId: appointment.id,
          clientId: appointment.clientId,
          amount: Number(appointment.price),
          method: index % 3 === 0 ? "Cash" : index % 3 === 1 ? "Card" : "Transfer",
          status: "Paid",
          paidAt: dateOnly(index - 10),
          comment: "Оплачено после визита"
        }
      })
    )
  );

  await prisma.payment.create({
    data: {
      userId: user.id,
      appointmentId: appointments[10].id,
      clientId: appointments[10].clientId,
      amount: 3000,
      method: "Transfer",
      status: "Partial",
      paidAt: dateOnly(0),
      comment: "Предоплата"
    }
  });
  await prisma.appointment.update({
    where: { id: appointments[10].id },
    data: { paymentStatus: "PartiallyPaid" }
  });

  await Promise.all([
    prisma.clientNote.create({
      data: {
        userId: user.id,
        clientId: clients[0].id,
        note: "Предпочитает нюдовые оттенки и запись в первой половине дня."
      }
    }),
    prisma.clientNote.create({
      data: {
        userId: user.id,
        clientId: clients[2].id,
        note: "Проверять аллергию перед окрашиванием."
      }
    }),
    prisma.clientNote.create({
      data: {
        userId: user.id,
        clientId: clients[3].id,
        note: "VIP-клиент, удобно предлагать окна заранее."
      }
    })
  ]);

  await Promise.all([
    prisma.reminder.create({
      data: {
        userId: user.id,
        clientId: clients[1].id,
        type: "FollowUp",
        message: "Написать Марине про повторный маникюр.",
        remindAt: dateOnly(0)
      }
    }),
    prisma.reminder.create({
      data: {
        userId: user.id,
        clientId: clients[0].id,
        appointmentId: appointments[9].id,
        type: "AppointmentMaster",
        message: "Подготовиться к записи Алии.",
        remindAt: dateOnly(0)
      }
    }),
    prisma.reminder.create({
      data: {
        userId: user.id,
        clientId: clients[4].id,
        type: "Birthday",
        message: "Проверить дату рождения Сауле и предложить поздравительный бонус.",
        remindAt: dateOnly(2)
      }
    })
  ]);

  await prisma.messageTemplate.createMany({
    data: [
      {
        userId: user.id,
        name: "Напоминание о записи",
        type: "AppointmentReminder",
        body: "Здравствуйте, {{clientName}}! Напоминаю, что вы записаны на {{serviceName}} {{date}} в {{time}}."
      },
      {
        userId: user.id,
        name: "Повторная запись",
        type: "FollowUp",
        body: "Здравствуйте, {{clientName}}! У вас уже прошло около месяца после последнего визита. Могу предложить удобное время на этой неделе, чтобы обновить {{serviceName}}."
      },
      {
        userId: user.id,
        name: "Возврат клиента",
        type: "Winback",
        body: "Здравствуйте, {{clientName}}! Давно вас не видела. На этой неделе есть несколько свободных окошек, могу предложить удобное время."
      }
    ]
  });

  console.log("Seed complete");
  console.log("Email: master@example.com");
  console.log("Password: password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
