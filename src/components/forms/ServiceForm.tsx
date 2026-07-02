"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { saveServiceAction } from "@/app/actions";
import { serviceSchema } from "@/lib/validations";
import { FieldError, FormError, inputClass, labelClass, textareaClass } from "@/components/forms/FormShell";

type ServiceValues = z.infer<typeof serviceSchema>;

export function ServiceForm({
  initial,
  compact = false
}: {
  initial?: Partial<ServiceValues>;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      id: initial?.id,
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      category: initial?.category ?? "",
      durationMinutes: initial?.durationMinutes ?? 60,
      price: initial?.price ?? 0
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveServiceAction(values);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить услугу.");
        return;
      }
      setSaved(true);
      if (!initial?.id) {
        form.reset({
          name: "",
          description: "",
          category: "",
          durationMinutes: 60,
          price: 0
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
        <span className={labelClass}>Название</span>
        <input className={inputClass} {...form.register("name")} />
        <FieldError message={form.formState.errors.name?.message} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Категория</span>
        <input className={inputClass} {...form.register("category")} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Длительность, минут</span>
        <input className={inputClass} {...form.register("durationMinutes")} type="number" min={1} />
        <FieldError message={form.formState.errors.durationMinutes?.message} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Цена</span>
        <input className={inputClass} {...form.register("price")} type="number" min={0} step="100" />
        <FieldError message={form.formState.errors.price?.message} />
      </label>

      <label className={compact ? "block space-y-1" : "block space-y-1 md:col-span-2"}>
        <span className={labelClass}>Описание</span>
        <textarea className={textareaClass} {...form.register("description")} />
      </label>

      <button className="btn-primary md:col-span-2" type="submit" disabled={isPending}>
        {isPending ? "Сохраняю..." : initial?.id ? "Сохранить услугу" : "Добавить услугу"}
      </button>
    </form>
  );
}
