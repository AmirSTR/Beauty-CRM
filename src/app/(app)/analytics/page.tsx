import { endOfDay, endOfMonth, startOfMonth } from "date-fns";
import { BarChart3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { dateFromInput } from "@/lib/time";
import { money, shortDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

type AnalyticsPageProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
  }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const from = params.from ? dateFromInput(params.from) : startOfMonth(new Date());
  const to = params.to ? endOfDay(dateFromInput(params.to)) : endOfMonth(new Date());

  const [profile, payments, appointments, clients] = await Promise.all([
    prisma.masterProfile.findUnique({ where: { userId: user.id } }),
    prisma.payment.findMany({
      where: {
        userId: user.id,
        paidAt: { gte: from, lte: to }
      },
      include: {
        appointment: {
          include: { service: true }
        }
      }
    }),
    prisma.appointment.findMany({
      where: {
        userId: user.id,
        date: { gte: from, lte: to }
      },
      include: {
        service: true
      }
    }),
    prisma.client.findMany({
      where: { userId: user.id },
      include: {
        appointments: {
          where: { status: "Completed" },
          select: { id: true }
        }
      }
    })
  ]);

  const currency = profile?.currency ?? "KZT";
  const paidPayments = payments.filter((payment) => payment.status === "Paid" || payment.status === "Partial");
  const revenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const completedAppointments = appointments.filter((appointment) => appointment.status === "Completed");
  const completedPaidAppointmentsCount = completedAppointments.filter((appointment) => appointment.paymentStatus === "Paid").length;
  const newClientsCount = clients.filter((client) => client.createdAt >= from && client.createdAt <= to).length;
  const repeatClientsCount = clients.filter((client) => client.appointments.length > 1).length;
  const averageCheck = completedPaidAppointmentsCount > 0 ? revenue / completedPaidAppointmentsCount : 0;
  const noShowCount = appointments.filter((appointment) => appointment.status === "NoShow").length;
  const cancelledCount = appointments.filter((appointment) => appointment.status === "Cancelled").length;
  const totalAppointments = appointments.length;
  const noShowPercent = totalAppointments > 0 ? Math.round((noShowCount / totalAppointments) * 100) : 0;
  const cancelledPercent = totalAppointments > 0 ? Math.round((cancelledCount / totalAppointments) * 100) : 0;

  const revenueByService = new Map<string, number>();
  for (const payment of paidPayments) {
    const serviceName = payment.appointment.service.name;
    revenueByService.set(serviceName, (revenueByService.get(serviceName) ?? 0) + Number(payment.amount));
  }
  const topServicesByRevenue = [...revenueByService.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const countByService = new Map<string, number>();
  for (const appointment of appointments) {
    countByService.set(appointment.service.name, (countByService.get(appointment.service.name) ?? 0) + 1);
  }
  const topServicesByCount = [...countByService.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const sources = new Map<string, number>();
  for (const client of clients) {
    sources.set(client.source, (sources.get(client.source) ?? 0) + 1);
  }
  const sourceStats = [...sources.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-sage">Analytics</p>
          <h1 className="text-3xl font-semibold">Аналитика</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {shortDate(from)} - {shortDate(to)}
          </p>
        </div>
        <form className="grid gap-2 sm:grid-cols-[160px_160px_auto]">
          <input className="rounded-md border border-line px-3 py-2 text-sm" type="date" name="from" defaultValue={params.from ?? startOfMonth(new Date()).toISOString().slice(0, 10)} />
          <input className="rounded-md border border-line px-3 py-2 text-sm" type="date" name="to" defaultValue={params.to ?? new Date().toISOString().slice(0, 10)} />
          <button className="btn-secondary" type="submit">Показать</button>
        </form>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="metric">
          <p className="text-sm text-zinc-500">Выручка</p>
          <p className="mt-2 text-2xl font-semibold">{money(revenue, currency)}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Завершенные записи</p>
          <p className="mt-2 text-2xl font-semibold">{completedAppointments.length}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Средний чек</p>
          <p className="mt-2 text-2xl font-semibold">{money(averageCheck, currency)}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Новые клиенты</p>
          <p className="mt-2 text-2xl font-semibold">{newClientsCount}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="metric">
          <p className="text-sm text-zinc-500">Повторные клиенты</p>
          <p className="mt-2 text-2xl font-semibold">{repeatClientsCount}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Неявки</p>
          <p className="mt-2 text-2xl font-semibold">{noShowPercent}%</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Отмены</p>
          <p className="mt-2 text-2xl font-semibold">{cancelledPercent}%</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Всего записей</p>
          <p className="mt-2 text-2xl font-semibold">{totalAppointments}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="panel">
          <div className="section flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sage" />
            <h2 className="text-lg font-semibold">Топ услуг по выручке</h2>
          </div>
          <div className="section">
            {topServicesByRevenue.length === 0 ? (
              <EmptyState title="Нет данных." />
            ) : (
              <div className="space-y-3">
                {topServicesByRevenue.map((service) => (
                  <div key={service.name} className="flex justify-between rounded-md border border-line px-3 py-2 text-sm">
                    <span>{service.name}</span>
                    <span className="font-semibold">{money(service.total, currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="section">
            <h2 className="text-lg font-semibold">Топ услуг по записям</h2>
          </div>
          <div className="section">
            {topServicesByCount.length === 0 ? (
              <EmptyState title="Нет данных." />
            ) : (
              <div className="space-y-3">
                {topServicesByCount.map((service) => (
                  <div key={service.name} className="flex justify-between rounded-md border border-line px-3 py-2 text-sm">
                    <span>{service.name}</span>
                    <span className="font-semibold">{service.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="section">
            <h2 className="text-lg font-semibold">Источники клиентов</h2>
          </div>
          <div className="section">
            {sourceStats.length === 0 ? (
              <EmptyState title="Нет клиентов." />
            ) : (
              <div className="space-y-3">
                {sourceStats.map((source) => (
                  <div key={source.source} className="flex justify-between rounded-md border border-line px-3 py-2 text-sm">
                    <span>{source.source}</span>
                    <span className="font-semibold">{source.count}</span>
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
