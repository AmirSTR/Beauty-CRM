import { addDays, addMonths, addWeeks, endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek, subDays } from "date-fns";

export function dateFromInput(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function dateTimeFromParts(date: Date | string, time: string) {
  const day = typeof date === "string" ? date : date.toISOString().slice(0, 10);
  return new Date(`${day}T${time}:00.000Z`);
}

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function fromMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function addMinutesToTime(time: string, minutes: number) {
  return fromMinutes(toMinutes(time) + minutes);
}

export function isOverlapping(
  newStart: string,
  newEnd: string,
  existingStart: string,
  existingEnd: string
) {
  return toMinutes(newStart) < toMinutes(existingEnd) && toMinutes(newEnd) > toMinutes(existingStart);
}

export function getRange(view: string | undefined, selectedDate: string | undefined) {
  const date = selectedDate ? dateFromInput(selectedDate) : startOfDay(new Date());

  if (view === "week") {
    return {
      from: startOfWeek(date, { weekStartsOn: 1 }),
      to: endOfWeek(date, { weekStartsOn: 1 }),
      previous: addWeeks(date, -1),
      next: addWeeks(date, 1)
    };
  }

  if (view === "month") {
    return {
      from: startOfMonth(date),
      to: endOfMonth(date),
      previous: addMonths(date, -1),
      next: addMonths(date, 1)
    };
  }

  return {
    from: startOfDay(date),
    to: endOfDay(date),
    previous: subDays(date, 1),
    next: addDays(date, 1)
  };
}
