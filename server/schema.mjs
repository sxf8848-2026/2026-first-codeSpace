const allowedStatuses = new Set([0, 1, 2]);
const allowedPriorities = new Set(["high", "medium", "low"]);
const allowedTagTones = new Set(["neutral", "green", "blue", "amber"]);
const allowedThemes = new Set(["light", "dark"]);
const allowedMetaLearningMasteries = new Set(["todo", "learning", "mastered", "skilled"]);
const allowedStudyGrowthTypes = new Set(["method", "habit", "mental_model"]);
const allowedStudyGrowthTitleSizes = new Set([18, 22, 26, 30]);
const allowedSkincareCategories = new Set(["cleanser", "toner", "serum", "lotion", "cream", "sunscreen", "mask", "other"]);
const allowedRewardRuleModes = new Set(["fixed", "tiered"]);
const allowedRewardRulePeriods = new Set(["daily", "weekly"]);
const allowedLearnedContentTypes = new Set(["article", "course", "book", "video", "other"]);
const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
const monthKeyPattern = /^\d{4}-\d{2}$/;
const localDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function isValidTodosPayload(payload) {
  if (!isPlainObject(payload)) return false;
  if (typeof payload.version !== "number") return false;
  if (!isPlainObject(payload.todos)) return false;
  if (!isPlainObject(payload.weeklyTodos)) return false;
  if (!isPlainObject(payload.awesomeRecords)) return false;
  if (!isPlainObject(payload.monthlyTodos)) return false;
  if (!Array.isArray(payload.deliveries)) return false;
  if (!Array.isArray(payload.habits)) return false;
  if (!isPlainObject(payload.habitChecks)) return false;
  if (!Array.isArray(payload.inspirations)) return false;
  if (!Array.isArray(payload.metaLearningAbilities)) return false;
  if (!Array.isArray(payload.videoInspirations)) return false;
  if (!Array.isArray(payload.videoNotes)) return false;
  if (!Array.isArray(payload.workExperiences)) return false;
  if (!Array.isArray(payload.dailyReadings)) return false;
  if (!Array.isArray(payload.argumentReflections)) return false;
  if (!Array.isArray(payload.divorcePlans)) return false;
  if (!Array.isArray(payload.books)) return false;
  if (!Array.isArray(payload.kindnessRecords)) return false;
  if (!Array.isArray(payload.studyGrowthRecords)) return false;
  if (!Array.isArray(payload.skincareProducts)) return false;
  if (!Array.isArray(payload.rewardRules)) return false;
  if (!Array.isArray(payload.rewardClaims)) return false;
  if (!Array.isArray(payload.learnedContents)) return false;
  if (!Array.isArray(payload.default_applied)) return false;

  if (!payload.default_applied.every(isDateKey)) return false;
  if (!payload.habits.every(isValidHabit)) return false;
  if (!payload.inspirations.every(isValidInspiration)) return false;
  if (!payload.metaLearningAbilities.every(isValidMetaLearningAbility)) return false;
  if (!payload.videoInspirations.every(isValidVideoInspiration)) return false;
  if (!payload.videoNotes.every(isValidVideoNote)) return false;
  if (!payload.workExperiences.every(isValidWorkExperience)) return false;
  if (!payload.dailyReadings.every(isValidDailyReading)) return false;
  if (!payload.argumentReflections.every(isValidArgumentReflection)) return false;
  if (!payload.divorcePlans.every(isValidDivorcePlan)) return false;
  if (!payload.books.every(isValidBook)) return false;
  if (!payload.kindnessRecords.every(isValidKindnessRecord)) return false;
  if (!payload.studyGrowthRecords.every(isValidStudyGrowthRecord)) return false;
  if (!payload.skincareProducts.every(isValidSkincareProduct)) return false;
  if (!payload.rewardRules.every(isValidRewardRule)) return false;
  if (!payload.rewardClaims.every(isValidRewardClaim)) return false;
  if (!payload.learnedContents.every(isValidLearnedContent)) return false;

  const deliverySequences = new Set();
  if (!payload.deliveries.every((delivery) => {
    if (!isValidDelivery(delivery)) return false;
    if (delivery.sequence === null) return true;
    if (deliverySequences.has(delivery.sequence)) return false;
    deliverySequences.add(delivery.sequence);
    return true;
  })) return false;

  const dailyTodosValid = Object.entries(payload.todos).every(([day, tasks]) => {
    if (!isDateKey(day)) return false;
    if (!Array.isArray(tasks)) return false;
    return tasks.every(isValidTask);
  });
  const weeklyTodosValid = Object.entries(payload.weeklyTodos).every(([week, tasks]) => {
    if (!isDateKey(week)) return false;
    if (!Array.isArray(tasks)) return false;
    return tasks.every(isValidWeeklyTask);
  });
  const awesomeRecordsValid = Object.entries(payload.awesomeRecords).every(([day, records]) => {
    if (!isDateKey(day)) return false;
    if (!Array.isArray(records)) return false;
    return records.every(isValidAwesomeRecord);
  });
  const monthlyTodosValid = Object.entries(payload.monthlyTodos).every(([month, tasks]) => {
    if (!isMonthKey(month)) return false;
    if (!Array.isArray(tasks)) return false;
    return tasks.every(isValidMonthlyTask);
  });
  const habitChecksValid = Object.entries(payload.habitChecks).every(([day, checks]) => {
    if (!isDateKey(day)) return false;
    if (!isPlainObject(checks)) return false;
    return Object.entries(checks).every(([habitId, checked]) => isNonEmptyString(habitId) && typeof checked === "boolean");
  });
  return dailyTodosValid && weeklyTodosValid && awesomeRecordsValid && monthlyTodosValid && habitChecksValid;
}

export function isValidPrefsPayload(payload) {
  if (!isPlainObject(payload)) return false;
  if (!allowedThemes.has(payload.theme)) return false;
  if (!Array.isArray(payload.tags)) return false;
  if (!Array.isArray(payload.defaultTasks)) return false;
  if (!Array.isArray(payload.deliveryPlatforms)) return false;
  return payload.tags.every(isValidTag) && payload.defaultTasks.every(isValidDefaultTask) && payload.deliveryPlatforms.every(isNonEmptyString);
}

function isValidTask(task) {
  if (!isPlainObject(task)) return false;
  if (!isNonEmptyString(task.id)) return false;
  if (!isNonEmptyString(task.text)) return false;
  if (!allowedStatuses.has(task.status)) return false;
  if (!allowedPriorities.has(task.priority)) return false;
  if (!isValidTagId(task.tag)) return false;
  if (typeof task.description !== "string") return false;
  if (typeof task.created_at !== "string") return false;
  if (typeof task.done_at !== "string" && task.done_at !== null) return false;
  return true;
}

function isValidWeeklyTask(task) {
  if (!isPlainObject(task)) return false;
  if (!isNonEmptyString(task.id)) return false;
  if (!isNonEmptyString(task.text)) return false;
  if (typeof task.done !== "boolean") return false;
  if (typeof task.created_at !== "string") return false;
  if (typeof task.done_at !== "string" && task.done_at !== null) return false;
  return true;
}

function isValidAwesomeRecord(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.text)) return false;
  if (typeof record.created_at !== "string") return false;
  return true;
}

function isValidMonthlyTask(task) {
  if (!isPlainObject(task)) return false;
  if (!isNonEmptyString(task.id)) return false;
  if (!isNonEmptyString(task.text)) return false;
  if (typeof task.description !== "string") return false;
  if (typeof task.done !== "boolean") return false;
  if (typeof task.created_at !== "string") return false;
  if (typeof task.done_at !== "string" && task.done_at !== null) return false;
  return true;
}

function isValidDelivery(delivery) {
  if (!isPlainObject(delivery)) return false;
  if (!isNonEmptyString(delivery.id)) return false;
  if (delivery.sequence !== null && (!Number.isInteger(delivery.sequence) || delivery.sequence <= 0)) return false;
  if (!isNonEmptyString(delivery.name)) return false;
  if (!isNonEmptyString(delivery.platform)) return false;
  if (typeof delivery.note !== "string") return false;
  if (typeof delivery.purchased_at !== "string") return false;
  if (typeof delivery.picked !== "boolean") return false;
  if (typeof delivery.created_at !== "string") return false;
  if (typeof delivery.picked_at !== "string" && delivery.picked_at !== null) return false;
  return true;
}

function isValidHabit(habit) {
  if (!isPlainObject(habit)) return false;
  if (!isNonEmptyString(habit.id)) return false;
  if (!isNonEmptyString(habit.name)) return false;
  if (typeof habit.note !== "string") return false;
  if (typeof habit.created_at !== "string") return false;
  if (typeof habit.archived_at !== "string" && habit.archived_at !== null && habit.archived_at !== undefined) return false;
  return true;
}

function isValidInspiration(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.title)) return false;
  if (typeof record.body !== "string") return false;
  if (typeof record.pinned !== "boolean") return false;
  if (typeof record.created_at !== "string") return false;
  if (typeof record.archived_at !== "string" && record.archived_at !== null && record.archived_at !== undefined) return false;
  return true;
}

function isValidMetaLearningAbility(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.name)) return false;
  if (typeof record.summary !== "string") return false;
  if (typeof record.usage !== "string") return false;
  if (!allowedMetaLearningMasteries.has(record.mastery)) return false;
  if (typeof record.created_at !== "string") return false;
  if (typeof record.archived_at !== "string" && record.archived_at !== null && record.archived_at !== undefined) return false;
  return true;
}

function isValidVideoInspiration(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.channel)) return false;
  if (!isNonEmptyString(record.title)) return false;
  if (typeof record.content !== "string") return false;
  if (typeof record.url !== "string") return false;
  if (typeof record.pinned !== "boolean") return false;
  if (typeof record.created_at !== "string") return false;
  if (typeof record.archived_at !== "string" && record.archived_at !== null && record.archived_at !== undefined) return false;
  return true;
}

function isValidVideoNote(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.title)) return false;
  if (typeof record.quote !== "string") return false;
  if (typeof record.reflection !== "string") return false;
  if (!record.quote.trim() && !record.reflection.trim()) return false;
  if (typeof record.source !== "string") return false;
  if (typeof record.url !== "string") return false;
  if (typeof record.pinned !== "boolean") return false;
  if (typeof record.created_at !== "string") return false;
  if (typeof record.archived_at !== "string" && record.archived_at !== null && record.archived_at !== undefined) return false;
  return true;
}

function isValidWorkExperience(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.title)) return false;
  if (!isNonEmptyString(record.body)) return false;
  if (!isMonthKey(record.month)) return false;
  if (typeof record.pinned !== "boolean") return false;
  if (typeof record.created_at !== "string") return false;
  if (typeof record.archived_at !== "string" && record.archived_at !== null && record.archived_at !== undefined) return false;
  return true;
}

function isValidDailyReading(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.title)) return false;
  if (!isNonEmptyString(record.body)) return false;
  if (typeof record.source !== "string") return false;
  if (!Number.isInteger(record.sort_order) || record.sort_order < 1) return false;
  if (typeof record.created_at !== "string") return false;
  if (typeof record.archived_at !== "string" && record.archived_at !== null && record.archived_at !== undefined) return false;
  return true;
}

function isValidArgumentReflection(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.topic)) return false;
  if (typeof record.occurred_at !== "string" || !localDateTimePattern.test(record.occurred_at)) return false;
  if (!isNonEmptyString(record.content)) return false;
  if (typeof record.created_at !== "string") return false;
  if (typeof record.archived_at !== "string" && record.archived_at !== null && record.archived_at !== undefined) return false;
  return true;
}

function isValidDivorcePlan(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.title)) return false;
  if (typeof record.occurred_at !== "string" || !localDateTimePattern.test(record.occurred_at)) return false;
  if (!isNonEmptyString(record.content)) return false;
  if (typeof record.created_at !== "string") return false;
  if (typeof record.archived_at !== "string" && record.archived_at !== null && record.archived_at !== undefined) return false;
  return true;
}

function isValidBook(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.title)) return false;
  if (typeof record.author !== "string") return false;
  if (typeof record.note !== "string") return false;
  if (!(record.status === "want_to_read" || record.status === "reading" || record.status === "read")) return false;
  if (typeof record.created_at !== "string") return false;
  if (typeof record.updated_at !== "string") return false;
  return true;
}

function isValidKindnessRecord(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.title)) return false;
  if (typeof record.occurred_at !== "string" || !localDateTimePattern.test(record.occurred_at)) return false;
  if (!isNonEmptyString(record.content)) return false;
  if (typeof record.created_at !== "string" || Number.isNaN(Date.parse(record.created_at))) return false;
  return true;
}

function isValidStudyGrowthRecord(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!allowedStudyGrowthTypes.has(record.type)) return false;
  if (!isNonEmptyString(record.title)) return false;
  if (!allowedStudyGrowthTitleSizes.has(record.title_size)) return false;
  if (!isNonEmptyString(record.content)) return false;
  if (!isNonEmptyString(record.content_markdown)) return false;
  if (typeof record.source !== "string") return false;
  if (typeof record.created_at !== "string" || Number.isNaN(Date.parse(record.created_at))) return false;
  if (typeof record.updated_at !== "string" || Number.isNaN(Date.parse(record.updated_at))) return false;
  return true;
}

function isValidSkincareProduct(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.name)) return false;
  if (typeof record.brand !== "string") return false;
  if (!allowedSkincareCategories.has(record.category)) return false;
  if (typeof record.description !== "string") return false;
  if (!isDateTimeStamp(record.created_at)) return false;
  if (!isDateTimeStamp(record.updated_at)) return false;
  return true;
}

function isValidRewardRule(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.name)) return false;
  if (!allowedRewardRuleModes.has(record.mode)) return false;
  if (!Array.isArray(record.tiers)) return false;
  if (record.mode === "fixed") {
    if (record.period !== "daily") return false;
    if (!isPositiveCents(record.amount_cents) || record.tiers.length !== 0) return false;
  } else {
    if (record.period !== null && !allowedRewardRulePeriods.has(record.period)) return false;
    if (record.amount_cents !== null || record.tiers.length < 2 || !record.tiers.every(isValidRewardTier)) return false;
    if (record.tiers.some((tier, index) => index > 0 && tier.amount_cents <= record.tiers[index - 1].amount_cents)) return false;
  }
  if (typeof record.description !== "string") return false;
  if (typeof record.active !== "boolean") return false;
  if (!Number.isInteger(record.sort_order) || record.sort_order < 1) return false;
  if (!isDateTimeStamp(record.created_at)) return false;
  if (!isDateTimeStamp(record.updated_at)) return false;
  return true;
}

function isValidRewardClaim(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!isNonEmptyString(record.rule_id)) return false;
  if (!isNonEmptyString(record.rule_name)) return false;
  if (!isPositiveCents(record.amount_cents)) return false;
  if (record.tier_name !== null && !isNonEmptyString(record.tier_name)) return false;
  if (!allowedRewardRulePeriods.has(record.period)) return false;
  if (record.period === "weekly" && record.tier_name === null) return false;
  if (typeof record.reward_date !== "string" || !dateKeyPattern.test(record.reward_date)) return false;
  if (typeof record.claimed_at !== "string" || !localDateTimePattern.test(record.claimed_at)) return false;
  return true;
}

function isValidRewardTier(tier) {
  return isPlainObject(tier) && isNonEmptyString(tier.name) && isPositiveCents(tier.amount_cents);
}

function isValidLearnedContent(record) {
  if (!isPlainObject(record)) return false;
  if (!isNonEmptyString(record.id)) return false;
  if (!allowedLearnedContentTypes.has(record.type)) return false;
  if (!isNonEmptyString(record.title)) return false;
  if (!isCalendarDateKey(record.completed_on)) return false;
  if (typeof record.source !== "string") return false;
  if (typeof record.url !== "string") return false;
  if (!isNonEmptyString(record.takeaway)) return false;
  if (!isDateTimeStamp(record.created_at)) return false;
  if (!isDateTimeStamp(record.updated_at)) return false;
  return true;
}

function isValidTag(tag) {
  if (!isPlainObject(tag)) return false;
  if (!isValidTagId(tag.id)) return false;
  if (!isNonEmptyString(tag.name)) return false;
  return allowedTagTones.has(tag.tone);
}

function isValidDefaultTask(task) {
  if (!isPlainObject(task)) return false;
  if (!isNonEmptyString(task.text)) return false;
  if (!isValidTagId(task.tag)) return false;
  return allowedPriorities.has(task.priority);
}

function isValidTagId(tag) {
  return typeof tag === "number" && Number.isInteger(tag) && tag >= 0;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDateKey(value) {
  return typeof value === "string" && dateKeyPattern.test(value);
}

function isCalendarDateKey(value) {
  if (!isDateKey(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function isMonthKey(value) {
  return typeof value === "string" && monthKeyPattern.test(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveCents(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isDateTimeStamp(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}
