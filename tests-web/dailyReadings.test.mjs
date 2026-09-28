import assert from "node:assert/strict";
import test from "node:test";
import {
  getCurrentDailyReading,
  getDailyReadingPosition,
  getNextDailyReadingId,
  getVisibleDailyReadings,
  normalizeDailyReadings,
  resolveDailyReadingCursorId,
} from "../src/services/dailyReadings.ts";

const records = [
  { id: "second", title: "第二条", body: "正文二", source: "书籍", created_at: "2026-09-12T08:00:00.000Z", archived_at: null },
  { id: "first", title: "第一条", body: "正文一", source: "笔记", created_at: "2026-09-11T08:00:00.000Z", archived_at: null },
  { id: "archived", title: "归档条目", body: "不展示", source: "旧书", created_at: "2026-09-10T08:00:00.000Z", archived_at: "2026-09-13T08:00:00.000Z" },
];

test("sorts visible daily readings from oldest to newest and hides archived records", () => {
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
    [{ id: "reading", title: "标题", body: "正文", source: "", created_at: "2026-09-17T08:00:00.000Z", archived_at: null }],
  );
});
