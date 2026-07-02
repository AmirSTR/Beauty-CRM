import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function money(value: number | string, currency = "KZT") {
  const amount = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function shortDate(date: Date | string) {
  return format(new Date(date), "dd MMM yyyy", { locale: ru });
}

export function longDate(date: Date | string) {
  return format(new Date(date), "EEEE, dd MMMM yyyy", { locale: ru });
}

export function isoDate(date: Date | string) {
  return format(new Date(date), "yyyy-MM-dd");
}

export function periodLabel(from: Date, to: Date) {
  return `${shortDate(from)} - ${shortDate(to)}`;
}
