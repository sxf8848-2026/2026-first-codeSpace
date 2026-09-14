export type SortableVideoInspiration = {
  id: string;
  channel: string;
  title: string;
  content: string;
  url: string;
  pinned: boolean;
  created_at: string;
  archived_at?: string | null;
};

export type VideoInspirationChannelFilter = "all" | string;

export function normalizeVideoInspirations(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableVideoInspiration[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableVideoInspiration> => Boolean(record) && typeof record === "object")
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : createId(),
      channel: typeof record.channel === "string" ? record.channel.trim() : "",
      title: typeof record.title === "string" ? record.title.trim() : "",
      content: typeof record.content === "string" ? record.content : "",
      url: typeof record.url === "string" ? record.url.trim() : "",
      pinned: record.pinned === true,
      created_at: typeof record.created_at === "string" ? record.created_at : createStamp(),
      archived_at: typeof record.archived_at === "string" ? record.archived_at : null,
    }))
    .filter((record) => record.channel && record.title);
}

export function getVisibleVideoInspirations<T extends SortableVideoInspiration>(
  records: T[],
  query = "",
  channel: VideoInspirationChannelFilter = "all",
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => !record.archived_at)
    .filter((record) => channel === "all" || record.channel === channel)
    .filter((record) => {
      if (!normalizedQuery) return true;
      return `${record.channel} ${record.title} ${record.content} ${record.url}`.toLowerCase().includes(normalizedQuery);
    })
    .slice()
    .sort((first, second) => {
      if (first.pinned !== second.pinned) return first.pinned ? -1 : 1;
      return timestamp(second.created_at) - timestamp(first.created_at);
    });
}

export function getVideoInspirationChannels(records: SortableVideoInspiration[]): string[] {
  return Array.from(new Set(records.filter((record) => !record.archived_at).map((record) => record.channel)));
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
