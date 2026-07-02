"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { saveClientAction } from "@/app/actions";
import { CLIENT_SOURCES, CLIENT_STATUSES } from "@/lib/constants";
import { clientSchema } from "@/lib/validations";
import { FieldError, FormError, inputClass, labelClass, textareaClass } from "@/components/forms/FormShell";

type ClientValues = z.infer<typeof clientSchema>;

export function ClientForm({
  initial,
  compact = false
}: {
  initial?: Partial<ClientValues>;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      id: initial?.id,
      name: initial?.name ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      birthDate: initial?.birthDate ?? "",
      instagram: initial?.instagram ?? "",
      telegram: initial?.telegram ?? "",
      source: initial?.source ?? "Other",
      notes: initial?.notes ?? "",
      allergies: initial?.allergies ?? "",
      preferences: initial?.preferences ?? "",
      status: initial?.status ?? "New"
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveClientAction(values);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить клиента.");
        return;
      }
      setSaved(true);
      if (!initial?.id) {
        form.reset({
          name: "",
          phone: "",
          email: "",
          birthDate: "",
          instagram: "",
          telegram: "",
          source: "Other",
          notes: "",
          allergies: "",
          preferences: "",
          status: "New"
        });
      }
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-3" : "grid gap-4 md:grid-cols-2"}>
      <input type="hidden" {...form.register("id")} />
      <div className={compact ? "space-y-3" : "md:col-span-2"}>
        <FormError message={error} />
        {saved && <p className="text-sm text-sage">Сохранено.</p>}
      </div>

      <label className="block space-y-1">
        <span className={labelClass}>Имя</span>
        <input className={inputClass} {...form.register("name")} />
        <FieldError message={form.formState.errors.name?.message} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Телефон</span>
        <input className={inputClass} {...form.register("phone")} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Email</span>
        <input className={inputClass} {...form.register("email")} type="email" />
        <FieldError message={form.formState.errors.email?.message} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Дата рождения</span>
        <input className={inputClass} {...form.register("birthDate")} type="date" />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Instagram</span>
        <input className={inputClass} {...form.register("instagram")} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Telegram</span>
        <input className={inputClass} {...form.register("telegram")} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Источник</span>
        <select className={inputClass} {...form.register("source")}>
          {CLIENT_SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Статус</span>
        <select className={inputClass} {...form.register("status")}>
          {CLIENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className={compact ? "block space-y-1" : "block space-y-1 md:col-span-2"}>
        <span className={labelClass}>Предпочтения</span>
        <textarea className={textareaClass} {...form.register("preferences")} />
      </label>

      <label className={compact ? "block space-y-1" : "block space-y-1 md:col-span-2"}>
        <span className={labelClass}>Аллергии</span>
        <textarea className={textareaClass} {...form.register("allergies")} />
      </label>

      <label className={compact ? "block space-y-1" : "block space-y-1 md:col-span-2"}>
        <span className={labelClass}>Заметки</span>
        <textarea className={textareaClass} {...form.register("notes")} />
      </label>

      <button className="btn-primary md:col-span-2" type="submit" disabled={isPending}>
        {isPending ? "Сохраняю..." : initial?.id ? "Сохранить клиента" : "Добавить клиента"}
      </button>
    </form>
  );
}
