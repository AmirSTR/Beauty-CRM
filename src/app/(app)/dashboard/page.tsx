import { endOfDay, startOfDay } from "date-fns";
import Link from "next/link";
import { CalendarPlus, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getFollowUpCandidates } from "@/lib/business";
import { money, shortDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyButton } from "@/components/CopyButton";

export default async function DashboardPage() {
  const user = await requireUser();
  const today = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [profile, todayAppointments, revenueToday, followUpClients] = await Promise.all([
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
    getFollowUpCandidates(user.id)
  ]);

  const currency = profile?.currency ?? "KZT";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-sage">Главная</p>
        <h1 className="text-3xl font-semibold text-ink">Сегодня</h1>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/calendar" className="panel flex items-center gap-3 p-4 transition hover:border-sage">
          <CalendarPlus className="h-5 w-5 text-sage" />
          <p className="font-semibold">Новая запись</p>
        </Link>
        <Link href="/clients" className="panel flex items-center gap-3 p-4 transition hover:border-sage">
          <UserPlus className="h-5 w-5 text-sage" />
          <p className="font-semibold">Клиенты</p>
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <p className="text-sm text-zinc-500">Записей</p>
          <p className="mt-2 text-3xl font-semibold">{todayAppointments.length}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Деньги</p>
          <p className="mt-2 text-3xl font-semibold">{money(Number(revenueToday._sum.amount ?? 0), currency)}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Написать</p>
          <p className="mt-2 text-3xl font-semibold">{followUpClients.length}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel">
          <div className="section flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Записи</h2>
            <p className="text-sm text-zinc-500">{shortDate(today)}</p>
          </div>
          <div className="section">
            {todayAppointments.length === 0 ? (
              <EmptyState title="На сегодня записей нет." />
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border border-line p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold">{appointment.startTime} - {appointment.client.name}</p>
                        <p className="text-sm text-zinc-600">{appointment.service.name}</p>
                      </div>
                      <StatusBadge value={appointment.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="section">
            <h2 className="text-xl font-semibold">Написать</h2>
          </div>
          <div className="section">
            {followUpClients.length === 0 ? (
              <EmptyState title="Писать некому." />
            ) : (
              <div className="space-y-3">
                {followUpClients.slice(0, 5).map((client) => (
                  <div key={client.id} className="rounded-lg border border-line p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link className="text-lg font-semibold text-ink hover:text-sage" href={`/clients/${client.id}`}>
                          {client.name}
                        </Link>
                        <p className="text-sm text-zinc-600">{client.phone || "Телефон не указан"}</p>
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
    </div>
  );
}