"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { saveTemplateAction } from "@/app/actions";
import { MESSAGE_TEMPLATE_TYPES } from "@/lib/constants";
import { templateSchema } from "@/lib/validations";
import { FieldError, FormError, inputClass, labelClass, textareaClass } from "@/components/forms/FormShell";

type TemplateValues = z.infer<typeof templateSchema>;

export function TemplateForm({
  initial
}: {
  initial?: Partial<TemplateValues>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<TemplateValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      id: initial?.id,
      name: initial?.name ?? "",
      type: initial?.type ?? "Custom",
      body: initial?.body ?? ""
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveTemplateAction(values);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить шаблон.");
        return;
      }
      setSaved(true);
      if (!initial?.id) {
        form.reset({ name: "", type: "Custom", body: "" });
      }
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" {...form.register("id")} />
      <div className="md:col-span-2">
        <FormError message={error} />
        {saved && <p className="text-sm text-sage">Шаблон сохранен.</p>}
      </div>

      <label className="block space-y-1">
        <span className={labelClass}>Название</span>
        <input className={inputClass} {...form.register("name")} />
        <FieldError message={form.formState.errors.name?.message} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Тип</span>
        <select className={inputClass} {...form.register("type")}>
          {MESSAGE_TEMPLATE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1 md:col-span-2">
        <span className={labelClass}>Текст</span>
        <textarea className={textareaClass} {...form.register("body")} />
        <FieldError message={form.formState.errors.body?.message} />
      </label>

      <button className="btn-primary md:col-span-2" type="submit" disabled={isPending}>
        {isPending ? "Сохраняю..." : initial?.id ? "Сохранить шаблон" : "Добавить шаблон"}
      </button>
    </form>
  );
}
