"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { updateAppointmentStatusAction } from "@/app/actions";
import { APPOINTMENT_STATUSES, displayLabel } from "@/lib/constants";

export function AppointmentStatusForm({
  id,
  status
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <select
        className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none sm:w-44"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        {APPOINTMENT_STATUSES.map((item) => (
          <option key={item} value={item}>
            {displayLabel(item)}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn-secondary inline-flex items-center justify-center gap-2"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await updateAppointmentStatusAction({ id, status: value });
            if (!result.ok) {
              setError(result.error ?? "Не удалось изменить статус.");
              return;
            }
            router.refresh();
          });
        }}
      >
        <CheckCircle2 className="h-4 w-4" />
        {isPending ? "Сохраняю..." : "Статус"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
