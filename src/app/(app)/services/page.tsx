import { Scissors } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { ServiceForm } from "@/components/forms/ServiceForm";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";

export default async function ServicesPage() {
  const user = await requireUser();
  const [profile, services] = await Promise.all([
    prisma.masterProfile.findUnique({ where: { userId: user.id } }),
    prisma.service.findMany({
      where: { userId: user.id },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }]
    })
  ]);
  const currency = profile?.currency ?? "KZT";
  const activeServices = services.filter((service) => service.isActive);
  const archivedServices = services.filter((service) => !service.isActive);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-sage">Услуги</p>
        <h1 className="text-3xl font-semibold">Что вы делаете и сколько это стоит</h1>
        <p className="max-w-2xl text-sm text-zinc-600">Для записи нужна хотя бы одна услуга: название, цена и длительность.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="metric">
          <p className="text-sm text-zinc-500">Активных услуг</p>
          <p className="mt-2 text-3xl font-semibold">{activeServices.length}</p>
        </div>
        <div className="metric">
          <p className="text-sm text-zinc-500">В архиве</p>
          <p className="mt-2 text-3xl font-semibold">{archivedServices.length}</p>
        </div>
      </section>

      <details className="panel" open={activeServices.length === 0}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-4 text-lg font-semibold sm:px-6">
          <Scissors className="h-5 w-5 text-sage" />
          Добавить услугу
        </summary>
        <div className="border-t border-line px-4 py-5 sm:px-6">
          <ServiceForm />
        </div>
      </details>

      <section className="panel">
        <div className="section">
          <h2 className="text-xl font-semibold">Ваши услуги</h2>
        </div>
        <div className="section">
          {activeServices.length === 0 ? (
            <EmptyState title="Услуг пока нет." text="Откройте “Добавить услугу” и создайте первую услугу." />
          ) : (
            <div className="space-y-3">
              {activeServices.map((service) => (
                <details key={service.id} className="rounded-lg border border-line bg-white p-4">
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-semibold">{service.name}</p>
                        <p className="text-sm text-zinc-600">
                          {service.durationMinutes} мин · {money(Number(service.price), currency)}
                        </p>
                      </div>
                      <StatusBadge value="Active" />
                    </div>
                  </summary>
                  <div className="mt-4 space-y-4 border-t border-line pt-4">
                    <ServiceForm
                      compact
                      initial={{
                        id: service.id,
                        name: service.name,
                        description: service.description ?? "",
                        category: service.category ?? "",
                        durationMinutes: service.durationMinutes,
                        price: Number(service.price)
                      }}
                    />
                    <ConfirmActionButton
                      id={service.id}
                      kind="archiveService"
                      label="Убрать в архив"
                      confirmText="Убрать услугу в архив? Ее можно восстановить позже."
                    />
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>

      <details className="panel">
        <summary className="cursor-pointer list-none px-4 py-4 text-lg font-semibold sm:px-6">
          Редко нужно: архив услуг
        </summary>
        <div className="border-t border-line px-4 py-5 sm:px-6">
          {archivedServices.length === 0 ? (
            <EmptyState title="Архив пуст." />
          ) : (
            <div className="space-y-3">
              {archivedServices.map((service) => (
                <div key={service.id} className="flex flex-col gap-3 rounded-lg border border-line p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{service.name}</p>
                    <p className="text-sm text-zinc-600">
                      {service.durationMinutes} мин · {money(Number(service.price), currency)}
                    </p>
                  </div>
                  <ConfirmActionButton
                    id={service.id}
                    kind="restoreService"
                    label="Вернуть"
                    confirmText="Вернуть услугу в активные?"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}