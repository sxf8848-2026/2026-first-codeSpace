import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleBooks, normalizeBooks } from "../src/services/books.ts";

const books = [
  { id: "old", title: "旧书", author: "甲", note: "基础笔记", status: "read", created_at: "2026-09-01T08:00:00.000Z", updated_at: "2026-09-01T08:00:00.000Z" },
  { id: "new", title: "新书", author: "乙", note: "准备开始", status: "reading", created_at: "2026-09-03T08:00:00.000Z", updated_at: "2026-09-03T08:00:00.000Z" },
  { id: "want", title: "计划阅读", author: "丙", note: "未来要看", status: "want_to_read", created_at: "2026-09-02T08:00:00.000Z", updated_at: "2026-09-02T08:00:00.000Z" },
];

test("sorts books by creation time descending", () => {
  assert.deepEqual(getVisibleBooks(books).map((book) => book.id), ["new", "want", "old"]);
});

test("filters books by status", () => {
  assert.deepEqual(getVisibleBooks(books, "", "read").map((book) => book.id), ["old"]);
});

test("searches book title, author and note", () => {
  assert.deepEqual(getVisibleBooks(books, "乙").map((book) => book.id), ["new"]);
  assert.deepEqual(getVisibleBooks(books, "未来").map((book) => book.id), ["want"]);
});

test("combines search and status filters", () => {
  assert.deepEqual(getVisibleBooks(books, "阅读", "want_to_read").map((book) => book.id), ["want"]);
  assert.deepEqual(getVisibleBooks(books, "阅读", "read"), []);
});

test("normalizes missing updated_at from created_at", () => {
  assert.equal(normalizeBooks([{ ...books[0], updated_at: undefined }])[0].updated_at, books[0].created_at);
});
