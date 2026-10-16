export type SortableDivorcePlan = {
  id: string;
  title: string;
  occurred_at: string;
  content: string;
  created_at: string;
  archived_at?: string | null;
};

export function normalizeDivorcePlans(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableDivorcePlan[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableDivorcePlan> => Boolean(record) && typeof record === "object")
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : createId(),
      title: typeof record.title === "string" ? record.title.trim() : "",
      occurred_at: typeof record.occurred_at === "string" ? record.occurred_at : "",
      content: typeof record.content === "string" ? record.content.trim() : "",
      created_at: typeof record.created_at === "string" ? record.created_at : createStamp(),
      archived_at: typeof record.archived_at === "string" ? record.archived_at : null,
    }))
    .filter((record) => record.title && isDateTimeLocal(record.occurred_at) && record.content);
}

export function getVisibleDivorcePlans<T extends SortableDivorcePlan>(records: T[], query = ""): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => !record.archived_at)
    .filter((record) => !normalizedQuery || `${record.title} ${record.content}`.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => Date.parse(second.occurred_at) - Date.parse(first.occurred_at));
}

function isDateTimeLocal(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}
