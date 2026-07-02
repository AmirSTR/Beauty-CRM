export function EmptyState({
  title,
  text
}: {
  title: string;
  text?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-zinc-50 px-4 py-8 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">{text}</p>}
    </div>
  );
}
