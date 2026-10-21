export type SortableKindnessRecord = {
  id: string;
  title: string;
  occurred_at: string;
  content: string;
  created_at: string;
};

export function normalizeKindnessRecords(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableKindnessRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableKindnessRecord> => Boolean(record) && typeof record === "object")
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : createId(),
      title: typeof record.title === "string" ? record.title.trim() : "",
      occurred_at: typeof record.occurred_at === "string" ? record.occurred_at : "",
      content: typeof record.content === "string" ? record.content.trim() : "",
      created_at: isDateTimeStamp(record.created_at) ? record.created_at : createStamp(),
    }))
    .filter((record) => record.title && isDateTimeLocal(record.occurred_at) && record.content);
}

export function getVisibleKindnessRecords<T extends SortableKindnessRecord>(
  records: T[],
  query = "",
  startDate = "",
  endDate = "",
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => !normalizedQuery || `${record.title} ${record.content}`.toLowerCase().includes(normalizedQuery))
    .filter((record) => !startDate || record.occurred_at.slice(0, 10) >= startDate)
    .filter((record) => !endDate || record.occurred_at.slice(0, 10) <= endDate)
    .slice()
    .sort((first, second) => second.occurred_at.localeCompare(first.occurred_at));
}

function isDateTimeLocal(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

function isDateTimeStamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}
