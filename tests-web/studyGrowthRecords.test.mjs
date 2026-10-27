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
    content_html: "用自己的话解释知识点。",
    source: "学习笔记",
    created_at: "2026-10-20T08:00:00.000Z",
    updated_at: "2026-10-20T08:00:00.000Z",
  },
  {
    id: "study-2",
    type: "habit",
    title: "每日复习",
    content: "睡前回顾当天学到的内容。",
    content_html: "睡前回顾当天学到的内容。",
    source: "",
    created_at: "2026-10-22T08:00:00.000Z",
    updated_at: "2026-10-22T08:00:00.000Z",
  },
  {
    id: "study-3",
    type: "method",
    title: "间隔重复",
    content: "按遗忘曲线安排复习。",
    content_html: "按遗忘曲线安排复习。",
    source: "认知科学课程",
    created_at: "2026-10-24T08:00:00.000Z",
    updated_at: "2026-10-24T08:00:00.000Z",
  },
  {
    id: "study-4",
    type: "mental_model",
    title: "二阶思维",
    content: "不仅考虑直接结果，也考虑后续影响。",
    content_html: "不仅考虑直接结果，也考虑后续影响。",
    source: "思维模型课程",
    created_at: "2026-10-25T08:00:00.000Z",
    updated_at: "2026-10-25T08:00:00.000Z",
  },
];

test("normalizes old data and falls back updated time to created time", () => {
  assert.deepEqual(normalizeStudyGrowthRecords(undefined), []);
  const [{ updated_at, ...normalized }] = normalizeStudyGrowthRecords([{ ...records[0], content_html: undefined, updated_at: undefined }]);
  assert.equal(updated_at, records[0].created_at);
  assert.equal(normalized.content_html, records[0].content);
  assert.deepEqual(normalized, Object.fromEntries(Object.entries(records[0]).filter(([key]) => key !== "updated_at")));
});

test("filters by the active type and sorts by creation time descending", () => {
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "method").map((record) => record.id), ["study-3", "study-1"]);
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "habit").map((record) => record.id), ["study-2"]);
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "mental_model").map((record) => record.id), ["study-4"]);
});

test("searches title, content, and source within the active type", () => {
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "method", "间隔").map((record) => record.id), ["study-3"]);
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "method", "解释").map((record) => record.id), ["study-1"]);
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "method", "课程").map((record) => record.id), ["study-3"]);
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "habit", "费曼"), []);
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "mental_model", "后续影响").map((record) => record.id), ["study-4"]);
  assert.deepEqual(getVisibleStudyGrowthRecords(records, "mental_model", "课程").map((record) => record.id), ["study-4"]);
});

test("editing the type moves a record to the other tab", () => {
  const updated = updateStudyGrowthRecord(records, "study-1", {
    type: "habit",
    title: "  费曼学习习惯  ",
    content: "  每天主动讲解一个知识点。  ",
    content_html: "<strong>每天主动讲解一个知识点。</strong>",
    source: "  学习笔记  ",
  }, "2026-10-26T08:00:00.000Z");
  assert.deepEqual(getVisibleStudyGrowthRecords(updated, "method").map((record) => record.id), ["study-3"]);
  assert.deepEqual(getVisibleStudyGrowthRecords(updated, "habit").map((record) => record.id), ["study-2", "study-1"]);
  assert.equal(updated.find((record) => record.id === "study-1").title, "费曼学习习惯");
});

test("does not move records into or out of the mental model tab", () => {
  const attemptedMoveIn = updateStudyGrowthRecord(records, "study-1", {
    type: "mental_model",
    title: records[0].title,
    content: records[0].content,
    content_html: records[0].content_html,
    source: records[0].source,
  }, "2026-10-27T08:00:00.000Z");
  const attemptedMoveOut = updateStudyGrowthRecord(attemptedMoveIn, "study-4", {
    type: "method",
    title: records[3].title,
    content: records[3].content,
    content_html: records[3].content_html,
    source: records[3].source,
  }, "2026-10-27T08:00:00.000Z");
  assert.equal(attemptedMoveOut.find((record) => record.id === "study-1").type, "method");
  assert.equal(attemptedMoveOut.find((record) => record.id === "study-4").type, "mental_model");
});
