import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { CLIENT_STATUSES } from "@/lib/constants";
import { money, shortDate } from "@/lib/format";
import { ClientForm } from "@/components/forms/ClientForm";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";

type ClientsPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const q = params.q?.trim();
  const status = params.status;

  const [profile, clients, allClients] = await Promise.all([
    prisma.masterProfile.findUnique({ where: { userId: user.id } }),
    prisma.client.findMany({
      where: {
        userId: user.id,
        isArchived: false,
        ...(status ? { status: status as never } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { instagram: { contains: q, mode: "insensitive" } },
                { telegram: { contains: q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      include: {
        appointments: {
          include: { service: true },
          orderBy: [{ date: "desc" }, { startTime: "desc" }]
        },
        payments: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.client.findMany({
      where: { userId: user.id, isArchived: false },
      select: { status: true }
    })
  ]);

  const currency = profile?.currency ?? "KZT";
  const activeCount = allClients.filter((client) => client.status === "Active").length;
  const sleepingCount = allClients.filter((client) => client.status === "Sleeping").length;
  const vipCount = allClients.filter((client) => client.status === "VIP").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-sage">Clients</p>
        <h1 className="text-3xl font-semibold">Клиенты</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="metric">
          <p className="text-sm text-zinc-500">Всего</p>
          <p className="mt-2 text-2xl font-semibold">{allClients.length}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Активные</p>
          <p className="mt-2 text-2xl font-semibold">{activeCount}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Спящие</p>
          <p className="mt-2 text-2xl font-semibold">{sleepingCount}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">VIP</p>
          <p className="mt-2 text-2xl font-semibold">{vipCount}</p>
        </div>
      </section>

      <section className="panel">
        <div className="section flex items-center gap-2">
          <Plus className="h-5 w-5 text-sage" />
          <h2 className="text-lg font-semibold">Добавить клиента</h2>
        </div>
        <div className="section">
          <ClientForm />
        </div>
      </section>

      <section className="panel">
        <div className="section">
          <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                name="q"
                defaultValue={q}
                className="w-full rounded-md border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/15"
                placeholder="Имя, телефон, email, Instagram, Telegram"
              />
            </label>
            <select name="status" defaultValue={status ?? ""} className="rounded-md border border-line bg-white px-3 py-2 text-sm outline-none">
              <option value="">Все статусы</option>
              {CLIENT_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button className="btn-secondary" type="submit">
              Найти
            </button>
          </form>
        </div>
        <div className="section">
          {clients.length === 0 ? (
            <EmptyState title="Клиентов пока нет." text="Добавьте первого клиента, чтобы начать вести историю визитов." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Контакт</th>
                    <th>Источник</th>
                    <th>Статус</th>
                    <th>Визиты</th>
                    <th>Последний визит</th>
                    <th>Оплаты</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {clients.map((client) => {
                    const completed = client.appointments.filter((appointment) => appointment.status === "Completed");
                    const lastVisit = completed[0];
                    const totalPaid = client.payments
                      .filter((payment) => payment.status === "Paid" || payment.status === "Partial")
                      .reduce((sum, payment) => sum + Number(payment.amount), 0);

                    return (
                      <tr key={client.id}>
                        <td>
                          <Link className="font-semibold text-ink hover:text-sage" href={`/clients/${client.id}`}>
                            {client.name}
                          </Link>
                        </td>
                        <td>
                          <p>{client.phone || "Нет телефона"}</p>
                          <p className="text-xs text-zinc-500">{client.email || client.telegram || client.instagram || ""}</p>
                        </td>
                        <td>{client.source}</td>
                        <td><StatusBadge value={client.status} /></td>
                        <td>{completed.length}</td>
                        <td>{lastVisit ? shortDate(lastVisit.date) : "Нет визитов"}</td>
                        <td>{money(totalPaid, currency)}</td>
                        <td>
                          <ConfirmActionButton
                            id={client.id}
                            kind="archiveClient"
                            label="Архив"
                            confirmText="Архивировать клиента?"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
