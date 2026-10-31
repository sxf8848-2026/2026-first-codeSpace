import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getDailyHistoryCalendarDays,
  getDailyHistoryDetail,
  getDailyHistoryEntries,
  getMonthlyHistoryEntries,
  getWeeklyDeliveryHistoryDetails,
  getWeeklyDeliveryHistoryEntries,
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

const baseWeeklyDelivery = {
  id: "delivery-1",
  sequence: null,
  name: "默认快递",
  platform: "淘宝",
  note: "",
  purchased_at: "2026-09-01",
  picked: false,
  created_at: "2026-09-01T00:00:00.000Z",
  picked_at: null,
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

test("weekly delivery history only includes weeks with deliveries sorted newest first", () => {
  const entries = getWeeklyDeliveryHistoryEntries({
    weeklyDeliveries: {
      "2026-09-07": [{ ...baseWeeklyDelivery, name: "纸巾" }],
      "2026-09-14": [],
      "2026-09-21": [{ ...baseWeeklyDelivery, name: "书" }],
    },
  });

  assert.deepEqual(
    entries.map((entry) => entry.week),
    ["2026-09-21", "2026-09-07"],
  );
});

test("weekly delivery history reports pending progress and summary", () => {
  const [entry] = getWeeklyDeliveryHistoryEntries({
    weeklyDeliveries: {
      "2026-09-07": [
        { ...baseWeeklyDelivery, id: "delivery-1", name: "纸巾", picked: false },
        { ...baseWeeklyDelivery, id: "delivery-2", name: "书", picked: true, picked_at: "2026-09-08T00:00:00.000Z" },
      ],
    },
  });

  assert.equal(entry.pendingCount, 1);
  assert.equal(entry.pickedCount, 1);
  assert.equal(entry.totalCount, 2);
  assert.equal(entry.summary, "纸巾、书");
});

test("weekly delivery details combine all weeks and sort numbered records descending", () => {
  const weeklyDeliveries = {
    "2026-09-07": [
      { ...baseWeeklyDelivery, id: "old-unassigned", name: "旧未编号" },
      { ...baseWeeklyDelivery, id: "numbered-8", name: "八号", sequence: 8 },
    ],
    "2026-09-21": [
      { ...baseWeeklyDelivery, id: "new-unassigned", name: "新未编号" },
      { ...baseWeeklyDelivery, id: "numbered-21", name: "二十一号", sequence: 21 },
    ],
  };
  const before = structuredClone(weeklyDeliveries);

  const deliveries = getWeeklyDeliveryHistoryDetails({ weeklyDeliveries });

  assert.deepEqual(
    deliveries.map((delivery) => `${delivery.week}:${delivery.id}`),
    [
      "2026-09-21:numbered-21",
      "2026-09-07:numbered-8",
      "2026-09-21:new-unassigned",
      "2026-09-07:old-unassigned",
    ],
  );
  assert.deepEqual(weeklyDeliveries, before);
});

test("weekly delivery detail search trims text, ignores case, and only matches names", () => {
  const weeklyDeliveries = {
    "2026-09-21": [
      { ...baseWeeklyDelivery, id: "named", name: "USB Cable", platform: "淘宝", note: "备用" },
      { ...baseWeeklyDelivery, id: "platform-only", name: "纸巾", platform: "USB Cable", note: "" },
      { ...baseWeeklyDelivery, id: "note-only", name: "牙刷", platform: "京东", note: "USB Cable" },
    ],
  };

  const deliveries = getWeeklyDeliveryHistoryDetails({ weeklyDeliveries }, "  usb CABLE  ");

  assert.deepEqual(deliveries.map((delivery) => delivery.id), ["named"]);
});

test("weekly delivery history dialog exposes weekly and all-delivery views with responsive details", () => {
  const component = readFileSync(new URL("../src/components/dialogs.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(component, />\s*按周查看\s*</);
  assert.match(component, />\s*全部快递\s*</);
  assert.match(component, /placeholder="搜索快递名称"/);
  assert.match(component, /allDeliveries\.length \? "没有匹配的快递" : "还没有历史快递"/);
  assert.match(styles, /\.delivery-history-detail-list\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*\.delivery-history-detail-list\s*\{[^}]*grid-template-columns:\s*1fr;/);
});
