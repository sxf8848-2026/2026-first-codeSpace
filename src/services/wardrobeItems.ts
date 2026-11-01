import type { WardrobeItemRecord } from "../types";

export type WardrobeCategoryFilter = "all" | string;
export type WardrobeMonthFilter = "all" | string;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const monthPattern = /^\d{4}-\d{2}$/;

export function normalizeWardrobeItems(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
  createDay: () => string = localDay,
): WardrobeItemRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<WardrobeItemRecord> => Boolean(record) && typeof record === "object")
    .map((record) => {
      const createdAt = isTimestamp(record.created_at) ? record.created_at : createStamp();
      const priceCents = typeof record.price_cents === "number" && Number.isSafeInteger(record.price_cents) && record.price_cents >= 0
        ? record.price_cents
        : null;
      return {
        id: typeof record.id === "string" ? record.id : createId(),
        name: typeof record.name === "string" ? record.name.trim() : "",
        category: typeof record.category === "string" ? record.category.trim() : "",
        purchased_on: isCalendarDate(record.purchased_on) ? record.purchased_on : createDay(),
        price_cents: priceCents,
        source: typeof record.source === "string" ? record.source.trim() : "",
        note: typeof record.note === "string" ? record.note.trim() : "",
        created_at: createdAt,
        updated_at: isTimestamp(record.updated_at) ? record.updated_at : createdAt,
        archived_at: isTimestamp(record.archived_at) ? record.archived_at : null,
      };
    })
    .filter((record) => record.name && record.category);
}

export function getActiveWardrobeItems(
  records: WardrobeItemRecord[],
  query = "",
  categoryFilter: WardrobeCategoryFilter = "all",
  monthFilter: WardrobeMonthFilter = "all",
): WardrobeItemRecord[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => !record.archived_at)
    .filter((record) => categoryFilter === "all" || record.category === categoryFilter)
    .filter((record) => monthFilter === "all" || record.purchased_on.startsWith(monthFilter))
    .filter((record) => !normalizedQuery || `${record.name} ${record.source} ${record.note}`.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => second.purchased_on.localeCompare(first.purchased_on) || timestamp(second.created_at) - timestamp(first.created_at));
}

export function getArchivedWardrobeItems(records: WardrobeItemRecord[], query = ""): WardrobeItemRecord[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => Boolean(record.archived_at))
    .filter((record) => !normalizedQuery || `${record.name} ${record.source} ${record.note}`.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => timestamp(second.archived_at ?? "") - timestamp(first.archived_at ?? ""));
}

export function getWardrobeCategories(records: WardrobeItemRecord[]): string[] {
  return [...new Set(records.filter((record) => !record.archived_at).map((record) => record.category).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, "zh-CN"));
}

export function getWardrobeMonths(records: WardrobeItemRecord[]): string[] {
  return [...new Set(records.filter((record) => !record.archived_at).map((record) => record.purchased_on.slice(0, 7)).filter((month) => monthPattern.test(month)))]
    .sort((first, second) => second.localeCompare(first));
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function localDay(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
