import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { Filter, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/constants";
import { dateFromInput } from "@/lib/time";
import { money, shortDate } from "@/lib/format";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";

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
  const methodTotals = PAYMENT_METHODS.map((method) => ({
    method,
    total: payments
      .filter((payment) => payment.method === method && (payment.status === "Paid" || payment.status === "Partial"))
      .reduce((sum, payment) => sum + Number(payment.amount), 0)
  })).filter((item) => item.total > 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-sage">Finance</p>
        <h1 className="text-3xl font-semibold">Финансы</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <p className="text-sm text-zinc-500">Сегодня</p>
          <p className="mt-2 text-2xl font-semibold">{money(Number(revenueToday._sum.amount ?? 0), currency)}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Неделя</p>
          <p className="mt-2 text-2xl font-semibold">{money(Number(revenueWeek._sum.amount ?? 0), currency)}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Месяц</p>
          <p className="mt-2 text-2xl font-semibold">{money(Number(revenueMonth._sum.amount ?? 0), currency)}</p>
        </div>
      </section>

      <section className="panel">
        <div className="section flex items-center gap-2">
          <Plus className="h-5 w-5 text-sage" />
          <h2 className="text-lg font-semibold">Добавить оплату</h2>
        </div>
        <div className="section">
          {appointmentOptions.length === 0 ? (
            <EmptyState title="Записей для оплаты пока нет." />
          ) : (
            <PaymentForm appointments={appointmentOptions} />
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section flex items-center gap-2">
          <Filter className="h-5 w-5 text-clay" />
          <h2 className="text-lg font-semibold">Фильтры</h2>
        </div>
        <div className="section">
          <form className="grid gap-3 md:grid-cols-5">
            <input className="rounded-md border border-line px-3 py-2 text-sm" type="date" name="from" defaultValue={params.from ?? startOfMonth(new Date()).toISOString().slice(0, 10)} />
            <input className="rounded-md border border-line px-3 py-2 text-sm" type="date" name="to" defaultValue={params.to ?? new Date().toISOString().slice(0, 10)} />
            <select className="rounded-md border border-line px-3 py-2 text-sm" name="method" defaultValue={params.method ?? ""}>
              <option value="">Все способы</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <select className="rounded-md border border-line px-3 py-2 text-sm" name="status" defaultValue={params.status ?? ""}>
              <option value="">Все статусы</option>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button className="btn-secondary" type="submit">Применить</button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="panel">
          <div className="section">
            <h2 className="text-lg font-semibold">Список оплат</h2>
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
                      <th>Услуга</th>
                      <th>Сумма</th>
                      <th>Способ</th>
                      <th>Статус</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{shortDate(payment.paidAt)}</td>
                        <td>{payment.client.name}</td>
                        <td>{payment.appointment.service.name}</td>
                        <td>{money(Number(payment.amount), currency)}</td>
                        <td>{payment.method}</td>
                        <td><StatusBadge value={payment.status} /></td>
                        <td>
                          <ConfirmActionButton id={payment.id} kind="deletePayment" label="Удалить" confirmText="Удалить оплату?" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel">
            <div className="section">
              <h2 className="text-lg font-semibold">Способы оплаты</h2>
            </div>
            <div className="section">
              {methodTotals.length === 0 ? (
                <EmptyState title="Нет данных." />
              ) : (
                <div className="space-y-3">
                  {methodTotals.map((item) => (
                    <div key={item.method} className="flex justify-between rounded-md border border-line px-3 py-2 text-sm">
                      <span>{item.method}</span>
                      <span className="font-semibold">{money(item.total, currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="section">
              <h2 className="text-lg font-semibold">Неоплаченные и частичные</h2>
            </div>
            <div className="section space-y-4">
              {[...unpaidAppointments, ...partialAppointments].length === 0 ? (
                <EmptyState title="Все актуальные записи оплачены." />
              ) : (
                [...unpaidAppointments, ...partialAppointments].map((appointment) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
