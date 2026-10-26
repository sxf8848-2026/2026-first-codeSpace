export type StudyGrowthType = "method" | "habit";

export type SortableStudyGrowthRecord = {
  id: string;
  type: StudyGrowthType;
  title: string;
  content: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export function normalizeStudyGrowthRecords(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableStudyGrowthRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableStudyGrowthRecord> => Boolean(record) && typeof record === "object")
    .map((record) => {
      const createdAt = isDateTimeStamp(record.created_at) ? record.created_at : createStamp();
      return {
        id: typeof record.id === "string" ? record.id : createId(),
        type: record.type === "method" || record.type === "habit" ? record.type : "method",
        title: typeof record.title === "string" ? record.title.trim() : "",
        content: typeof record.content === "string" ? record.content.trim() : "",
        source: typeof record.source === "string" ? record.source.trim() : "",
        created_at: createdAt,
        updated_at: isDateTimeStamp(record.updated_at) ? record.updated_at : createdAt,
      };
    })
    .filter((record) => record.title && record.content);
}

export function getVisibleStudyGrowthRecords<T extends SortableStudyGrowthRecord>(
  records: T[],
  type: StudyGrowthType,
  query = "",
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => record.type === type)
    .filter((record) => !normalizedQuery || `${record.title} ${record.content} ${record.source}`.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => second.created_at.localeCompare(first.created_at));
}

export function updateStudyGrowthRecord(
  records: SortableStudyGrowthRecord[],
  recordId: string,
  update: Pick<SortableStudyGrowthRecord, "type" | "title" | "content" | "source">,
  updatedAt: string,
): SortableStudyGrowthRecord[] {
  return records.map((record) => record.id === recordId ? {
    ...record,
    ...update,
    title: update.title.trim(),
    content: update.content.trim(),
    source: update.source.trim(),
    updated_at: updatedAt,
  } : record);
}

function isDateTimeStamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}
