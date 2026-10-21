import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleKindnessRecords, normalizeKindnessRecords } from "../src/services/kindnessRecords.ts";

const records = [
  {
    id: "kindness-1",
    title: "帮同事排查问题",
    occurred_at: "2026-10-18T09:30",
    content: "一起定位了接口报错。",
    created_at: "2026-10-18T09:40:00.000Z",
  },
  {
    id: "kindness-2",
    title: "给陌生人指路",
    occurred_at: "2026-10-20T18:10",
    content: "在地铁站说明了换乘路线。",
    created_at: "2026-10-20T18:20:00.000Z",
  },
  {
    id: "kindness-3",
    title: "帮助家人",
    occurred_at: "2026-10-21T08:00",
    content: "早上帮忙准备了早餐。",
    created_at: "2026-10-21T08:10:00.000Z",
  },
];

test("normalizes old data and valid kindness records", () => {
  assert.deepEqual(normalizeKindnessRecords(undefined), []);
  assert.deepEqual(
    normalizeKindnessRecords([{ ...records[0], title: "  帮同事排查问题  ", content: "  一起定位了接口报错。  " }]),
    [records[0]],
  );
});

test("sorts kindness records by occurred time descending", () => {
  assert.deepEqual(getVisibleKindnessRecords(records).map((record) => record.id), ["kindness-3", "kindness-2", "kindness-1"]);
});

test("searches titles and content", () => {
  assert.deepEqual(getVisibleKindnessRecords(records, "陌生人").map((record) => record.id), ["kindness-2"]);
  assert.deepEqual(getVisibleKindnessRecords(records, "早餐").map((record) => record.id), ["kindness-3"]);
});

test("filters by inclusive start and end dates", () => {
  assert.deepEqual(getVisibleKindnessRecords(records, "", "2026-10-20").map((record) => record.id), ["kindness-3", "kindness-2"]);
  assert.deepEqual(getVisibleKindnessRecords(records, "", "", "2026-10-20").map((record) => record.id), ["kindness-2", "kindness-1"]);
  assert.deepEqual(getVisibleKindnessRecords(records, "", "2026-10-20", "2026-10-20").map((record) => record.id), ["kindness-2"]);
});

test("combines keyword and date range filters", () => {
  assert.deepEqual(getVisibleKindnessRecords(records, "帮", "2026-10-20", "2026-10-21").map((record) => record.id), ["kindness-3"]);
});
