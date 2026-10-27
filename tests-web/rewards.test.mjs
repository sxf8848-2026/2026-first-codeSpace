import assert from "node:assert/strict";
import test from "node:test";
import {
  canClaimReward,
  buildRewardClaim,
  getRewardClaimMonths,
  getRewardTotals,
  getVisibleRewardClaims,
  getVisibleRewardRules,
  normalizeRewardClaims,
  normalizeRewardRules,
} from "../src/services/rewards.ts";

const rules = [
  { id: "rule-1", name: "早起早睡", amount_cents: 200, description: "当天按计划作息", active: true, created_at: "2026-10-25T08:00:00.000Z", updated_at: "2026-10-25T08:00:00.000Z" },
  { id: "rule-2", name: "完成学习计划", amount_cents: 500, description: "完成今日学习", active: false, created_at: "2026-10-26T08:00:00.000Z", updated_at: "2026-10-26T08:00:00.000Z" },
];

const claims = [
  { id: "claim-1", rule_id: "rule-1", rule_name: "早起早睡", amount_cents: 200, claimed_at: "2026-10-27T07:30" },
  { id: "claim-2", rule_id: "rule-2", rule_name: "完成学习计划", amount_cents: 500, claimed_at: "2026-09-30T21:00" },
  { id: "claim-3", rule_id: "rule-1", rule_name: "早起早睡", amount_cents: 200, claimed_at: "2026-10-26T07:20" },
];

test("normalizes reward rules and claims", () => {
  assert.equal(normalizeRewardRules([{ ...rules[0], updated_at: undefined }])[0].updated_at, rules[0].created_at);
  assert.deepEqual(normalizeRewardRules([{ ...rules[0], amount_cents: 0 }]), []);
  assert.deepEqual(normalizeRewardClaims([{ ...claims[0], claimed_at: "invalid" }]), []);
  assert.deepEqual(normalizeRewardRules(undefined), []);
  assert.deepEqual(normalizeRewardClaims(undefined), []);
});

test("filters reward rules by status and keyword", () => {
  assert.deepEqual(getVisibleRewardRules(rules).map((rule) => rule.id), ["rule-1"]);
  assert.deepEqual(getVisibleRewardRules(rules, "学习", "all").map((rule) => rule.id), ["rule-2"]);
  assert.deepEqual(getVisibleRewardRules(rules, "", "inactive").map((rule) => rule.id), ["rule-2"]);
});

test("prevents duplicate same-day claims and disabled rule claims", () => {
  assert.equal(canClaimReward(rules[0], claims, "2026-10-27"), false);
  assert.equal(canClaimReward(rules[0], claims, "2026-10-28"), true);
  assert.equal(canClaimReward(rules[1], claims, "2026-10-28"), false);
});

test("builds reward claims with rule name and amount snapshots", () => {
  const claim = buildRewardClaim(rules[0], "2026-10-28T07:30", () => "claim-new");
  assert.deepEqual(claim, {
    id: "claim-new",
    rule_id: "rule-1",
    rule_name: "早起早睡",
    amount_cents: 200,
    claimed_at: "2026-10-28T07:30",
  });
});

test("calculates current-month and all-time totals", () => {
  assert.deepEqual(getRewardTotals(claims, "2026-10"), { monthCents: 400, totalCents: 900 });
  assert.deepEqual(getRewardTotals(claims.filter((claim) => claim.id !== "claim-1"), "2026-10"), { monthCents: 200, totalCents: 700 });
});

test("filters and sorts reward claims and collects months", () => {
  assert.deepEqual(getVisibleRewardClaims(claims, "早起", "2026-10").map((claim) => claim.id), ["claim-1", "claim-3"]);
  assert.deepEqual(getRewardClaimMonths(claims), ["2026-10", "2026-09"]);
});
