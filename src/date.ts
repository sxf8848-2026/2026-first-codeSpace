const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function monthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function fromMonthKey(key: string): Date {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dayOffset);
  return start;
}

export function weekKey(date: Date): string {
  return dateKey(startOfWeek(date));
}

export function formatWeekRange(date: Date): string {
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  return `${dateKey(start)} 至 ${dateKey(end)}`;
}

export function formatDisplayDate(date: Date): string {
  return `${date.getFullYear()} 年 ${String(date.getMonth() + 1).padStart(2, "0")} 月 ${String(
    date.getDate(),
  ).padStart(2, "0")} 日`;
}

export function formatMonthTitle(date: Date): string {
  return `${date.getFullYear()} 年 ${String(date.getMonth() + 1).padStart(2, "0")} 月`;
}

export function dayLabel(date: Date): string {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((dateStart.getTime() - todayStart.getTime()) / 86400000);
  const suffix = diff === 0 ? "今天" : diff === -1 ? "昨天" : diff === 1 ? "明天" : "";
  return suffix ? `${WEEKDAYS[date.getDay()]} · ${suffix}` : WEEKDAYS[date.getDay()];
}

export function formatTime(stamp: string | null): string {
  if (!stamp) return "";
  const parsed = new Date(stamp);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
}

export function nowStamp(): string {
  return new Date().toISOString();
}
