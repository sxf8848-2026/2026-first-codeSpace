import assert from "node:assert/strict";
import test from "node:test";
import { normalizeInspirations } from "../src/services/inspirations.ts";
import { normalizeMetaLearningAbilities } from "../src/services/metaLearning.ts";
import { normalizeVideoInspirations } from "../src/services/videoInspirations.ts";
import { normalizeWorkExperiences } from "../src/services/workExperiences.ts";

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
