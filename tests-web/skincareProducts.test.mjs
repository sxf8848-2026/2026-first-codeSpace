import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleSkincareProducts, normalizeSkincareProducts } from "../src/services/skincareProducts.ts";

const records = [
  { id: "skin-1", name: "氨基酸洁面", brand: "品牌甲", category: "cleanser", description: "晚间使用", created_at: "2026-10-25T08:00:00.000Z", updated_at: "2026-10-25T08:00:00.000Z" },
  { id: "skin-2", name: "修护精华", brand: "品牌乙", category: "serum", description: "舒缓修护", created_at: "2026-10-27T08:00:00.000Z", updated_at: "2026-10-27T08:00:00.000Z" },
  { id: "skin-3", name: "防晒霜", brand: "品牌甲", category: "sunscreen", description: "日常通勤", created_at: "2026-10-26T08:00:00.000Z", updated_at: "2026-10-26T08:00:00.000Z" },
];

test("normalizes skincare products and falls back invalid categories to other", () => {
  const normalized = normalizeSkincareProducts([{ ...records[0], category: "unknown", updated_at: undefined }]);
  assert.equal(normalized[0].category, "other");
  assert.equal(normalized[0].updated_at, records[0].created_at);
  assert.deepEqual(normalizeSkincareProducts(undefined), []);
});

test("sorts skincare products by creation time descending", () => {
  assert.deepEqual(getVisibleSkincareProducts(records).map((record) => record.id), ["skin-2", "skin-3", "skin-1"]);
});

test("searches name brand and description", () => {
  assert.deepEqual(getVisibleSkincareProducts(records, "修护").map((record) => record.id), ["skin-2"]);
  assert.deepEqual(getVisibleSkincareProducts(records, "品牌甲").map((record) => record.id), ["skin-3", "skin-1"]);
  assert.deepEqual(getVisibleSkincareProducts(records, "晚间").map((record) => record.id), ["skin-1"]);
});

test("combines category and keyword filters", () => {
  assert.deepEqual(getVisibleSkincareProducts(records, "品牌甲", "sunscreen").map((record) => record.id), ["skin-3"]);
  assert.deepEqual(getVisibleSkincareProducts(records, "品牌乙", "sunscreen"), []);
});
