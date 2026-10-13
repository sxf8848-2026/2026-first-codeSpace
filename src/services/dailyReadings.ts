export type SortableDailyReading = {
  id: string;
  title: string;
  body: string;
  source: string;
  sort_order?: number;
  created_at: string;
  archived_at?: string | null;
};

export function normalizeDailyReadings(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): Array<SortableDailyReading & { sort_order: number }> {
  if (!Array.isArray(raw)) return [];
  const records = raw
    .filter((record): record is Partial<SortableDailyReading> => Boolean(record) && typeof record === "object")
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : createId(),
      title: typeof record.title === "string" ? record.title.trim() : "",
      body: typeof record.body === "string" ? record.body.trim() : "",
      source: typeof record.source === "string" ? record.source.trim() : "",
      sort_order: isSortOrder(record.sort_order) ? record.sort_order : undefined,
      created_at: typeof record.created_at === "string" ? record.created_at : createStamp(),
      archived_at: typeof record.archived_at === "string" ? record.archived_at : null,
    }))
    .filter((record) => record.title && record.body);
  return normalizeDailyReadingOrder(records).map((record) => ({ ...record, sort_order: record.sort_order ?? 1 }));
}

export function getActiveDailyReadings<T extends SortableDailyReading>(records: T[]): T[] {
  return records
    .filter((record) => !record.archived_at)
    .slice()
    .sort(compareDailyReadings);
}

export function reorderDailyReadings<T extends SortableDailyReading>(records: T[], recordId: string, targetPosition: number): T[] {
  const activeRecords = getActiveDailyReadings(records);
  const currentIndex = activeRecords.findIndex((record) => record.id === recordId);
  if (currentIndex < 0) return records;
  const [record] = activeRecords.splice(currentIndex, 1);
  activeRecords.splice(Math.min(Math.max(targetPosition, 1), activeRecords.length + 1) - 1, 0, record);
  const positions = new Map(activeRecords.map((item, index) => [item.id, index + 1]));
  return records.map((item) => (positions.has(item.id) ? { ...item, sort_order: positions.get(item.id) } : item));
}

export function normalizeDailyReadingOrder<T extends SortableDailyReading>(records: T[]): T[] {
  const activePositions = new Map(getActiveDailyReadings(records).map((record, index) => [record.id, index + 1]));
  const archivedRecords = records.filter((record) => record.archived_at).sort(compareDailyReadings);
  const archivedPositions = new Map(archivedRecords.map((record, index) => [record.id, activePositions.size + index + 1]));
  return records.map((record) => ({ ...record, sort_order: activePositions.get(record.id) ?? archivedPositions.get(record.id) ?? 1 }));
}

export function getVisibleDailyReadings<T extends SortableDailyReading>(records: T[], query = ""): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return getActiveDailyReadings(records).filter((record) => {
    if (!normalizedQuery) return true;
    return `${record.title} ${record.body} ${record.source}`.toLowerCase().includes(normalizedQuery);
  });
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function compareDailyReadings(first: SortableDailyReading, second: SortableDailyReading): number {
  const firstOrder = isSortOrder(first.sort_order) ? first.sort_order : Number.MAX_SAFE_INTEGER;
  const secondOrder = isSortOrder(second.sort_order) ? second.sort_order : Number.MAX_SAFE_INTEGER;
  return firstOrder - secondOrder || timestamp(first.created_at) - timestamp(second.created_at);
}

function isSortOrder(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
