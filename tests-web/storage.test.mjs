import assert from "node:assert/strict";
import test from "node:test";
import { normalizeInspirations } from "../src/services/inspirations.ts";
import { normalizeMetaLearningAbilities } from "../src/services/metaLearning.ts";
import { normalizeVideoInspirations } from "../src/services/videoInspirations.ts";
import { normalizeVideoNotes } from "../src/services/videoNotes.ts";
import { normalizeWorkExperiences } from "../src/services/workExperiences.ts";
import { normalizeDailyReadings } from "../src/services/dailyReadings.ts";
import { normalizeArgumentReflections } from "../src/services/argumentReflections.ts";
import { normalizeDivorcePlans } from "../src/services/divorcePlans.ts";
import { DEFAULT_DELIVERY_PLATFORMS, normalizeDeliveryPlatforms } from "../src/services/deliveryPlatforms.ts";
import { normalizeBooks } from "../src/services/books.ts";
import { normalizeKindnessRecords } from "../src/services/kindnessRecords.ts";
import { normalizeStudyGrowthRecords } from "../src/services/studyGrowthRecords.ts";
import { normalizeSkincareProducts } from "../src/services/skincareProducts.ts";
import { normalizeRewardClaims, normalizeRewardRules } from "../src/services/rewards.ts";
import { normalizeLearnedContents } from "../src/services/learnedContents.ts";
import { normalizeWardrobeItems } from "../src/services/wardrobeItems.ts";
import { migrateLegacyWeeklyDeliveries } from "../src/services/deliveries.ts";

const legacyDelivery = {
  id: "legacy-delivery",
  sequence: null,
  name: "旧快递",
  platform: "淘宝",
  note: "",
  purchased_at: "",
  picked: false,
  created_at: "2026-09-01T00:00:00.000Z",
  picked_at: null,
};

test("flattens legacy weekly deliveries using newest week first and stable order within each week", () => {
  const migrated = migrateLegacyWeeklyDeliveries({
    "2026-09-07": [
      { ...legacyDelivery, id: "old-first", name: "旧周第一条", picked: true, picked_at: "2026-09-08T00:00:00.000Z" },
      { ...legacyDelivery, id: "old-second", name: "旧周第二条" },
    ],
    "2026-09-21": [{ ...legacyDelivery, id: "new", name: "新周快递" }],
  });

  assert.deepEqual(migrated.map((delivery) => delivery.id), ["new", "old-first", "old-second"]);
  assert.equal(migrated[1].picked, true);
  assert.equal(migrated[0].purchased_at, "");
});

test("normalizes old todo data without inspirations", () => {
  assert.deepEqual(normalizeInspirations(undefined), []);
});

test("normalizes old todo data without meta learning abilities", () => {
  assert.deepEqual(normalizeMetaLearningAbilities(undefined), []);
});

test("normalizes old todo data without video inspirations", () => {
  assert.deepEqual(normalizeVideoInspirations(undefined), []);
});

test("normalizes old todo data without video notes", () => {
  assert.deepEqual(normalizeVideoNotes(undefined), []);
});

test("normalizes old todo data without work experiences", () => {
  assert.deepEqual(normalizeWorkExperiences(undefined), []);
});

test("normalizes old todo data without daily readings", () => {
  assert.deepEqual(normalizeDailyReadings(undefined), []);
});

test("normalizes old todo data without argument reflections", () => {
  assert.deepEqual(normalizeArgumentReflections(undefined), []);
});

test("normalizes old todo data without divorce plans", () => {
  assert.deepEqual(normalizeDivorcePlans(undefined), []);
});

test("normalizes old todo data without books", () => {
  assert.deepEqual(normalizeBooks(undefined), []);
});

test("normalizes old todo data without kindness records", () => {
  assert.deepEqual(normalizeKindnessRecords(undefined), []);
});

test("normalizes old todo data without study growth records", () => {
  assert.deepEqual(normalizeStudyGrowthRecords(undefined), []);
});

test("normalizes old todo data without personal management records", () => {
  assert.deepEqual(normalizeSkincareProducts(undefined), []);
  assert.deepEqual(normalizeRewardRules(undefined), []);
  assert.deepEqual(normalizeRewardClaims(undefined), []);
  assert.deepEqual(normalizeLearnedContents(undefined), []);
  assert.deepEqual(normalizeWardrobeItems(undefined), []);
});

test("normalizes old prefs with default delivery platforms", () => {
  assert.deepEqual(normalizeDeliveryPlatforms(undefined), DEFAULT_DELIVERY_PLATFORMS);
});

test("normalizes custom delivery platforms by trimming and deduplicating", () => {
  assert.deepEqual(normalizeDeliveryPlatforms([" 淘宝 ", "京东", "淘宝", "", 1]), ["淘宝", "京东"]);
});
