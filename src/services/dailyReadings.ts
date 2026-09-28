export type SortableDailyReading = {
  id: string;
  title: string;
  body: string;
  source: string;
  created_at: string;
  archived_at?: string | null;
};

export function normalizeDailyReadings(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableDailyReading[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableDailyReading> => Boolean(record) && typeof record === "object")
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : createId(),
      title: typeof record.title === "string" ? record.title.trim() : "",
      body: typeof record.body === "string" ? record.body.trim() : "",
      source: typeof record.source === "string" ? record.source.trim() : "",
      created_at: typeof record.created_at === "string" ? record.created_at : createStamp(),
      archived_at: typeof record.archived_at === "string" ? record.archived_at : null,
    }))
    .filter((record) => record.title && record.body);
}

export function getActiveDailyReadings<T extends SortableDailyReading>(records: T[]): T[] {
  return records
    .filter((record) => !record.archived_at)
    .slice()
    .sort((first, second) => timestamp(first.created_at) - timestamp(second.created_at));
}

export function getVisibleDailyReadings<T extends SortableDailyReading>(records: T[], query = ""): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return getActiveDailyReadings(records).filter((record) => {
    if (!normalizedQuery) return true;
    return `${record.title} ${record.body} ${record.source}`.toLowerCase().includes(normalizedQuery);
  });
}

export function resolveDailyReadingCursorId(records: SortableDailyReading[], cursorId: unknown): string | null {
  const activeRecords = getActiveDailyReadings(records);
  if (!activeRecords.length) return null;
  return typeof cursorId === "string" && activeRecords.some((record) => record.id === cursorId) ? cursorId : activeRecords[0].id;
}

export function getCurrentDailyReading<T extends SortableDailyReading>(records: T[], cursorId: string | null): T | null {
  const activeRecords = getActiveDailyReadings(records);
  if (!activeRecords.length) return null;
  return activeRecords.find((record) => record.id === cursorId) ?? activeRecords[0];
}

export function getNextDailyReadingId(records: SortableDailyReading[], currentId: string | null): string | null {
  const activeRecords = getActiveDailyReadings(records);
  if (!activeRecords.length) return null;
  const currentIndex = activeRecords.findIndex((record) => record.id === currentId);
  return activeRecords[(currentIndex + 1 + activeRecords.length) % activeRecords.length].id;
}

export function getDailyReadingPosition(records: SortableDailyReading[], cursorId: string | null): { current: number; total: number } {
  const activeRecords = getActiveDailyReadings(records);
  const currentIndex = activeRecords.findIndex((record) => record.id === cursorId);
  return { current: currentIndex >= 0 ? currentIndex + 1 : activeRecords.length ? 1 : 0, total: activeRecords.length };
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
