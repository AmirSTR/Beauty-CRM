"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { saveAppointmentAction } from "@/app/actions";
import { appointmentSchema } from "@/lib/validations";
import { FieldError, FormError, inputClass, labelClass, textareaClass } from "@/components/forms/FormShell";

type AppointmentValues = z.infer<typeof appointmentSchema>;
type SelectOption = {
  id: string;
  name: string;
};
type ServiceOption = SelectOption & {
  durationMinutes: number;
  price: number;
};

export function AppointmentForm({
  clients,
  services,
  initial
}: {
  clients: SelectOption[];
  services: ServiceOption[];
  initial?: Partial<AppointmentValues>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<AppointmentValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      id: initial?.id,
      clientId: initial?.clientId ?? "",
      serviceId: initial?.serviceId ?? "",
      date: initial?.date ?? new Date().toISOString().slice(0, 10),
      startTime: initial?.startTime ?? "10:00",
      price: initial?.price ?? undefined,
      comment: initial?.comment ?? ""
    }
  });
  const selectedServiceId = form.watch("serviceId");

  useEffect(() => {
    const service = services.find((item) => item.id === selectedServiceId);
    if (service && !initial?.id) {
      form.setValue("price", service.price);
    }
  }, [form, initial?.id, selectedServiceId, services]);

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveAppointmentAction(values);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить запись.");
        return;
      }
      setSaved(true);
      if (!initial?.id) {
        form.reset({
          clientId: "",
          serviceId: "",
          date: new Date().toISOString().slice(0, 10),
          startTime: "10:00",
          price: undefined,
          comment: ""
        });
      }
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" {...form.register("id")} />
      <div className="md:col-span-2">
        <FormError message={error} />
        {saved && <p className="text-sm text-sage">Запись сохранена.</p>}
      </div>

      <label className="block space-y-1">
        <span className={labelClass}>Клиент</span>
        <select className={inputClass} {...form.register("clientId")}>
          <option value="">Выберите клиента</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <FieldError message={form.formState.errors.clientId?.message} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Услуга</span>
        <select className={inputClass} {...form.register("serviceId")}>
          <option value="">Выберите услугу</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} · {service.durationMinutes} мин
            </option>
          ))}
        </select>
        <FieldError message={form.formState.errors.serviceId?.message} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Дата</span>
        <input className={inputClass} {...form.register("date")} type="date" />
        <FieldError message={form.formState.errors.date?.message} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Начало</span>
        <input className={inputClass} {...form.register("startTime")} type="time" />
        <FieldError message={form.formState.errors.startTime?.message} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Цена</span>
        <input className={inputClass} {...form.register("price")} type="number" min={0} step="100" />
      </label>

      <label className="block space-y-1 md:col-span-2">
        <span className={labelClass}>Комментарий</span>
        <textarea className={textareaClass} {...form.register("comment")} />
      </label>

      <button className="btn-primary md:col-span-2" type="submit" disabled={isPending}>
        {isPending ? "Сохраняю..." : initial?.id ? "Перенести запись" : "Создать запись"}
      </button>
    </form>
  );
}
