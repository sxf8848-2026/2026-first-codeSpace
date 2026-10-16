import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleDivorcePlans, normalizeDivorcePlans } from "../src/services/divorcePlans.ts";

const records = [
  { id: "old", title: "旧冲突", occurred_at: "2026-10-10T09:00", content: "沟通安排时出现分歧。", created_at: "2026-10-10T09:10:00.000Z", archived_at: null },
  { id: "new", title: "新冲突", occurred_at: "2026-10-12T20:00", content: "讨论居住安排和后续决定。", created_at: "2026-10-12T20:10:00.000Z", archived_at: null },
  { id: "archived", title: "已归档记录", occurred_at: "2026-10-13T09:00", content: "这条不应展示。", created_at: "2026-10-13T09:10:00.000Z", archived_at: "2026-10-14T09:00:00.000Z" },
];

test("sorts active divorce plans by occurred time and hides archived records", () => {
  assert.deepEqual(getVisibleDivorcePlans(records).map((record) => record.id), ["new", "old"]);
});

test("searches divorce plan titles and content", () => {
  assert.deepEqual(getVisibleDivorcePlans(records, "新冲突").map((record) => record.id), ["new"]);
  assert.deepEqual(getVisibleDivorcePlans(records, "居住安排").map((record) => record.id), ["new"]);
});

test("normalizes missing divorce plans and trims valid records", () => {
  assert.deepEqual(normalizeDivorcePlans(undefined), []);
  assert.deepEqual(normalizeDivorcePlans([{ ...records[0], title: "  旧冲突  ", content: "  沟通安排时出现分歧。  " }]), [records[0]]);
});
