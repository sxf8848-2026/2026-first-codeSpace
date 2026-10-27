export type SkincareCategory = "cleanser" | "toner" | "serum" | "lotion" | "cream" | "sunscreen" | "mask" | "other";
export type SkincareCategoryFilter = "all" | SkincareCategory;

export type SortableSkincareProduct = {
  id: string;
  name: string;
  brand: string;
  category: SkincareCategory;
  description: string;
  created_at: string;
  updated_at: string;
};

export const SKINCARE_CATEGORY_OPTIONS: ReadonlyArray<readonly [SkincareCategory, string]> = [
  ["cleanser", "洁面"],
  ["toner", "爽肤水"],
  ["serum", "精华"],
  ["lotion", "乳液"],
  ["cream", "面霜"],
  ["sunscreen", "防晒"],
  ["mask", "面膜"],
  ["other", "其他"],
];

const categories = new Set<SkincareCategory>(SKINCARE_CATEGORY_OPTIONS.map(([value]) => value));

export function isSkincareCategory(value: unknown): value is SkincareCategory {
  return typeof value === "string" && categories.has(value as SkincareCategory);
}

export function skincareCategoryLabel(category: SkincareCategory): string {
  return SKINCARE_CATEGORY_OPTIONS.find(([value]) => value === category)?.[1] ?? "其他";
}

export function normalizeSkincareProducts(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableSkincareProduct[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableSkincareProduct> => Boolean(record) && typeof record === "object")
    .map((record) => {
      const createdAt = isDateTimeStamp(record.created_at) ? record.created_at : createStamp();
      return {
        id: typeof record.id === "string" ? record.id : createId(),
        name: typeof record.name === "string" ? record.name.trim() : "",
        brand: typeof record.brand === "string" ? record.brand.trim() : "",
        category: isSkincareCategory(record.category) ? record.category : "other",
        description: typeof record.description === "string" ? record.description.trim() : "",
        created_at: createdAt,
        updated_at: isDateTimeStamp(record.updated_at) ? record.updated_at : createdAt,
      };
    })
    .filter((record) => record.name);
}

export function getVisibleSkincareProducts<T extends SortableSkincareProduct>(
  records: T[],
  query = "",
  categoryFilter: SkincareCategoryFilter = "all",
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return records
    .filter((record) => categoryFilter === "all" || record.category === categoryFilter)
    .filter((record) => !normalizedQuery || `${record.name} ${record.brand} ${record.description}`.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => timestamp(second.created_at) - timestamp(first.created_at));
}

function isDateTimeStamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
