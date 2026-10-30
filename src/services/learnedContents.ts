import type { LearnedContentRecord, LearnedContentType } from "../types";

export type LearnedContentTypeFilter = "all" | LearnedContentType;
export type LearnedContentMonthFilter = "all" | string;
export type LearnedContentStats = {
  total: number;
  currentMonth: number;
  typeCounts: Record<LearnedContentType, number>;
  trend: Array<{ month: string; count: number }>;
};

export const LEARNED_CONTENT_TYPE_OPTIONS: ReadonlyArray<readonly [LearnedContentType, string]> = [
  ["article", "文章"],
  ["course", "课程"],
  ["book", "书籍"],
  ["video", "视频"],
  ["other", "其他"],
];

const learnedContentTypes = new Set<LearnedContentType>(LEARNED_CONTENT_TYPE_OPTIONS.map(([value]) => value));
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const monthPattern = /^\d{4}-\d{2}$/;

export function normalizeLearnedContents(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
  createDay: () => string = localDay,
): LearnedContentRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<LearnedContentRecord> => Boolean(record) && typeof record === "object")
    .map((record) => {
      const createdAt = typeof record.created_at === "string" ? record.created_at : createStamp();
      return {
        id: typeof record.id === "string" ? record.id : createId(),
        type: isLearnedContentType(record.type) ? record.type : "other",
        title: typeof record.title === "string" ? record.title.trim() : "",
        completed_on: isCalendarDate(record.completed_on) ? record.completed_on : createDay(),
        source: typeof record.source === "string" ? record.source.trim() : "",
        url: typeof record.url === "string" ? record.url.trim() : "",
        takeaway: typeof record.takeaway === "string" ? record.takeaway.trim() : "",
        created_at: createdAt,
        updated_at: typeof record.updated_at === "string" ? record.updated_at : createdAt,
      };
    })
    .filter((record) => record.title && record.takeaway);
}

export function getVisibleLearnedContents(
  records: LearnedContentRecord[],
  query = "",
  typeFilter: LearnedContentTypeFilter = "all",
  monthFilter: LearnedContentMonthFilter = "all",
): LearnedContentRecord[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => typeFilter === "all" || record.type === typeFilter)
    .filter((record) => monthFilter === "all" || record.completed_on.startsWith(monthFilter))
    .filter((record) => !normalizedQuery || `${record.title} ${record.source} ${record.takeaway}`.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => second.completed_on.localeCompare(first.completed_on) || timestamp(second.created_at) - timestamp(first.created_at));
}

export function getLearnedContentMonths(records: LearnedContentRecord[]): string[] {
  return [...new Set(records.map((record) => record.completed_on.slice(0, 7)).filter((month) => monthPattern.test(month)))]
    .sort((first, second) => second.localeCompare(first));
}

export function getLearnedContentStats(records: LearnedContentRecord[], currentMonth = localMonth()): LearnedContentStats {
  const typeCounts: Record<LearnedContentType, number> = { article: 0, course: 0, book: 0, video: 0, other: 0 };
  records.forEach((record) => { typeCounts[record.type] += 1; });
  const trend = Array.from({ length: 12 }, (_, index) => offsetMonth(currentMonth, index - 11))
    .map((month) => ({ month, count: records.filter((record) => record.completed_on.startsWith(month)).length }));
  return {
    total: records.length,
    currentMonth: records.filter((record) => record.completed_on.startsWith(currentMonth)).length,
    typeCounts,
    trend,
  };
}

export function learnedContentTypeLabel(type: LearnedContentType): string {
  return LEARNED_CONTENT_TYPE_OPTIONS.find(([value]) => value === type)?.[1] ?? "其他";
}

export function isLearnedContentType(value: unknown): value is LearnedContentType {
  return typeof value === "string" && learnedContentTypes.has(value as LearnedContentType);
}

function offsetMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const total = year * 12 + monthNumber - 1 + offset;
  return `${Math.floor(total / 12)}-${String(total % 12 + 1).padStart(2, "0")}`;
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function localDay(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localMonth(): string {
  return localDay().slice(0, 7);
}
