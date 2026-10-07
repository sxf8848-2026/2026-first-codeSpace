export type SortableArgumentReflection = {
  id: string;
  topic: string;
  occurred_at: string;
  person: string;
  event: string;
  my_response: string;
  other_response: string;
  improvement: string;
  created_at: string;
  archived_at?: string | null;
};

export function normalizeArgumentReflections(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableArgumentReflection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableArgumentReflection> => Boolean(record) && typeof record === "object")
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : createId(),
      topic: typeof record.topic === "string" ? record.topic.trim() : "",
      occurred_at: typeof record.occurred_at === "string" ? record.occurred_at : "",
      person: typeof record.person === "string" ? record.person.trim() : "",
      event: typeof record.event === "string" ? record.event.trim() : "",
      my_response: typeof record.my_response === "string" ? record.my_response.trim() : "",
      other_response: typeof record.other_response === "string" ? record.other_response.trim() : "",
      improvement: typeof record.improvement === "string" ? record.improvement.trim() : "",
      created_at: typeof record.created_at === "string" ? record.created_at : createStamp(),
      archived_at: typeof record.archived_at === "string" ? record.archived_at : null,
    }))
    .filter((record) => record.topic && isDateTimeLocal(record.occurred_at) && record.event && record.my_response && record.other_response && record.improvement);
}

export function getVisibleArgumentReflections<T extends SortableArgumentReflection>(records: T[], query = ""): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => !record.archived_at)
    .filter((record) => !normalizedQuery || [record.topic, record.person, record.event, record.my_response, record.other_response, record.improvement].join(" ").toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => timestamp(second.occurred_at) - timestamp(first.occurred_at));
}

function isDateTimeLocal(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
