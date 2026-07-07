import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import Link from "next/link";
import { CalendarPlus, Scissors, UserPlus } from "lucide-react";
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

  const [profile, todayAppointments, revenueToday, revenueMonth, unpaidAppointments, reminders, followUpClients] =
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
      prisma.appointment.findMany({
        where: {
          userId: user.id,
          paymentStatus: { in: ["Unpaid", "PartiallyPaid"] },
          status: { notIn: ["Cancelled", "NoShow"] }
        },
        include: { client: true, service: true },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 5
      }),
      prisma.reminder.findMany({
        where: {
          userId: user.id,
          status: "Pending",
          remindAt: { lte: todayEnd }
        },
        include: { client: true },
        orderBy: { remindAt: "asc" },
        take: 5
      }),
      getFollowUpCandidates(user.id)
    ]);

  const currency = profile?.currency ?? "KZT";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-sage">Главная</p>
        <h1 className="text-3xl font-semibold text-ink">Что сделать сегодня?</h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Здесь только самое важное: кого принять, кому написать и сколько денег пришло.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <Link href="/calendar" className="panel flex items-center gap-3 p-4 transition hover:border-sage">
          <CalendarPlus className="h-5 w-5 text-sage" />
          <div>
            <p className="font-semibold">Записать клиента</p>
            <p className="text-sm text-zinc-500">Создать новую запись</p>
          </div>
        </Link>
        <Link href="/clients" className="panel flex items-center gap-3 p-4 transition hover:border-sage">
          <UserPlus className="h-5 w-5 text-sage" />
          <div>
            <p className="font-semibold">Добавить клиента</p>
            <p className="text-sm text-zinc-500">Имя и телефон</p>
          </div>
        </Link>
        <Link href="/services" className="panel flex items-center gap-3 p-4 transition hover:border-sage">
          <Scissors className="h-5 w-5 text-sage" />
          <div>
            <p className="font-semibold">Добавить услугу</p>
            <p className="text-sm text-zinc-500">Цена и длительность</p>
          </div>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <p className="text-sm text-zinc-500">Записей сегодня</p>
          <p className="mt-2 text-3xl font-semibold">{todayAppointments.length}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Деньги сегодня</p>
          <p className="mt-2 text-3xl font-semibold">{money(Number(revenueToday._sum.amount ?? 0), currency)}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Кому написать</p>
          <p className="mt-2 text-3xl font-semibold">{followUpClients.length}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="panel">
          <div className="section">
            <h2 className="text-xl font-semibold">Сегодня</h2>
            <p className="text-sm text-zinc-500">{shortDate(today)}</p>
          </div>
          <div className="section">
            {todayAppointments.length === 0 ? (
              <EmptyState title="На сегодня записей нет." text="Можно спокойно добавить новую запись или написать старым клиентам." />
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border border-line p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold">
                          {appointment.startTime} · {appointment.client.name}
                        </p>
                        <p className="text-sm text-zinc-600">{appointment.service.name}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value={appointment.status} />
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
            <h2 className="text-xl font-semibold">Кому написать</h2>
            <p className="text-sm text-zinc-500">Клиенты, которым пора предложить повторную запись.</p>
          </div>
          <div className="section">
            {followUpClients.length === 0 ? (
              <EmptyState title="Пока писать некому." text="Когда клиент давно не приходил и нет будущей записи, он появится здесь." />
            ) : (
              <div className="space-y-3">
                {followUpClients.slice(0, 5).map((client) => (
                  <div key={client.id} className="rounded-lg border border-line p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link className="text-lg font-semibold text-ink hover:text-sage" href={`/clients/${client.id}`}>
                          {client.name}
                        </Link>
                        <p className="text-sm text-zinc-600">{client.phone || "Телефон не указан"}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Был(а): {shortDate(client.lastVisitDate)} · {client.serviceName || "услуга не указана"}
                        </p>
                      </div>
                      <CopyButton text={client.message} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <details className="panel">
        <summary className="cursor-pointer list-none px-4 py-4 text-lg font-semibold sm:px-6">
          Еще: напоминания, долги и месяц
        </summary>
        <div className="grid gap-6 border-t border-line px-4 py-5 sm:px-6 lg:grid-cols-3">
          <div>
            <p className="text-sm text-zinc-500">Деньги за месяц</p>
            <p className="mt-2 text-2xl font-semibold">{money(Number(revenueMonth._sum.amount ?? 0), currency)}</p>
          </div>
          <div>
            <p className="mb-3 font-semibold">Напоминания</p>
            {reminders.length === 0 ? (
              <p className="text-sm text-zinc-500">Нет активных напоминаний.</p>
            ) : (
              <div className="space-y-2">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-md border border-line p-3 text-sm">
                    <p>{reminder.message}</p>
                    <div className="mt-2"><ReminderButton id={reminder.id} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-3 font-semibold">Не оплачено</p>
            {unpaidAppointments.length === 0 ? (
              <p className="text-sm text-zinc-500">Долгов нет.</p>
            ) : (
              <div className="space-y-2">
                {unpaidAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-md border border-line p-3 text-sm">
                    <p className="font-semibold">{appointment.client.name}</p>
                    <p className="text-zinc-500">{money(Number(appointment.price), currency)} · {shortDate(appointment.date)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}