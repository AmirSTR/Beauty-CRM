"use client";

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/15";

export const labelClass = "block text-xs font-semibold uppercase tracking-wide text-zinc-500";

export const textareaClass =
  "min-h-24 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/15";
