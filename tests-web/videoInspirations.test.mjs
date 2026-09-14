import assert from "node:assert/strict";
import test from "node:test";
import { getVideoInspirationChannels, getVisibleVideoInspirations } from "../src/services/videoInspirations.ts";

const records = [
  {
    id: "old-normal",
    channel: "B站",
    title: "旧视频",
    content: "比较早的内容",
    url: "https://example.com/old",
    pinned: false,
    created_at: "2026-09-12T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "new-normal",
    channel: "抖音",
    title: "新视频",
    content: "新的内容",
    url: "",
    pinned: false,
    created_at: "2026-09-14T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "old-pinned",
    channel: "小红书",
    title: "置顶旧视频",
    content: "重点内容",
    url: "https://example.com/pinned-old",
    pinned: true,
    created_at: "2026-09-13T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "new-pinned",
    channel: "抖音",
    title: "置顶新视频",
    content: "更重要的内容",
    url: "https://example.com/pinned-new",
    pinned: true,
    created_at: "2026-09-15T08:00:00.000Z",
    archived_at: null,
  },
  {
    id: "archived",
    channel: "YouTube",
    title: "不显示",
    content: "归档内容",
    url: "https://example.com/archived",
    pinned: true,
    created_at: "2026-09-16T08:00:00.000Z",
    archived_at: "2026-09-17T08:00:00.000Z",
  },
];

test("sorts visible video inspirations by pinned first then newest first", () => {
  assert.deepEqual(
    getVisibleVideoInspirations(records).map((record) => record.id),
    ["new-pinned", "old-pinned", "new-normal", "old-normal"],
  );
});

test("filters video inspirations by channel, title, content or url", () => {
  assert.deepEqual(
    getVisibleVideoInspirations(records, "pinned-new").map((record) => record.id),
    ["new-pinned"],
  );
});

test("filters video inspirations by channel", () => {
  assert.deepEqual(
    getVisibleVideoInspirations(records, "", "抖音").map((record) => record.id),
    ["new-pinned", "new-normal"],
  );
});

test("does not show archived video inspirations", () => {
  assert.equal(getVisibleVideoInspirations(records, "不显示").length, 0);
});

test("collects channels from unarchived video inspirations", () => {
  assert.deepEqual(getVideoInspirationChannels(records), ["B站", "抖音", "小红书"]);
});
