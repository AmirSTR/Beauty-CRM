import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import Link from "next/link";
import { CalendarPlus, WalletCards } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getFollowUpCandidates } from "@/lib/business";
import { money, shortDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { ReminderButton } from "@/components/ReminderButton";
import { AppointmentStatusForm } from "@/components/AppointmentStatusForm";

export default async function DashboardPage() {
  const user = await requireUser();
  const today = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const [profile, todayAppointments, upcomingAppointment, revenueToday, revenueMonth, newClientsMonth, unpaidAppointments, reminders, followUpClients] =
    await Promise.all([
      prisma.masterProfile.findUnique({ where: { userId: user.id } }),
      prisma.appointment.findMany({
        where: {
          userId: user.id,
          date: { gte: today, lte: todayEnd }
        },
        include: { client: true, service: true },
        orderBy: [{ startTime: "asc" }]
      }),
      prisma.appointment.findFirst({
        where: {
          userId: user.id,
          date: { gte: today },
          status: { in: ["New", "Confirmed"] }
        },
        include: { client: true, service: true },
        orderBy: [{ date: "asc" }, { startTime: "asc" }]
      }),
      prisma.payment.aggregate({
        where: {
          userId: user.id,
          status: { in: ["Paid", "Partial"] },
          paidAt: { gte: today, lte: todayEnd }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          userId: user.id,
          status: { in: ["Paid", "Partial"] },
          paidAt: { gte: monthStart, lte: monthEnd }
        },
        _sum: { amount: true }
      }),
      prisma.client.count({
        where: {
          userId: user.id,
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      prisma.appointment.findMany({
        where: {
          userId: user.id,
          paymentStatus: { in: ["Unpaid", "PartiallyPaid"] },
          status: { notIn: ["Cancelled", "NoShow"] }
        },
        include: { client: true, service: true },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 6
      }),
      prisma.reminder.findMany({
        where: {
          userId: user.id,
          status: "Pending",
          remindAt: { lte: todayEnd }
        },
        include: { client: true },
        orderBy: { remindAt: "asc" },
        take: 8
      }),
      getFollowUpCandidates(user.id)
    ]);

  const currency = profile?.currency ?? "KZT";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-sage">Dashboard</p>
          <h1 className="text-3xl font-semibold text-ink">Сегодня в работе</h1>
        </div>
        <Link href="/calendar" className="btn-primary inline-flex gap-2">
          <CalendarPlus className="h-4 w-4" />
          Новая запись
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="metric">
          <p className="text-sm text-zinc-500">Выручка сегодня</p>
          <p className="mt-2 text-2xl font-semibold">{money(Number(revenueToday._sum.amount ?? 0), currency)}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Выручка за месяц</p>
          <p className="mt-2 text-2xl font-semibold">{money(Number(revenueMonth._sum.amount ?? 0), currency)}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Новые клиенты</p>
          <p className="mt-2 text-2xl font-semibold">{newClientsMonth}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Неоплаченные записи</p>
          <p className="mt-2 text-2xl font-semibold">{unpaidAppointments.length}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel">
          <div className="section flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Записи на сегодня</h2>
              <p className="text-sm text-zinc-500">{shortDate(today)}</p>
            </div>
            {upcomingAppointment && (
              <div className="rounded-md bg-sage/10 px-3 py-2 text-sm text-sage">
                Ближайшая: {upcomingAppointment.startTime}
              </div>
            )}
          </div>
          <div className="section">
            {todayAppointments.length === 0 ? (
              <EmptyState title="На сегодня записей нет." />
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border border-line p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold">
                          {appointment.startTime}-{appointment.endTime} · {appointment.client.name}
                        </p>
                        <p className="text-sm text-zinc-600">{appointment.service.name}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={appointment.status} />
                        <StatusBadge value={appointment.paymentStatus} />
                        <AppointmentStatusForm id={appointment.id} status={appointment.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="section">
            <h2 className="text-lg font-semibold">Напоминания</h2>
            <p className="text-sm text-zinc-500">Pending на сегодня и просроченные</p>
          </div>
          <div className="section">
            {reminders.length === 0 ? (
              <EmptyState title="Активных напоминаний нет." />
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-lg border border-line p-3">
                    <p className="text-sm font-medium">{reminder.message}</p>
                    <p className="mt-1 text-xs text-zinc-500">{shortDate(reminder.remindAt)}</p>
                    <div className="mt-3">
                      <ReminderButton id={reminder.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Кому написать сегодня</h2>
            <p className="text-sm text-zinc-500">Клиенты без будущей записи, у которых последний визит был 25+ дней назад.</p>
          </div>
          <WalletCards className="h-5 w-5 text-clay" />
        </div>
        <div className="section">
          {followUpClients.length === 0 ? (
            <EmptyState title="Пока нет клиентов для follow-up." text="Когда после завершенного визита пройдет 25 дней и не будет будущей записи, клиент появится здесь." />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {followUpClients.map((client) => (
                <div key={client.id} className="rounded-lg border border-line p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Link className="font-semibold text-ink hover:text-sage" href={`/clients/${client.id}`}>
                        {client.name}
                      </Link>
                      <p className="text-sm text-zinc-600">{client.phone || "Телефон не указан"}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Последний визит: {shortDate(client.lastVisitDate)} · {client.serviceName || "услуга не указана"}
                      </p>
                    </div>
                    <CopyButton text={client.message} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section">
          <h2 className="text-lg font-semibold">Неоплаченные записи</h2>
        </div>
        <div className="section">
          {unpaidAppointments.length === 0 ? (
            <EmptyState title="Неоплаченных записей нет." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Клиент</th>
                    <th>Услуга</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {unpaidAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{shortDate(appointment.date)} {appointment.startTime}</td>
                      <td>{appointment.client.name}</td>
                      <td>{appointment.service.name}</td>
                      <td>{money(Number(appointment.price), currency)}</td>
                      <td><StatusBadge value={appointment.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
