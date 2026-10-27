import { plainTextToStudyGrowthHtml, sanitizeStudyGrowthHtml, studyGrowthHtmlToPlainText } from "./studyGrowthRichText.ts";

export type StudyGrowthType = "method" | "habit" | "mental_model";

export type SortableStudyGrowthRecord = {
  id: string;
  type: StudyGrowthType;
  title: string;
  content: string;
  content_html: string;
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
      const plainContent = typeof record.content === "string" ? record.content.trim() : "";
      const savedHtml = typeof record.content_html === "string" ? sanitizeStudyGrowthHtml(record.content_html) : "";
      const contentHtml = studyGrowthHtmlToPlainText(savedHtml) ? savedHtml : plainTextToStudyGrowthHtml(plainContent);
      return {
        id: typeof record.id === "string" ? record.id : createId(),
        type: record.type === "method" || record.type === "habit" || record.type === "mental_model" ? record.type : "method",
        title: typeof record.title === "string" ? record.title.trim() : "",
        content: studyGrowthHtmlToPlainText(contentHtml),
        content_html: contentHtml,
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
  update: Pick<SortableStudyGrowthRecord, "type" | "title" | "content" | "content_html" | "source">,
  updatedAt: string,
): SortableStudyGrowthRecord[] {
  return records.map((record) => {
    if (record.id !== recordId) return record;
    const type = record.type === "mental_model" || update.type === "mental_model" ? record.type : update.type;
    return {
      ...record,
      ...update,
      type,
      title: update.title.trim(),
      content: update.content.trim(),
      content_html: sanitizeStudyGrowthHtml(update.content_html),
      source: update.source.trim(),
      updated_at: updatedAt,
    };
  });
}

function isDateTimeStamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}
