import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleMetaLearningAbilities } from "../src/services/metaLearning.ts";

const records = [
  {
    id: "old-learning",
    name: "旧学习法",
    summary: "比较早记录",
    usage: "用于长期积累",
    mastery: "learning",
    created_at: "2026-09-12T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "new-mastered",
    name: "费曼学习法",
    summary: "用自己的话解释概念",
    usage: "用于检验是否真正理解知识点",
    mastery: "mastered",
    created_at: "2026-09-14T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "todo",
    name: "间隔重复",
    summary: "按遗忘曲线复习",
    usage: "适合记忆类内容",
    mastery: "todo",
    created_at: "2026-09-13T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "archived",
    name: "不显示",
    summary: "归档内容",
    usage: "不应展示",
    mastery: "skilled",
    created_at: "2026-09-15T08:00:00.000Z",
    archived_at: "2026-09-16T08:00:00.000Z",
  },
];

test("sorts visible meta learning abilities by newest first", () => {
  assert.deepEqual(
    getVisibleMetaLearningAbilities(records).map((record) => record.id),
    ["new-mastered", "todo", "old-learning"],
  );
});

test("filters meta learning abilities by name, summary or usage", () => {
  assert.deepEqual(
    getVisibleMetaLearningAbilities(records, "理解知识点").map((record) => record.id),
    ["new-mastered"],
  );
});

test("filters meta learning abilities by mastery", () => {
  assert.deepEqual(
    getVisibleMetaLearningAbilities(records, "", "todo").map((record) => record.id),
    ["todo"],
  );
});

test("does not show archived meta learning abilities", () => {
  assert.equal(getVisibleMetaLearningAbilities(records, "不显示").length, 0);
});
