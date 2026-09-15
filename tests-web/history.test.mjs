import assert from "node:assert/strict";
import test from "node:test";
import {
  getDailyHistoryCalendarDays,
  getDailyHistoryDetail,
  getDailyHistoryEntries,
  getMonthlyHistoryEntries,
} from "../src/services/history.ts";

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

test("daily history calendar builds a stable monday-first grid with data marks", () => {
  const days = getDailyHistoryCalendarDays(
    {
      todos: {
        "2026-09-15": [{ ...baseTask, text: "读书", status: 0 }],
      },
      awesomeRecords: {},
    },
    "2026-09",
  );

  assert.equal(days.length, 42);
  assert.equal(days[0].day, "2026-08-31");
  assert.equal(days[0].inMonth, false);
  assert.equal(days[15].day, "2026-09-15");
  assert.equal(days[15].hasData, true);
  assert.equal(days[15].doneCount, 1);
});

test("daily history calendar includes adjacent month days outside the active month", () => {
  const days = getDailyHistoryCalendarDays(
    {
      todos: {},
      awesomeRecords: {
        "2026-08-31": [{ id: "awesome-1", text: "周末复盘", created_at: "2026-08-31T00:00:00.000Z" }],
      },
    },
    "2026-09",
  );

  assert.equal(days[41].day, "2026-10-11");
  assert.equal(days[41].inMonth, false);
  assert.equal(days[0].day, "2026-08-31");
  assert.equal(days[0].inMonth, false);
  assert.equal(days[0].hasData, true);
});

test("daily history detail groups tasks and keeps awesome records", () => {
  const detail = getDailyHistoryDetail(
    {
      todos: {
        "2026-09-12": [
          { ...baseTask, id: "task-1", text: "读书", status: 0 },
          { ...baseTask, id: "task-2", text: "写作", status: 2 },
          { ...baseTask, id: "task-3", text: "运动", status: 1 },
        ],
      },
      awesomeRecords: {
        "2026-09-12": [{ id: "awesome-1", text: "完成复盘", created_at: "2026-09-12T00:00:00.000Z" }],
      },
    },
    "2026-09-12",
  );

  assert.deepEqual(
    detail.doneTasks.map((task) => task.text),
    ["读书"],
  );
  assert.deepEqual(
    detail.inProgressTasks.map((task) => task.text),
    ["写作"],
  );
  assert.deepEqual(
    detail.todoTasks.map((task) => task.text),
    ["运动"],
  );
  assert.equal(detail.awesomeRecords.length, 1);
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
