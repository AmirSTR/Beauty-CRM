import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { buildFollowUpMessage } from "@/lib/business";
import { isoDate, money, shortDate } from "@/lib/format";
import { ClientForm } from "@/components/forms/ClientForm";
import { NoteForm } from "@/components/forms/NoteForm";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { CopyButton } from "@/components/CopyButton";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const [profile, client] = await Promise.all([
    prisma.masterProfile.findUnique({ where: { userId: user.id } }),
    prisma.client.findFirst({
      where: { id, userId: user.id },
      include: {
        clientNotes: { orderBy: { createdAt: "desc" } },
        appointments: {
          include: { service: true },
          orderBy: [{ date: "desc" }, { startTime: "desc" }]
        },
        payments: {
          include: {
            appointment: {
              include: { service: true }
            }
          },
          orderBy: { paidAt: "desc" }
        }
      }
    })
  ]);

  if (!client) notFound();

  const currency = profile?.currency ?? "KZT";
  const completedAppointments = client.appointments.filter((appointment) => appointment.status === "Completed");
  const paidPayments = client.payments.filter((payment) => payment.status === "Paid" || payment.status === "Partial");
  const totalPaid = paidPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const averageCheck = completedAppointments.length > 0 ? totalPaid / completedAppointments.length : 0;
  const lastVisit = completedAppointments[0];
  const nextAppointment = client.appointments
    .filter((appointment) => ["New", "Confirmed"].includes(appointment.status) && appointment.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  const serviceName = lastVisit?.service.name;
  const followUpMessage = buildFollowUpMessage(client.name, serviceName);
  const recentAppointments = client.appointments.slice(0, 5);

  const paymentAppointmentOptions = client.appointments.map((appointment) => ({
    id: appointment.id,
    label: `${shortDate(appointment.date)} ${appointment.startTime} - ${appointment.service.name} - ${client.name}`,
    price: Number(appointment.price)
  }));

  const contacts = [
    { label: "Телефон", value: client.phone },
    { label: "Email", value: client.email },
    { label: "Instagram", value: client.instagram },
    { label: "Telegram", value: client.telegram }
  ].filter((item) => item.value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Link href="/clients" className="text-sm font-medium text-sage">
            Назад к клиентам
          </Link>
          <h1 className="mt-1 text-3xl font-semibold">{client.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge value={client.status} />
            {client.isArchived && <StatusBadge value="Archived" />}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/calendar" className="btn-primary inline-flex gap-2">
            <CalendarPlus className="h-4 w-4" />
            Записать
          </Link>
          <CopyButton text={followUpMessage} />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="metric">
          <p className="text-sm text-zinc-500">Визитов</p>
          <p className="mt-2 text-2xl font-semibold">{completedAppointments.length}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Оплачено</p>
          <p className="mt-2 text-2xl font-semibold">{money(totalPaid, currency)}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Средний чек</p>
          <p className="mt-2 text-2xl font-semibold">{money(averageCheck, currency)}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">Следующая запись</p>
          <p className="mt-2 text-lg font-semibold">{nextAppointment ? `${shortDate(nextAppointment.date)} ${nextAppointment.startTime}` : "Нет"}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="panel">
          <div className="section flex items-center gap-2">
            <UserRound className="h-5 w-5 text-sage" />
            <h2 className="text-lg font-semibold">Контакты</h2>
          </div>
          <div className="section space-y-4">
            {contacts.length === 0 ? (
              <EmptyState title="Контактов пока нет." />
            ) : (
              <div className="space-y-3">
                {contacts.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs uppercase text-zinc-500">{item.label}</p>
                    <p className="font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
            {(client.preferences || client.allergies || client.notes) && (
              <div className="space-y-3 rounded-lg border border-line bg-zinc-50 p-4 text-sm">
                {client.preferences && <p><span className="font-semibold">Любит: </span>{client.preferences}</p>}
                {client.allergies && <p><span className="font-semibold">Аллергии: </span>{client.allergies}</p>}
                {client.notes && <p><span className="font-semibold">Важно: </span>{client.notes}</p>}
              </div>
            )}
            <details className="rounded-lg border border-line p-4">
              <summary className="cursor-pointer list-none font-semibold">Изменить данные клиента</summary>
              <div className="mt-4 border-t border-line pt-4">
                <ClientForm
                  compact
                  initial={{
                    id: client.id,
                    name: client.name,
                    phone: client.phone ?? "",
                    email: client.email ?? "",
                    birthDate: client.birthDate ? isoDate(client.birthDate) : "",
                    instagram: client.instagram ?? "",
                    telegram: client.telegram ?? "",
                    source: client.source,
                    notes: client.notes ?? "",
                    allergies: client.allergies ?? "",
                    preferences: client.preferences ?? "",
                    status: client.status
                  }}
                />
              </div>
            </details>
          </div>
        </div>

        <div className="panel">
          <div className="section">
            <h2 className="text-lg font-semibold">Последние визиты</h2>
          </div>
          <div className="section">
            {recentAppointments.length === 0 ? (
              <EmptyState title="Записей пока нет." />
            ) : (
              <div className="space-y-3">
                {recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border border-line p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{appointment.service.name}</p>
                        <p className="text-sm text-zinc-600">{shortDate(appointment.date)} {appointment.startTime}-{appointment.endTime}</p>
                        <p className="mt-1 text-sm text-zinc-500">{money(Number(appointment.price), currency)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={appointment.status} />
                        <StatusBadge value={appointment.paymentStatus} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section">
          <h2 className="text-lg font-semibold">Заметки</h2>
        </div>
        <div className="section grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <details className="rounded-lg border border-line p-4" open={client.clientNotes.length === 0}>
            <summary className="cursor-pointer list-none font-semibold">Добавить заметку</summary>
            <div className="mt-4 border-t border-line pt-4">
              <NoteForm clientId={client.id} />
            </div>
          </details>
          {client.clientNotes.length === 0 ? (
            <EmptyState title="Заметок пока нет." />
          ) : (
            <div className="space-y-3">
              {client.clientNotes.slice(0, 4).map((note) => (
                <div key={note.id} className="rounded-lg border border-line p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm">{note.note}</p>
                      <p className="mt-2 text-xs text-zinc-500">{shortDate(note.createdAt)}</p>
                    </div>
                    <details>
                      <summary className="cursor-pointer list-none text-sm font-medium text-zinc-500">Еще</summary>
                      <div className="mt-2">
                        <ConfirmActionButton id={note.id} kind="deleteNote" label="Удалить" confirmText="Удалить заметку?" />
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <details className="panel">
        <summary className="section cursor-pointer list-none">
          <h2 className="text-lg font-semibold">Еще: оплаты, полная история и архив</h2>
        </summary>
        <div className="section grid gap-6 xl:grid-cols-2">
          <div>
            <h3 className="mb-3 font-semibold">Добавить оплату</h3>
            {paymentAppointmentOptions.length === 0 ? (
              <EmptyState title="Сначала создайте запись." />
            ) : (
              <PaymentForm appointments={paymentAppointmentOptions} />
            )}
          </div>
          <div>
            <h3 className="mb-3 font-semibold">История оплат</h3>
            {client.payments.length === 0 ? (
              <EmptyState title="Оплат пока нет." />
            ) : (
              <div className="space-y-3">
                {client.payments.map((payment) => (
                  <div key={payment.id} className="rounded-lg border border-line p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{money(Number(payment.amount), currency)}</p>
                        <p className="text-sm text-zinc-600">{payment.appointment.service.name} - {shortDate(payment.paidAt)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={payment.status} />
                        <ConfirmActionButton id={payment.id} kind="deletePayment" label="Удалить" confirmText="Удалить оплату?" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="section space-y-4">
          <h3 className="font-semibold">Все визиты</h3>
          {client.appointments.length === 0 ? (
            <EmptyState title="Истории записей пока нет." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Услуга</th>
                    <th>Время</th>
                    <th>Цена</th>
                    <th>Статус</th>
                    <th>Оплата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {client.appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{shortDate(appointment.date)}</td>
                      <td>{appointment.service.name}</td>
                      <td>{appointment.startTime}-{appointment.endTime}</td>
                      <td>{money(Number(appointment.price), currency)}</td>
                      <td><StatusBadge value={appointment.status} /></td>
                      <td><StatusBadge value={appointment.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="rounded-lg border border-line p-4">
            <h3 className="mb-3 font-semibold">Архив</h3>
            {client.isArchived ? (
              <ConfirmActionButton id={client.id} kind="restoreClient" label="Вернуть клиента" confirmText="Вернуть клиента из архива?" />
            ) : (
              <ConfirmActionButton id={client.id} kind="archiveClient" label="Убрать в архив" confirmText="Убрать клиента в архив?" />
            )}
          </div>
        </div>
      </details>
    </div>
  );
}