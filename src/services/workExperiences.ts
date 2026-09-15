export type SortableWorkExperience = {
  id: string;
  title: string;
  body: string;
  month: string;
  pinned: boolean;
  created_at: string;
  archived_at?: string | null;
};

export type WorkExperienceMonthFilter = "all" | string;

export function normalizeWorkExperiences(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableWorkExperience[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableWorkExperience> => Boolean(record) && typeof record === "object")
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : createId(),
      title: typeof record.title === "string" ? record.title.trim() : "",
      body: typeof record.body === "string" ? record.body : "",
      month: normalizeMonth(record.month, record.created_at, createStamp),
      pinned: record.pinned === true,
      created_at: typeof record.created_at === "string" ? record.created_at : createStamp(),
      archived_at: typeof record.archived_at === "string" ? record.archived_at : null,
    }))
    .filter((record) => record.title);
}

export function getVisibleWorkExperiences<T extends SortableWorkExperience>(
  records: T[],
  query = "",
  monthFilter: WorkExperienceMonthFilter = "all",
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => !record.archived_at)
    .filter((record) => monthFilter === "all" || record.month === monthFilter)
    .filter((record) => {
      if (!normalizedQuery) return true;
      return `${record.title} ${record.body}`.toLowerCase().includes(normalizedQuery);
    })
    .slice()
    .sort((first, second) => {
      if (first.pinned !== second.pinned) return first.pinned ? -1 : 1;
      return timestamp(second.created_at) - timestamp(first.created_at);
    });
}

export function getWorkExperienceMonths<T extends SortableWorkExperience>(records: T[]): string[] {
  return Array.from(new Set(records.filter((record) => !record.archived_at).map((record) => record.month)))
    .filter(isMonthKey)
    .sort()
    .reverse();
}

function normalizeMonth(month: unknown, createdAt: unknown, createStamp: () => string): string {
  if (typeof month === "string" && isMonthKey(month)) return month;
  if (typeof createdAt === "string") {
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) return monthKey(parsed);
  }
  return monthKey(new Date(createStamp()));
}

function monthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function isMonthKey(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value);
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
