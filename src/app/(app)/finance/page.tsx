import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { Filter, WalletCards } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PAYMENT_METHODS, PAYMENT_STATUSES, displayLabel } from "@/lib/constants";
import { dateFromInput } from "@/lib/time";
import { money, shortDate } from "@/lib/format";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";

type FinancePageProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
    method?: string;
    status?: string;
  }>;
};

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const from = params.from ? dateFromInput(params.from) : startOfMonth(new Date());
  const to = params.to ? endOfDay(dateFromInput(params.to)) : endOfMonth(new Date());
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const paymentWhere = {
    userId: user.id,
    paidAt: { gte: from, lte: to },
    ...(params.method ? { method: params.method as never } : {}),
    ...(params.status ? { status: params.status as never } : {})
  };

  const [profile, payments, appointments, revenueToday, revenueWeek, revenueMonth, unpaidAppointments, partialAppointments] =
    await Promise.all([
      prisma.masterProfile.findUnique({ where: { userId: user.id } }),
      prisma.payment.findMany({
        where: paymentWhere,
        include: {
          client: true,
          appointment: {
            include: { service: true }
          }
        },
        orderBy: { paidAt: "desc" }
      }),
      prisma.appointment.findMany({
        where: {
          userId: user.id,
          status: { notIn: ["Cancelled", "NoShow"] }
        },
        include: {
          client: true,
          service: true
        },
        orderBy: [{ date: "desc" }, { startTime: "desc" }]
      }),
      prisma.payment.aggregate({
        where: {
          userId: user.id,
          status: { in: ["Paid", "Partial"] },
          paidAt: { gte: today, lte: endOfDay(new Date()) }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          userId: user.id,
          status: { in: ["Paid", "Partial"] },
          paidAt: { gte: weekStart, lte: weekEnd }
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
          paymentStatus: "Unpaid",
          status: { notIn: ["Cancelled", "NoShow"] }
        },
        include: { client: true, service: true },
        orderBy: [{ date: "asc" }, { startTime: "asc" }]
      }),
      prisma.appointment.findMany({
        where: {
          userId: user.id,
          paymentStatus: "PartiallyPaid",
          status: { notIn: ["Cancelled", "NoShow"] }
        },
        include: { client: true, service: true },
        orderBy: [{ date: "asc" }, { startTime: "asc" }]
      })
    ]);

  const currency = profile?.currency ?? "KZT";
  const appointmentOptions = appointments.map((appointment) => ({
    id: appointment.id,
    label: `${shortDate(appointment.date)} ${appointment.startTime} · ${appointment.client.name} · ${appointment.service.name}`,
    price: Number(appointment.price)
  }));
  const unpaidAndPartial = [...unpaidAppointments, ...partialAppointments];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-sage">Деньги</p>
        <h1 className="text-3xl font-semibold">Сколько заработали</h1>
        <p className="max-w-2xl text-sm text-zinc-600">Тут оплаты и долги. Все сложные фильтры спрятаны ниже.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <p className="text-sm text-zinc-500">Сегодня</p>
          <p className="mt-2 text-3xl font-semibold">{money(Number(revenueToday._sum.amount ?? 0), currency)}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Эта неделя</p>
          <p className="mt-2 text-3xl font-semibold">{money(Number(revenueWeek._sum.amount ?? 0), currency)}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Этот месяц</p>
          <p className="mt-2 text-3xl font-semibold">{money(Number(revenueMonth._sum.amount ?? 0), currency)}</p>
        </div>
      </section>

      <details className="panel" open={unpaidAndPartial.length > 0}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-4 text-lg font-semibold sm:px-6">
          <WalletCards className="h-5 w-5 text-sage" />
          Добавить оплату
        </summary>
        <div className="border-t border-line px-4 py-5 sm:px-6">
          {appointmentOptions.length === 0 ? (
            <EmptyState title="Записей для оплаты пока нет." />
          ) : (
            <PaymentForm appointments={appointmentOptions} />
          )}
        </div>
      </details>

      <section className="panel">
        <div className="section">
          <h2 className="text-xl font-semibold">Оплаты</h2>
        </div>
        <div className="section">
          {payments.length === 0 ? (
            <EmptyState title="Оплат за период нет." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Клиент</th>
                    <th>За что</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{shortDate(payment.paidAt)}</td>
                      <td>{payment.client.name}</td>
                      <td>{payment.appointment.service.name}</td>
                      <td>{money(Number(payment.amount), currency)}</td>
                      <td><StatusBadge value={payment.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <details className="panel">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-4 text-lg font-semibold sm:px-6">
          <Filter className="h-5 w-5 text-clay" />
          Редко нужно: фильтры и долги
        </summary>
        <div className="grid gap-6 border-t border-line px-4 py-5 sm:px-6 xl:grid-cols-[1fr_0.8fr]">
          <form className="grid gap-3 md:grid-cols-2">
            <input className="rounded-md border border-line px-3 py-2 text-sm" type="date" name="from" defaultValue={params.from ?? startOfMonth(new Date()).toISOString().slice(0, 10)} />
            <input className="rounded-md border border-line px-3 py-2 text-sm" type="date" name="to" defaultValue={params.to ?? new Date().toISOString().slice(0, 10)} />
            <select className="rounded-md border border-line px-3 py-2 text-sm" name="method" defaultValue={params.method ?? ""}>
              <option value="">Все способы</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {displayLabel(method)}
                </option>
              ))}
            </select>
            <select className="rounded-md border border-line px-3 py-2 text-sm" name="status" defaultValue={params.status ?? ""}>
              <option value="">Все статусы</option>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {displayLabel(status)}
                </option>
              ))}
            </select>
            <button className="btn-secondary md:col-span-2" type="submit">Показать</button>
          </form>

          <div>
            <p className="mb-3 font-semibold">Не оплачено</p>
            {unpaidAndPartial.length === 0 ? (
              <p className="text-sm text-zinc-500">Долгов нет.</p>
            ) : (
              <div className="space-y-3">
                {unpaidAndPartial.map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border border-line p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{appointment.client.name}</p>
                        <p className="text-sm text-zinc-600">
                          {shortDate(appointment.date)} · {appointment.service.name}
                        </p>
                      </div>
                      <StatusBadge value={appointment.paymentStatus} />
                    </div>
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