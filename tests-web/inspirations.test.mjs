import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleInspirations } from "../src/services/inspirations.ts";

const records = [
  {
    id: "normal-old",
    title: "旧普通灵感",
    body: "先写下来",
    pinned: false,
    created_at: "2026-09-10T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "pinned-old",
    title: "旧置顶灵感",
    body: "重要想法",
    pinned: true,
    created_at: "2026-09-11T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "normal-new",
    title: "新普通灵感",
    body: "后来的想法",
    pinned: false,
    created_at: "2026-09-13T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "pinned-new",
    title: "新置顶灵感",
    body: "最重要",
    pinned: true,
    created_at: "2026-09-14T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "archived",
    title: "已归档灵感",
    body: "不显示",
    pinned: true,
    created_at: "2026-09-15T08:00:00.000Z",
    archived_at: "2026-09-16T08:00:00.000Z",
  },
];

test("sorts visible inspirations by pinned first then newest first", () => {
  assert.deepEqual(
    getVisibleInspirations(records).map((record) => record.id),
    ["pinned-new", "pinned-old", "normal-new", "normal-old"],
  );
});

test("filters inspirations by title or body", () => {
  assert.deepEqual(
    getVisibleInspirations(records, "后来").map((record) => record.id),
    ["normal-new"],
  );
});

test("does not show archived inspirations", () => {
  assert.equal(getVisibleInspirations(records, "不显示").length, 0);
});
