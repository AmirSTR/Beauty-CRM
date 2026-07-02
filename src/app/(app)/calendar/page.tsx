import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getRange } from "@/lib/time";
import { isoDate, longDate, money, periodLabel, shortDate } from "@/lib/format";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { AppointmentStatusForm } from "@/components/AppointmentStatusForm";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";

type CalendarPageProps = {
  searchParams?: Promise<{
    view?: string;
    date?: string;
  }>;
};

const views = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" }
];

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const view = ["day", "week", "month"].includes(params.view ?? "") ? params.view : "day";
  const selectedDate = params.date ?? new Date().toISOString().slice(0, 10);
  const range = getRange(view, selectedDate);

  const [profile, clients, services, appointments] = await Promise.all([
    prisma.masterProfile.findUnique({ where: { userId: user.id } }),
    prisma.client.findMany({
      where: { userId: user.id, isArchived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.service.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, durationMinutes: true, price: true }
    }),
    prisma.appointment.findMany({
      where: {
        userId: user.id,
        date: { gte: range.from, lte: range.to }
      },
      include: {
        client: true,
        service: true
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }]
    })
  ]);

  const currency = profile?.currency ?? "KZT";
  const serviceOptions = services.map((service) => ({
    ...service,
    price: Number(service.price)
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-sage">Calendar</p>
          <h1 className="text-3xl font-semibold">Календарь записей</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {view === "day" ? longDate(range.from) : periodLabel(range.from, range.to)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn-secondary" href={`/calendar?view=${view}&date=${isoDate(range.previous)}`} title="Предыдущий период">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link className="btn-secondary" href={`/calendar?view=${view}&date=${new Date().toISOString().slice(0, 10)}`}>
            Сегодня
          </Link>
          <Link className="btn-secondary" href={`/calendar?view=${view}&date=${isoDate(range.next)}`} title="Следующий период">
            <ChevronRight className="h-4 w-4" />
          </Link>
          <div className="inline-flex rounded-md border border-line bg-white p-1">
            {views.map((item) => (
              <Link
                key={item.value}
                href={`/calendar?view=${item.value}&date=${selectedDate}`}
                className={[
                  "rounded px-3 py-1.5 text-sm font-semibold",
                  view === item.value ? "bg-sage text-white" : "text-zinc-600 hover:text-ink"
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="section flex items-center gap-2">
          <Plus className="h-5 w-5 text-sage" />
          <h2 className="text-lg font-semibold">Создать запись</h2>
        </div>
        <div className="section">
          {clients.length === 0 || services.length === 0 ? (
            <EmptyState
              title="Для записи нужны клиент и услуга."
              text="Добавьте хотя бы одного клиента и одну активную услугу, затем вернитесь в календарь."
            />
          ) : (
            <AppointmentForm clients={clients} services={serviceOptions} />
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section">
          <h2 className="text-lg font-semibold">Записи</h2>
        </div>
        <div className="section">
          {appointments.length === 0 ? (
            <EmptyState title={view === "day" ? "На сегодня записей нет." : "За выбранный период записей нет."} />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {appointments.map((appointment) => (
                <details key={appointment.id} className="rounded-lg border border-line bg-white p-4">
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">
                          {shortDate(appointment.date)} · {appointment.startTime}-{appointment.endTime}
                        </p>
                        <p className="text-sm text-zinc-600">
                          {appointment.client.name} · {appointment.service.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={appointment.status} />
                        <StatusBadge value={appointment.paymentStatus} />
                      </div>
                    </div>
                  </summary>
                  <div className="mt-4 space-y-4 border-t border-line pt-4">
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <p><span className="text-zinc-500">Цена:</span> {money(Number(appointment.price), currency)}</p>
                      <p><span className="text-zinc-500">Комментарий:</span> {appointment.comment || "Нет"}</p>
                      <p>
                        <span className="text-zinc-500">Клиент:</span>{" "}
                        <Link className="font-semibold text-sage" href={`/clients/${appointment.clientId}`}>
                          открыть карточку
                        </Link>
                      </p>
                      <p><span className="text-zinc-500">Услуга:</span> {appointment.service.category || "Без категории"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AppointmentStatusForm id={appointment.id} status={appointment.status} />
                      <ConfirmActionButton
                        id={appointment.id}
                        kind="cancelAppointment"
                        label="Отменить"
                        confirmText="Отменить запись?"
                      />
                    </div>
                    <div>
                      <p className="mb-3 text-sm font-semibold">Перенос</p>
                      <AppointmentForm
                        clients={clients}
                        services={serviceOptions}
                        initial={{
                          id: appointment.id,
                          clientId: appointment.clientId,
                          serviceId: appointment.serviceId,
                          date: isoDate(appointment.date),
                          startTime: appointment.startTime,
                          price: Number(appointment.price),
                          comment: appointment.comment ?? ""
                        }}
                      />
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
