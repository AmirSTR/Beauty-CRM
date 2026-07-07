"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { savePaymentAction } from "@/app/actions";
import { PAYMENT_METHODS, PAYMENT_STATUSES, displayLabel } from "@/lib/constants";
import { paymentSchema } from "@/lib/validations";
import { FieldError, FormError, inputClass, labelClass, textareaClass } from "@/components/forms/FormShell";

type PaymentValues = z.infer<typeof paymentSchema>;

export function PaymentForm({
  appointments,
  initial
}: {
  appointments: Array<{
    id: string;
    label: string;
    price: number;
  }>;
  initial?: Partial<PaymentValues>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      id: initial?.id,
      appointmentId: initial?.appointmentId ?? "",
      amount: initial?.amount ?? 0,
      method: initial?.method ?? "Cash",
      status: initial?.status ?? "Paid",
      paidAt: initial?.paidAt ?? new Date().toISOString().slice(0, 10),
      comment: initial?.comment ?? ""
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await savePaymentAction(values);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить оплату.");
        return;
      }
      setSaved(true);
      if (!initial?.id) {
        form.reset({
          appointmentId: "",
          amount: 0,
          method: "Cash",
          status: "Paid",
          paidAt: new Date().toISOString().slice(0, 10),
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
        {saved && <p className="text-sm text-sage">Оплата сохранена.</p>}
      </div>

      <label className="block space-y-1 md:col-span-2">
        <span className={labelClass}>Запись</span>
        <select className={inputClass} {...form.register("appointmentId")}>
          <option value="">Выберите запись</option>
          {appointments.map((appointment) => (
            <option key={appointment.id} value={appointment.id}>
              {appointment.label}
            </option>
          ))}
        </select>
        <FieldError message={form.formState.errors.appointmentId?.message} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Сумма</span>
        <input className={inputClass} {...form.register("amount")} type="number" min={1} step="100" />
        <FieldError message={form.formState.errors.amount?.message} />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Дата оплаты</span>
        <input className={inputClass} {...form.register("paidAt")} type="date" />
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Способ</span>
        <select className={inputClass} {...form.register("method")}>
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {displayLabel(method)}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className={labelClass}>Статус</span>
        <select className={inputClass} {...form.register("status")}>
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {displayLabel(status)}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1 md:col-span-2">
        <span className={labelClass}>Комментарий</span>
        <textarea className={textareaClass} {...form.register("comment")} />
      </label>

      <button className="btn-primary md:col-span-2" type="submit" disabled={isPending}>
        {isPending ? "Сохраняю..." : initial?.id ? "Сохранить оплату" : "Добавить оплату"}
      </button>
    </form>
  );
}
