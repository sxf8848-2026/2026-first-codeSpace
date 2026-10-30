import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  applyRewardClaim,
  canClaimReward,
  buildRewardClaim,
  getRewardBreakdown,
  getRewardClaimMonths,
  getRewardPeriodKey,
  getPreviousWeeklyRewardKey,
  getRewardTotals,
  getVisibleRewardClaims,
  getVisibleRewardRules,
  isRewardBackfillDateAllowed,
  isRewardClaimBackfill,
  isWeeklyRewardBackfillAllowed,
  normalizeRewardClaims,
  normalizeRewardRules,
} from "../src/services/rewards.ts";

const rules = [
  { id: "rule-1", name: "早起早睡", mode: "fixed", period: "daily", amount_cents: 200, tiers: [], description: "当天按计划作息", active: true, created_at: "2026-10-25T08:00:00.000Z", updated_at: "2026-10-25T08:00:00.000Z" },
  { id: "rule-2", name: "完成学习计划", mode: "fixed", period: "daily", amount_cents: 500, tiers: [], description: "完成今日学习", active: false, created_at: "2026-10-26T08:00:00.000Z", updated_at: "2026-10-26T08:00:00.000Z" },
];

const tieredRule = {
  id: "rule-3",
  name: "每日读书",
  mode: "tiered",
  period: "daily",
  amount_cents: null,
  tiers: [
    { name: "读书10分钟", amount_cents: 100 },
    { name: "读书20分钟", amount_cents: 200 },
    { name: "读书30分钟", amount_cents: 300 },
  ],
  description: "按当天阅读时长领取",
  active: true,
  created_at: "2026-10-27T08:00:00.000Z",
  updated_at: "2026-10-27T08:00:00.000Z",
};

const claims = [
  { id: "claim-1", rule_id: "rule-1", rule_name: "早起早睡", amount_cents: 200, tier_name: null, period: "daily", reward_date: "2026-10-27", claimed_at: "2026-10-27T07:30" },
  { id: "claim-2", rule_id: "rule-2", rule_name: "完成学习计划", amount_cents: 500, tier_name: null, period: "daily", reward_date: "2026-09-30", claimed_at: "2026-10-01T08:00" },
  { id: "claim-3", rule_id: "rule-1", rule_name: "早起早睡", amount_cents: 200, tier_name: null, period: "daily", reward_date: "2026-10-26", claimed_at: "2026-10-26T07:20" },
];

const weeklyTieredRule = { ...tieredRule, id: "rule-weekly", name: "每周跑步", period: "weekly" };

test("normalizes reward rules and claims", () => {
  const legacyRule = { ...rules[0], mode: undefined, period: undefined, tiers: undefined, updated_at: undefined };
  assert.deepEqual(normalizeRewardRules([legacyRule])[0], { ...rules[0], updated_at: rules[0].created_at });
  assert.deepEqual(normalizeRewardRules([tieredRule]), [tieredRule]);
  assert.equal(normalizeRewardRules([{ ...tieredRule, period: undefined }])[0].period, null);
  assert.deepEqual(normalizeRewardRules([{ ...tieredRule, tiers: [tieredRule.tiers[1], tieredRule.tiers[0]] }]), []);
  assert.deepEqual(normalizeRewardRules([{ ...rules[0], amount_cents: 0 }]), []);
  const legacyClaim = { ...claims[0], tier_name: undefined, period: undefined, reward_date: undefined };
  assert.deepEqual(normalizeRewardClaims([legacyClaim])[0], { ...claims[0], tier_name: null });
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
  assert.equal(canClaimReward(tieredRule, [], "2026-10-28", tieredRule.tiers[0]), true);
  assert.equal(canClaimReward(tieredRule, [], "2026-10-28"), false);
});

test("builds reward claims with rule name and amount snapshots", () => {
  const claim = buildRewardClaim(rules[0], "2026-10-27", "2026-10-28T07:30", null, () => "claim-new");
  assert.deepEqual(claim, {
    id: "claim-new",
    rule_id: "rule-1",
    rule_name: "早起早睡",
    amount_cents: 200,
    tier_name: null,
    period: "daily",
    reward_date: "2026-10-27",
    claimed_at: "2026-10-28T07:30",
  });
  assert.deepEqual(buildRewardClaim(tieredRule, "2026-10-28", "2026-10-28T08:00", tieredRule.tiers[1], () => "claim-tiered"), {
    id: "claim-tiered",
    rule_id: "rule-3",
    rule_name: "每日读书",
    amount_cents: 200,
    tier_name: "读书20分钟",
    period: "daily",
    reward_date: "2026-10-28",
    claimed_at: "2026-10-28T08:00",
  });
});

test("upgrades a tiered reward by the difference while keeping one daily claim", () => {
  const first = applyRewardClaim(tieredRule, [], "2026-10-27", "2026-10-28T08:00", tieredRule.tiers[0], () => "claim-tiered");
  assert.equal(first.added_cents, 100);
  const upgraded = applyRewardClaim(tieredRule, first.claims, "2026-10-27", "2026-10-28T09:30", tieredRule.tiers[2]);
  assert.equal(upgraded.added_cents, 200);
  assert.equal(upgraded.claims.length, 1);
  assert.deepEqual(upgraded.claims[0], {
    id: "claim-tiered",
    rule_id: "rule-3",
    rule_name: "每日读书",
    amount_cents: 300,
    tier_name: "读书30分钟",
    period: "daily",
    reward_date: "2026-10-27",
    claimed_at: "2026-10-28T09:30",
  });
  assert.equal(applyRewardClaim(tieredRule, upgraded.claims, "2026-10-27", "2026-10-28T10:00", tieredRule.tiers[1]), null);
  assert.equal(applyRewardClaim(tieredRule, upgraded.claims, "2026-10-27", "2026-10-28T10:00", tieredRule.tiers[2]), null);
});

test("does not apply a converted rule mode until the next day", () => {
  const fixedSnapshot = [{ ...claims[0], rule_id: tieredRule.id, reward_date: "2026-10-28", claimed_at: "2026-10-28T07:30" }];
  assert.equal(canClaimReward(tieredRule, fixedSnapshot, "2026-10-28", tieredRule.tiers[2]), false);
  assert.equal(canClaimReward(tieredRule, fixedSnapshot, "2026-10-29", tieredRule.tiers[0]), true);
});

test("uses one Monday key for a weekly reward and resets next week", () => {
  assert.equal(getRewardPeriodKey(weeklyTieredRule, "2026-10-26"), "2026-10-26");
  assert.equal(getRewardPeriodKey(weeklyTieredRule, "2026-11-01"), "2026-10-26");
  assert.equal(getRewardPeriodKey(weeklyTieredRule, "2026-11-02"), "2026-11-02");
  assert.equal(getRewardPeriodKey(tieredRule, "2026-11-01"), "2026-11-01");
});

test("upgrades a weekly tiered reward by the difference while keeping one weekly claim", () => {
  const weekKey = getRewardPeriodKey(weeklyTieredRule, "2026-10-30");
  const first = applyRewardClaim(weeklyTieredRule, [], weekKey, "2026-10-30T08:00", weeklyTieredRule.tiers[0], () => "claim-weekly");
  assert.equal(first.added_cents, 100);
  assert.equal(first.claims[0].period, "weekly");
  const upgraded = applyRewardClaim(weeklyTieredRule, first.claims, weekKey, "2026-11-01T09:00", weeklyTieredRule.tiers[2]);
  assert.equal(upgraded.added_cents, 200);
  assert.equal(upgraded.claims.length, 1);
  assert.equal(upgraded.claims[0].reward_date, "2026-10-26");
  assert.equal(upgraded.claims[0].amount_cents, 300);
  assert.equal(applyRewardClaim(weeklyTieredRule, upgraded.claims, weekKey, "2026-11-01T10:00", weeklyTieredRule.tiers[1]), null);
  assert.equal(canClaimReward(weeklyTieredRule, upgraded.claims, "2026-11-02", weeklyTieredRule.tiers[0]), true);
});

test("rejects upgrading a claim created under another reward period", () => {
  const dailyClaim = buildRewardClaim(tieredRule, "2026-10-26", "2026-10-30T08:00", tieredRule.tiers[0], () => "daily-claim");
  assert.equal(canClaimReward(weeklyTieredRule, [{ ...dailyClaim, rule_id: weeklyTieredRule.id }], "2026-10-26", weeklyTieredRule.tiers[2]), false);
});

test("calculates current-month and all-time totals", () => {
  assert.deepEqual(getRewardTotals(claims, "2026-10"), { monthCents: 400, totalCents: 900 });
  assert.deepEqual(getRewardTotals(claims.filter((claim) => claim.id !== "claim-1"), "2026-10"), { monthCents: 200, totalCents: 700 });
});

test("groups the historical total by rule without mutating claims", () => {
  const history = [
    { id: "claim-a1", rule_id: "rule-a", rule_name: "旧名称", amount_cents: 100, tier_name: "10分钟", period: "daily", reward_date: "2026-10-27", claimed_at: "2026-10-27T08:00" },
    { id: "claim-b1", rule_id: "rule-b", rule_name: "早睡", amount_cents: 200, tier_name: null, period: "daily", reward_date: "2026-10-28", claimed_at: "2026-10-28T22:00" },
    { id: "claim-a2", rule_id: "rule-a", rule_name: "每日读书", amount_cents: 200, tier_name: "20分钟", period: "daily", reward_date: "2026-10-26", claimed_at: "2026-10-29T09:00" },
    { id: "claim-c1", rule_id: "rule-c", rule_name: "运动", amount_cents: 200, tier_name: null, period: "daily", reward_date: "2026-10-29", claimed_at: "2026-10-29T10:00" },
  ];
  const original = structuredClone(history);

  const breakdown = getRewardBreakdown(history);

  assert.deepEqual(breakdown.map((group) => group.rule_id), ["rule-a", "rule-c", "rule-b"]);
  assert.deepEqual(breakdown[0], {
    rule_id: "rule-a",
    rule_name: "每日读书",
    total_cents: 300,
    completion_count: 2,
    latest_reward_date: "2026-10-27",
    claims: [history[0], history[2]],
  });
  assert.equal(breakdown.reduce((total, group) => total + group.total_cents, 0), 700);
  assert.equal(breakdown.reduce((total, group) => total + group.completion_count, 0), history.length);
  assert.deepEqual(history, original);
});

test("allows backfill only for the previous seven complete local days", () => {
  assert.equal(isRewardBackfillDateAllowed("2026-10-28", "2026-10-29"), true);
  assert.equal(isRewardBackfillDateAllowed("2026-10-22", "2026-10-29"), true);
  assert.equal(isRewardBackfillDateAllowed("2026-10-29", "2026-10-29"), false);
  assert.equal(isRewardBackfillDateAllowed("2026-10-21", "2026-10-29"), false);
  assert.equal(isRewardBackfillDateAllowed("2026-02-31", "2026-10-29"), false);
});

test("allows weekly backfill only for the previous complete natural week", () => {
  assert.equal(getPreviousWeeklyRewardKey("2026-10-30"), "2026-10-19");
  assert.equal(isWeeklyRewardBackfillAllowed("2026-10-19", "2026-10-30"), true);
  assert.equal(isWeeklyRewardBackfillAllowed("2026-10-26", "2026-10-30"), false);
  assert.equal(isWeeklyRewardBackfillAllowed("2026-10-12", "2026-10-30"), false);
});

test("marks weekly claims as backfill only when claimed outside their reward week", () => {
  const currentWeekClaim = buildRewardClaim(weeklyTieredRule, "2026-10-26", "2026-11-01T09:00", weeklyTieredRule.tiers[0], () => "weekly-current");
  const previousWeekClaim = { ...currentWeekClaim, id: "weekly-backfill", reward_date: "2026-10-19" };
  assert.equal(isRewardClaimBackfill(currentWeekClaim), false);
  assert.equal(isRewardClaimBackfill(previousWeekClaim), true);
  assert.equal(isRewardClaimBackfill(claims[1]), true);
});

test("attributes a cross-month weekly reward to the month containing Monday", () => {
  const weeklyClaim = buildRewardClaim(weeklyTieredRule, "2026-10-26", "2026-11-01T09:00", weeklyTieredRule.tiers[1], () => "weekly-cross-month");
  assert.deepEqual(getRewardTotals([weeklyClaim], "2026-10"), { monthCents: 200, totalCents: 200 });
  assert.deepEqual(getRewardTotals([weeklyClaim], "2026-11"), { monthCents: 0, totalCents: 200 });
  assert.deepEqual(getRewardClaimMonths([weeklyClaim]), ["2026-10"]);
});

test("filters and sorts reward claims and collects months", () => {
  assert.deepEqual(getVisibleRewardClaims(claims, "早起", "2026-10").map((claim) => claim.id), ["claim-1", "claim-3"]);
  assert.deepEqual(getVisibleRewardClaims([{ ...claims[0], tier_name: "读书30分钟" }], "30分钟").map((claim) => claim.id), ["claim-1"]);
  assert.deepEqual(getRewardClaimMonths(claims), ["2026-10", "2026-09"]);
});

test("shows the personal reward calculation start note below the page title", () => {
  const component = readFileSync(new URL("../src/components/AppSections.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(component, /<h1>个人奖励<\/h1><p className="reward-start-note">个人奖励系统从2026-10-28开始计算<\/p>/);
  assert.match(styles, /\.reward-start-note\s*\{[^}]*color:\s*var\(--muted\)/s);
});
