import { DATA_VERSION, DEFAULT_TASKS, DELIVERY_PLATFORMS, TAGS } from "../constants";
import { dateKey, nowStamp } from "../date";
import { normalizeHabit } from "./habits";
import { normalizeInspirations } from "./inspirations";
import { normalizeMetaLearningAbilities } from "./metaLearning";
import { normalizeVideoInspirations } from "./videoInspirations";
import { normalizeVideoNotes } from "./videoNotes";
import { normalizeWorkExperiences } from "./workExperiences";
import { normalizeDailyReadings } from "./dailyReadings";
import { normalizeArgumentReflections } from "./argumentReflections";
import { normalizeDivorcePlans } from "./divorcePlans";
import { normalizeBooks } from "./books";
import { normalizeKindnessRecords } from "./kindnessRecords";
import { normalizeStudyGrowthRecords } from "./studyGrowthRecords";
import { normalizeSkincareProducts } from "./skincareProducts";
import { normalizeRewardClaims, normalizeRewardRules } from "./rewards";
import { normalizeLearnedContents } from "./learnedContents";
import { normalizeDeliveryPlatforms } from "./deliveryPlatforms";
import { migrateLegacyWeeklyDeliveries, normalizeDeliverySequence } from "./deliveries";
import {
  AppPrefs,
  AwesomeRecord,
  DefaultTask,
  DailyReadingRecord,
  ArgumentReflectionRecord,
  DivorcePlanRecord,
  BookRecord,
  KindnessRecord,
  StudyGrowthRecord,
  StudyGrowthType,
  SkincareCategory,
  SkincareProductRecord,
  RewardRuleRecord,
  RewardRuleMode,
  RewardRulePeriod,
  RewardTier,
  LearnedContentRecord,
  LearnedContentType,
  Habit,
  InspirationRecord,
  MetaLearningAbility,
  MetaLearningMastery,
  MonthlyTask,
  Priority,
  STATUS_DONE,
  STATUS_TODO,
  TagId,
  TagTone,
  TaskDraft,
  TodoData,
  TodoTag,
  TodoTask,
  VideoInspirationRecord,
  VideoNoteRecord,
  DeliveryRecord,
  WeeklyTask,
  WorkExperienceRecord,
} from "../types";

const TODOS_KEY = "daily-todo.todos.v1";
const PREFS_KEY = "daily-todo.prefs.v1";
let todosEtag: string | null = null;
let prefsEtag: string | null = null;
let todosSaveQueue: Promise<ProjectSaveResult> = Promise.resolve({ ok: true, fallback: "localStorage" });
let prefsSaveQueue: Promise<ProjectSaveResult> = Promise.resolve({ ok: true, fallback: "localStorage" });

export type ProjectSaveResult = {
  ok: boolean;
  fallback: "localStorage";
  message?: string;
};

const initialData: TodoData = {
  version: DATA_VERSION,
  todos: {},
  weeklyTodos: {},
  awesomeRecords: {},
  monthlyTodos: {},
  deliveries: [],
  habits: [],
  habitChecks: {},
  inspirations: [],
  metaLearningAbilities: [],
  videoInspirations: [],
  videoNotes: [],
  workExperiences: [],
  dailyReadings: [],
  argumentReflections: [],
  divorcePlans: [],
  books: [],
  kindnessRecords: [],
  studyGrowthRecords: [],
  skincareProducts: [],
  rewardRules: [],
  rewardClaims: [],
  learnedContents: [],
  default_applied: [],
};

export function loadData(): TodoData {
  const raw = window.localStorage.getItem(TODOS_KEY);
  if (!raw) return initialData;
  try {
    return normalizeData(JSON.parse(raw));
  } catch {
    return initialData;
  }
}

export function saveData(data: TodoData): void {
  window.localStorage.setItem(TODOS_KEY, JSON.stringify(data));
}

export async function loadDataFromProject(): Promise<TodoData> {
  try {
    const response = await fetch("/api/todos");
    if (!response.ok) throw new Error("Failed to load todos");
    todosEtag = response.headers.get("ETag");
    const data = normalizeData(await response.json());
    const localData = loadData();
    const resolvedData = hasTasks(data) || !hasTasks(localData) ? data : localData;
    window.localStorage.setItem(TODOS_KEY, JSON.stringify(resolvedData));
    return resolvedData;
  } catch {
    return loadData();
  }
}

export async function saveDataToProject(data: TodoData): Promise<ProjectSaveResult> {
  window.localStorage.setItem(TODOS_KEY, JSON.stringify(data));
  todosSaveQueue = todosSaveQueue.then(() => saveDataRequest(data), () => saveDataRequest(data));
  return todosSaveQueue;
}

async function saveDataRequest(data: TodoData): Promise<ProjectSaveResult> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (todosEtag) headers["If-Match"] = todosEtag;
    const response = await fetch("/api/todos", {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      return {
        ok: false,
        fallback: "localStorage",
        message: `项目文件保存失败：${response.status} ${response.statusText || "接口异常"}`,
      };
    }
    todosEtag = response.headers.get("ETag") ?? todosEtag;
    return { ok: true, fallback: "localStorage" };
  } catch (error) {
    return {
      ok: false,
      fallback: "localStorage",
      message: getSaveErrorMessage(error),
    };
  }
}

export function loadPrefs(): AppPrefs {
  const raw = window.localStorage.getItem(PREFS_KEY);
  if (!raw) return initialPrefs;
  try {
    return normalizePrefs(JSON.parse(raw));
  } catch {
    return initialPrefs;
  }
}

export function savePrefs(prefs: AppPrefs): void {
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function loadPrefsFromProject(): Promise<AppPrefs> {
  try {
    const response = await fetch("/api/prefs");
    if (!response.ok) throw new Error("Failed to load prefs");
    prefsEtag = response.headers.get("ETag");
    const prefs = normalizePrefs(await response.json());
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    return prefs;
  } catch {
    return loadPrefs();
  }
}

export async function savePrefsToProject(prefs: AppPrefs): Promise<ProjectSaveResult> {
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  prefsSaveQueue = prefsSaveQueue.then(() => savePrefsRequest(prefs), () => savePrefsRequest(prefs));
  return prefsSaveQueue;
}

async function savePrefsRequest(prefs: AppPrefs): Promise<ProjectSaveResult> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (prefsEtag) headers["If-Match"] = prefsEtag;
    const response = await fetch("/api/prefs", {
      method: "PUT",
      headers,
      body: JSON.stringify(prefs),
    });
    if (!response.ok) {
      return {
        ok: false,
        fallback: "localStorage",
        message: `偏好设置保存失败：${response.status} ${response.statusText || "接口异常"}`,
      };
    }
    prefsEtag = response.headers.get("ETag") ?? prefsEtag;
    return { ok: true, fallback: "localStorage" };
  } catch (error) {
    return {
      ok: false,
      fallback: "localStorage",
      message: getSaveErrorMessage(error),
    };
  }
}

export function createTask(draft: TaskDraft): TodoTask {
  const status = draft.status;
  return {
    id: crypto.randomUUID(),
    text: draft.text.trim(),
    status,
    priority: draft.priority,
    created_at: nowStamp(),
    done_at: status === STATUS_DONE ? nowStamp() : null,
    description: draft.description.trim(),
    tag: draft.tag,
  };
}

export function createWeeklyTask(text: string): WeeklyTask {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    done: false,
    created_at: nowStamp(),
    done_at: null,
  };
}

export function createAwesomeRecord(text: string): AwesomeRecord {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    created_at: nowStamp(),
  };
}

export function createMonthlyTask(text: string, description: string): MonthlyTask {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    description: description.trim(),
    done: false,
    created_at: nowStamp(),
    done_at: null,
  };
}

export function createDelivery(name: string, platform: string, note: string, purchasedAt = "", sequence: number | null = null): DeliveryRecord {
  return {
    id: crypto.randomUUID(),
    sequence,
    name: name.trim(),
    platform: platform.trim(),
    note: note.trim(),
    purchased_at: purchasedAt,
    picked: false,
    created_at: nowStamp(),
    picked_at: null,
  };
}

export function createHabit(name: string, note = ""): Habit {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    note: note.trim(),
    created_at: nowStamp(),
    archived_at: null,
  };
}

export function createInspiration(title: string, body: string): InspirationRecord {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    body: body.trim(),
    pinned: false,
    created_at: nowStamp(),
    archived_at: null,
  };
}

export function createMetaLearningAbility(
  name: string,
  summary: string,
  usage: string,
  mastery: MetaLearningMastery,
): MetaLearningAbility {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    summary: summary.trim(),
    usage: usage.trim(),
    mastery,
    created_at: nowStamp(),
    archived_at: null,
  };
}

export function createVideoInspiration(channel: string, title: string, content: string, url: string): VideoInspirationRecord {
  return {
    id: crypto.randomUUID(),
    channel: channel.trim(),
    title: title.trim(),
    content: content.trim(),
    url: url.trim(),
    pinned: false,
    created_at: nowStamp(),
    archived_at: null,
  };
}

export function createVideoNote(title: string, quote: string, reflection: string, source: string, url: string): VideoNoteRecord {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    quote: quote.trim(),
    reflection: reflection.trim(),
    source: source.trim(),
    url: url.trim(),
    pinned: false,
    created_at: nowStamp(),
    archived_at: null,
  };
}

export function createWorkExperience(title: string, body: string, month: string): WorkExperienceRecord {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    body: body.trim(),
    month,
    pinned: false,
    created_at: nowStamp(),
    archived_at: null,
  };
}

export function createDailyReading(title: string, body: string, source: string, sort_order: number): DailyReadingRecord {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    body: body.trim(),
    source: source.trim(),
    sort_order,
    created_at: nowStamp(),
    archived_at: null,
  };
}

export function createArgumentReflection(
  topic: string,
  occurred_at: string,
  content: string,
): ArgumentReflectionRecord {
  return {
    id: crypto.randomUUID(),
    topic: topic.trim(),
    occurred_at,
    content: content.trim(),
    created_at: nowStamp(),
    archived_at: null,
  };
}

export function createDivorcePlan(title: string, occurred_at: string, content: string): DivorcePlanRecord {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    occurred_at,
    content: content.trim(),
    created_at: nowStamp(),
    archived_at: null,
  };
}

export function createBook(title: string, author: string, note: string, status: BookRecord["status"]): BookRecord {
  const stamp = nowStamp();
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    author: author.trim(),
    note: note.trim(),
    status,
    created_at: stamp,
    updated_at: stamp,
  };
}

export function createKindnessRecord(title: string, occurred_at: string, content: string): KindnessRecord {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    occurred_at,
    content: content.trim(),
    created_at: nowStamp(),
  };
}

export function createStudyGrowthRecord(
  type: StudyGrowthType,
  title: string,
  title_size: StudyGrowthRecord["title_size"],
  content: string,
  content_markdown: string,
  source: string,
): StudyGrowthRecord {
  const stamp = nowStamp();
  return {
    id: crypto.randomUUID(),
    type,
    title: title.trim(),
    title_size,
    content: content.trim(),
    content_markdown: content_markdown.trim(),
    source: source.trim(),
    created_at: stamp,
    updated_at: stamp,
  };
}

export function createSkincareProduct(
  name: string,
  brand: string,
  category: SkincareCategory,
  description: string,
): SkincareProductRecord {
  const stamp = nowStamp();
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    brand: brand.trim(),
    category,
    description: description.trim(),
    created_at: stamp,
    updated_at: stamp,
  };
}

export function createRewardRule(
  name: string,
  mode: RewardRuleMode,
  period: RewardRulePeriod,
  amount_cents: number | null,
  tiers: RewardTier[],
  description: string,
): RewardRuleRecord {
  const stamp = nowStamp();
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    mode,
    period: mode === "fixed" ? "daily" : period,
    amount_cents: mode === "fixed" ? amount_cents : null,
    tiers: mode === "tiered" ? tiers : [],
    description: description.trim(),
    active: true,
    sort_order: 1,
    created_at: stamp,
    updated_at: stamp,
  };
}

export function createLearnedContent(
  type: LearnedContentType,
  title: string,
  completed_on: string,
  source: string,
  url: string,
  takeaway: string,
): LearnedContentRecord {
  const stamp = nowStamp();
  return {
    id: crypto.randomUUID(),
    type,
    title: title.trim(),
    completed_on,
    source: source.trim(),
    url: url.trim(),
    takeaway: takeaway.trim(),
    created_at: stamp,
    updated_at: stamp,
  };
}

export function applyDefaultTasks(data: TodoData, day: string, defaultTasks: DefaultTask[] = DEFAULT_TASKS): TodoData {
  if (data.default_applied.includes(day)) return data;
  const existing = new Set((data.todos[day] ?? []).map((task) => task.text));
  const additions = defaultTasks.filter((task) => !existing.has(task.text)).map((task) =>
    createTask({
      text: task.text,
      tag: task.tag,
      priority: task.priority,
      status: STATUS_TODO,
      description: "",
    }),
  );
  return {
    ...data,
    todos: {
      ...data.todos,
      [day]: [...(data.todos[day] ?? []), ...additions],
    },
    default_applied: [...data.default_applied, day],
  };
}

export function seedToday(data: TodoData, defaultTasks: DefaultTask[] = DEFAULT_TASKS): TodoData {
  return applyDefaultTasks(data, dateKey(new Date()), defaultTasks);
}

export function normalizeData(raw: unknown): TodoData {
  if (!raw || typeof raw !== "object") return initialData;
  const value = raw as Partial<TodoData> & { weeklyDeliveries?: unknown };
  const todos: TodoData["todos"] = {};
  const weeklyTodos: TodoData["weeklyTodos"] = {};
  const awesomeRecords: TodoData["awesomeRecords"] = {};
  const monthlyTodos: TodoData["monthlyTodos"] = {};
  const deliveries: TodoData["deliveries"] = [];
  const habits: TodoData["habits"] = [];
  const habitChecks: TodoData["habitChecks"] = {};
  const inspirations: TodoData["inspirations"] = normalizeInspirations(
    value.inspirations,
    () => crypto.randomUUID(),
    nowStamp,
  );
  const metaLearningAbilities: TodoData["metaLearningAbilities"] = normalizeMetaLearningAbilities(
    value.metaLearningAbilities,
    () => crypto.randomUUID(),
    nowStamp,
  );
  const videoInspirations: TodoData["videoInspirations"] = normalizeVideoInspirations(
    value.videoInspirations,
    () => crypto.randomUUID(),
    nowStamp,
  );
  const videoNotes: TodoData["videoNotes"] = normalizeVideoNotes(
    value.videoNotes,
    () => crypto.randomUUID(),
    nowStamp,
  );
  const workExperiences: TodoData["workExperiences"] = normalizeWorkExperiences(
    value.workExperiences,
    () => crypto.randomUUID(),
    nowStamp,
  );
  const dailyReadings: TodoData["dailyReadings"] = normalizeDailyReadings(
    value.dailyReadings,
    () => crypto.randomUUID(),
    nowStamp,
  );
  const argumentReflections: TodoData["argumentReflections"] = normalizeArgumentReflections(
    value.argumentReflections,
    () => crypto.randomUUID(),
    nowStamp,
  );
  const divorcePlans: TodoData["divorcePlans"] = normalizeDivorcePlans(
    value.divorcePlans,
    () => crypto.randomUUID(),
    nowStamp,
  );
  const books: TodoData["books"] = normalizeBooks(value.books, () => crypto.randomUUID(), nowStamp);
  const kindnessRecords: TodoData["kindnessRecords"] = normalizeKindnessRecords(
    value.kindnessRecords,
    () => crypto.randomUUID(),
    nowStamp,
  );
  const studyGrowthRecords: TodoData["studyGrowthRecords"] = normalizeStudyGrowthRecords(
    value.studyGrowthRecords,
    () => crypto.randomUUID(),
    nowStamp,
  );
  const skincareProducts: TodoData["skincareProducts"] = normalizeSkincareProducts(
    value.skincareProducts,
    () => crypto.randomUUID(),
    nowStamp,
  );
  const rewardRules: TodoData["rewardRules"] = normalizeRewardRules(
    value.rewardRules,
    () => crypto.randomUUID(),
    nowStamp,
  );
  const rewardClaims: TodoData["rewardClaims"] = normalizeRewardClaims(
    value.rewardClaims,
    () => crypto.randomUUID(),
  );
  const learnedContents: TodoData["learnedContents"] = normalizeLearnedContents(
    value.learnedContents,
    () => crypto.randomUUID(),
    nowStamp,
    () => dateKey(new Date()),
  );
  const rawTodos =
    value.todos && typeof value.todos === "object"
      ? (value.todos as Record<string, unknown>)
      : {};
  for (const [day, tasks] of Object.entries(rawTodos)) {
    if (!Array.isArray(tasks)) continue;
    todos[day] = tasks
      .filter((task): task is Partial<TodoTask> & { done?: boolean } => Boolean(task) && typeof task === "object")
      .map(normalizeTask)
      .filter((task) => task.text);
  }
  const rawWeeklyTodos =
    value.weeklyTodos && typeof value.weeklyTodos === "object"
      ? (value.weeklyTodos as Record<string, unknown>)
      : {};
  for (const [week, tasks] of Object.entries(rawWeeklyTodos)) {
    if (!Array.isArray(tasks)) continue;
    weeklyTodos[week] = tasks
      .filter((task): task is Partial<WeeklyTask> => Boolean(task) && typeof task === "object")
      .map(normalizeWeeklyTask)
      .filter((task) => task.text);
  }
  const rawAwesomeRecords =
    value.awesomeRecords && typeof value.awesomeRecords === "object"
      ? (value.awesomeRecords as Record<string, unknown>)
      : {};
  for (const [day, records] of Object.entries(rawAwesomeRecords)) {
    if (!Array.isArray(records)) continue;
    awesomeRecords[day] = records
      .filter((record): record is Partial<AwesomeRecord> => Boolean(record) && typeof record === "object")
      .map(normalizeAwesomeRecord)
      .filter((record) => record.text);
  }
  const rawMonthlyTodos =
    value.monthlyTodos && typeof value.monthlyTodos === "object"
      ? (value.monthlyTodos as Record<string, unknown>)
      : {};
  for (const [month, tasks] of Object.entries(rawMonthlyTodos)) {
    if (!Array.isArray(tasks)) continue;
    monthlyTodos[month] = tasks
      .filter((task): task is Partial<MonthlyTask> => Boolean(task) && typeof task === "object")
      .map(normalizeMonthlyTask)
      .filter((task) => task.text);
  }
  const rawDeliveries = Array.isArray(value.deliveries)
    ? value.deliveries
    : migrateLegacyWeeklyDeliveries(value.weeklyDeliveries);
  deliveries.push(
    ...rawDeliveries
      .filter((delivery): delivery is Partial<DeliveryRecord> => Boolean(delivery) && typeof delivery === "object")
      .map(normalizeDelivery)
      .filter((delivery) => delivery.name && delivery.platform),
  );
  const rawHabits = Array.isArray(value.habits) ? (value.habits as unknown[]) : [];
  habits.push(
    ...rawHabits
      .filter((habit): habit is Partial<Habit> => Boolean(habit) && typeof habit === "object")
      .map((habit) => normalizeHabit(habit, () => crypto.randomUUID(), nowStamp))
      .filter((habit) => habit.name),
  );
  const rawHabitChecks =
    value.habitChecks && typeof value.habitChecks === "object"
      ? (value.habitChecks as Record<string, unknown>)
      : {};
  for (const [day, checks] of Object.entries(rawHabitChecks)) {
    if (!checks || typeof checks !== "object" || Array.isArray(checks)) continue;
    const dayChecks: Record<string, boolean> = {};
    for (const [habitId, checked] of Object.entries(checks as Record<string, unknown>)) {
      if (habitId && typeof checked === "boolean") dayChecks[habitId] = checked;
    }
    if (Object.keys(dayChecks).length) habitChecks[day] = dayChecks;
  }
  return {
    version: DATA_VERSION,
    todos,
    weeklyTodos,
    awesomeRecords,
    monthlyTodos,
    deliveries,
    habits,
    habitChecks,
    inspirations,
    metaLearningAbilities,
    videoInspirations,
    videoNotes,
    workExperiences,
    dailyReadings,
    argumentReflections,
    divorcePlans,
    books,
    kindnessRecords,
    studyGrowthRecords,
    skincareProducts,
    rewardRules,
    rewardClaims,
    learnedContents,
    default_applied: Array.isArray(value.default_applied)
      ? value.default_applied.filter((day): day is string => typeof day === "string")
      : [],
  };
}

function hasTasks(data: TodoData): boolean {
  return (
    Object.values(data.todos).some((tasks) => tasks.length > 0) ||
    Object.values(data.weeklyTodos).some((tasks) => tasks.length > 0) ||
    Object.values(data.awesomeRecords).some((records) => records.length > 0) ||
    Object.values(data.monthlyTodos).some((tasks) => tasks.length > 0) ||
    data.deliveries.length > 0 ||
    data.habits.length > 0 ||
    Object.values(data.habitChecks).some((checks) => Object.values(checks).some(Boolean)) ||
    data.inspirations.length > 0 ||
    data.metaLearningAbilities.length > 0 ||
    data.videoInspirations.length > 0 ||
    data.videoNotes.length > 0 ||
    data.workExperiences.length > 0 ||
    data.dailyReadings.length > 0 ||
    data.argumentReflections.length > 0 ||
    data.divorcePlans.length > 0 ||
    data.books.length > 0 ||
    data.kindnessRecords.length > 0 ||
    data.studyGrowthRecords.length > 0 ||
    data.skincareProducts.length > 0 ||
    data.rewardRules.length > 0 ||
    data.rewardClaims.length > 0 ||
    data.learnedContents.length > 0
  );
}

function normalizeTask(task: Partial<TodoTask> & { done?: boolean }): TodoTask {
  const status = typeof task.status === "number" ? task.status : task.done ? STATUS_DONE : STATUS_TODO;
  return {
    id: typeof task.id === "string" ? task.id : crypto.randomUUID(),
    text: typeof task.text === "string" ? task.text.trim() : "",
    status: status === 0 || status === 1 || status === 2 ? status : STATUS_TODO,
    priority: normalizePriority(task.priority),
    created_at: typeof task.created_at === "string" ? task.created_at : nowStamp(),
    done_at: typeof task.done_at === "string" ? task.done_at : null,
    description: typeof task.description === "string" ? task.description : "",
    tag: normalizeTag(task.tag),
  };
}

function normalizeWeeklyTask(task: Partial<WeeklyTask>): WeeklyTask {
  const done = task.done === true;
  return {
    id: typeof task.id === "string" ? task.id : crypto.randomUUID(),
    text: typeof task.text === "string" ? task.text.trim() : "",
    done,
    created_at: typeof task.created_at === "string" ? task.created_at : nowStamp(),
    done_at: typeof task.done_at === "string" ? task.done_at : done ? nowStamp() : null,
  };
}

function normalizeAwesomeRecord(record: Partial<AwesomeRecord>): AwesomeRecord {
  return {
    id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
    text: typeof record.text === "string" ? record.text.trim() : "",
    created_at: typeof record.created_at === "string" ? record.created_at : nowStamp(),
  };
}

function normalizeMonthlyTask(task: Partial<MonthlyTask>): MonthlyTask {
  const done = task.done === true;
  return {
    id: typeof task.id === "string" ? task.id : crypto.randomUUID(),
    text: typeof task.text === "string" ? task.text.trim() : "",
    description: typeof task.description === "string" ? task.description : "",
    done,
    created_at: typeof task.created_at === "string" ? task.created_at : nowStamp(),
    done_at: typeof task.done_at === "string" ? task.done_at : done ? nowStamp() : null,
  };
}

function normalizeDelivery(delivery: Partial<DeliveryRecord>): DeliveryRecord {
  const picked = delivery.picked === true;
  return {
    id: typeof delivery.id === "string" ? delivery.id : crypto.randomUUID(),
    sequence: normalizeDeliverySequence(delivery.sequence),
    name: typeof delivery.name === "string" ? delivery.name.trim() : "",
    platform: typeof delivery.platform === "string" ? delivery.platform.trim() : "",
    note: typeof delivery.note === "string" ? delivery.note : "",
    purchased_at: typeof delivery.purchased_at === "string" ? delivery.purchased_at : "",
    picked,
    created_at: typeof delivery.created_at === "string" ? delivery.created_at : nowStamp(),
    picked_at: typeof delivery.picked_at === "string" ? delivery.picked_at : picked ? nowStamp() : null,
  };
}

function normalizePriority(priority: unknown): Priority {
  return priority === "high" || priority === "low" || priority === "medium" ? priority : "medium";
}

function normalizeTag(tag: unknown): TagId {
  return typeof tag === "number" && Number.isInteger(tag) && tag >= 0 ? tag : 0;
}

function getSaveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return `项目文件保存失败：${error.message}`;
  }
  return "项目文件保存失败：本地后端可能未启动";
}

const initialPrefs: AppPrefs = {
  theme: "light",
  tags: TAGS,
  defaultTasks: DEFAULT_TASKS,
  deliveryPlatforms: DELIVERY_PLATFORMS,
};

export function normalizePrefs(raw: unknown): AppPrefs {
  if (!raw || typeof raw !== "object") return initialPrefs;
  const value = raw as Partial<AppPrefs>;
  return {
    theme: value.theme === "dark" ? "dark" : "light",
    tags: normalizeTags(value.tags),
    defaultTasks: normalizeDefaultTasks(value.defaultTasks),
    deliveryPlatforms: normalizeDeliveryPlatforms(value.deliveryPlatforms),
  };
}

function normalizeTags(tags: unknown): TodoTag[] {
  if (!Array.isArray(tags)) return TAGS;
  const normalized = tags
    .filter((tag): tag is Partial<TodoTag> => Boolean(tag) && typeof tag === "object")
    .map((tag) => ({
      id: normalizeTag(tag.id),
      name: typeof tag.name === "string" && tag.name.trim() ? tag.name.trim() : "未命名",
      tone: normalizeTone(tag.tone),
    }));
  const deduped = normalized.filter((tag, index, list) => list.findIndex((item) => item.id === tag.id) === index);
  if (!deduped.some((tag) => tag.id === 0)) {
    deduped.unshift(TAGS[0]);
  }
  return deduped;
}

function normalizeDefaultTasks(tasks: unknown): DefaultTask[] {
  if (!Array.isArray(tasks)) return DEFAULT_TASKS;
  return tasks
    .filter((task): task is Partial<DefaultTask> => Boolean(task) && typeof task === "object")
    .map((task) => ({
      text: typeof task.text === "string" ? task.text.trim() : "",
      tag: normalizeTag(task.tag),
      priority: normalizePriority(task.priority),
    }))
    .filter((task) => task.text);
}

function normalizeTone(tone: unknown): TagTone {
  return tone === "green" || tone === "blue" || tone === "amber" || tone === "neutral" ? tone : "neutral";
}
