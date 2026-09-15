import assert from "node:assert/strict";
import test from "node:test";
import { getDailyHistoryEntries, getMonthlyHistoryEntries } from "../src/services/history.ts";

const baseTask = {
  id: "task-1",
  text: "默认任务",
  status: 1,
  description: "",
  tag: 1,
  priority: "medium",
  created_at: "2026-09-01T00:00:00.000Z",
  done_at: null,
};

const baseMonthlyTask = {
  id: "monthly-1",
  text: "默认月任务",
  description: "",
  done: false,
  created_at: "2026-09-01T00:00:00.000Z",
  done_at: null,
};

test("daily history only includes days with todos or awesome records sorted newest first", () => {
  const entries = getDailyHistoryEntries({
    todos: {
      "2026-09-12": [],
      "2026-09-10": [{ ...baseTask, text: "读书", status: 0 }],
    },
    awesomeRecords: {
      "2026-09-11": [{ id: "awesome-1", text: "完成复盘", created_at: "2026-09-11T00:00:00.000Z" }],
    },
  });

  assert.deepEqual(
    entries.map((entry) => entry.day),
    ["2026-09-11", "2026-09-10"],
  );
});

test("daily history summarizes completed tasks before awesome records", () => {
  const [entry] = getDailyHistoryEntries({
    todos: {
      "2026-09-12": [
        { ...baseTask, id: "task-1", text: "读书", status: 0 },
        { ...baseTask, id: "task-2", text: "运动", status: 1 },
      ],
    },
    awesomeRecords: {
      "2026-09-12": [{ id: "awesome-1", text: "写完总结", created_at: "2026-09-12T00:00:00.000Z" }],
    },
  });

  assert.equal(entry.doneCount, 1);
  assert.equal(entry.totalCount, 2);
  assert.equal(entry.awesomeCount, 1);
  assert.equal(entry.summary, "读书");
});

test("monthly history only includes months with tasks sorted newest first", () => {
  const entries = getMonthlyHistoryEntries({
    monthlyTodos: {
      "2026-08": [{ ...baseMonthlyTask, text: "整理资料", done: true }],
      "2026-09": [],
      "2026-10": [{ ...baseMonthlyTask, text: "完成计划" }],
    },
  });

  assert.deepEqual(
    entries.map((entry) => entry.month),
    ["2026-10", "2026-08"],
  );
});

test("monthly history reports progress and task summary", () => {
  const [entry] = getMonthlyHistoryEntries({
    monthlyTodos: {
      "2026-09": [
        { ...baseMonthlyTask, id: "monthly-1", text: "完成课程", done: true },
        { ...baseMonthlyTask, id: "monthly-2", text: "整理预算", done: false },
      ],
    },
  });

  assert.equal(entry.doneCount, 1);
  assert.equal(entry.totalCount, 2);
  assert.equal(entry.summary, "完成课程、整理预算");
});
