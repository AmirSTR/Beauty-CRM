"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { saveNoteAction } from "@/app/actions";
import { noteSchema } from "@/lib/validations";
import { FieldError, FormError, textareaClass } from "@/components/forms/FormShell";

type NoteValues = z.infer<typeof noteSchema>;

export function NoteForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<NoteValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      clientId,
      note: ""
    }
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await saveNoteAction(values);
      if (!result.ok) {
        setError(result.error ?? "Не удалось добавить заметку.");
        return;
      }
      form.reset({ clientId, note: "" });
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" {...form.register("clientId")} />
      <FormError message={error} />
      <textarea className={textareaClass} {...form.register("note")} placeholder="Новая заметка" />
      <FieldError message={form.formState.errors.note?.message} />
      <button className="btn-secondary" type="submit" disabled={isPending}>
        {isPending ? "Добавляю..." : "Добавить заметку"}
      </button>
    </form>
  );
}
