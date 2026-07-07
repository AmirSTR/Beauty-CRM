import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { ClientForm } from "@/components/forms/ClientForm";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";

type ClientsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const q = params.q?.trim();

  const [profile, clients, allClients] = await Promise.all([
    prisma.masterProfile.findUnique({ where: { userId: user.id } }),
    prisma.client.findMany({
      where: {
        userId: user.id,
        isArchived: false,
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
  const sleepingCount = allClients.filter((client) => client.status === "Sleeping").length;
  const vipCount = allClients.filter((client) => client.status === "VIP").length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-sage">Клиенты</p>
        <h1 className="text-3xl font-semibold">Люди, которые к вам ходят</h1>
        <p className="max-w-2xl text-sm text-zinc-600">Добавьте человека один раз, дальше история визитов и оплат будет собираться сама.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="metric">
          <p className="text-sm text-zinc-500">Всего клиентов</p>
          <p className="mt-2 text-3xl font-semibold">{allClients.length}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Давно не были</p>
          <p className="mt-2 text-3xl font-semibold">{sleepingCount}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">VIP</p>
          <p className="mt-2 text-3xl font-semibold">{vipCount}</p>
        </div>
      </section>

      <details className="panel">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-4 text-lg font-semibold sm:px-6">
          <UserPlus className="h-5 w-5 text-sage" />
          Добавить клиента
        </summary>
        <div className="border-t border-line px-4 py-5 sm:px-6">
          <ClientForm />
        </div>
      </details>

      <section className="panel">
        <div className="section">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                name="q"
                defaultValue={q}
                className="w-full rounded-md border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/15"
                placeholder="Найти клиента по имени или телефону"
              />
            </label>
            <button className="btn-secondary" type="submit">
              Найти
            </button>
          </form>
        </div>
        <div className="section">
          {clients.length === 0 ? (
            <EmptyState title="Клиентов пока нет." text="Откройте блок “Добавить клиента” и внесите первого человека." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Клиент</th>
                    <th>Телефон</th>
                    <th>Статус</th>
                    <th>Визитов</th>
                    <th>Последний раз</th>
                    <th>Оплачено</th>
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
                        <td>{client.phone || "Не указан"}</td>
                        <td><StatusBadge value={client.status} /></td>
                        <td>{completed.length}</td>
                        <td>{lastVisit ? shortDate(lastVisit.date) : "Еще не был(а)"}</td>
                        <td>{money(totalPaid, currency)}</td>
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