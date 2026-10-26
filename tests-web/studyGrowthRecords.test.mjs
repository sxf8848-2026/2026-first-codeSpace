import assert from "node:assert/strict";
import test from "node:test";
import {
  getVisibleStudyGrowthRecords,
  normalizeStudyGrowthRecords,
  updateStudyGrowthRecord,
} from "../src/services/studyGrowthRecords.ts";

const records = [
  {
    id: "study-1",
    type: "method",
    title: "费曼学习法",
    content: "用自己的话解释知识点。",
    source: "学习笔记",
    created_at: "2026-10-20T08:00:00.000Z",
    updated_at: "2026-10-20T08:00:00.000Z",
  },
  {
    id: "study-2",
    type: "habit",
    title: "每日复习",
    content: "睡前回顾当天学到的内容。",
    source: "",
    created_at: "2026-10-22T08:00:00.000Z",
    updated_at: "2026-10-22T08:00:00.000Z",
  },
  {
    id: "study-3",
    type: "method",
    title: "间隔重复",
    content: "按遗忘曲线安排复习。",
    source: "认知科学课程",
    created_at: "2026-10-24T08:00:00.000Z",
    updated_at: "2026-10-24T08:00:00.000Z",
  },
];

test("normalizes old data and falls back updated time to created time", () => {
  assert.deepEqual(normalizeStudyGrowthRecords(undefined), []);
  const [{ updated_at, ...normalized }] = normalizeStudyGrowthRecords([{ ...records[0], updated_at: undefined }]);
  assert.equal(updated_at, records[0].created_at);
  assert.deepEqual(normalized, Object.fromEntries(Object.entries(records[0]).filter(([key]) => key !== "updated_at")));
});

test("filters by the active type and sorts by creation time descending", () => {
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "method").map((record) => record.id), ["study-3", "study-1"]);
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "habit").map((record) => record.id), ["study-2"]);
});

test("searches title, content, and source within the active type", () => {
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "method", "间隔").map((record) => record.id), ["study-3"]);
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "method", "解释").map((record) => record.id), ["study-1"]);
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "method", "课程").map((record) => record.id), ["study-3"]);
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "habit", "费曼"), []);
});

test("editing the type moves a record to the other tab", () => {
  const updated = updateStudyGrowthRecord(records, "study-1", {
    type: "habit",
    title: "  费曼学习习惯  ",
    content: "  每天主动讲解一个知识点。  ",
    source: "  学习笔记  ",
  }, "2026-10-26T08:00:00.000Z");
  assert.deepEqual(getVisibleStudyGrowthRecords(updated, "method").map((record) => record.id), ["study-3"]);
  assert.deepEqual(getVisibleStudyGrowthRecords(updated, "habit").map((record) => record.id), ["study-2", "study-1"]);
  assert.equal(updated.find((record) => record.id === "study-1").title, "费曼学习习惯");
});
