import { Plus } from "lucide-react";
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
      <div>
        <p className="text-sm font-medium text-sage">Services</p>
        <h1 className="text-3xl font-semibold">Услуги</h1>
      </div>

      <section className="panel">
        <div className="section flex items-center gap-2">
          <Plus className="h-5 w-5 text-sage" />
          <h2 className="text-lg font-semibold">Добавить услугу</h2>
        </div>
        <div className="section">
          <ServiceForm />
        </div>
      </section>

      <section className="panel">
        <div className="section">
          <h2 className="text-lg font-semibold">Активные услуги</h2>
        </div>
        <div className="section">
          {activeServices.length === 0 ? (
            <EmptyState title="Услуг пока нет." text="Добавьте первую услугу, чтобы создавать записи." />
          ) : (
            <div className="space-y-3">
              {activeServices.map((service) => (
                <details key={service.id} className="rounded-lg border border-line bg-white p-4">
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold">{service.name}</p>
                        <p className="text-sm text-zinc-600">
                          {service.category || "Без категории"} · {service.durationMinutes} мин · {money(Number(service.price), currency)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge value="Active" />
                        <ConfirmActionButton
                          id={service.id}
                          kind="archiveService"
                          label="Архивировать"
                          confirmText="Архивировать услугу? Ее можно восстановить позже."
                        />
                      </div>
                    </div>
                  </summary>
                  <div className="mt-4 border-t border-line pt-4">
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
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section">
          <h2 className="text-lg font-semibold">Архив</h2>
        </div>
        <div className="section">
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
                    label="Восстановить"
                    confirmText="Вернуть услугу в активные?"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
