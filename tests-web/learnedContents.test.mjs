import assert from "node:assert/strict";
import test from "node:test";
import {
  getLearnedContentMonths,
  getLearnedContentStats,
  getVisibleLearnedContents,
  normalizeLearnedContents,
} from "../src/services/learnedContents.ts";

const records = [
  { id: "article", type: "article", title: "高价值文章", completed_on: "2026-10-30", source: "公众号", url: "https://example.com/article", takeaway: "学会拆解问题", created_at: "2026-10-30T08:00:00.000Z", updated_at: "2026-10-30T08:00:00.000Z" },
  { id: "course", type: "course", title: "Agent 课程", completed_on: "2026-10-30", source: "在线课堂", url: "", takeaway: "理解工具调用", created_at: "2026-10-30T09:00:00.000Z", updated_at: "2026-10-30T09:00:00.000Z" },
  { id: "book", type: "book", title: "原则", completed_on: "2026-09-12", source: "纸质书", url: "", takeaway: "记录决策原则", created_at: "2026-09-12T08:00:00.000Z", updated_at: "2026-09-12T08:00:00.000Z" },
  { id: "video", type: "video", title: "沟通视频", completed_on: "2025-12-01", source: "B站", url: "", takeaway: "先复述再回应", created_at: "2025-12-01T08:00:00.000Z", updated_at: "2025-12-01T08:00:00.000Z" },
];

test("sorts learned contents by completion date then creation time without mutating input", () => {
  const source = [...records];
  assert.deepEqual(getVisibleLearnedContents(source).map((record) => record.id), ["course", "article", "book", "video"]);
  assert.deepEqual(source, records);
});

test("filters learned contents by keyword, type and month together", () => {
  assert.deepEqual(getVisibleLearnedContents(records, "拆解").map((record) => record.id), ["article"]);
  assert.deepEqual(getVisibleLearnedContents(records, "在线课堂").map((record) => record.id), ["course"]);
  assert.deepEqual(getVisibleLearnedContents(records, "", "book").map((record) => record.id), ["book"]);
  assert.deepEqual(getVisibleLearnedContents(records, "原则", "book", "2026-09").map((record) => record.id), ["book"]);
  assert.deepEqual(getVisibleLearnedContents(records, "原则", "book", "2026-10"), []);
});

test("collects completion months in descending order", () => {
  assert.deepEqual(getLearnedContentMonths(records), ["2026-10", "2026-09", "2025-12"]);
});

test("calculates global totals, type counts and a zero-filled twelve month trend", () => {
  const stats = getLearnedContentStats(records, "2026-10");
  assert.equal(stats.total, 4);
  assert.equal(stats.currentMonth, 2);
  assert.deepEqual(stats.typeCounts, { article: 1, course: 1, book: 1, video: 1, other: 0 });
  assert.equal(stats.trend.length, 12);
  assert.deepEqual(stats.trend[0], { month: "2025-11", count: 0 });
  assert.deepEqual(stats.trend.find((item) => item.month === "2025-12"), { month: "2025-12", count: 1 });
  assert.deepEqual(stats.trend.at(-1), { month: "2026-10", count: 2 });
});

test("normalizes old and partial learned content data", () => {
  assert.deepEqual(normalizeLearnedContents(undefined), []);
  const normalized = normalizeLearnedContents([{
    title: " 文章 ", type: "article", completed_on: "2026-02-30", source: " 来源 ", url: " example.com ", takeaway: " 收获 ", created_at: "2026-10-01T08:00:00.000Z",
  }], () => "generated", () => "2026-10-01T09:00:00.000Z", () => "2026-10-30");
  assert.deepEqual(normalized[0], {
    id: "generated", type: "article", title: "文章", completed_on: "2026-10-30", source: "来源", url: "example.com", takeaway: "收获", created_at: "2026-10-01T08:00:00.000Z", updated_at: "2026-10-01T08:00:00.000Z",
  });
});
