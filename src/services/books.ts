export type BookStatus = "want_to_read" | "reading" | "read";

export type SortableBook = {
  id: string;
  title: string;
  author: string;
  note: string;
  status: BookStatus;
  created_at: string;
  updated_at: string;
};

export type BookStatusFilter = "all" | BookStatus;

const statuses = new Set<BookStatus>(["want_to_read", "reading", "read"]);

export function normalizeBooks(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): SortableBook[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((book): book is Partial<SortableBook> => Boolean(book) && typeof book === "object")
    .map((book) => {
      const createdAt = typeof book.created_at === "string" ? book.created_at : createStamp();
      return {
        id: typeof book.id === "string" ? book.id : createId(),
        title: typeof book.title === "string" ? book.title.trim() : "",
        author: typeof book.author === "string" ? book.author.trim() : "",
        note: typeof book.note === "string" ? book.note.trim() : "",
        status: isBookStatus(book.status) ? book.status : "want_to_read",
        created_at: createdAt,
        updated_at: typeof book.updated_at === "string" ? book.updated_at : createdAt,
      };
    })
    .filter((book) => book.title);
}

export function getVisibleBooks<T extends SortableBook>(
  books: T[],
  query = "",
  statusFilter: BookStatusFilter = "all",
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return books
    .filter((book) => statusFilter === "all" || book.status === statusFilter)
    .filter((book) => !normalizedQuery || `${book.title} ${book.author} ${book.note}`.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => timestamp(second.created_at) - timestamp(first.created_at));
}

export function isBookStatus(value: unknown): value is BookStatus {
  return typeof value === "string" && statuses.has(value as BookStatus);
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
