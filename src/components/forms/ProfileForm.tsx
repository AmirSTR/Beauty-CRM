"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { saveProfileAction } from "@/app/actions";
import { CURRENCIES, WORK_DAYS } from "@/lib/constants";
import { profileSchema } from "@/lib/validations";
import { FieldError, FormError, inputClass, labelClass } from "@/components/forms/FormShell";

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm({
  initial
}: {
  initial: Partial<ProfileValues>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      specialization: initial.specialization ?? "",
      city: initial.city ?? "",
      address: initial.address ?? "",
      phone: initial.phone ?? "",
      instagram: initial.instagram ?? "",
      telegram: initial.telegram ?? "",
      whatsapp: initial.whatsapp ?? "",
      currency: initial.currency ?? "KZT",
      workStartTime: initial.workStartTime ?? "09:00",
      workEndTime: initial.workEndTime ?? "19:00",
      workDays: initial.workDays ?? ["1", "2", "3", "4", "5"]
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveProfileAction(values);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить профиль.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <FormError message={error} />
        {saved && <p className="text-sm text-sage">Профиль сохранен.</p>}
      </div>

      <label className="block space-y-1">
        <span className={labelClass}>Специализация</span>
        <input className={inputClass} {...form.register("specialization")} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Город</span>
        <input className={inputClass} {...form.register("city")} />
      </label>

      <label className="block space-y-1 md:col-span-2">
        <span className={labelClass}>Адрес</span>
        <input className={inputClass} {...form.register("address")} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Телефон</span>
        <input className={inputClass} {...form.register("phone")} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>WhatsApp</span>
        <input className={inputClass} {...form.register("whatsapp")} />
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
        <span className={labelClass}>Валюта</span>
        <select className={inputClass} {...form.register("currency")}>
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className={labelClass}>Начало работы</span>
          <input className={inputClass} {...form.register("workStartTime")} type="time" />
        </label>
        <label className="block space-y-1">
          <span className={labelClass}>Конец работы</span>
          <input className={inputClass} {...form.register("workEndTime")} type="time" />
        </label>
      </div>

      <fieldset className="md:col-span-2">
        <legend className={labelClass}>Рабочие дни</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {WORK_DAYS.map((day) => (
            <label key={day.value} className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm">
              <input type="checkbox" value={day.value} {...form.register("workDays")} />
              {day.label}
            </label>
          ))}
        </div>
        <FieldError message={form.formState.errors.workDays?.message} />
      </fieldset>

      <button className="btn-primary md:col-span-2" type="submit" disabled={isPending}>
        {isPending ? "Сохраняю..." : "Сохранить настройки"}
      </button>
    </form>
  );
}
