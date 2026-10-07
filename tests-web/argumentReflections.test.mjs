import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleArgumentReflections, normalizeArgumentReflections } from "../src/services/argumentReflections.ts";

const records = [
  { id: "old", topic: "旧争执", occurred_at: "2026-09-10T09:00", content: "和家人沟通失焦，我提高了音量。下次先暂停十分钟。", created_at: "2026-09-10T09:10:00.000Z", archived_at: null },
  { id: "new", topic: "新争执", occurred_at: "2026-09-12T20:00", content: "和朋友的约定改变，我着急解释，对方感到被忽略。下次先确认彼此感受。", created_at: "2026-09-12T20:10:00.000Z", archived_at: null },
  { id: "archived", topic: "已归档", occurred_at: "2026-09-13T09:00", content: "同事对排期有分歧，下次先对齐目标。", created_at: "2026-09-13T09:10:00.000Z", archived_at: "2026-09-14T09:00:00.000Z" },
];

test("sorts active argument reflections by occurred time and hides archived records", () => {
  assert.deepEqual(getVisibleArgumentReflections(records).map((record) => record.id), ["new", "old"]);
});

test("searches argument reflection topic and content", () => {
  assert.deepEqual(getVisibleArgumentReflections(records, "朋友").map((record) => record.id), ["new"]);
  assert.deepEqual(getVisibleArgumentReflections(records, "提高了音量").map((record) => record.id), ["old"]);
  assert.deepEqual(getVisibleArgumentReflections(records, "彼此感受").map((record) => record.id), ["new"]);
});

test("normalizes valid argument reflections and migrates legacy content", () => {
  assert.deepEqual(normalizeArgumentReflections(undefined), []);
  assert.deepEqual(
    normalizeArgumentReflections([{ ...records[0], topic: "  旧争执  " }, { id: "legacy", topic: "旧字段", occurred_at: "2026-09-15T10:00", person: "朋友", event: "争执经过", my_response: "我的反应", other_response: "对方反应", improvement: "下次改进", created_at: "2026-09-15T10:10:00.000Z" }]),
    [
      { ...records[0], topic: "旧争执" },
      { id: "legacy", topic: "旧字段", occurred_at: "2026-09-15T10:00", content: "涉及对象：朋友\n\n争执经过：争执经过\n\n我的反应：我的反应\n\n对方反应：对方反应\n\n下次如何改进：下次改进", created_at: "2026-09-15T10:10:00.000Z", archived_at: null },
    ],
  );
});
