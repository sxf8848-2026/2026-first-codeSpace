import { addDays, dateKey, fromDateKey, weekKey } from "../date.ts";
import type { RewardRulePeriod } from "../types.ts";

export type RewardRuleStatusFilter = "active" | "all" | "inactive";

export type SortableRewardTier = {
  name: string;
  amount_cents: number;
};

export type SortableRewardRule = {
  id: string;
  name: string;
  mode: "fixed" | "tiered";
  period: RewardRulePeriod | null;
  amount_cents: number | null;
  tiers: SortableRewardTier[];
  description: string;
  active: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
};

export type SortableRewardClaim = {
  id: string;
  rule_id: string;
  rule_name: string;
  amount_cents: number;
  tier_name: string | null;
  period: RewardRulePeriod;
  reward_date: string;
  claimed_at: string;
};

export type RewardBreakdownGroup<T extends SortableRewardClaim = SortableRewardClaim> = {
  rule_id: string;
  rule_name: string;
  total_cents: number;
  completion_count: number;
  latest_reward_date: string;
  claims: T[];
};

export function normalizeRewardRules(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
  createStamp: () => string = () => new Date().toISOString(),
): Array<SortableRewardRule & { sort_order: number }> {
  if (!Array.isArray(raw)) return [];
  const records = raw
    .filter((record): record is Partial<SortableRewardRule> => Boolean(record) && typeof record === "object")
    .map((record) => {
      const createdAt = isDateTimeStamp(record.created_at) ? record.created_at : createStamp();
      const mode: SortableRewardRule["mode"] = record.mode === "tiered" ? "tiered" : "fixed";
      const period = mode === "fixed"
        ? "daily"
        : record.period === "daily" || record.period === "weekly" ? record.period : null;
      return {
        id: typeof record.id === "string" ? record.id : createId(),
        name: typeof record.name === "string" ? record.name.trim() : "",
        mode,
        period,
        amount_cents: mode === "fixed" && isPositiveCents(record.amount_cents) ? record.amount_cents : null,
        tiers: mode === "tiered" ? normalizeRewardTiers(record.tiers) : [],
        description: typeof record.description === "string" ? record.description.trim() : "",
        active: typeof record.active === "boolean" ? record.active : true,
        sort_order: isSortOrder(record.sort_order) ? record.sort_order : undefined,
        created_at: createdAt,
        updated_at: isDateTimeStamp(record.updated_at) ? record.updated_at : createdAt,
      };
    })
    .filter((record) => record.name && (
      record.mode === "fixed"
        ? record.amount_cents !== null
        : record.tiers.length >= 2 && hasStrictlyIncreasingAmounts(record.tiers)
    ));
  return normalizeRewardRuleOrder(records);
}

export function normalizeRewardRuleOrder<T extends SortableRewardRule>(rules: T[]): Array<T & { sort_order: number }> {
  const positions = new Map<string, number>();
  for (const active of [true, false]) {
    rules
      .filter((rule) => rule.active === active)
      .slice()
      .sort((first, second) => (
        rewardRuleOrder(first) - rewardRuleOrder(second)
        || timestamp(second.created_at) - timestamp(first.created_at)
        || first.id.localeCompare(second.id)
      ))
      .forEach((rule, index) => positions.set(rule.id, index + 1));
  }
  return rules.map((rule) => ({ ...rule, sort_order: positions.get(rule.id) ?? 1 }));
}

export function prependRewardRule<T extends SortableRewardRule>(rules: T[], rule: T): T[] {
  const normalized = normalizeRewardRuleOrder(rules);
  return [
    { ...rule, active: true, sort_order: 1 },
    ...normalized.map((item) => item.active ? { ...item, sort_order: item.sort_order + 1 } : item),
  ];
}

export function reorderRewardRules<T extends SortableRewardRule>(rules: T[], sourceId: string, targetId: string): T[] {
  const normalized = normalizeRewardRuleOrder(rules);
  const source = normalized.find((rule) => rule.id === sourceId);
  const target = normalized.find((rule) => rule.id === targetId);
  if (!source || !target || source.id === target.id || source.active !== target.active) return normalized;

  const group = normalized
    .filter((rule) => rule.active === source.active)
    .sort((first, second) => first.sort_order - second.sort_order);
  const sourceIndex = group.findIndex((rule) => rule.id === sourceId);
  const targetIndex = group.findIndex((rule) => rule.id === targetId);
  const [moved] = group.splice(sourceIndex, 1);
  group.splice(targetIndex, 0, moved);
  const positions = new Map(group.map((rule, index) => [rule.id, index + 1]));
  return normalized.map((rule) => positions.has(rule.id) ? { ...rule, sort_order: positions.get(rule.id)! } : rule);
}

export function toggleRewardRuleStatus<T extends SortableRewardRule>(rules: T[], ruleId: string): T[] {
  const normalized = normalizeRewardRuleOrder(rules);
  const current = normalized.find((rule) => rule.id === ruleId);
  if (!current) return normalized;
  const nextActive = !current.active;
  const targetOrder = normalized.filter((rule) => rule.active === nextActive).length + 1;
  return normalized.map((rule) => {
    if (rule.id === ruleId) return { ...rule, active: nextActive, sort_order: targetOrder };
    if (rule.active === current.active && rule.sort_order > current.sort_order) return { ...rule, sort_order: rule.sort_order - 1 };
    return rule;
  });
}

export function canReorderRewardRules(query: string, statusFilter: RewardRuleStatusFilter, editingRuleId: string | null): boolean {
  return !query.trim() && statusFilter !== "all" && editingRuleId === null;
}

export function normalizeRewardClaims(
  raw: unknown,
  createId: () => string = () => crypto.randomUUID(),
): SortableRewardClaim[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((record): record is Partial<SortableRewardClaim> => Boolean(record) && typeof record === "object")
    .map((record) => {
      const claimedAt = typeof record.claimed_at === "string" ? record.claimed_at : "";
      const period: RewardRulePeriod = record.period === "weekly" ? "weekly" : "daily";
      return {
        id: typeof record.id === "string" ? record.id : createId(),
        rule_id: typeof record.rule_id === "string" ? record.rule_id : "",
        rule_name: typeof record.rule_name === "string" ? record.rule_name.trim() : "",
        amount_cents: isPositiveCents(record.amount_cents) ? record.amount_cents : 0,
        tier_name: record.tier_name === null || record.tier_name === undefined
          ? null
          : typeof record.tier_name === "string" ? record.tier_name.trim() : "",
        period,
        reward_date: isDateKey(record.reward_date) ? record.reward_date : claimedAt.slice(0, 10),
        claimed_at: claimedAt,
      };
    })
    .filter((record) => record.rule_id && record.rule_name && record.amount_cents > 0 && record.tier_name !== "" && isDateKey(record.reward_date) && isLocalDateTime(record.claimed_at));
}

export function buildRewardClaim(
  rule: SortableRewardRule,
  rewardDate: string,
  claimedAt: string,
  tier: SortableRewardTier | null = null,
  createId: () => string = () => crypto.randomUUID(),
): SortableRewardClaim {
  if (!isDateKey(rewardDate)) throw new Error("奖励归属日期无效");
  if (rule.mode === "tiered" && (!tier || !hasTier(rule, tier))) throw new Error("阶梯奖励必须选择有效档位");
  if (rule.mode === "fixed" && !isPositiveCents(rule.amount_cents)) throw new Error("固定奖励金额无效");
  return {
    id: createId(),
    rule_id: rule.id,
    rule_name: rule.name,
    amount_cents: rule.mode === "tiered" ? tier!.amount_cents : rule.amount_cents!,
    tier_name: rule.mode === "tiered" ? tier!.name : null,
    period: getEffectiveRewardPeriod(rule),
    reward_date: rewardDate,
    claimed_at: claimedAt,
  };
}

export function applyRewardClaim<T extends SortableRewardClaim>(
  rule: SortableRewardRule,
  claims: T[],
  rewardDate: string,
  claimedAt: string,
  tier: SortableRewardTier | null = null,
  createId: () => string = () => crypto.randomUUID(),
): { claims: Array<T | SortableRewardClaim>; added_cents: number } | null {
  if (!canClaimReward(rule, claims, rewardDate, tier)) return null;
  const existing = getRewardClaimForDay(claims, rule.id, rewardDate);
  if (!existing) {
    const claim = buildRewardClaim(rule, rewardDate, claimedAt, tier, createId);
    return { claims: [claim, ...claims], added_cents: claim.amount_cents };
  }
  const updated = {
    ...existing,
    rule_name: rule.name,
    amount_cents: tier!.amount_cents,
    tier_name: tier!.name,
    period: getEffectiveRewardPeriod(rule),
    claimed_at: claimedAt,
  };
  return {
    claims: claims.map((claim) => claim.id === existing.id ? updated : claim),
    added_cents: updated.amount_cents - existing.amount_cents,
  };
}

export function getVisibleRewardRules<T extends SortableRewardRule>(
  rules: T[],
  query = "",
  statusFilter: RewardRuleStatusFilter = "active",
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return rules
    .filter((rule) => statusFilter === "all" || (statusFilter === "active" ? rule.active : !rule.active))
    .filter((rule) => !normalizedQuery || `${rule.name} ${rule.description}`.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => (
      Number(second.active) - Number(first.active)
      || rewardRuleOrder(first) - rewardRuleOrder(second)
      || timestamp(second.created_at) - timestamp(first.created_at)
    ));
}

export function getVisibleRewardClaims<T extends SortableRewardClaim>(claims: T[], query = "", monthFilter = "all"): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  return claims
    .filter((claim) => monthFilter === "all" || claim.reward_date.startsWith(monthFilter))
    .filter((claim) => !normalizedQuery || `${claim.rule_name} ${claim.tier_name ?? ""}`.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((first, second) => second.reward_date.localeCompare(first.reward_date) || second.claimed_at.localeCompare(first.claimed_at));
}

export function getRewardClaimMonths(claims: SortableRewardClaim[]): string[] {
  return Array.from(new Set(claims.map((claim) => claim.reward_date.slice(0, 7)).filter((month) => /^\d{4}-\d{2}$/.test(month))))
    .sort((first, second) => second.localeCompare(first));
}

export function getRewardTotals(claims: SortableRewardClaim[], currentMonth: string): { monthCents: number; totalCents: number } {
  return claims.reduce((totals, claim) => ({
    monthCents: totals.monthCents + (claim.reward_date.startsWith(currentMonth) ? claim.amount_cents : 0),
    totalCents: totals.totalCents + claim.amount_cents,
  }), { monthCents: 0, totalCents: 0 });
}

export function getRewardBreakdown<T extends SortableRewardClaim>(claims: T[]): RewardBreakdownGroup<T>[] {
  const grouped = new Map<string, T[]>();
  claims.forEach((claim) => grouped.set(claim.rule_id, [...(grouped.get(claim.rule_id) ?? []), claim]));

  return Array.from(grouped.entries())
    .map(([ruleId, ruleClaims]) => {
      const sortedClaims = ruleClaims.slice().sort((first, second) => (
        second.reward_date.localeCompare(first.reward_date) || second.claimed_at.localeCompare(first.claimed_at)
      ));
      const latestClaim = ruleClaims.reduce((latest, claim) => claim.claimed_at > latest.claimed_at ? claim : latest);
      return {
        rule_id: ruleId,
        rule_name: latestClaim.rule_name,
        total_cents: ruleClaims.reduce((total, claim) => total + claim.amount_cents, 0),
        completion_count: ruleClaims.length,
        latest_reward_date: sortedClaims[0].reward_date,
        claims: sortedClaims,
      };
    })
    .sort((first, second) => (
      second.total_cents - first.total_cents
      || second.latest_reward_date.localeCompare(first.latest_reward_date)
      || first.rule_name.localeCompare(second.rule_name, "zh-CN")
    ));
}

export function getRewardClaimForDay<T extends SortableRewardClaim>(claims: T[], ruleId: string, localDay: string): T | undefined {
  return claims.find((claim) => claim.rule_id === ruleId && claim.reward_date === localDay);
}

export function getEffectiveRewardPeriod(rule: SortableRewardRule): RewardRulePeriod {
  return rule.mode === "tiered" && rule.period === "weekly" ? "weekly" : "daily";
}

export function getRewardPeriodKey(rule: SortableRewardRule, localDay: string): string {
  return getEffectiveRewardPeriod(rule) === "weekly" ? weekKey(fromDateKey(localDay)) : localDay;
}

export function getPreviousWeeklyRewardKey(todayDay: string): string {
  return dateKey(addDays(fromDateKey(weekKey(fromDateKey(todayDay))), -7));
}

export function isRewardBackfillDateAllowed(rewardDate: string, todayDay: string): boolean {
  const rewardOrdinal = dateOrdinal(rewardDate);
  const todayOrdinal = dateOrdinal(todayDay);
  if (rewardOrdinal === null || todayOrdinal === null) return false;
  const daysAgo = todayOrdinal - rewardOrdinal;
  return daysAgo >= 1 && daysAgo <= 7;
}

export function isWeeklyRewardBackfillAllowed(rewardDate: string, todayDay: string): boolean {
  return rewardDate === getPreviousWeeklyRewardKey(todayDay);
}

export function isRewardClaimBackfill(claim: SortableRewardClaim): boolean {
  const claimedDay = claim.claimed_at.slice(0, 10);
  const claimedPeriodKey = claim.period === "weekly" ? weekKey(fromDateKey(claimedDay)) : claimedDay;
  return claim.reward_date !== claimedPeriodKey;
}

export function canClaimReward(
  rule: SortableRewardRule,
  claims: SortableRewardClaim[],
  localDay: string,
  tier: SortableRewardTier | null = null,
): boolean {
  if (!rule.active) return false;
  const existing = getRewardClaimForDay(claims, rule.id, localDay);
  if (rule.mode === "fixed") return !existing;
  if (!tier || !hasTier(rule, tier)) return false;
  if (!existing) return true;
  return existing.period === getEffectiveRewardPeriod(rule) && existing.tier_name !== null && tier.amount_cents > existing.amount_cents;
}

function normalizeRewardTiers(raw: unknown): SortableRewardTier[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((tier): tier is Partial<SortableRewardTier> => Boolean(tier) && typeof tier === "object")
    .map((tier) => ({
      name: typeof tier.name === "string" ? tier.name.trim() : "",
      amount_cents: isPositiveCents(tier.amount_cents) ? tier.amount_cents : 0,
    }))
    .filter((tier) => tier.name && tier.amount_cents > 0);
}

function hasStrictlyIncreasingAmounts(tiers: SortableRewardTier[]): boolean {
  return tiers.every((tier, index) => index === 0 || tier.amount_cents > tiers[index - 1].amount_cents);
}

function hasTier(rule: SortableRewardRule, tier: SortableRewardTier): boolean {
  return rule.tiers.some((item) => item.name === tier.name && item.amount_cents === tier.amount_cents);
}

function isPositiveCents(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isSortOrder(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function rewardRuleOrder(rule: SortableRewardRule): number {
  return isSortOrder(rule.sort_order) ? rule.sort_order : Number.MAX_SAFE_INTEGER;
}

function isLocalDateTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && dateOrdinal(value) !== null;
}

function dateOrdinal(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return Math.floor(date.getTime() / 86400000);
}

function isDateTimeStamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}
