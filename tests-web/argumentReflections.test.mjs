import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleArgumentReflections, normalizeArgumentReflections } from "../src/services/argumentReflections.ts";

const records = [
  { id: "old", topic: "旧争执", occurred_at: "2026-09-10T09:00", person: "家人", event: "沟通失焦", my_response: "提高音量", other_response: "沉默", improvement: "先暂停十分钟", created_at: "2026-09-10T09:10:00.000Z", archived_at: null },
  { id: "new", topic: "新争执", occurred_at: "2026-09-12T20:00", person: "朋友", event: "约定改变", my_response: "着急解释", other_response: "感到被忽略", improvement: "先确认彼此感受", created_at: "2026-09-12T20:10:00.000Z", archived_at: null },
  { id: "archived", topic: "已归档", occurred_at: "2026-09-13T09:00", person: "同事", event: "排期分歧", my_response: "直接否定", other_response: "反驳", improvement: "先对齐目标", created_at: "2026-09-13T09:10:00.000Z", archived_at: "2026-09-14T09:00:00.000Z" },
];

test("sorts active argument reflections by occurred time and hides archived records", () => {
  assert.deepEqual(getVisibleArgumentReflections(records).map((record) => record.id), ["new", "old"]);
});

test("searches every argument reflection text field", () => {
  assert.deepEqual(getVisibleArgumentReflections(records, "朋友").map((record) => record.id), ["new"]);
  assert.deepEqual(getVisibleArgumentReflections(records, "提高音量").map((record) => record.id), ["old"]);
  assert.deepEqual(getVisibleArgumentReflections(records, "彼此感受").map((record) => record.id), ["new"]);
});

test("normalizes valid argument reflections and drops incomplete records", () => {
  assert.deepEqual(normalizeArgumentReflections(undefined), []);
  assert.deepEqual(
    normalizeArgumentReflections([{ ...records[0], topic: "  旧争执  " }, { ...records[1], event: " " }]),
    [{ ...records[0], topic: "旧争执" }],
  );
});
