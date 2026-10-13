const allowedStatuses = new Set([0, 1, 2]);
const allowedPriorities = new Set(["high", "medium", "low"]);
const allowedTagTones = new Set(["neutral", "green", "blue", "amber"]);
const allowedThemes = new Set(["light", "dark"]);
const allowedMetaLearningMasteries = new Set(["todo", "learning", "mastered", "skilled"]);
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
  if (!isPlainObject(payload.weeklyDeliveries)) return false;
  if (!Array.isArray(payload.habits)) return false;
  if (!isPlainObject(payload.habitChecks)) return false;
  if (!Array.isArray(payload.inspirations)) return false;
  if (!Array.isArray(payload.metaLearningAbilities)) return false;
  if (!Array.isArray(payload.videoInspirations)) return false;
  if (!Array.isArray(payload.workExperiences)) return false;
  if (!Array.isArray(payload.dailyReadings)) return false;
  if (!Array.isArray(payload.argumentReflections)) return false;
  if (!Array.isArray(payload.books)) return false;
  if (!Array.isArray(payload.default_applied)) return false;

  if (!payload.default_applied.every(isDateKey)) return false;
  if (!payload.habits.every(isValidHabit)) return false;
  if (!payload.inspirations.every(isValidInspiration)) return false;
  if (!payload.metaLearningAbilities.every(isValidMetaLearningAbility)) return false;
  if (!payload.videoInspirations.every(isValidVideoInspiration)) return false;
  if (!payload.workExperiences.every(isValidWorkExperience)) return false;
  if (!payload.dailyReadings.every(isValidDailyReading)) return false;
  if (!payload.argumentReflections.every(isValidArgumentReflection)) return false;
  if (!payload.books.every(isValidBook)) return false;

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
  const weeklyDeliveriesValid = Object.entries(payload.weeklyDeliveries).every(([week, deliveries]) => {
    if (!isDateKey(week)) return false;
    if (!Array.isArray(deliveries)) return false;
    return deliveries.every(isValidWeeklyDelivery);
  });
  const habitChecksValid = Object.entries(payload.habitChecks).every(([day, checks]) => {
    if (!isDateKey(day)) return false;
    if (!isPlainObject(checks)) return false;
    return Object.entries(checks).every(([habitId, checked]) => isNonEmptyString(habitId) && typeof checked === "boolean");
  });
  return dailyTodosValid && weeklyTodosValid && awesomeRecordsValid && monthlyTodosValid && weeklyDeliveriesValid && habitChecksValid;
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

function isValidWeeklyDelivery(delivery) {
  if (!isPlainObject(delivery)) return false;
  if (!isNonEmptyString(delivery.id)) return false;
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

function isMonthKey(value) {
  return typeof value === "string" && monthKeyPattern.test(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
