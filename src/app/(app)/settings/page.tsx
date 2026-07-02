import { Settings } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CURRENCIES } from "@/lib/constants";
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-sage">Settings</p>
        <h1 className="text-3xl font-semibold">Настройки</h1>
      </div>

      <section className="panel">
        <div className="section flex items-center gap-2">
          <Settings className="h-5 w-5 text-sage" />
          <div>
            <h2 className="text-lg font-semibold">Профиль мастера</h2>
            <p className="text-sm text-zinc-500">Рабочий график используется для проверки новых записей.</p>
          </div>
        </div>
        <div className="section">
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
      </section>

      <section className="panel">
        <div className="section">
          <h2 className="text-lg font-semibold">Новый шаблон сообщения</h2>
          <p className="text-sm text-zinc-500">Поддерживаются переменные: {"{{clientName}}"}, {"{{serviceName}}"}, {"{{date}}"}, {"{{time}}"}, {"{{price}}"}, {"{{masterName}}"}.</p>
        </div>
        <div className="section">
          <TemplateForm />
        </div>
      </section>

      <section className="panel">
        <div className="section">
          <h2 className="text-lg font-semibold">Шаблоны сообщений</h2>
        </div>
        <div className="section">
          {templates.length === 0 ? (
            <EmptyState title="Шаблонов пока нет." />
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <details key={template.id} className="rounded-lg border border-line p-4">
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold">{template.name}</p>
                        <p className="text-sm text-zinc-500">{template.type}</p>
                        <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{template.body}</p>
                      </div>
                      <ConfirmActionButton
                        id={template.id}
                        kind="deleteTemplate"
                        label="Удалить"
                        confirmText="Удалить шаблон?"
                      />
                    </div>
                  </summary>
                  <div className="mt-4 border-t border-line pt-4">
                    <TemplateForm
                      initial={{
                        id: template.id,
                        name: template.name,
                        type: template.type,
                        body: template.body
                      }}
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
