import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleVideoNotes, normalizeVideoNotes } from "../src/services/videoNotes.ts";

const records = [
  {
    id: "old",
    title: "旧记录",
    quote: "慢就是快",
    reflection: "持续比冲刺重要",
    source: "抖音 · 某账号",
    url: "https://example.com/old",
    pinned: false,
    created_at: "2026-10-18T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "new",
    title: "新记录",
    quote: "",
    reflection: "先开始，再优化",
    source: "小红书",
    url: "",
    pinned: false,
    created_at: "2026-10-20T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "pinned",
    title: "置顶记录",
    quote: "保持清醒",
    reflection: "",
    source: "B站",
    url: "https://example.com/pinned",
    pinned: true,
    created_at: "2026-10-17T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "archived",
    title: "已归档",
    quote: "不应显示",
    reflection: "",
    source: "抖音",
    url: "",
    pinned: false,
    created_at: "2026-10-21T08:00:00.000Z",
    archived_at: "2026-10-21T09:00:00.000Z",
  },
];

test("sorts visible video notes by pinned first then newest first and hides archived records", () => {
  assert.deepEqual(getVisibleVideoNotes(records).map((record) => record.id), ["pinned", "new", "old"]);
});

test("searches every video note text field", () => {
  assert.deepEqual(getVisibleVideoNotes(records, "慢就是快").map((record) => record.id), ["old"]);
  assert.deepEqual(getVisibleVideoNotes(records, "持续比冲刺").map((record) => record.id), ["old"]);
  assert.deepEqual(getVisibleVideoNotes(records, "小红书").map((record) => record.id), ["new"]);
  assert.deepEqual(getVisibleVideoNotes(records, "example.com/pinned").map((record) => record.id), ["pinned"]);
});

test("normalizes valid video notes and rejects records without usable content", () => {
  assert.deepEqual(normalizeVideoNotes(undefined), []);
  assert.deepEqual(
    normalizeVideoNotes([
      { ...records[0], title: "  旧记录  ", quote: "  慢就是快  ", source: "  抖音  " },
      { ...records[1], title: "无内容", quote: " ", reflection: " " },
    ]),
    [{ ...records[0], title: "旧记录", quote: "慢就是快", source: "抖音" }],
  );
});
