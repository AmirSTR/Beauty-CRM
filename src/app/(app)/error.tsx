"use client";

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="panel p-6">
      <h2 className="text-xl font-semibold text-ink">Не удалось загрузить страницу</h2>
      <p className="mt-2 text-sm text-zinc-600">{error.message || "Попробуйте обновить страницу."}</p>
      <button className="btn-primary mt-4" type="button" onClick={() => reset()}>
        Повторить
      </button>
    </div>
  );
}
