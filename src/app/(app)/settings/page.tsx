import { Settings } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CURRENCIES, displayLabel } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { TemplateForm } from "@/components/forms/TemplateForm";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { EmptyState } from "@/components/EmptyState";

export default async function SettingsPage() {
  const user = await requireUser();
  const [profile, templates] = await Promise.all([
    prisma.masterProfile.findUnique({ where: { userId: user.id } }),
    prisma.messageTemplate.findMany({
      where: { userId: user.id },
      orderBy: [{ type: "asc" }, { createdAt: "desc" }]
    })
  ]);

  const profileCurrency = CURRENCIES.find((currency) => currency === profile?.currency) ?? "KZT";
  const schedule = `${profile?.workStartTime ?? "09:00"}-${profile?.workEndTime ?? "19:00"}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-sage">Настройки</p>
        <h1 className="text-3xl font-semibold">Ваш профиль</h1>
        <p className="mt-2 text-sm text-zinc-500">Тут только базовые данные: город, контакты, валюта и рабочее время.</p>
      </div>

      <section className="panel">
        <div className="section flex items-center gap-2">
          <Settings className="h-5 w-5 text-sage" />
          <h2 className="text-lg font-semibold">Основное</h2>
        </div>
        <div className="section grid gap-4 md:grid-cols-4">
          <div className="metric">
            <p className="text-sm text-zinc-500">Специализация</p>
            <p className="mt-2 text-lg font-semibold">{profile?.specialization || "Не указана"}</p>
          </div>
          <div className="metric">
            <p className="text-sm text-zinc-500">Город</p>
            <p className="mt-2 text-lg font-semibold">{profile?.city || "Не указан"}</p>
          </div>
          <div className="metric">
            <p className="text-sm text-zinc-500">Рабочее время</p>
            <p className="mt-2 text-lg font-semibold">{schedule}</p>
          </div>
          <div className="metric">
            <p className="text-sm text-zinc-500">Валюта</p>
            <p className="mt-2 text-lg font-semibold">{profileCurrency}</p>
          </div>
        </div>
        <details className="section" open={!profile}>
          <summary className="cursor-pointer list-none font-semibold">Изменить профиль</summary>
          <div className="mt-4 border-t border-line pt-4">
            <ProfileForm
              initial={{
                specialization: profile?.specialization ?? "",
                city: profile?.city ?? "",
                address: profile?.address ?? "",
                phone: profile?.phone ?? "",
                instagram: profile?.instagram ?? "",
                telegram: profile?.telegram ?? "",
                whatsapp: profile?.whatsapp ?? "",
                currency: profileCurrency,
                workStartTime: profile?.workStartTime ?? "09:00",
                workEndTime: profile?.workEndTime ?? "19:00",
                workDays: profile?.workDays ? profile.workDays.split(",") : ["1", "2", "3", "4", "5"]
              }}
            />
          </div>
        </details>
      </section>

      <section className="panel">
        <div className="section">
          <h2 className="text-lg font-semibold">Сообщения клиентам</h2>
          <p className="text-sm text-zinc-500">Шаблоны нужны только если хотите быстро копировать готовый текст.</p>
        </div>
        <details className="section" open={templates.length === 0}>
          <summary className="cursor-pointer list-none font-semibold">Добавить шаблон</summary>
          <div className="mt-4 border-t border-line pt-4">
            <TemplateForm />
          </div>
        </details>
        <div className="section">
          {templates.length === 0 ? (
            <EmptyState title="Шаблонов пока нет." />
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <details key={template.id} className="rounded-lg border border-line p-4">
                  <summary className="cursor-pointer list-none">
                    <p className="font-semibold">{template.name}</p>
                    <p className="text-sm text-zinc-500">{displayLabel(template.type)}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{template.body}</p>
                  </summary>
                  <div className="mt-4 space-y-4 border-t border-line pt-4">
                    <TemplateForm
                      initial={{
                        id: template.id,
                        name: template.name,
                        type: template.type,
                        body: template.body
                      }}
                    />
                    <ConfirmActionButton
                      id={template.id}
                      kind="deleteTemplate"
                      label="Удалить шаблон"
                      confirmText="Удалить шаблон?"
                    />
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