import type { MetaLearningMastery } from "../types";

export type SortableMetaLearningAbility = {
  id: string;
  name: string;
  summary: string;
  usage: string;
  mastery: MetaLearningMastery;
  created_at: string;
  archived_at?: string | null;
};

export const META_LEARNING_MASTERY_OPTIONS: { value: MetaLearningMastery; label: string }[] = [
  { value: "todo", label: "待学习" },
  { value: "learning", label: "学习中" },
  { value: "mastered", label: "已掌握" },
  { value: "skilled", label: "熟练" },
];

export type MetaLearningMasteryFilter = "all" | MetaLearningMastery;

export function normalizeMetaLearningAbilities(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableMetaLearningAbility[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableMetaLearningAbility> => Boolean(record) && typeof record === "object")
    .map((record) => ({
      id: typeof record.id === "string" ? record.id : createId(),
      name: typeof record.name === "string" ? record.name.trim() : "",
      summary: typeof record.summary === "string" ? record.summary : "",
      usage: typeof record.usage === "string" ? record.usage : "",
      mastery: normalizeMetaLearningMastery(record.mastery),
      created_at: typeof record.created_at === "string" ? record.created_at : createStamp(),
      archived_at: typeof record.archived_at === "string" ? record.archived_at : null,
    }))
    .filter((record) => record.name);
}

export function getVisibleMetaLearningAbilities<T extends SortableMetaLearningAbility>(
  records: T[],
  query = "",
  mastery: MetaLearningMasteryFilter = "all",
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => !record.archived_at)
    .filter((record) => mastery === "all" || record.mastery === mastery)
    .filter((record) => {
      if (!normalizedQuery) return true;
      return `${record.name} ${record.summary} ${record.usage}`.toLowerCase().includes(normalizedQuery);
    })
    .slice()
    .sort((first, second) => timestamp(second.created_at) - timestamp(first.created_at));
}

export function normalizeMetaLearningMastery(value: unknown): MetaLearningMastery {
  return value === "todo" || value === "learning" || value === "mastered" || value === "skilled" ? value : "todo";
}

export function metaLearningMasteryLabel(value: MetaLearningMastery): string {
  return META_LEARNING_MASTERY_OPTIONS.find((option) => option.value === value)?.label ?? "待学习";
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
