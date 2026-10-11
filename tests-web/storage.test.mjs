import assert from "node:assert/strict";
import test from "node:test";
import { normalizeInspirations } from "../src/services/inspirations.ts";
import { normalizeMetaLearningAbilities } from "../src/services/metaLearning.ts";
import { normalizeVideoInspirations } from "../src/services/videoInspirations.ts";
import { normalizeWorkExperiences } from "../src/services/workExperiences.ts";
import { normalizeDailyReadings } from "../src/services/dailyReadings.ts";
import { normalizeArgumentReflections } from "../src/services/argumentReflections.ts";
import { DEFAULT_DELIVERY_PLATFORMS, normalizeDeliveryPlatforms } from "../src/services/deliveryPlatforms.ts";
import { normalizeBooks } from "../src/services/books.ts";

test("normalizes old todo data without inspirations", () => {
  assert.deepEqual(normalizeInspirations(undefined), []);
});

test("normalizes old todo data without meta learning abilities", () => {
  assert.deepEqual(normalizeMetaLearningAbilities(undefined), []);
});

test("normalizes old todo data without video inspirations", () => {
  assert.deepEqual(normalizeVideoInspirations(undefined), []);
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

test("normalizes old todo data without books", () => {
  assert.deepEqual(normalizeBooks(undefined), []);
});

test("normalizes old prefs with default delivery platforms", () => {
  assert.deepEqual(normalizeDeliveryPlatforms(undefined), DEFAULT_DELIVERY_PLATFORMS);
});

test("normalizes custom delivery platforms by trimming and deduplicating", () => {
  assert.deepEqual(normalizeDeliveryPlatforms([" 淘宝 ", "京东", "淘宝", "", 1]), ["淘宝", "京东"]);
});
