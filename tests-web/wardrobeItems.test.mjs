import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getActiveWardrobeItems,
  getArchivedWardrobeItems,
  getWardrobeCategories,
  getWardrobeMonths,
  normalizeWardrobeItems,
} from "../src/services/wardrobeItems.ts";

const records = [
  { id: "one", name: "旧上衣", category: "上衣", purchased_on: "2026-09-01", price_cents: 1000, source: "淘宝", note: "秋装", created_at: "2026-09-01T08:00:00.000Z", updated_at: "2026-09-01T08:00:00.000Z", archived_at: null },
  { id: "two", name: "运动鞋", category: "鞋子", purchased_on: "2026-10-01", price_cents: null, source: "京东", note: "跑步", created_at: "2026-10-01T08:00:00.000Z", updated_at: "2026-10-01T08:00:00.000Z", archived_at: null },
  { id: "three", name: "旧电脑", category: "数码", purchased_on: "2026-10-02", price_cents: 5000, source: "线下", note: "备用", created_at: "2026-10-02T08:00:00.000Z", updated_at: "2026-10-02T08:00:00.000Z", archived_at: "2026-10-03T08:00:00.000Z" },
  { id: "four", name: "旧鞋", category: "鞋子", purchased_on: "2026-08-02", price_cents: 300, source: "淘宝", note: "归档较晚", created_at: "2026-08-02T08:00:00.000Z", updated_at: "2026-08-02T08:00:00.000Z", archived_at: "2026-10-04T08:00:00.000Z" },
];

test("sorts active wardrobe items by purchase date then creation time without changing input", () => {
  const original = records.map((record) => record.id);
  assert.deepEqual(getActiveWardrobeItems(records).map((record) => record.id), ["two", "one"]);
  assert.deepEqual(records.map((record) => record.id), original);
});

test("filters active wardrobe items by keyword, free category and purchase month together", () => {
  assert.deepEqual(getActiveWardrobeItems(records, "跑步", "鞋子", "2026-10").map((record) => record.id), ["two"]);
  assert.deepEqual(getWardrobeCategories(records), ["上衣", "鞋子"]);
  assert.deepEqual(getWardrobeMonths(records), ["2026-10", "2026-09"]);
});

test("lists archived wardrobe items by archive time and searches only visible text", () => {
  assert.deepEqual(getArchivedWardrobeItems(records).map((record) => record.id), ["four", "three"]);
  assert.deepEqual(getArchivedWardrobeItems(records, "电脑").map((record) => record.id), ["three"]);
  assert.deepEqual(getArchivedWardrobeItems(records, "5000"), []);
});

test("normalizes legacy missing wardrobe data and clears invalid optional values", () => {
  assert.deepEqual(normalizeWardrobeItems(undefined), []);
  const normalized = normalizeWardrobeItems([{ ...records[0], price_cents: -1, archived_at: "invalid" }], () => "new", () => "2026-10-01T00:00:00.000Z", () => "2026-10-01");
  assert.equal(normalized[0].price_cents, null);
  assert.equal(normalized[0].archived_at, null);
});

test("renders wardrobe prices with the shared emphasis style", () => {
  const panelSource = readFileSync(new URL("../src/components/AppSections.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(panelSource, /className="wardrobe-price"/);
  assert.match(styles, /\.wardrobe-price\s*\{[^}]*color:\s*#dc2626;[^}]*font-weight:\s*700;/s);
});
