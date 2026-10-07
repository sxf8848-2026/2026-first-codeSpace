export type SortableArgumentReflection = {
  id: string;
  topic: string;
  occurred_at: string;
  content: string;
  created_at: string;
  archived_at?: string | null;
};

type LegacyArgumentReflection = Partial<SortableArgumentReflection> & {
  person?: unknown;
  event?: unknown;
  my_response?: unknown;
  other_response?: unknown;
  improvement?: unknown;
};

export function normalizeArgumentReflections(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableArgumentReflection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is LegacyArgumentReflection => Boolean(record) && typeof record === "object")
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : createId(),
      topic: typeof record.topic === "string" ? record.topic.trim() : "",
      occurred_at: typeof record.occurred_at === "string" ? record.occurred_at : "",
      content: normalizeContent(record),
      created_at: typeof record.created_at === "string" ? record.created_at : createStamp(),
      archived_at: typeof record.archived_at === "string" ? record.archived_at : null,
    }))
    .filter((record) => record.topic && isDateTimeLocal(record.occurred_at) && record.content);
}

export function getVisibleArgumentReflections<T extends SortableArgumentReflection>(records: T[], query = ""): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => !record.archived_at)
    .filter((record) => !normalizedQuery || `${record.topic} ${record.content}`.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => timestamp(second.occurred_at) - timestamp(first.occurred_at));
}

function normalizeContent(record: LegacyArgumentReflection): string {
  if (typeof record.content === "string") return record.content.trim();
  const legacyFields = [
    ["涉及对象", record.person],
    ["争执经过", record.event],
    ["我的反应", record.my_response],
    ["对方反应", record.other_response],
    ["下次如何改进", record.improvement],
  ].filter(([, value]) => typeof value === "string" && value.trim()) as Array<[string, string]>;
  return legacyFields.map(([label, value]) => `${label}：${value.trim()}`).join("\n\n");
}

function isDateTimeLocal(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
