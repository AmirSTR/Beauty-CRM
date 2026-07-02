"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateReminderStatusAction } from "@/app/actions";

export function ReminderButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        className="btn-secondary inline-flex items-center gap-2"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await updateReminderStatusAction({ id, status: "Done" });
            if (!result.ok) {
              setError(result.error ?? "Не удалось обновить напоминание.");
              return;
            }
            router.refresh();
          });
        }}
      >
        <Check className="h-4 w-4" />
        {isPending ? "Готово..." : "Выполнено"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
