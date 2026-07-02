import { z } from "zod";
import {
  APPOINTMENT_STATUSES,
  CLIENT_SOURCES,
  CLIENT_STATUSES,
  CURRENCIES,
  MESSAGE_TEMPLATE_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES
} from "@/lib/constants";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional()
);

const optionalDate = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional()
);

export const authSchema = z.object({
  email: z.string().trim().email("Укажите корректный email"),
  password: z.string().min(8, "Пароль должен быть не короче 8 символов")
});

export const registerSchema = authSchema.extend({
  name: z.string().trim().min(2, "Укажите имя")
});

export const profileSchema = z.object({
  specialization: optionalText,
  city: optionalText,
  address: optionalText,
  phone: optionalText,
  instagram: optionalText,
  telegram: optionalText,
  whatsapp: optionalText,
  currency: z.enum(CURRENCIES),
  workStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  workEndTime: z.string().regex(/^\d{2}:\d{2}$/),
  workDays: z.array(z.string()).min(1, "Выберите хотя бы один рабочий день")
});

export const serviceSchema = z.object({
  id: optionalText,
  name: z.string().trim().min(1, "Название услуги обязательно"),
  description: optionalText,
  category: optionalText,
  durationMinutes: z.coerce.number().int().positive("Длительность должна быть больше 0"),
  price: z.coerce.number().min(0, "Цена должна быть 0 или больше")
});

export const clientSchema = z.object({
  id: optionalText,
  name: z.string().trim().min(1, "Имя клиента обязательно"),
  phone: optionalText,
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().email("Укажите корректный email").optional()
  ),
  birthDate: optionalDate,
  instagram: optionalText,
  telegram: optionalText,
  source: z.enum(CLIENT_SOURCES),
  notes: optionalText,
  allergies: optionalText,
  preferences: optionalText,
  status: z.enum(CLIENT_STATUSES).optional()
});

export const appointmentSchema = z.object({
  id: optionalText,
  clientId: z.string().min(1, "Выберите клиента"),
  serviceId: z.string().min(1, "Выберите услугу"),
  date: z.string().min(1, "Выберите дату"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Укажите время"),
  price: z.coerce.number().min(0, "Цена должна быть 0 или больше").optional(),
  comment: optionalText
});

export const appointmentStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(APPOINTMENT_STATUSES)
});

export const paymentSchema = z.object({
  id: optionalText,
  appointmentId: z.string().min(1, "Выберите запись"),
  amount: z.coerce.number().positive("Сумма должна быть больше 0"),
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(PAYMENT_STATUSES),
  paidAt: z.string().min(1, "Укажите дату оплаты"),
  comment: optionalText
});

export const noteSchema = z.object({
  clientId: z.string().min(1),
  note: z.string().trim().min(1, "Заметка не должна быть пустой")
});

export const reminderStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["Done", "Cancelled"])
});

export const templateSchema = z.object({
  id: optionalText,
  name: z.string().trim().min(1, "Название шаблона обязательно"),
  type: z.enum(MESSAGE_TEMPLATE_TYPES),
  body: z.string().trim().min(1, "Текст шаблона обязателен")
});

export type ActionResult = {
  ok: boolean;
  error?: string;
};
