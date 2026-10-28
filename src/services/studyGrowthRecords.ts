import { studyGrowthHtmlToMarkdown, studyGrowthMarkdownToPlainText } from "./studyGrowthMarkdown.ts";

export type StudyGrowthType = "method" | "habit" | "mental_model";
export type StudyGrowthTitleSize = 18 | 22 | 26 | 30;

export const STUDY_GROWTH_TITLE_SIZES: StudyGrowthTitleSize[] = [18, 22, 26, 30];

export type SortableStudyGrowthRecord = {
  id: string;
  type: StudyGrowthType;
  title: string;
  title_size: StudyGrowthTitleSize;
  content: string;
  content_markdown: string;
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
    .filter((record): record is Partial<SortableStudyGrowthRecord> & { content_html?: unknown } => Boolean(record) && typeof record === "object")
    .map((record) => {
      const createdAt = isDateTimeStamp(record.created_at) ? record.created_at : createStamp();
      const plainContent = typeof record.content === "string" ? record.content.trim() : "";
      const contentMarkdown = typeof record.content_markdown === "string" && record.content_markdown.trim()
        ? record.content_markdown.trim()
        : typeof record.content_html === "string" && record.content_html.trim()
          ? studyGrowthHtmlToMarkdown(record.content_html)
          : plainContent;
      return {
        id: typeof record.id === "string" ? record.id : createId(),
        type: record.type === "method" || record.type === "habit" || record.type === "mental_model" ? record.type : "method",
        title: typeof record.title === "string" ? record.title.trim() : "",
        title_size: normalizeStudyGrowthTitleSize(record.title_size),
        content: studyGrowthMarkdownToPlainText(contentMarkdown),
        content_markdown: contentMarkdown,
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
  update: Pick<SortableStudyGrowthRecord, "type" | "title" | "title_size" | "content" | "content_markdown" | "source">,
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
      title_size: normalizeStudyGrowthTitleSize(update.title_size),
      content: update.content.trim(),
      content_markdown: update.content_markdown.trim(),
      source: update.source.trim(),
      updated_at: updatedAt,
    };
  });
}

function normalizeStudyGrowthTitleSize(value: unknown): StudyGrowthTitleSize {
  return STUDY_GROWTH_TITLE_SIZES.includes(value as StudyGrowthTitleSize) ? value as StudyGrowthTitleSize : 22;
}

function isDateTimeStamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}
