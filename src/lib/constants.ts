export const CLIENT_SOURCES = [
  "Instagram",
  "TikTok",
  "Referral",
  "WhatsApp",
  "Telegram",
  "GoogleMaps",
  "TwoGIS",
  "Ads",
  "Other"
] as const;

export const CLIENT_STATUSES = [
  "New",
  "Active",
  "Regular",
  "Sleeping",
  "VIP",
  "Problem"
] as const;

export const APPOINTMENT_STATUSES = [
  "New",
  "Confirmed",
  "Completed",
  "Cancelled",
  "NoShow",
  "Rescheduled"
] as const;

export const APPOINTMENT_PAYMENT_STATUSES = [
  "Unpaid",
  "PartiallyPaid",
  "Paid",
  "Refunded"
] as const;

export const PAYMENT_STATUSES = ["Pending", "Partial", "Paid", "Refunded"] as const;

export const PAYMENT_METHODS = ["Cash", "Card", "Transfer", "Online", "Other"] as const;

export const REMINDER_TYPES = [
  "AppointmentClient",
  "AppointmentMaster",
  "FollowUp",
  "Birthday"
] as const;

export const MESSAGE_TEMPLATE_TYPES = [
  "AppointmentReminder",
  "FollowUp",
  "Birthday",
  "Winback",
  "Custom"
] as const;

export const DISPLAY_LABELS: Record<string, string> = {
  Instagram: "Instagram",
  TikTok: "TikTok",
  Referral: "Рекомендация",
  WhatsApp: "WhatsApp",
  Telegram: "Telegram",
  GoogleMaps: "Google Maps",
  TwoGIS: "2GIS",
  Ads: "Реклама",
  Other: "Другое",
  New: "Новая",
  Active: "Активно",
  Regular: "Постоянный",
  Sleeping: "Давно не был",
  VIP: "VIP",
  Problem: "Проблемный",
  Archived: "В архиве",
  Confirmed: "Подтверждена",
  Completed: "Готово",
  Cancelled: "Отменена",
  NoShow: "Не пришел",
  Rescheduled: "Перенесена",
  Unpaid: "Не оплачено",
  PartiallyPaid: "Частично",
  Paid: "Оплачено",
  Refunded: "Возврат",
  Pending: "Ожидает",
  Partial: "Частично",
  Cash: "Наличные",
  Card: "Карта",
  Transfer: "Перевод",
  Online: "Онлайн",
  AppointmentReminder: "Напоминание о записи",
  FollowUp: "Написать после визита",
  Birthday: "День рождения",
  Winback: "Вернуть клиента",
  Custom: "Свой шаблон"
};

export function displayLabel(value: string) {
  return DISPLAY_LABELS[value] ?? value;
}

export const CURRENCIES = ["KZT", "RUB", "USD", "EUR"] as const;

export const WORK_DAYS = [
  { value: "1", label: "Пн" },
  { value: "2", label: "Вт" },
  { value: "3", label: "Ср" },
  { value: "4", label: "Чт" },
  { value: "5", label: "Пт" },
  { value: "6", label: "Сб" },
  { value: "0", label: "Вс" }
] as const;

export const DEFAULT_FOLLOW_UP_TEMPLATE =
  "Здравствуйте, {{clientName}}! У вас уже прошло около месяца после последнего визита. Могу предложить удобное время на этой неделе, чтобы обновить {{serviceName}}.";

export const DEFAULT_WINBACK_TEMPLATE =
  "Здравствуйте, {{clientName}}! Давно вас не видела. На этой неделе есть несколько свободных окошек, могу предложить удобное время.";