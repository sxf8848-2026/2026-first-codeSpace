import assert from "node:assert/strict";
import test from "node:test";
import {
  getCurrentDailyReading,
  getDailyReadingPosition,
  getNextDailyReadingId,
  getVisibleDailyReadings,
  normalizeDailyReadings,
  reorderDailyReadings,
  resolveDailyReadingCursorId,
} from "../src/services/dailyReadings.ts";

const records = [
  { id: "second", title: "第二条", body: "正文二", source: "书籍", sort_order: 2, created_at: "2026-09-12T08:00:00.000Z", archived_at: null },
  { id: "first", title: "第一条", body: "正文一", source: "笔记", sort_order: 1, created_at: "2026-09-11T08:00:00.000Z", archived_at: null },
  { id: "archived", title: "归档条目", body: "不展示", source: "旧书", sort_order: 3, created_at: "2026-09-10T08:00:00.000Z", archived_at: "2026-09-13T08:00:00.000Z" },
];

test("sorts visible daily readings by custom order and hides archived records", () => {
  assert.deepEqual(getVisibleDailyReadings(records).map((record) => record.id), ["first", "second"]);
});

test("filters daily readings by title, body or source", () => {
  assert.deepEqual(getVisibleDailyReadings(records, "正文二").map((record) => record.id), ["second"]);
  assert.deepEqual(getVisibleDailyReadings(records, "笔记").map((record) => record.id), ["first"]);
});

test("uses the first active record when the cursor is missing or invalid", () => {
  assert.equal(resolveDailyReadingCursorId(records, null), "first");
  assert.equal(resolveDailyReadingCursorId(records, "archived"), "first");
  assert.equal(getCurrentDailyReading(records, "missing")?.id, "first");
});

test("advances to the next record and wraps back to the first record", () => {
  assert.equal(getNextDailyReadingId(records, "first"), "second");
  assert.equal(getNextDailyReadingId(records, "second"), "first");
});

test("reports the current position in the reading cycle", () => {
  assert.deepEqual(getDailyReadingPosition(records, "second"), { current: 2, total: 2 });
});

test("normalizes old or incomplete daily reading data", () => {
  assert.deepEqual(normalizeDailyReadings(undefined), []);
  assert.deepEqual(
    normalizeDailyReadings([{ id: "reading", title: " 标题 ", body: " 正文 ", created_at: "2026-09-17T08:00:00.000Z" }]),
    [{ id: "reading", title: "标题", body: "正文", source: "", sort_order: 1, created_at: "2026-09-17T08:00:00.000Z", archived_at: null }],
  );
});

test("assigns old daily readings continuous positions by creation time", () => {
  const normalized = normalizeDailyReadings([
    { id: "later", title: "后添加", body: "正文", source: "", created_at: "2026-09-18T08:00:00.000Z" },
    { id: "earlier", title: "先添加", body: "正文", source: "", created_at: "2026-09-17T08:00:00.000Z" },
  ]);
  assert.deepEqual(normalized.map((record) => [record.id, record.sort_order]), [["later", 2], ["earlier", 1]]);
});

test("moves a reading earlier and shifts the intervening readings back", () => {
  const reordered = reorderDailyReadings([
    { ...records[1] },
    { ...records[0] },
    { id: "third", title: "第三条", body: "正文三", source: "", sort_order: 3, created_at: "2026-09-13T08:00:00.000Z", archived_at: null },
    { id: "fourth", title: "第四条", body: "正文四", source: "", sort_order: 4, created_at: "2026-09-14T08:00:00.000Z", archived_at: null },
  ], "fourth", 2);
  assert.deepEqual(getVisibleDailyReadings(reordered).map((record) => [record.id, record.sort_order]), [
    ["first", 1], ["fourth", 2], ["second", 3], ["third", 4],
  ]);
});

test("moves a reading later and uses the custom order for the next reading", () => {
  const reordered = reorderDailyReadings([
    { ...records[1] },
    { ...records[0] },
    { id: "third", title: "第三条", body: "正文三", source: "", sort_order: 3, created_at: "2026-09-13T08:00:00.000Z", archived_at: null },
    { id: "fourth", title: "第四条", body: "正文四", source: "", sort_order: 4, created_at: "2026-09-14T08:00:00.000Z", archived_at: null },
  ], "first", 4);
  assert.deepEqual(getVisibleDailyReadings(reordered).map((record) => [record.id, record.sort_order]), [
    ["second", 1], ["third", 2], ["fourth", 3], ["first", 4],
  ]);
  assert.equal(getNextDailyReadingId(reordered, "fourth"), "first");
});
