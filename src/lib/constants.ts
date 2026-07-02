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
