export type SortableVideoNote = {
  id: string;
  title: string;
  quote: string;
  reflection: string;
  source: string;
  url: string;
  pinned: boolean;
  created_at: string;
  archived_at?: string | null;
};

export function normalizeVideoNotes(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableVideoNote[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableVideoNote> => Boolean(record) && typeof record === "object")
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : createId(),
      title: typeof record.title === "string" ? record.title.trim() : "",
      quote: typeof record.quote === "string" ? record.quote.trim() : "",
      reflection: typeof record.reflection === "string" ? record.reflection.trim() : "",
      source: typeof record.source === "string" ? record.source.trim() : "",
      url: typeof record.url === "string" ? record.url.trim() : "",
      pinned: record.pinned === true,
      created_at: typeof record.created_at === "string" ? record.created_at : createStamp(),
      archived_at: typeof record.archived_at === "string" ? record.archived_at : null,
    }))
    .filter((record) => record.title && (record.quote || record.reflection));
}

export function getVisibleVideoNotes<T extends SortableVideoNote>(records: T[], query = ""): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => !record.archived_at)
    .filter((record) => {
      if (!normalizedQuery) return true;
      return `${record.title} ${record.quote} ${record.reflection} ${record.source} ${record.url}`
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .slice()
    .sort((first, second) => {
      if (first.pinned !== second.pinned) return first.pinned ? -1 : 1;
      return timestamp(second.created_at) - timestamp(first.created_at);
    });
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
