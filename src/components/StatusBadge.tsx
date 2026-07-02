const appointmentColors: Record<string, string> = {
  New: "bg-zinc-100 text-zinc-700",
  Confirmed: "bg-sky-100 text-sky-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-zinc-200 text-zinc-700",
  NoShow: "bg-red-100 text-red-800",
  Rescheduled: "bg-amber-100 text-amber-800",
  Paid: "bg-emerald-100 text-emerald-800",
  PartiallyPaid: "bg-amber-100 text-amber-800",
  Partial: "bg-amber-100 text-amber-800",
  Unpaid: "bg-red-100 text-red-800",
  Pending: "bg-zinc-100 text-zinc-700",
  Refunded: "bg-stone-200 text-stone-800",
  VIP: "bg-honey/20 text-yellow-900",
  Problem: "bg-red-100 text-red-800",
  Sleeping: "bg-stone-200 text-stone-800",
  Regular: "bg-emerald-100 text-emerald-800",
  Active: "bg-sky-100 text-sky-800"
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${appointmentColors[value] ?? "bg-zinc-100 text-zinc-700"}`}>
      {value}
    </span>
  );
}
