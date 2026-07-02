"use client";

import { Archive, RotateCcw, Trash2, XCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  archiveClientAction,
  archiveServiceAction,
  cancelAppointmentAction,
  deleteNoteAction,
  deletePaymentAction,
  deleteTemplateAction,
  restoreClientAction,
  restoreServiceAction
} from "@/app/actions";

type ActionKind =
  | "archiveService"
  | "restoreService"
  | "archiveClient"
  | "restoreClient"
  | "deletePayment"
  | "deleteTemplate"
  | "deleteNote"
  | "cancelAppointment";

const actionMap: Record<ActionKind, (id: string) => Promise<void>> = {
  archiveService: archiveServiceAction,
  restoreService: restoreServiceAction,
  archiveClient: archiveClientAction,
  restoreClient: restoreClientAction,
  deletePayment: deletePaymentAction,
  deleteTemplate: deleteTemplateAction,
  deleteNote: deleteNoteAction,
  cancelAppointment: cancelAppointmentAction
};

export function ConfirmActionButton({
  id,
  kind,
  label,
  confirmText
}: {
  id: string;
  kind: ActionKind;
  label: string;
  confirmText: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const Icon =
    kind.startsWith("restore") ? RotateCcw : kind === "cancelAppointment" ? XCircle : kind.startsWith("delete") ? Trash2 : Archive;

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        className="btn-secondary inline-flex items-center gap-2"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(confirmText)) return;
          setError(null);
          startTransition(async () => {
            try {
              await actionMap[kind](id);
              router.refresh();
            } catch {
              setError("Действие не выполнено.");
            }
          });
        }}
      >
        <Icon className="h-4 w-4" />
        {isPending ? "Подождите..." : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
