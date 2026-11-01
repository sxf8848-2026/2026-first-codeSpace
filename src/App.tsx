import { type DragEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import {
  AwesomePanel,
  ArgumentReflectionPanel,
  DivorcePlanPanel,
  AppView,
  BooksPanel,
  DailyCategoryPanel,
  DashboardPanel,
  DailyReadingPanel,
  HabitPanel,
  InspirationPanel,
  KindnessRecordsPanel,
  StudyGrowthPanel,
  SkincarePanel,
  RewardPanel,
  LearnedContentsPanel,
  LoadingScreen,
  MetaLearningPanel,
  MonthlyPanel,
  Sidebar,
  SummaryBand,
  TaskComposer,
  TaskToolbar,
  VideoInspirationPanel,
  VideoNotesPanel,
  WorkExperiencePanel,
  DeliveryPanel,
  WeeklyPanel,
  WorkspaceHeader,
} from "./components/AppSections";
import { EditDialog, HistoryDialog, SettingsDialog } from "./components/dialogs";
import { TaskRow } from "./components/TaskRow";
import { DATA_VERSION } from "./constants";
import { addDays, dateKey, formatWeekRange, fromDateKey, fromMonthKey, monthKey, nowStamp, weekKey } from "./date";
import { useDataHistory } from "./hooks/useDataHistory";
import {
  applyDefaultTasks,
  createAwesomeRecord,
  createHabit,
  createDailyReading,
  createArgumentReflection,
  createDivorcePlan,
  createBook,
  createKindnessRecord,
  createStudyGrowthRecord,
  createSkincareProduct,
  createRewardRule,
  createLearnedContent,
  createInspiration,
  createMetaLearningAbility,
  createMonthlyTask,
  createTask,
  createVideoInspiration,
  createVideoNote,
  createDelivery,
  createWeeklyTask,
  createWorkExperience,
  loadDataFromProject,
  loadPrefs,
  loadPrefsFromProject,
  saveDataToProject,
  savePrefsToProject,
  seedToday,
} from "./services/storage";
import { getHabitCompletion, getHabitViews, setHabitCheckForDay, toggleHabitCheckForDay } from "./services/habits";
import { getDailyHistoryEntries, getMonthlyHistoryEntries } from "./services/history";
import { getVisibleInspirations } from "./services/inspirations";
import {
  getVisibleDailyReadings,
  reorderDailyReadings,
} from "./services/dailyReadings";
import { getVisibleMetaLearningAbilities, MetaLearningMasteryFilter } from "./services/metaLearning";
import {
  getVideoInspirationChannels,
  getVisibleVideoInspirations,
  VideoInspirationChannelFilter,
} from "./services/videoInspirations";
import { getVisibleVideoNotes } from "./services/videoNotes";
import { getVisibleWorkExperiences, getWorkExperienceMonths, WorkExperienceMonthFilter } from "./services/workExperiences";
import { getVisibleArgumentReflections } from "./services/argumentReflections";
import { getVisibleDivorcePlans } from "./services/divorcePlans";
import { BookStatusFilter, getVisibleBooks } from "./services/books";
import { getVisibleKindnessRecords } from "./services/kindnessRecords";
import { getVisibleStudyGrowthRecords, updateStudyGrowthRecord } from "./services/studyGrowthRecords";
import { studyGrowthMarkdownToPlainText } from "./services/studyGrowthMarkdown";
import { getVisibleSkincareProducts, SkincareCategoryFilter } from "./services/skincareProducts";
import {
  applyRewardClaim,
  canClaimReward,
  getEffectiveRewardPeriod,
  getRewardClaimMonths,
  getRewardPeriodKey,
  getRewardTotals,
  getVisibleRewardClaims,
  getVisibleRewardRules,
  isRewardBackfillDateAllowed,
  isWeeklyRewardBackfillAllowed,
  prependRewardRule,
  reorderRewardRules,
  RewardRuleStatusFilter,
  toggleRewardRuleStatus,
} from "./services/rewards";
import { findDeliveryBySequence, getDeliveryStatusColumns } from "./services/deliveries";
import {
  getLearnedContentMonths,
  getLearnedContentStats,
  getVisibleLearnedContents,
  LearnedContentMonthFilter,
  LearnedContentTypeFilter,
} from "./services/learnedContents";
import {
  canReorderDailyTasks,
  moveDailyTaskBeforeWithinStatus,
  moveDailyTaskWithinStatus,
  sortDailyTasksByStatus,
} from "./services/dailyTasks";
import {
  Filters,
  AppPrefs,
  DefaultTask,
  MonthlyTask,
  STATUS_DONE,
  STATUS_IN_PROGRESS,
  STATUS_TODO,
  StatusFilter,
  TagFilter,
  TagId,
  TaskDraft,
  TaskStatus,
  TodoData,
  TodoTag,
  TodoTask,
  VideoInspirationRecord,
  VideoNoteRecord,
  DeliveryRecord,
  DeliveryStatus,
  WeeklyTask,
  AwesomeRecord,
  Habit,
  InspirationRecord,
  MetaLearningAbility,
  MetaLearningMastery,
  WorkExperienceRecord,
  DailyReadingRecord,
  ArgumentReflectionRecord,
  DivorcePlanRecord,
  BookRecord,
  KindnessRecord,
  StudyGrowthRecord,
  StudyGrowthTitleSize,
  StudyGrowthType,
  SkincareCategory,
  SkincareProductRecord,
  RewardRuleRecord,
  RewardRuleMode,
  RewardRulePeriod,
  RewardClaimRecord,
  RewardTier,
  LearnedContentRecord,
  LearnedContentType,
} from "./types";

const blankDraft: TaskDraft = {
  text: "",
  status: STATUS_TODO,
  tag: 0,
  priority: "medium",
  description: "",
};

type ProjectSaveStatus = {
  state: "idle" | "saved" | "fallback";
  message: string;
};

type EditingTaskState = {
  day: string;
  task: TodoTask;
};

type BookDraft = {
  title: string;
  author: string;
  note: string;
  status: BookRecord["status"];
};

const blankBookDraft: BookDraft = { title: "", author: "", note: "", status: "want_to_read" };

type VideoInspirationDraft = {
  channel: string;
  title: string;
  content: string;
  url: string;
};

const blankVideoInspirationDraft: VideoInspirationDraft = {
  channel: "",
  title: "",
  content: "",
  url: "",
};

type VideoNoteDraft = {
  title: string;
  quote: string;
  reflection: string;
  source: string;
  url: string;
};

const blankVideoNoteDraft: VideoNoteDraft = {
  title: "",
  quote: "",
  reflection: "",
  source: "",
  url: "",
};

type HabitDraft = {
  name: string;
  note: string;
};

const blankHabitDraft: HabitDraft = {
  name: "",
  note: "",
};

type MetaLearningDraft = {
  name: string;
  summary: string;
  usage: string;
  mastery: MetaLearningMastery;
};

const blankMetaLearningDraft: MetaLearningDraft = {
  name: "",
  summary: "",
  usage: "",
  mastery: "learning",
};

type ArgumentReflectionDraft = {
  topic: string;
  occurred_at: string;
  content: string;
};

type DivorcePlanDraft = {
  title: string;
  occurred_at: string;
  content: string;
};

type KindnessDraft = {
  title: string;
  occurred_at: string;
  content: string;
};

type StudyGrowthDraft = {
  title: string;
  title_size: StudyGrowthTitleSize;
  content: string;
  content_markdown: string;
  source: string;
};

type StudyGrowthEditDraft = StudyGrowthDraft & {
  type: StudyGrowthType;
};

const blankStudyGrowthDraft: StudyGrowthDraft = { title: "", title_size: 22, content: "", content_markdown: "", source: "" };
const blankStudyGrowthEditDraft: StudyGrowthEditDraft = { ...blankStudyGrowthDraft, type: "method" };

type SkincareDraft = { name: string; brand: string; category: SkincareCategory; description: string };
type RewardTierDraft = { name: string; amount: string };
type RewardRuleDraft = { name: string; mode: RewardRuleMode; period: RewardRulePeriod; amount: string; tiers: RewardTierDraft[]; description: string };
type LearnedContentDraft = { type: LearnedContentType; title: string; completed_on: string; source: string; url: string; takeaway: string };

const blankSkincareDraft: SkincareDraft = { name: "", brand: "", category: "cleanser", description: "" };

function createBlankRewardRuleDraft(): RewardRuleDraft {
  return { name: "", mode: "fixed", period: "daily", amount: "", tiers: [{ name: "", amount: "" }, { name: "", amount: "" }], description: "" };
}

function createBlankLearnedContentDraft(): LearnedContentDraft {
  return { type: "article", title: "", completed_on: dateKey(new Date()), source: "", url: "", takeaway: "" };
}

function createBlankArgumentReflectionDraft(): ArgumentReflectionDraft {
  return {
    topic: "",
    occurred_at: toLocalDateTime(new Date()),
    content: "",
  };
}

function createBlankDivorcePlanDraft(): DivorcePlanDraft {
  return {
    title: "",
    occurred_at: toLocalDateTime(new Date()),
    content: "",
  };
}

function createBlankKindnessDraft(): KindnessDraft {
  return {
    title: "",
    occurred_at: toLocalDateTime(new Date()),
    content: "",
  };
}

export function App() {
  const [data, setData] = useState<TodoData | null>(null);
  const [prefs, setPrefs] = useState<AppPrefs>(() => loadPrefs());
  const [storageReady, setStorageReady] = useState(false);
  const [projectSaveStatus, setProjectSaveStatus] = useState<ProjectSaveStatus>({
    state: "idle",
    message: "正在连接项目文件存储",
  });
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [habitDate, setHabitDate] = useState(() => new Date());
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [draft, setDraft] = useState<TaskDraft>(blankDraft);
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    priority: "all",
    tag: -1,
    query: "",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [weeklyDraft, setWeeklyDraft] = useState("");
  const [editingWeeklyTaskId, setEditingWeeklyTaskId] = useState<string | null>(null);
  const [weeklyEditText, setWeeklyEditText] = useState("");
  const [awesomeDraft, setAwesomeDraft] = useState("");
  const [editingAwesomeRecordId, setEditingAwesomeRecordId] = useState<string | null>(null);
  const [awesomeEditText, setAwesomeEditText] = useState("");
  const [monthlyDraft, setMonthlyDraft] = useState({ text: "", description: "" });
  const [editingMonthlyTaskId, setEditingMonthlyTaskId] = useState<string | null>(null);
  const [monthlyEditDraft, setMonthlyEditDraft] = useState({ text: "", description: "" });
  const [deliveryDraft, setDeliveryDraft] = useState({ sequence: "", name: "", platform: "", note: "", purchased_at: "" });
  const [deliveryQuery, setDeliveryQuery] = useState("");
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null);
  const [deliveryEditDraft, setDeliveryEditDraft] = useState({ sequence: "", name: "", platform: "", note: "", purchased_at: "" });
  const [habitDraft, setHabitDraft] = useState<HabitDraft>(blankHabitDraft);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [habitEditDraft, setHabitEditDraft] = useState<HabitDraft>(blankHabitDraft);
  const [inspirationDraft, setInspirationDraft] = useState({ title: "", body: "" });
  const [inspirationQuery, setInspirationQuery] = useState("");
  const [editingInspirationId, setEditingInspirationId] = useState<string | null>(null);
  const [inspirationEditDraft, setInspirationEditDraft] = useState({ title: "", body: "" });
  const [dailyReadingDraft, setDailyReadingDraft] = useState({ title: "", body: "", source: "" });
  const [dailyReadingQuery, setDailyReadingQuery] = useState("");
  const [editingDailyReadingId, setEditingDailyReadingId] = useState<string | null>(null);
  const [dailyReadingEditDraft, setDailyReadingEditDraft] = useState({ title: "", body: "", source: "", sortOrder: "" });
  const [argumentReflectionDraft, setArgumentReflectionDraft] = useState<ArgumentReflectionDraft>(createBlankArgumentReflectionDraft);
  const [argumentReflectionQuery, setArgumentReflectionQuery] = useState("");
  const [editingArgumentReflectionId, setEditingArgumentReflectionId] = useState<string | null>(null);
  const [argumentReflectionEditDraft, setArgumentReflectionEditDraft] = useState<ArgumentReflectionDraft>(createBlankArgumentReflectionDraft);
  const [divorcePlanDraft, setDivorcePlanDraft] = useState<DivorcePlanDraft>(createBlankDivorcePlanDraft);
  const [divorcePlanQuery, setDivorcePlanQuery] = useState("");
  const [editingDivorcePlanId, setEditingDivorcePlanId] = useState<string | null>(null);
  const [divorcePlanEditDraft, setDivorcePlanEditDraft] = useState<DivorcePlanDraft>(createBlankDivorcePlanDraft);
  const [bookDraft, setBookDraft] = useState<BookDraft>(blankBookDraft);
  const [bookQuery, setBookQuery] = useState("");
  const [bookStatusFilter, setBookStatusFilter] = useState<BookStatusFilter>("all");
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookEditDraft, setBookEditDraft] = useState<BookDraft>(blankBookDraft);
  const [kindnessDraft, setKindnessDraft] = useState<KindnessDraft>(createBlankKindnessDraft);
  const [kindnessQuery, setKindnessQuery] = useState("");
  const [kindnessStartDate, setKindnessStartDate] = useState("");
  const [kindnessEndDate, setKindnessEndDate] = useState("");
  const [editingKindnessId, setEditingKindnessId] = useState<string | null>(null);
  const [kindnessEditDraft, setKindnessEditDraft] = useState<KindnessDraft>(createBlankKindnessDraft);
  const [studyGrowthType, setStudyGrowthType] = useState<StudyGrowthType>("method");
  const [studyGrowthDraft, setStudyGrowthDraft] = useState<StudyGrowthDraft>(blankStudyGrowthDraft);
  const [studyGrowthQuery, setStudyGrowthQuery] = useState("");
  const [editingStudyGrowthId, setEditingStudyGrowthId] = useState<string | null>(null);
  const [studyGrowthEditDraft, setStudyGrowthEditDraft] = useState<StudyGrowthEditDraft>(blankStudyGrowthEditDraft);
  const [skincareDraft, setSkincareDraft] = useState<SkincareDraft>(blankSkincareDraft);
  const [skincareQuery, setSkincareQuery] = useState("");
  const [skincareCategoryFilter, setSkincareCategoryFilter] = useState<SkincareCategoryFilter>("all");
  const [editingSkincareId, setEditingSkincareId] = useState<string | null>(null);
  const [skincareEditDraft, setSkincareEditDraft] = useState<SkincareDraft>(blankSkincareDraft);
  const [rewardRuleDraft, setRewardRuleDraft] = useState<RewardRuleDraft>(createBlankRewardRuleDraft);
  const [rewardRuleQuery, setRewardRuleQuery] = useState("");
  const [rewardRuleStatusFilter, setRewardRuleStatusFilter] = useState<RewardRuleStatusFilter>("active");
  const [editingRewardRuleId, setEditingRewardRuleId] = useState<string | null>(null);
  const [rewardRuleEditDraft, setRewardRuleEditDraft] = useState<RewardRuleDraft>(createBlankRewardRuleDraft);
  const [rewardClaimQuery, setRewardClaimQuery] = useState("");
  const [rewardClaimMonthFilter, setRewardClaimMonthFilter] = useState("all");
  const [learnedContentDraft, setLearnedContentDraft] = useState<LearnedContentDraft>(createBlankLearnedContentDraft);
  const [learnedContentQuery, setLearnedContentQuery] = useState("");
  const [learnedContentTypeFilter, setLearnedContentTypeFilter] = useState<LearnedContentTypeFilter>("all");
  const [learnedContentMonthFilter, setLearnedContentMonthFilter] = useState<LearnedContentMonthFilter>("all");
  const [editingLearnedContentId, setEditingLearnedContentId] = useState<string | null>(null);
  const [learnedContentEditDraft, setLearnedContentEditDraft] = useState<LearnedContentDraft>(createBlankLearnedContentDraft);
  const [videoInspirationDraft, setVideoInspirationDraft] = useState<VideoInspirationDraft>(blankVideoInspirationDraft);
  const [videoInspirationQuery, setVideoInspirationQuery] = useState("");
  const [videoInspirationChannelFilter, setVideoInspirationChannelFilter] = useState<VideoInspirationChannelFilter>("all");
  const [editingVideoInspirationId, setEditingVideoInspirationId] = useState<string | null>(null);
  const [videoInspirationEditDraft, setVideoInspirationEditDraft] = useState<VideoInspirationDraft>(blankVideoInspirationDraft);
  const [videoNoteDraft, setVideoNoteDraft] = useState<VideoNoteDraft>(blankVideoNoteDraft);
  const [videoNoteQuery, setVideoNoteQuery] = useState("");
  const [editingVideoNoteId, setEditingVideoNoteId] = useState<string | null>(null);
  const [videoNoteEditDraft, setVideoNoteEditDraft] = useState<VideoNoteDraft>(blankVideoNoteDraft);
  const [metaLearningDraft, setMetaLearningDraft] = useState<MetaLearningDraft>(blankMetaLearningDraft);
  const [metaLearningQuery, setMetaLearningQuery] = useState("");
  const [metaLearningMasteryFilter, setMetaLearningMasteryFilter] = useState<MetaLearningMasteryFilter>("all");
  const [editingMetaLearningId, setEditingMetaLearningId] = useState<string | null>(null);
  const [metaLearningEditDraft, setMetaLearningEditDraft] = useState<MetaLearningDraft>(blankMetaLearningDraft);
  const [workExperienceDraft, setWorkExperienceDraft] = useState(() => ({ title: "", body: "", month: monthKey(new Date()) }));
  const [workExperienceQuery, setWorkExperienceQuery] = useState("");
  const [workExperienceMonthFilter, setWorkExperienceMonthFilter] = useState<WorkExperienceMonthFilter>("all");
  const [editingWorkExperienceId, setEditingWorkExperienceId] = useState<string | null>(null);
  const [workExperienceEditDraft, setWorkExperienceEditDraft] = useState(() => ({ title: "", body: "", month: monthKey(new Date()) }));
  const [editingTask, setEditingTask] = useState<EditingTaskState | null>(null);
  const [showDailyHistory, setShowDailyHistory] = useState(false);
  const [showMonthlyHistory, setShowMonthlyHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dataHistory = useDataHistory();

  const theme = prefs.theme;
  const tags = prefs.tags;
  const defaultTasks = prefs.defaultTasks;
  const deliveryPlatforms = prefs.deliveryPlatforms;
  const currentDay = dateKey(currentDate);
  const currentWeek = weekKey(currentDate);
  const currentMonth = monthKey(currentDate);
  const todayDate = new Date();
  const todayDay = dateKey(todayDate);
  const habitDay = dateKey(habitDate);
  const todayMonth = monthKey(todayDate);
  const activeData = data ?? emptyData;
  const allTasks = activeData.todos[currentDay] ?? [];
  const todayTasks = activeData.todos[todayDay] ?? [];
  const weeklyTasks = activeData.weeklyTodos[currentWeek] ?? [];
  const awesomeRecords = activeData.awesomeRecords[currentDay] ?? [];
  const monthlyTasks = activeData.monthlyTodos[currentMonth] ?? [];
  const todayMonthlyTasks = activeData.monthlyTodos[todayMonth] ?? [];
  const deliveryTasks = activeData.deliveries;
  const weekRange = formatWeekRange(currentDate);
  const visibleTasks = useMemo(
    () => sortDailyTasksByStatus(allTasks.filter((task) => matchesFilters(task, filters))),
    [allTasks, filters],
  );
  const deliveryStatusColumns = useMemo(
    () => getDeliveryStatusColumns(deliveryTasks, deliveryQuery),
    [deliveryTasks, deliveryQuery],
  );
  const doneCount = allTasks.filter((task) => task.status === STATUS_DONE).length;
  const progress = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;
  const pendingDeliveryCount = deliveryTasks.filter((task) => task.status === "pending").length;
  const todayDoneCount = todayTasks.filter((task) => task.status === STATUS_DONE).length;
  const todayProgress = todayTasks.length ? Math.round((todayDoneCount / todayTasks.length) * 100) : 0;
  const todayInProgressCount = todayTasks.filter((task) => task.status === STATUS_IN_PROGRESS).length;
  const todayOpenMonthlyCount = todayMonthlyTasks.filter((task) => !task.done).length;
  const activeHabits = useMemo(() => activeData.habits.filter((habit) => !habit.archived_at), [activeData.habits]);
  const habitViews = useMemo(() => getHabitViews(activeData.habits, activeData.habitChecks, habitDay), [activeData.habits, activeData.habitChecks, habitDay]);
  const todayHabitCompletion = useMemo(
    () => getHabitCompletion(activeData.habits, activeData.habitChecks, todayDay),
    [activeData.habits, activeData.habitChecks, todayDay],
  );
  const canEditHabitDay = habitDay <= todayDay;
  const dashboardTasks = useMemo(
    () => todayTasks.filter((task) => task.status !== STATUS_DONE).slice(0, 6),
    [todayTasks],
  );
  const visibleInspirations = useMemo(
    () => getVisibleInspirations(activeData.inspirations, inspirationQuery),
    [activeData.inspirations, inspirationQuery],
  );
  const visibleDailyReadings = useMemo(
    () => getVisibleDailyReadings(activeData.dailyReadings, dailyReadingQuery),
    [activeData.dailyReadings, dailyReadingQuery],
  );
  const visibleArgumentReflections = useMemo(
    () => getVisibleArgumentReflections(activeData.argumentReflections, argumentReflectionQuery),
    [activeData.argumentReflections, argumentReflectionQuery],
  );
  const visibleDivorcePlans = useMemo(
    () => getVisibleDivorcePlans(activeData.divorcePlans, divorcePlanQuery),
    [activeData.divorcePlans, divorcePlanQuery],
  );
  const visibleBooks = useMemo(
    () => getVisibleBooks(activeData.books, bookQuery, bookStatusFilter),
    [activeData.books, bookQuery, bookStatusFilter],
  );
  const visibleKindnessRecords = useMemo(
    () => getVisibleKindnessRecords(activeData.kindnessRecords, kindnessQuery, kindnessStartDate, kindnessEndDate),
    [activeData.kindnessRecords, kindnessEndDate, kindnessQuery, kindnessStartDate],
  );
  const visibleStudyGrowthRecords = useMemo(
    () => getVisibleStudyGrowthRecords(activeData.studyGrowthRecords, studyGrowthType, studyGrowthQuery),
    [activeData.studyGrowthRecords, studyGrowthQuery, studyGrowthType],
  );
  const studyGrowthTypeCount = useMemo(
    () => activeData.studyGrowthRecords.filter((record) => record.type === studyGrowthType).length,
    [activeData.studyGrowthRecords, studyGrowthType],
  );
  const visibleSkincareProducts = useMemo(
    () => getVisibleSkincareProducts(activeData.skincareProducts, skincareQuery, skincareCategoryFilter),
    [activeData.skincareProducts, skincareCategoryFilter, skincareQuery],
  );
  const visibleRewardRules = useMemo(
    () => getVisibleRewardRules(activeData.rewardRules, rewardRuleQuery, rewardRuleStatusFilter),
    [activeData.rewardRules, rewardRuleQuery, rewardRuleStatusFilter],
  );
  const visibleRewardClaims = useMemo(
    () => getVisibleRewardClaims(activeData.rewardClaims, rewardClaimQuery, rewardClaimMonthFilter),
    [activeData.rewardClaims, rewardClaimMonthFilter, rewardClaimQuery],
  );
  const rewardClaimMonths = useMemo(() => getRewardClaimMonths(activeData.rewardClaims), [activeData.rewardClaims]);
  const rewardTotals = useMemo(() => getRewardTotals(activeData.rewardClaims, todayMonth), [activeData.rewardClaims, todayMonth]);
  const currentRewardClaims = useMemo(() => {
    const claims = new Map<string, RewardClaimRecord>();
    activeData.rewardRules.forEach((rule) => {
      const periodKey = getRewardPeriodKey(rule, todayDay);
      const claim = activeData.rewardClaims.find((item) => item.rule_id === rule.id && item.reward_date === periodKey);
      if (claim) claims.set(rule.id, claim);
    });
    return claims;
  }, [activeData.rewardClaims, activeData.rewardRules, todayDay]);
  const visibleLearnedContents = useMemo(
    () => getVisibleLearnedContents(activeData.learnedContents, learnedContentQuery, learnedContentTypeFilter, learnedContentMonthFilter),
    [activeData.learnedContents, learnedContentMonthFilter, learnedContentQuery, learnedContentTypeFilter],
  );
  const learnedContentMonths = useMemo(() => getLearnedContentMonths(activeData.learnedContents), [activeData.learnedContents]);
  const learnedContentStats = useMemo(
    () => getLearnedContentStats(activeData.learnedContents, todayMonth),
    [activeData.learnedContents, todayMonth],
  );
  const videoInspirationChannels = useMemo(
    () => getVideoInspirationChannels(activeData.videoInspirations),
    [activeData.videoInspirations],
  );
  const visibleVideoInspirations = useMemo(
    () => getVisibleVideoInspirations(activeData.videoInspirations, videoInspirationQuery, videoInspirationChannelFilter),
    [activeData.videoInspirations, videoInspirationChannelFilter, videoInspirationQuery],
  );
  const visibleVideoNotes = useMemo(
    () => getVisibleVideoNotes(activeData.videoNotes, videoNoteQuery),
    [activeData.videoNotes, videoNoteQuery],
  );
  const visibleMetaLearningAbilities = useMemo(
    () => getVisibleMetaLearningAbilities(activeData.metaLearningAbilities, metaLearningQuery, metaLearningMasteryFilter),
    [activeData.metaLearningAbilities, metaLearningMasteryFilter, metaLearningQuery],
  );
  const workExperienceMonths = useMemo(() => getWorkExperienceMonths(activeData.workExperiences), [activeData.workExperiences]);
  const visibleWorkExperiences = useMemo(
    () => getVisibleWorkExperiences(activeData.workExperiences, workExperienceQuery, workExperienceMonthFilter),
    [activeData.workExperiences, workExperienceMonthFilter, workExperienceQuery],
  );
  const canUndo = dataHistory.canUndo;
  const canRedo = dataHistory.canRedo;
  const canDragTasks = isUnfilteredTaskView(filters);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (!storageReady) return;
    let cancelled = false;
    savePrefsToProject(prefs).then((result) => {
      if (cancelled) return;
      setProjectSaveStatus(
        result.ok
          ? { state: "saved", message: "已保存到项目文件" }
          : { state: "fallback", message: `${result.message}，当前仅暂存到浏览器本地` },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [prefs, storageReady, theme]);

  useEffect(() => {
    if (!storageReady || !data) return;
    let cancelled = false;
    saveDataToProject(data).then((result) => {
      if (cancelled) return;
      setProjectSaveStatus(
        result.ok
          ? { state: "saved", message: "已保存到项目文件" }
          : { state: "fallback", message: `${result.message}，当前仅暂存到浏览器本地` },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [data, storageReady]);

  useEffect(() => {
    if (canDragTasks) return;
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  }, [canDragTasks]);

  useEffect(() => {
    if (videoInspirationChannelFilter === "all" || videoInspirationChannels.includes(videoInspirationChannelFilter)) return;
    setVideoInspirationChannelFilter("all");
  }, [videoInspirationChannelFilter, videoInspirationChannels]);

  useEffect(() => {
    setEditingWeeklyTaskId(null);
    setWeeklyEditText("");
  }, [currentWeek]);

  useEffect(() => {
    setEditingAwesomeRecordId(null);
    setAwesomeEditText("");
  }, [currentDay]);

  useEffect(() => {
    setEditingMonthlyTaskId(null);
    setMonthlyEditDraft({ text: "", description: "" });
  }, [currentMonth]);

  useEffect(() => {
    setEditingHabitId(null);
    setHabitEditDraft(blankHabitDraft);
  }, [habitDay]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadDataFromProject(), loadPrefsFromProject()]).then(([projectData, projectPrefs]) => {
      if (cancelled) return;
      setData(seedToday(projectData, projectPrefs.defaultTasks));
      dataHistory.resetHistory();
      setPrefs(projectPrefs);
      setStorageReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateData(updater: (value: TodoData) => TodoData) {
    if (!data) return;
    const next = updater(data);
    if (next === data || JSON.stringify(next) === JSON.stringify(data)) return;
    dataHistory.pushHistory(data);
    setData(next);
  }

  function updatePrefs(updater: (value: AppPrefs) => AppPrefs) {
    setPrefs((value) => updater(value));
  }

  function undoData() {
    if (!data) return;
    dataHistory.undoData(data, (previous) => {
      setData(previous);
      setSelectedId(null);
      setEditingTask(null);
      setEditingWeeklyTaskId(null);
      setWeeklyEditText("");
      setEditingAwesomeRecordId(null);
      setAwesomeEditText("");
      setEditingMonthlyTaskId(null);
      setMonthlyEditDraft({ text: "", description: "" });
      setEditingDeliveryId(null);
      setDeliveryEditDraft({ sequence: "", name: "", platform: "", note: "", purchased_at: "" });
      setEditingHabitId(null);
      setHabitEditDraft(blankHabitDraft);
      setEditingInspirationId(null);
      setInspirationEditDraft({ title: "", body: "" });
      setEditingDailyReadingId(null);
      setDailyReadingEditDraft({ title: "", body: "", source: "", sortOrder: "" });
      setEditingArgumentReflectionId(null);
      setArgumentReflectionEditDraft(createBlankArgumentReflectionDraft());
      setEditingDivorcePlanId(null);
      setDivorcePlanEditDraft(createBlankDivorcePlanDraft());
      setEditingVideoInspirationId(null);
      setVideoInspirationEditDraft(blankVideoInspirationDraft);
      setEditingVideoNoteId(null);
      setVideoNoteEditDraft(blankVideoNoteDraft);
      setEditingMetaLearningId(null);
      setMetaLearningEditDraft(blankMetaLearningDraft);
      setEditingKindnessId(null);
      setKindnessEditDraft(createBlankKindnessDraft());
      setEditingStudyGrowthId(null);
      setStudyGrowthEditDraft(blankStudyGrowthEditDraft);
      setEditingSkincareId(null);
      setSkincareEditDraft(blankSkincareDraft);
      setEditingRewardRuleId(null);
      setRewardRuleEditDraft(createBlankRewardRuleDraft());
    });
  }

  function redoData() {
    if (!data) return;
    dataHistory.redoData(data, (next) => {
      setData(next);
      setSelectedId(null);
      setEditingTask(null);
      setEditingWeeklyTaskId(null);
      setWeeklyEditText("");
      setEditingAwesomeRecordId(null);
      setAwesomeEditText("");
      setEditingMonthlyTaskId(null);
      setMonthlyEditDraft({ text: "", description: "" });
      setEditingDeliveryId(null);
      setDeliveryEditDraft({ sequence: "", name: "", platform: "", note: "", purchased_at: "" });
      setEditingHabitId(null);
      setHabitEditDraft(blankHabitDraft);
      setEditingInspirationId(null);
      setInspirationEditDraft({ title: "", body: "" });
      setEditingDailyReadingId(null);
      setDailyReadingEditDraft({ title: "", body: "", source: "", sortOrder: "" });
      setEditingArgumentReflectionId(null);
      setArgumentReflectionEditDraft(createBlankArgumentReflectionDraft());
      setEditingDivorcePlanId(null);
      setDivorcePlanEditDraft(createBlankDivorcePlanDraft());
      setEditingVideoInspirationId(null);
      setVideoInspirationEditDraft(blankVideoInspirationDraft);
      setEditingVideoNoteId(null);
      setVideoNoteEditDraft(blankVideoNoteDraft);
      setEditingMetaLearningId(null);
      setMetaLearningEditDraft(blankMetaLearningDraft);
      setEditingKindnessId(null);
      setKindnessEditDraft(createBlankKindnessDraft());
      setEditingStudyGrowthId(null);
      setStudyGrowthEditDraft(blankStudyGrowthEditDraft);
      setEditingSkincareId(null);
      setSkincareEditDraft(blankSkincareDraft);
      setEditingRewardRuleId(null);
      setRewardRuleEditDraft(createBlankRewardRuleDraft());
    });
  }

  function changeView(view: AppView) {
    setActiveView(view);
    if (view === "dashboard") {
      updateData((value) => applyDefaultTasks(value, dateKey(new Date()), defaultTasks));
    }
    if (view === "daily") {
      updateData((value) => applyDefaultTasks(value, currentDay, defaultTasks));
    }
    if (view === "habits") {
      setHabitDate(new Date());
    }
  }

  function openTodayDaily() {
    const today = new Date();
    const nextDay = dateKey(today);
    setCurrentDate(today);
    setActiveView("daily");
    setSelectedId(null);
    updateData((value) => applyDefaultTasks(value, nextDay, defaultTasks));
  }

  function openTodayHabits() {
    setHabitDate(new Date());
    setActiveView("habits");
  }

  function setDay(nextDate: Date) {
    const nextDay = dateKey(nextDate);
    setCurrentDate(nextDate);
    setSelectedId(null);
    updateData((value) => applyDefaultTasks(value, nextDay, defaultTasks));
  }

  function setMonth(nextDate: Date) {
    if (Number.isNaN(nextDate.getTime())) return;
    setCurrentDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    setSelectedId(null);
  }

  function replaceTasks(day: string, tasks: TodoTask[]) {
    updateData((value) => {
      const todos = { ...value.todos };
      if (tasks.length) {
        todos[day] = tasks;
      } else {
        delete todos[day];
      }
      return { ...value, todos };
    });
  }

  function replaceWeeklyTasks(week: string, tasks: WeeklyTask[]) {
    updateData((value) => {
      const weeklyTodos = { ...value.weeklyTodos };
      if (tasks.length) {
        weeklyTodos[week] = tasks;
      } else {
        delete weeklyTodos[week];
      }
      return { ...value, weeklyTodos };
    });
  }

  function replaceAwesomeRecords(day: string, records: AwesomeRecord[]) {
    updateData((value) => {
      const awesomeRecords = { ...value.awesomeRecords };
      if (records.length) {
        awesomeRecords[day] = records;
      } else {
        delete awesomeRecords[day];
      }
      return { ...value, awesomeRecords };
    });
  }

  function replaceMonthlyTasks(month: string, tasks: MonthlyTask[]) {
    updateData((value) => {
      const monthlyTodos = { ...value.monthlyTodos };
      if (tasks.length) {
        monthlyTodos[month] = tasks;
      } else {
        delete monthlyTodos[month];
      }
      return { ...value, monthlyTodos };
    });
  }

  function replaceDeliveries(deliveries: DeliveryRecord[]) {
    updateData((value) => ({ ...value, deliveries }));
  }

  function replaceHabits(habits: Habit[]) {
    updateData((value) => ({ ...value, habits }));
  }

  function replaceInspirations(inspirations: InspirationRecord[]) {
    updateData((value) => ({ ...value, inspirations }));
  }

  function replaceDailyReadings(dailyReadings: DailyReadingRecord[]) {
    updateData((value) => ({ ...value, dailyReadings }));
  }

  function replaceArgumentReflections(argumentReflections: ArgumentReflectionRecord[]) {
    updateData((value) => ({ ...value, argumentReflections }));
  }

  function replaceDivorcePlans(divorcePlans: DivorcePlanRecord[]) {
    updateData((value) => ({ ...value, divorcePlans }));
  }

  function replaceBooks(books: BookRecord[]) {
    updateData((value) => ({ ...value, books }));
  }

  function replaceKindnessRecords(kindnessRecords: KindnessRecord[]) {
    updateData((value) => ({ ...value, kindnessRecords }));
  }

  function replaceStudyGrowthRecords(studyGrowthRecords: StudyGrowthRecord[]) {
    updateData((value) => ({ ...value, studyGrowthRecords }));
  }

  function replaceSkincareProducts(skincareProducts: SkincareProductRecord[]) {
    updateData((value) => ({ ...value, skincareProducts }));
  }

  function replaceRewardRules(rewardRules: RewardRuleRecord[]) {
    updateData((value) => ({ ...value, rewardRules }));
  }

  function replaceLearnedContents(learnedContents: LearnedContentRecord[]) {
    updateData((value) => ({ ...value, learnedContents }));
  }

  function replaceVideoInspirations(videoInspirations: VideoInspirationRecord[]) {
    updateData((value) => ({ ...value, videoInspirations }));
  }

  function replaceVideoNotes(videoNotes: VideoNoteRecord[]) {
    updateData((value) => ({ ...value, videoNotes }));
  }

  function replaceMetaLearningAbilities(metaLearningAbilities: MetaLearningAbility[]) {
    updateData((value) => ({ ...value, metaLearningAbilities }));
  }

  function replaceWorkExperiences(workExperiences: WorkExperienceRecord[]) {
    updateData((value) => ({ ...value, workExperiences }));
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!draft.text.trim()) return;
    const task = createTask(draft);
    replaceTasks(currentDay, [task, ...allTasks]);
    setSelectedId(task.id);
    setDraft(blankDraft);
  }

  function addWeeklyTask(event: FormEvent) {
    event.preventDefault();
    const text = weeklyDraft.trim();
    if (!text) return;
    replaceWeeklyTasks(currentWeek, [...weeklyTasks, createWeeklyTask(text)]);
    setWeeklyDraft("");
  }

  function toggleWeeklyTask(taskId: string) {
    replaceWeeklyTasks(
      currentWeek,
      weeklyTasks.map((task) => {
        if (task.id !== taskId) return task;
        const done = !task.done;
        return {
          ...task,
          done,
          done_at: done ? nowStamp() : null,
        };
      }),
    );
  }

  function startWeeklyEdit(task: WeeklyTask) {
    setEditingWeeklyTaskId(task.id);
    setWeeklyEditText(task.text);
  }

  function saveWeeklyEdit(taskId: string) {
    const text = weeklyEditText.trim();
    if (!text) return;
    replaceWeeklyTasks(
      currentWeek,
      weeklyTasks.map((task) => (task.id === taskId ? { ...task, text } : task)),
    );
    setEditingWeeklyTaskId(null);
    setWeeklyEditText("");
  }

  function deleteWeeklyTask(taskId: string) {
    const task = weeklyTasks.find((item) => item.id === taskId);
    if (!task) return;
    if (!window.confirm(`确定删除本周待办“${task.text}”吗？删除后可以用撤销恢复。`)) return;
    replaceWeeklyTasks(
      currentWeek,
      weeklyTasks.filter((item) => item.id !== taskId),
    );
    if (editingWeeklyTaskId === taskId) {
      setEditingWeeklyTaskId(null);
      setWeeklyEditText("");
    }
  }

  function addAwesomeRecord(event: FormEvent) {
    event.preventDefault();
    const text = awesomeDraft.trim();
    if (!text) return;
    replaceAwesomeRecords(currentDay, [createAwesomeRecord(text), ...awesomeRecords]);
    setAwesomeDraft("");
  }

  function startAwesomeEdit(record: AwesomeRecord) {
    setEditingAwesomeRecordId(record.id);
    setAwesomeEditText(record.text);
  }

  function saveAwesomeEdit(recordId: string) {
    const text = awesomeEditText.trim();
    if (!text) return;
    replaceAwesomeRecords(
      currentDay,
      awesomeRecords.map((record) => (record.id === recordId ? { ...record, text } : record)),
    );
    setEditingAwesomeRecordId(null);
    setAwesomeEditText("");
  }

  function deleteAwesomeRecord(recordId: string) {
    const record = awesomeRecords.find((item) => item.id === recordId);
    if (!record) return;
    if (!window.confirm(`确定删除真棒记录“${record.text}”吗？删除后可以用撤销恢复。`)) return;
    replaceAwesomeRecords(
      currentDay,
      awesomeRecords.filter((item) => item.id !== recordId),
    );
    if (editingAwesomeRecordId === recordId) {
      setEditingAwesomeRecordId(null);
      setAwesomeEditText("");
    }
  }

  function addMonthlyTask(event: FormEvent) {
    event.preventDefault();
    const text = monthlyDraft.text.trim();
    if (!text) return;
    replaceMonthlyTasks(currentMonth, [createMonthlyTask(text, monthlyDraft.description), ...monthlyTasks]);
    setMonthlyDraft({ text: "", description: "" });
  }

  function toggleMonthlyTask(taskId: string) {
    replaceMonthlyTasks(
      currentMonth,
      monthlyTasks.map((task) => {
        if (task.id !== taskId) return task;
        const done = !task.done;
        return {
          ...task,
          done,
          done_at: done ? nowStamp() : null,
        };
      }),
    );
  }

  function startMonthlyEdit(task: MonthlyTask) {
    setEditingMonthlyTaskId(task.id);
    setMonthlyEditDraft({ text: task.text, description: task.description });
  }

  function saveMonthlyEdit(taskId: string) {
    const text = monthlyEditDraft.text.trim();
    if (!text) return;
    replaceMonthlyTasks(
      currentMonth,
      monthlyTasks.map((task) =>
        task.id === taskId ? { ...task, text, description: monthlyEditDraft.description.trim() } : task,
      ),
    );
    setEditingMonthlyTaskId(null);
    setMonthlyEditDraft({ text: "", description: "" });
  }

  function deleteMonthlyTask(taskId: string) {
    const task = monthlyTasks.find((item) => item.id === taskId);
    if (!task) return;
    if (!window.confirm(`确定删除每月待办“${task.text}”吗？删除后可以用撤销恢复。`)) return;
    replaceMonthlyTasks(
      currentMonth,
      monthlyTasks.filter((item) => item.id !== taskId),
    );
    if (editingMonthlyTaskId === taskId) {
      setEditingMonthlyTaskId(null);
      setMonthlyEditDraft({ text: "", description: "" });
    }
  }

  function addDelivery(event: FormEvent) {
    event.preventDefault();
    const name = deliveryDraft.name.trim();
    const platform = deliveryDraft.platform.trim();
    const sequence = parseDeliverySequence(deliveryDraft.sequence);
    if (!name || !platform) return;
    if (sequence === null) {
      window.alert("快递序号只能填写非 0 整数。");
      return;
    }
    const conflict = findDeliveryBySequence(deliveryTasks, sequence);
    if (conflict) {
      window.alert(`序号 #${sequence} 已被快递“${conflict.name}”占用。`);
      return;
    }
    replaceDeliveries([createDelivery(name, platform, deliveryDraft.note, deliveryDraft.purchased_at, sequence), ...deliveryTasks]);
    setDeliveryDraft({ sequence: "", name: "", platform: "", note: "", purchased_at: "" });
  }

  function changeDeliveryStatus(deliveryId: string, status: DeliveryStatus) {
    replaceDeliveries(
      deliveryTasks.map((delivery) => {
        if (delivery.id !== deliveryId) return delivery;
        return {
          ...delivery,
          status,
          picked_at: status === "picked" ? (delivery.status === "picked" ? delivery.picked_at : nowStamp()) : null,
        };
      }),
    );
  }

  function addHabit(event: FormEvent) {
    event.preventDefault();
    if (!canEditHabitDay) return;
    const name = habitDraft.name.trim();
    if (!name) return;
    const existingHabit = activeHabits.find((habit) => habit.name.trim().toLowerCase() === name.toLowerCase());
    if (existingHabit) {
      updateData((value) => ({ ...value, habitChecks: setHabitCheckForDay(value.habitChecks, habitDay, existingHabit.id, todayDay, true) }));
      setHabitDraft(blankHabitDraft);
      return;
    }
    replaceHabits([createHabit(name, habitDraft.note), ...activeData.habits]);
    setHabitDraft(blankHabitDraft);
  }

  function startHabitEdit(habit: Habit) {
    setEditingHabitId(habit.id);
    setHabitEditDraft({ name: habit.name, note: habit.note });
  }

  function saveHabitEdit(habitId: string) {
    if (!canEditHabitDay) return;
    const name = habitEditDraft.name.trim();
    if (!name) return;
    replaceHabits(
      activeData.habits.map((habit) => (habit.id === habitId ? { ...habit, name, note: habitEditDraft.note.trim() } : habit)),
    );
    setEditingHabitId(null);
    setHabitEditDraft(blankHabitDraft);
  }

  function deleteHabit(habitId: string) {
    if (!canEditHabitDay) return;
    const habit = activeData.habits.find((item) => item.id === habitId);
    if (!habit) return;
    if (!window.confirm(`确定归档习惯“${habit.name}”吗？历史打卡记录会保留。`)) return;
    replaceHabits(activeData.habits.map((item) => (item.id === habitId ? { ...item, archived_at: nowStamp() } : item)));
    if (editingHabitId === habitId) {
      setEditingHabitId(null);
      setHabitEditDraft(blankHabitDraft);
    }
  }

  function toggleHabit(habitId: string) {
    if (!canEditHabitDay) return;
    updateData((value) => ({ ...value, habitChecks: toggleHabitCheckForDay(value.habitChecks, habitDay, habitId, todayDay) }));
  }

  function addInspiration(event: FormEvent) {
    event.preventDefault();
    const title = inspirationDraft.title.trim();
    if (!title) return;
    replaceInspirations([createInspiration(title, inspirationDraft.body), ...activeData.inspirations]);
    setInspirationDraft({ title: "", body: "" });
  }

  function startInspirationEdit(record: InspirationRecord) {
    setEditingInspirationId(record.id);
    setInspirationEditDraft({ title: record.title, body: record.body });
  }

  function saveInspirationEdit(recordId: string) {
    const title = inspirationEditDraft.title.trim();
    if (!title) return;
    replaceInspirations(
      activeData.inspirations.map((record) =>
        record.id === recordId ? { ...record, title, body: inspirationEditDraft.body.trim() } : record,
      ),
    );
    setEditingInspirationId(null);
    setInspirationEditDraft({ title: "", body: "" });
  }

  function toggleInspirationPinned(recordId: string) {
    replaceInspirations(
      activeData.inspirations.map((record) => (record.id === recordId ? { ...record, pinned: !record.pinned } : record)),
    );
  }

  function archiveInspiration(recordId: string) {
    const record = activeData.inspirations.find((item) => item.id === recordId);
    if (!record) return;
    if (!window.confirm(`确定归档灵感“${record.title}”吗？归档后列表不再显示，但数据会保留。`)) return;
    replaceInspirations(activeData.inspirations.map((item) => (item.id === recordId ? { ...item, archived_at: nowStamp() } : item)));
    if (editingInspirationId === recordId) {
      setEditingInspirationId(null);
      setInspirationEditDraft({ title: "", body: "" });
    }
  }

  function addDailyReading(event: FormEvent) {
    event.preventDefault();
    const title = dailyReadingDraft.title.trim();
    const body = dailyReadingDraft.body.trim();
    if (!title || !body) return;
    updateData((value) => {
      const record = createDailyReading(
        title,
        body,
        dailyReadingDraft.source,
        value.dailyReadings.filter((item) => !item.archived_at).length + 1,
      );
      return {
        ...value,
        dailyReadings: [...value.dailyReadings, record],
      };
    });
    setDailyReadingDraft({ title: "", body: "", source: "" });
  }

  function startDailyReadingEdit(record: DailyReadingRecord) {
    setEditingDailyReadingId(record.id);
    setDailyReadingEditDraft({ title: record.title, body: record.body, source: record.source, sortOrder: String(record.sort_order) });
  }

  function saveDailyReadingEdit(recordId: string) {
    const title = dailyReadingEditDraft.title.trim();
    const body = dailyReadingEditDraft.body.trim();
    if (!title || !body) return;
    const activeCount = activeData.dailyReadings.filter((record) => !record.archived_at).length;
    const targetPosition = Math.min(Math.max(Number.parseInt(dailyReadingEditDraft.sortOrder, 10) || 1, 1), activeCount);
    updateData((value) => ({
      ...value,
      dailyReadings: reorderDailyReadings(
        value.dailyReadings.map((record) =>
          record.id === recordId ? { ...record, title, body, source: dailyReadingEditDraft.source.trim() } : record,
        ),
        recordId,
        targetPosition,
      ),
    }));
    setEditingDailyReadingId(null);
    setDailyReadingEditDraft({ title: "", body: "", source: "", sortOrder: "" });
  }

  function archiveDailyReading(recordId: string) {
    const record = activeData.dailyReadings.find((item) => item.id === recordId);
    if (!record) return;
    if (!window.confirm(`确定归档必读文案“${record.title}”吗？归档后列表不再显示，但数据会保留。`)) return;
    updateData((value) => ({
      ...value,
      dailyReadings: value.dailyReadings.map((item) => (item.id === recordId ? { ...item, archived_at: nowStamp() } : item)),
    }));
    if (editingDailyReadingId === recordId) {
      setEditingDailyReadingId(null);
      setDailyReadingEditDraft({ title: "", body: "", source: "", sortOrder: "" });
    }
  }

  function addArgumentReflection(event: FormEvent) {
    event.preventDefault();
    const draft = argumentReflectionDraft;
    if (![draft.topic, draft.occurred_at, draft.content].every((value) => value.trim())) return;
    replaceArgumentReflections([
      createArgumentReflection(draft.topic, draft.occurred_at, draft.content),
      ...activeData.argumentReflections,
    ]);
    setArgumentReflectionDraft(createBlankArgumentReflectionDraft());
  }

  function addDivorcePlan(event: FormEvent) {
    event.preventDefault();
    const draft = divorcePlanDraft;
    if (![draft.title, draft.occurred_at, draft.content].every((value) => value.trim())) return;
    replaceDivorcePlans([
      createDivorcePlan(draft.title, draft.occurred_at, draft.content),
      ...activeData.divorcePlans,
    ]);
    setDivorcePlanDraft(createBlankDivorcePlanDraft());
  }

  function addBook(event: FormEvent) {
    event.preventDefault();
    const title = bookDraft.title.trim();
    if (!title) return;
    replaceBooks([createBook(title, bookDraft.author, bookDraft.note, bookDraft.status), ...activeData.books]);
    setBookDraft(blankBookDraft);
  }

  function addKindnessRecord(event: FormEvent) {
    event.preventDefault();
    const draft = kindnessDraft;
    if (![draft.title, draft.occurred_at, draft.content].every((value) => value.trim())) return;
    replaceKindnessRecords([
      createKindnessRecord(draft.title, draft.occurred_at, draft.content),
      ...activeData.kindnessRecords,
    ]);
    setKindnessDraft(createBlankKindnessDraft());
  }

  function startKindnessEdit(record: KindnessRecord) {
    setEditingKindnessId(record.id);
    setKindnessEditDraft({ title: record.title, occurred_at: record.occurred_at, content: record.content });
  }

  function saveKindnessEdit(recordId: string) {
    const draft = kindnessEditDraft;
    if (![draft.title, draft.occurred_at, draft.content].every((value) => value.trim())) return;
    replaceKindnessRecords(activeData.kindnessRecords.map((record) => record.id === recordId ? {
      ...record,
      title: draft.title.trim(),
      occurred_at: draft.occurred_at,
      content: draft.content.trim(),
    } : record));
    setEditingKindnessId(null);
    setKindnessEditDraft(createBlankKindnessDraft());
  }

  function addStudyGrowthRecord(event: FormEvent) {
    event.preventDefault();
    const title = studyGrowthDraft.title.trim();
    const content = studyGrowthDraft.content.trim();
    if (!title || !content) return;
    replaceStudyGrowthRecords([
      createStudyGrowthRecord(studyGrowthType, title, studyGrowthDraft.title_size, content, studyGrowthDraft.content_markdown, studyGrowthDraft.source),
      ...activeData.studyGrowthRecords,
    ]);
    setStudyGrowthDraft(blankStudyGrowthDraft);
  }

  function startStudyGrowthEdit(record: StudyGrowthRecord) {
    setEditingStudyGrowthId(record.id);
    setStudyGrowthEditDraft({ type: record.type, title: record.title, title_size: record.title_size, content: record.content, content_markdown: record.content_markdown, source: record.source });
  }

  function saveStudyGrowthEdit(recordId: string) {
    const title = studyGrowthEditDraft.title.trim();
    const content = studyGrowthMarkdownToPlainText(studyGrowthEditDraft.content_markdown);
    if (!title || !content) return;
    replaceStudyGrowthRecords(updateStudyGrowthRecord(activeData.studyGrowthRecords, recordId, {
      type: studyGrowthEditDraft.type,
      title,
      title_size: studyGrowthEditDraft.title_size,
      content,
      content_markdown: studyGrowthEditDraft.content_markdown,
      source: studyGrowthEditDraft.source,
    }, nowStamp()));
    setEditingStudyGrowthId(null);
    setStudyGrowthEditDraft(blankStudyGrowthEditDraft);
  }

  function changeStudyGrowthType(type: StudyGrowthType) {
    setStudyGrowthType(type);
    setEditingStudyGrowthId(null);
    setStudyGrowthEditDraft({ ...blankStudyGrowthEditDraft, type });
  }

  function addSkincareProduct(event: FormEvent) {
    event.preventDefault();
    const name = skincareDraft.name.trim();
    if (!name) return;
    replaceSkincareProducts([
      createSkincareProduct(name, skincareDraft.brand, skincareDraft.category, skincareDraft.description),
      ...activeData.skincareProducts,
    ]);
    setSkincareDraft(blankSkincareDraft);
  }

  function startSkincareEdit(product: SkincareProductRecord) {
    setEditingSkincareId(product.id);
    setSkincareEditDraft({ name: product.name, brand: product.brand, category: product.category, description: product.description });
  }

  function saveSkincareEdit(productId: string) {
    const name = skincareEditDraft.name.trim();
    if (!name) return;
    replaceSkincareProducts(activeData.skincareProducts.map((product) => product.id === productId ? {
      ...product,
      name,
      brand: skincareEditDraft.brand.trim(),
      category: skincareEditDraft.category,
      description: skincareEditDraft.description.trim(),
      updated_at: nowStamp(),
    } : product));
    setEditingSkincareId(null);
    setSkincareEditDraft(blankSkincareDraft);
  }

  function addRewardRule(event: FormEvent) {
    event.preventDefault();
    const name = rewardRuleDraft.name.trim();
    const values = parseRewardRuleValues(rewardRuleDraft);
    if (!name || !values) {
      window.alert("请填写有效奖励金额；阶梯奖励至少需要两个金额递增的完整档位。");
      return;
    }
    replaceRewardRules(prependRewardRule(
      activeData.rewardRules,
      createRewardRule(name, rewardRuleDraft.mode, rewardRuleDraft.period, values.amountCents, values.tiers, rewardRuleDraft.description),
    ));
    setRewardRuleDraft(createBlankRewardRuleDraft());
  }

  function addLearnedContent(event: FormEvent) {
    event.preventDefault();
    const title = learnedContentDraft.title.trim();
    const takeaway = learnedContentDraft.takeaway.trim();
    if (!title || !takeaway || !learnedContentDraft.completed_on) return;
    replaceLearnedContents([
      createLearnedContent(
        learnedContentDraft.type,
        title,
        learnedContentDraft.completed_on,
        learnedContentDraft.source,
        learnedContentDraft.url,
        takeaway,
      ),
      ...activeData.learnedContents,
    ]);
    setLearnedContentDraft(createBlankLearnedContentDraft());
  }

  function startLearnedContentEdit(record: LearnedContentRecord) {
    setEditingLearnedContentId(record.id);
    setLearnedContentEditDraft({
      type: record.type,
      title: record.title,
      completed_on: record.completed_on,
      source: record.source,
      url: record.url,
      takeaway: record.takeaway,
    });
  }

  function saveLearnedContentEdit(recordId: string) {
    const title = learnedContentEditDraft.title.trim();
    const takeaway = learnedContentEditDraft.takeaway.trim();
    if (!title || !takeaway || !learnedContentEditDraft.completed_on) return;
    replaceLearnedContents(activeData.learnedContents.map((record) => record.id === recordId ? {
      ...record,
      ...learnedContentEditDraft,
      title,
      source: learnedContentEditDraft.source.trim(),
      url: learnedContentEditDraft.url.trim(),
      takeaway,
      updated_at: nowStamp(),
    } : record));
    setEditingLearnedContentId(null);
    setLearnedContentEditDraft(createBlankLearnedContentDraft());
  }

  function deleteLearnedContent(recordId: string) {
    const record = activeData.learnedContents.find((item) => item.id === recordId);
    if (!record || !window.confirm(`确定删除“${record.title}”吗？`)) return;
    replaceLearnedContents(activeData.learnedContents.filter((item) => item.id !== recordId));
    if (editingLearnedContentId === recordId) {
      setEditingLearnedContentId(null);
      setLearnedContentEditDraft(createBlankLearnedContentDraft());
    }
  }

  function startRewardRuleEdit(rule: RewardRuleRecord) {
    setEditingRewardRuleId(rule.id);
    setRewardRuleEditDraft({
      name: rule.name,
      mode: rule.mode,
      period: rule.period ?? "daily",
      amount: rule.amount_cents === null ? "" : (rule.amount_cents / 100).toFixed(2),
      tiers: rule.mode === "tiered" ? rule.tiers.map((tier) => ({ name: tier.name, amount: (tier.amount_cents / 100).toFixed(2) })) : [{ name: "", amount: "" }, { name: "", amount: "" }],
      description: rule.description,
    });
  }

  function saveRewardRule(ruleId: string) {
    const currentRule = activeData.rewardRules.find((rule) => rule.id === ruleId);
    if (!currentRule) return;
    const name = rewardRuleEditDraft.name.trim();
    const values = parseRewardRuleValues(rewardRuleEditDraft);
    if (!name || !values) {
      window.alert("请填写有效奖励金额；阶梯奖励至少需要两个金额递增的完整档位。");
      return;
    }
    if (currentRule.period === "weekly" && rewardRuleEditDraft.mode !== "tiered") {
      window.alert("每周阶梯奖励创建后不能改为固定奖励。");
      return;
    }
    const nextMode = currentRule.period === "weekly" ? "tiered" : rewardRuleEditDraft.mode;
    const nextPeriod = nextMode === "fixed" ? "daily" : currentRule.period ?? rewardRuleEditDraft.period;
    replaceRewardRules(activeData.rewardRules.map((rule) => rule.id === ruleId ? {
      ...rule,
      name,
      mode: nextMode,
      period: nextPeriod,
      amount_cents: values.amountCents,
      tiers: values.tiers,
      description: rewardRuleEditDraft.description.trim(),
      updated_at: nowStamp(),
    } : rule));
    setEditingRewardRuleId(null);
    setRewardRuleEditDraft(createBlankRewardRuleDraft());
  }

  function toggleRewardRule(ruleId: string) {
    const toggled = toggleRewardRuleStatus(activeData.rewardRules, ruleId);
    replaceRewardRules(toggled.map((rule) => rule.id === ruleId ? { ...rule, updated_at: nowStamp() } : rule));
  }

  function reorderRewardRule(sourceId: string, targetId: string) {
    replaceRewardRules(reorderRewardRules(activeData.rewardRules, sourceId, targetId));
  }

  function claimReward(ruleId: string, tierIndex?: number, rewardDate?: string): boolean {
    const rule = activeData.rewardRules.find((item) => item.id === ruleId);
    if (!rule) return false;
    const now = new Date();
    const localDay = dateKey(now);
    const rewardDay = rewardDate ?? getRewardPeriodKey(rule, localDay);
    const rewardPeriod = getEffectiveRewardPeriod(rule);
    const backfillAllowed = rewardPeriod === "weekly"
      ? isWeeklyRewardBackfillAllowed(rewardDay, localDay)
      : isRewardBackfillDateAllowed(rewardDay, localDay);
    if (rewardDate && !backfillAllowed) {
      window.alert(rewardPeriod === "weekly" ? "每周奖励只能补领上一完整自然周。" : "只能补领昨天至 7 天前的奖励。");
      return false;
    }
    const tier = rule.mode === "tiered" ? rule.tiers[tierIndex ?? -1] ?? null : null;
    if (!canClaimReward(rule, activeData.rewardClaims, rewardDay, tier)) {
      if (rule.active) window.alert(`${rewardDay} 已领取过相同或更高档位，不能重复领取、降档或跨模式升级。`);
      return false;
    }
    const result = applyRewardClaim(rule, activeData.rewardClaims, rewardDay, toLocalDateTime(now), tier);
    if (result) updateData((value) => ({ ...value, rewardClaims: result.claims }));
    return Boolean(result);
  }

  function deleteRewardClaim(claimId: string) {
    const claim = activeData.rewardClaims.find((item) => item.id === claimId);
    if (!claim || !window.confirm(`确定删除“${claim.rule_name}”的这条领取记录吗？金额统计会同步回退。`)) return;
    updateData((value) => ({ ...value, rewardClaims: value.rewardClaims.filter((item) => item.id !== claimId) }));
  }

  function startBookEdit(book: BookRecord) {
    setEditingBookId(book.id);
    setBookEditDraft({ title: book.title, author: book.author, note: book.note, status: book.status });
  }

  function saveBookEdit(bookId: string) {
    const title = bookEditDraft.title.trim();
    if (!title) return;
    replaceBooks(activeData.books.map((book) => book.id === bookId ? {
      ...book,
      title,
      author: bookEditDraft.author.trim(),
      note: bookEditDraft.note.trim(),
      status: bookEditDraft.status,
      updated_at: nowStamp(),
    } : book));
    setEditingBookId(null);
    setBookEditDraft(blankBookDraft);
  }

  function startArgumentReflectionEdit(record: ArgumentReflectionRecord) {
    setEditingArgumentReflectionId(record.id);
    setArgumentReflectionEditDraft({
      topic: record.topic,
      occurred_at: record.occurred_at,
      content: record.content,
    });
  }

  function saveArgumentReflectionEdit(recordId: string) {
    const draft = argumentReflectionEditDraft;
    if (![draft.topic, draft.occurred_at, draft.content].every((value) => value.trim())) return;
    replaceArgumentReflections(activeData.argumentReflections.map((record) => record.id === recordId ? {
      ...record,
      topic: draft.topic.trim(),
      occurred_at: draft.occurred_at,
      content: draft.content.trim(),
    } : record));
    setEditingArgumentReflectionId(null);
    setArgumentReflectionEditDraft(createBlankArgumentReflectionDraft());
  }

  function archiveArgumentReflection(recordId: string) {
    const record = activeData.argumentReflections.find((item) => item.id === recordId);
    if (!record) return;
    if (!window.confirm(`确定归档复盘“${record.topic}”吗？归档后列表不再显示，但数据会保留。`)) return;
    replaceArgumentReflections(activeData.argumentReflections.map((item) => item.id === recordId ? { ...item, archived_at: nowStamp() } : item));
    if (editingArgumentReflectionId === recordId) {
      setEditingArgumentReflectionId(null);
      setArgumentReflectionEditDraft(createBlankArgumentReflectionDraft());
    }
  }

  function startDivorcePlanEdit(record: DivorcePlanRecord) {
    setEditingDivorcePlanId(record.id);
    setDivorcePlanEditDraft({
      title: record.title,
      occurred_at: record.occurred_at,
      content: record.content,
    });
  }

  function saveDivorcePlanEdit(recordId: string) {
    const draft = divorcePlanEditDraft;
    if (![draft.title, draft.occurred_at, draft.content].every((value) => value.trim())) return;
    replaceDivorcePlans(activeData.divorcePlans.map((record) => record.id === recordId ? {
      ...record,
      title: draft.title.trim(),
      occurred_at: draft.occurred_at,
      content: draft.content.trim(),
    } : record));
    setEditingDivorcePlanId(null);
    setDivorcePlanEditDraft(createBlankDivorcePlanDraft());
  }

  function archiveDivorcePlan(recordId: string) {
    const record = activeData.divorcePlans.find((item) => item.id === recordId);
    if (!record) return;
    if (!window.confirm(`确定归档记录“${record.title}”吗？归档后列表不再显示，但数据会保留。`)) return;
    replaceDivorcePlans(activeData.divorcePlans.map((item) => item.id === recordId ? { ...item, archived_at: nowStamp() } : item));
    if (editingDivorcePlanId === recordId) {
      setEditingDivorcePlanId(null);
      setDivorcePlanEditDraft(createBlankDivorcePlanDraft());
    }
  }

  function addVideoInspiration(event: FormEvent) {
    event.preventDefault();
    const channel = videoInspirationDraft.channel.trim();
    const title = videoInspirationDraft.title.trim();
    if (!channel || !title) return;
    replaceVideoInspirations([
      createVideoInspiration(channel, title, videoInspirationDraft.content, videoInspirationDraft.url),
      ...activeData.videoInspirations,
    ]);
    setVideoInspirationDraft(blankVideoInspirationDraft);
  }

  function startVideoInspirationEdit(record: VideoInspirationRecord) {
    setEditingVideoInspirationId(record.id);
    setVideoInspirationEditDraft({
      channel: record.channel,
      title: record.title,
      content: record.content,
      url: record.url,
    });
  }

  function saveVideoInspirationEdit(recordId: string) {
    const channel = videoInspirationEditDraft.channel.trim();
    const title = videoInspirationEditDraft.title.trim();
    if (!channel || !title) return;
    replaceVideoInspirations(
      activeData.videoInspirations.map((record) =>
        record.id === recordId
          ? {
              ...record,
              channel,
              title,
              content: videoInspirationEditDraft.content.trim(),
              url: videoInspirationEditDraft.url.trim(),
            }
          : record,
      ),
    );
    setEditingVideoInspirationId(null);
    setVideoInspirationEditDraft(blankVideoInspirationDraft);
  }

  function toggleVideoInspirationPinned(recordId: string) {
    replaceVideoInspirations(
      activeData.videoInspirations.map((record) => (record.id === recordId ? { ...record, pinned: !record.pinned } : record)),
    );
  }

  function archiveVideoInspiration(recordId: string) {
    const record = activeData.videoInspirations.find((item) => item.id === recordId);
    if (!record) return;
    if (!window.confirm(`确定归档视频灵感“${record.title}”吗？归档后列表不再显示，但数据会保留。`)) return;
    replaceVideoInspirations(
      activeData.videoInspirations.map((item) => (item.id === recordId ? { ...item, archived_at: nowStamp() } : item)),
    );
    if (editingVideoInspirationId === recordId) {
      setEditingVideoInspirationId(null);
      setVideoInspirationEditDraft(blankVideoInspirationDraft);
    }
  }

  function addVideoNote(event: FormEvent) {
    event.preventDefault();
    const title = videoNoteDraft.title.trim();
    const quote = videoNoteDraft.quote.trim();
    const reflection = videoNoteDraft.reflection.trim();
    if (!title || (!quote && !reflection)) return;
    replaceVideoNotes([
      createVideoNote(title, quote, reflection, videoNoteDraft.source, videoNoteDraft.url),
      ...activeData.videoNotes,
    ]);
    setVideoNoteDraft(blankVideoNoteDraft);
  }

  function startVideoNoteEdit(record: VideoNoteRecord) {
    setEditingVideoNoteId(record.id);
    setVideoNoteEditDraft({
      title: record.title,
      quote: record.quote,
      reflection: record.reflection,
      source: record.source,
      url: record.url,
    });
  }

  function saveVideoNoteEdit(recordId: string) {
    const title = videoNoteEditDraft.title.trim();
    const quote = videoNoteEditDraft.quote.trim();
    const reflection = videoNoteEditDraft.reflection.trim();
    if (!title || (!quote && !reflection)) return;
    replaceVideoNotes(
      activeData.videoNotes.map((record) =>
        record.id === recordId
          ? {
              ...record,
              title,
              quote,
              reflection,
              source: videoNoteEditDraft.source.trim(),
              url: videoNoteEditDraft.url.trim(),
            }
          : record,
      ),
    );
    setEditingVideoNoteId(null);
    setVideoNoteEditDraft(blankVideoNoteDraft);
  }

  function toggleVideoNotePinned(recordId: string) {
    replaceVideoNotes(
      activeData.videoNotes.map((record) => (record.id === recordId ? { ...record, pinned: !record.pinned } : record)),
    );
  }

  function archiveVideoNote(recordId: string) {
    const record = activeData.videoNotes.find((item) => item.id === recordId);
    if (!record) return;
    if (!window.confirm(`确定归档刷视频随记“${record.title}”吗？归档后列表不再显示，但数据会保留。`)) return;
    replaceVideoNotes(
      activeData.videoNotes.map((item) => (item.id === recordId ? { ...item, archived_at: nowStamp() } : item)),
    );
    if (editingVideoNoteId === recordId) {
      setEditingVideoNoteId(null);
      setVideoNoteEditDraft(blankVideoNoteDraft);
    }
  }

  function addMetaLearningAbility(event: FormEvent) {
    event.preventDefault();
    const name = metaLearningDraft.name.trim();
    if (!name) return;
    replaceMetaLearningAbilities([
      createMetaLearningAbility(name, metaLearningDraft.summary, metaLearningDraft.usage, metaLearningDraft.mastery),
      ...activeData.metaLearningAbilities,
    ]);
    setMetaLearningDraft(blankMetaLearningDraft);
  }

  function startMetaLearningEdit(record: MetaLearningAbility) {
    setEditingMetaLearningId(record.id);
    setMetaLearningEditDraft({
      name: record.name,
      summary: record.summary,
      usage: record.usage,
      mastery: record.mastery,
    });
  }

  function saveMetaLearningEdit(recordId: string) {
    const name = metaLearningEditDraft.name.trim();
    if (!name) return;
    replaceMetaLearningAbilities(
      activeData.metaLearningAbilities.map((record) =>
        record.id === recordId
          ? {
              ...record,
              name,
              summary: metaLearningEditDraft.summary.trim(),
              usage: metaLearningEditDraft.usage.trim(),
              mastery: metaLearningEditDraft.mastery,
            }
          : record,
      ),
    );
    setEditingMetaLearningId(null);
    setMetaLearningEditDraft(blankMetaLearningDraft);
  }

  function archiveMetaLearningAbility(recordId: string) {
    const record = activeData.metaLearningAbilities.find((item) => item.id === recordId);
    if (!record) return;
    if (!window.confirm(`确定归档学习能力“${record.name}”吗？归档后列表不再显示，但数据会保留。`)) return;
    replaceMetaLearningAbilities(
      activeData.metaLearningAbilities.map((item) => (item.id === recordId ? { ...item, archived_at: nowStamp() } : item)),
    );
    if (editingMetaLearningId === recordId) {
      setEditingMetaLearningId(null);
      setMetaLearningEditDraft(blankMetaLearningDraft);
    }
  }

  function addWorkExperience(event: FormEvent) {
    event.preventDefault();
    const title = workExperienceDraft.title.trim();
    const body = workExperienceDraft.body.trim();
    if (!title || !body) return;
    replaceWorkExperiences([createWorkExperience(title, body, workExperienceDraft.month), ...activeData.workExperiences]);
    setWorkExperienceDraft({ title: "", body: "", month: monthKey(new Date()) });
  }

  function startWorkExperienceEdit(record: WorkExperienceRecord) {
    setEditingWorkExperienceId(record.id);
    setWorkExperienceEditDraft({ title: record.title, body: record.body, month: record.month });
  }

  function saveWorkExperienceEdit(recordId: string) {
    const title = workExperienceEditDraft.title.trim();
    const body = workExperienceEditDraft.body.trim();
    if (!title || !body) return;
    replaceWorkExperiences(
      activeData.workExperiences.map((record) =>
        record.id === recordId ? { ...record, title, body, month: workExperienceEditDraft.month } : record,
      ),
    );
    setEditingWorkExperienceId(null);
    setWorkExperienceEditDraft({ title: "", body: "", month: monthKey(new Date()) });
  }

  function toggleWorkExperiencePinned(recordId: string) {
    replaceWorkExperiences(
      activeData.workExperiences.map((record) => (record.id === recordId ? { ...record, pinned: !record.pinned } : record)),
    );
  }

  function archiveWorkExperience(recordId: string) {
    const record = activeData.workExperiences.find((item) => item.id === recordId);
    if (!record) return;
    if (!window.confirm(`确定归档工作经验“${record.title}”吗？归档后列表不再显示，但数据会保留。`)) return;
    replaceWorkExperiences(activeData.workExperiences.map((item) => (item.id === recordId ? { ...item, archived_at: nowStamp() } : item)));
    if (editingWorkExperienceId === recordId) {
      setEditingWorkExperienceId(null);
      setWorkExperienceEditDraft({ title: "", body: "", month: monthKey(new Date()) });
    }
  }

  function startDeliveryEdit(delivery: DeliveryRecord) {
    setEditingDeliveryId(delivery.id);
    setDeliveryEditDraft({ sequence: delivery.sequence === null ? "" : String(delivery.sequence), name: delivery.name, platform: delivery.platform, note: delivery.note, purchased_at: delivery.purchased_at });
  }

  function saveDeliveryEdit(deliveryId: string) {
    const name = deliveryEditDraft.name.trim();
    const platform = deliveryEditDraft.platform.trim();
    const sequenceText = deliveryEditDraft.sequence.trim();
    const sequence = sequenceText ? parseDeliverySequence(sequenceText) : null;
    if (!name || !platform) return;
    if (sequenceText && sequence === null) {
      window.alert("快递序号只能填写非 0 整数。");
      return;
    }
    if (sequence !== null) {
      const conflict = findDeliveryBySequence(deliveryTasks, sequence, deliveryId);
      if (conflict) {
        window.alert(`序号 #${sequence} 已被快递“${conflict.name}”占用。`);
        return;
      }
    }
    replaceDeliveries(
      deliveryTasks.map((delivery) =>
        delivery.id === deliveryId ? { ...delivery, sequence, name, platform, note: deliveryEditDraft.note.trim(), purchased_at: deliveryEditDraft.purchased_at } : delivery,
      ),
    );
    setEditingDeliveryId(null);
    setDeliveryEditDraft({ sequence: "", name: "", platform: "", note: "", purchased_at: "" });
  }

  function deleteDelivery(deliveryId: string) {
    const delivery = deliveryTasks.find((item) => item.id === deliveryId);
    if (!delivery) return;
    if (!window.confirm(`确定删除快递“${delivery.name}”吗？删除后可以用撤销恢复。`)) return;
    replaceDeliveries(
      deliveryTasks.filter((item) => item.id !== deliveryId),
    );
    if (editingDeliveryId === deliveryId) {
      setEditingDeliveryId(null);
      setDeliveryEditDraft({ sequence: "", name: "", platform: "", note: "", purchased_at: "" });
    }
  }

  function toggleTask(taskId: string) {
    replaceTasks(
      currentDay,
      allTasks.map((task) => {
        if (task.id !== taskId) return task;
        const done = task.status !== STATUS_DONE;
        return {
          ...task,
          status: done ? STATUS_DONE : STATUS_TODO,
          done_at: done ? nowStamp() : null,
        };
      }),
    );
    setSelectedId(taskId);
  }

  function toggleTodayTask(taskId: string) {
    replaceTasks(
      todayDay,
      todayTasks.map((task) => {
        if (task.id !== taskId) return task;
        const done = task.status !== STATUS_DONE;
        return {
          ...task,
          status: done ? STATUS_DONE : STATUS_TODO,
          done_at: done ? nowStamp() : null,
        };
      }),
    );
    setSelectedId(taskId);
  }

  function startTodayTask(taskId: string) {
    replaceTasks(
      todayDay,
      todayTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: STATUS_IN_PROGRESS,
              done_at: null,
            }
          : task,
      ),
    );
    setSelectedId(taskId);
  }

  function saveTask(task: TodoTask) {
    if (!editingTask) return;
    const sourceDay = editingTask.day;
    const sourceTasks = activeData.todos[sourceDay] ?? [];
    replaceTasks(sourceDay, sourceTasks.map((item) => (item.id === task.id ? task : item)));
    setEditingTask(null);
  }

  function deleteTask(taskId: string) {
    const task = allTasks.find((item) => item.id === taskId);
    if (!task) return;
    if (!window.confirm(`确定删除“${task.text}”吗？删除后可以用撤销恢复。`)) return;
    replaceTasks(
      currentDay,
      allTasks.filter((task) => task.id !== taskId),
    );
    if (selectedId === taskId) setSelectedId(null);
  }

  function moveSelected(delta: number) {
    if (!selectedId) return;
    const next = moveDailyTaskWithinStatus(allTasks, selectedId, delta);
    if (next === allTasks) return;
    replaceTasks(currentDay, next);
  }

  function startTaskDrag(event: DragEvent<HTMLElement>, taskId: string) {
    if (!canDragTasks) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
    setDragOverTaskId(null);
    setSelectedId(taskId);
  }

  function enterTaskDropTarget(taskId: string) {
    if (!canDragTasks || !draggedTaskId || !canReorderTaskPair(draggedTaskId, taskId)) {
      setDragOverTaskId(null);
      return;
    }
    setDragOverTaskId(taskId);
  }

  function hoverTaskDropTarget(event: DragEvent<HTMLElement>, taskId: string) {
    if (!canDragTasks || !draggedTaskId || !canReorderTaskPair(draggedTaskId, taskId)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverTaskId(taskId);
  }

  function leaveTaskDropTarget(event: DragEvent<HTMLElement>, taskId: string) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setDragOverTaskId((value) => (value === taskId ? null : value));
  }

  function dropTaskOnTarget(event: DragEvent<HTMLElement>, targetTaskId: string) {
    if (!canDragTasks) return;
    event.preventDefault();
    const sourceTaskId = draggedTaskId ?? event.dataTransfer.getData("text/plain");
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    if (!sourceTaskId || !canReorderTaskPair(sourceTaskId, targetTaskId)) return;
    moveTaskBefore(sourceTaskId, targetTaskId);
  }

  function endTaskDrag() {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  }

  function moveTaskBefore(sourceTaskId: string, targetTaskId: string) {
    const next = moveDailyTaskBeforeWithinStatus(allTasks, sourceTaskId, targetTaskId);
    if (next === allTasks) return;
    replaceTasks(currentDay, next);
    setSelectedId(sourceTaskId);
  }

  function canReorderTaskPair(sourceTaskId: string, targetTaskId: string): boolean {
    return canReorderDailyTasks(
      allTasks.find((task) => task.id === sourceTaskId),
      allTasks.find((task) => task.id === targetTaskId),
    );
  }

  function carryOver() {
    if (!data) return;
    const previousDay = dateKey(addDays(currentDate, -1));
    const existing = new Set(allTasks.map((task) => task.text));
    const carried = (data.todos[previousDay] ?? [])
      .filter((task) => task.status !== STATUS_DONE && !existing.has(task.text))
      .map((task) =>
        createTask({
          text: task.text,
          description: task.description,
          tag: task.tag,
          priority: task.priority,
          status: STATUS_TODO,
        }),
      );
    if (!carried.length) return;
    replaceTasks(currentDay, [...carried, ...allTasks]);
  }

  function clearDone() {
    const doneTasks = allTasks.filter((task) => task.status === STATUS_DONE);
    if (!doneTasks.length) return;
    if (!window.confirm(`确定清除 ${doneTasks.length} 个已完成事项吗？清除后可以用撤销恢复。`)) return;
    replaceTasks(
      currentDay,
      allTasks.filter((task) => task.status !== STATUS_DONE),
    );
  }

  function addTag(name: string, tone: TodoTag["tone"]) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const nextId = Math.max(0, ...tags.map((tag) => tag.id)) + 1;
    updatePrefs((value) => ({
      ...value,
      tags: [...value.tags, { id: nextId, name: trimmed, tone }],
    }));
  }

  function updateTag(updatedTag: TodoTag) {
    const name = updatedTag.name.trim() || "未命名";
    updatePrefs((value) => ({
      ...value,
      tags: value.tags.map((tag) => (tag.id === updatedTag.id ? { ...updatedTag, name } : tag)),
    }));
  }

  function deleteTag(tagId: TagId) {
    if (tagId === 0) return;
    const tag = tags.find((item) => item.id === tagId);
    if (!tag) return;
    if (!window.confirm(`确定删除标签“${tag.name}”吗？已有任务和默认任务会改为“未分类”。`)) return;
    updatePrefs((value) => ({
      ...value,
      tags: value.tags.filter((item) => item.id !== tagId),
      defaultTasks: value.defaultTasks.map((task) => (task.tag === tagId ? { ...task, tag: 0 } : task)),
    }));
    updateData((value) => ({
      ...value,
      todos: Object.fromEntries(
        Object.entries(value.todos).map(([day, tasks]) => [
          day,
          tasks.map((task) => (task.tag === tagId ? { ...task, tag: 0 } : task)),
        ]),
      ),
    }));
    setDraft((value) => (value.tag === tagId ? { ...value, tag: 0 } : value));
  }

  function addDeliveryPlatform(platform: string) {
    const trimmed = platform.trim();
    if (!trimmed || deliveryPlatforms.some((item) => item === trimmed)) return;
    updatePrefs((value) => ({ ...value, deliveryPlatforms: [...value.deliveryPlatforms, trimmed] }));
  }

  function updateDeliveryPlatform(index: number, platform: string) {
    const trimmed = platform.trim();
    if (!trimmed || deliveryPlatforms.some((item, itemIndex) => itemIndex !== index && item === trimmed)) return;
    updatePrefs((value) => ({
      ...value,
      deliveryPlatforms: value.deliveryPlatforms.map((item, itemIndex) => itemIndex === index ? trimmed : item),
    }));
  }

  function deleteDeliveryPlatform(index: number) {
    const platform = deliveryPlatforms[index];
    if (!platform || deliveryPlatforms.length <= 1) return;
    if (!window.confirm(`确定从可选平台中删除“${platform}”吗？已有快递记录不会受影响。`)) return;
    updatePrefs((value) => ({ ...value, deliveryPlatforms: value.deliveryPlatforms.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function addDefaultTask(task: DefaultTask) {
    const text = task.text.trim();
    if (!text) return;
    const normalizedTask = { ...task, text };
    updatePrefs((value) => ({
      ...value,
      defaultTasks: [...value.defaultTasks, normalizedTask],
    }));
    updateData((value) => {
      const today = dateKey(new Date());
      const todayTasks = value.todos[today] ?? [];
      if (todayTasks.some((item) => item.text.trim() === text)) return value;
      return {
        ...value,
        todos: {
          ...value.todos,
          [today]: [
            ...todayTasks,
            createTask({
              text,
              tag: normalizedTask.tag,
              priority: normalizedTask.priority,
              status: STATUS_TODO,
              description: "",
            }),
          ],
        },
      };
    });
  }

  function updateDefaultTask(index: number, task: DefaultTask) {
    updatePrefs((value) => ({
      ...value,
      defaultTasks: value.defaultTasks.map((item, itemIndex) =>
        itemIndex === index ? { ...task, text: task.text.trim() || item.text } : item,
      ),
    }));
  }

  function deleteDefaultTask(index: number) {
    updatePrefs((value) => ({
      ...value,
      defaultTasks: value.defaultTasks.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isFormField(event.target)) return;

      if (isUndoRedoShortcut(event)) {
        event.preventDefault();
        if (event.key.toLowerCase() === "z" && !event.shiftKey) {
          undoData();
        } else {
          redoData();
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "ArrowUp") {
        event.preventDefault();
        moveSelected(-1);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "ArrowDown") {
        event.preventDefault();
        moveSelected(1);
        return;
      }

      if (event.key === "Delete" && selectedId) {
        event.preventDefault();
        deleteTask(selectedId);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const tagCounts = useMemo(() => {
    const counts = new Map<TagFilter, number>([[-1, allTasks.length]]);
    for (const tag of tags) counts.set(tag.id, allTasks.filter((task) => task.tag === tag.id).length);
    return counts;
  }, [allTasks, tags]);

  const dailyHistoryEntries = useMemo(() => getDailyHistoryEntries(activeData), [activeData]);
  const monthlyHistoryEntries = useMemo(() => getMonthlyHistoryEntries(activeData), [activeData]);

  if (!storageReady || !data) {
    return <LoadingScreen />;
  }

  return (
    <main className="app-shell">
      <Sidebar
        activeView={activeView}
        dashboardCount={dashboardTasks.length + pendingDeliveryCount}
        dailyCount={todayTasks.length}
        monthlyCount={monthlyTasks.length}
        deliveryCount={deliveryTasks.length}
        onViewChange={changeView}
        onShowSettings={() => setShowSettings(true)}
      />

      <section className="workspace">
        {activeView === "dashboard" ? (
          <DashboardPanel
            today={todayDate}
            saveStatus={projectSaveStatus}
            doneCount={todayDoneCount}
            totalCount={todayTasks.length}
            progress={todayProgress}
            inProgressCount={todayInProgressCount}
            totalDeliveryCount={deliveryTasks.length}
            pendingDeliveryCount={pendingDeliveryCount}
            openMonthlyCount={todayOpenMonthlyCount}
            habitDoneCount={todayHabitCompletion.done}
            habitTotalCount={todayHabitCompletion.total}
            tasks={dashboardTasks}
            tags={tags}
            onToggleTask={toggleTodayTask}
            onStartTask={startTodayTask}
            onOpenDaily={openTodayDaily}
            onOpenHabits={openTodayHabits}
          />
        ) : activeView === "habits" ? (
          <HabitPanel
            currentDate={habitDate}
            selectedDay={habitDay}
            todayDay={todayDay}
            canEditSelectedDate={canEditHabitDay}
            habits={habitViews}
            draft={habitDraft}
            editingHabitId={editingHabitId}
            editingDraft={habitEditDraft}
            saveStatus={projectSaveStatus}
            onSetDate={setHabitDate}
            onDraftChange={setHabitDraft}
            onAdd={addHabit}
            onToggle={toggleHabit}
            onStartEdit={startHabitEdit}
            onEditDraftChange={setHabitEditDraft}
            onSaveEdit={saveHabitEdit}
            onCancelEdit={() => {
              setEditingHabitId(null);
              setHabitEditDraft(blankHabitDraft);
            }}
            onArchive={deleteHabit}
          />
        ) : activeView === "daily" ? (
          <>
            <WorkspaceHeader
              currentDate={currentDate}
              theme={theme}
              onSetDate={setDay}
              onToggleTheme={() => updatePrefs((value) => ({ ...value, theme: theme === "dark" ? "light" : "dark" }))}
              onShowHistory={() => setShowDailyHistory(true)}
            />
            <SummaryBand doneCount={doneCount} total={allTasks.length} progress={progress} saveStatus={projectSaveStatus} />
            <WeeklyPanel
              weekRange={weekRange}
              tasks={weeklyTasks}
              draft={weeklyDraft}
              editingTaskId={editingWeeklyTaskId}
              editingText={weeklyEditText}
              onDraftChange={setWeeklyDraft}
              onAdd={addWeeklyTask}
              onToggle={toggleWeeklyTask}
              onStartEdit={startWeeklyEdit}
              onEditTextChange={setWeeklyEditText}
              onSaveEdit={saveWeeklyEdit}
              onCancelEdit={() => {
                setEditingWeeklyTaskId(null);
                setWeeklyEditText("");
              }}
              onDelete={deleteWeeklyTask}
            />
            <TaskComposer draft={draft} tags={tags} onDraftChange={setDraft} onSubmit={handleAdd} />
            <TaskToolbar
              filters={filters}
              canUndo={canUndo}
              canRedo={canRedo}
              onCarryOver={carryOver}
              onClearDone={clearDone}
              onUndo={undoData}
              onRedo={redoData}
              onFiltersChange={setFilters}
            />

            <section className="daily-task-board">
              <DailyCategoryPanel filters={filters} tags={tags} tagCounts={tagCounts} onTagChange={(tag) => setFilters({ ...filters, tag })} />
              <section className="task-list" aria-label="任务列表">
                {visibleTasks.length ? (
                  visibleTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      tags={tags}
                      selected={selectedId === task.id}
                      onSelect={() => setSelectedId(task.id)}
                      onToggle={() => toggleTask(task.id)}
                      onEdit={() => setEditingTask({ day: currentDay, task })}
                      onDelete={() => deleteTask(task.id)}
                      draggable={canDragTasks}
                      dragging={draggedTaskId === task.id}
                      dragOver={dragOverTaskId === task.id}
                      onDragStart={(event) => startTaskDrag(event, task.id)}
                      onDragEnter={() => enterTaskDropTarget(task.id)}
                      onDragOver={(event) => hoverTaskDropTarget(event, task.id)}
                      onDragLeave={(event) => leaveTaskDropTarget(event, task.id)}
                      onDrop={(event) => dropTaskOnTarget(event, task.id)}
                      onDragEnd={endTaskDrag}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <strong>{allTasks.length ? "没有匹配的任务" : "今天还没有任务"}</strong>
                    <span>{allTasks.length ? "试试换个筛选条件或搜索词" : "从上面的输入框写下第一件事"}</span>
                  </div>
                )}
              </section>
            </section>

            <AwesomePanel
              records={awesomeRecords}
              draft={awesomeDraft}
              editingRecordId={editingAwesomeRecordId}
              editingText={awesomeEditText}
              onDraftChange={setAwesomeDraft}
              onAdd={addAwesomeRecord}
              onStartEdit={startAwesomeEdit}
              onEditTextChange={setAwesomeEditText}
              onSaveEdit={saveAwesomeEdit}
              onCancelEdit={() => {
                setEditingAwesomeRecordId(null);
                setAwesomeEditText("");
              }}
              onDelete={deleteAwesomeRecord}
            />
          </>
        ) : activeView === "monthly" ? (
          <MonthlyPanel
            currentDate={currentDate}
            monthValue={currentMonth}
            tasks={monthlyTasks}
            draft={monthlyDraft}
            editingTaskId={editingMonthlyTaskId}
            editingDraft={monthlyEditDraft}
            saveStatus={projectSaveStatus}
            onSetMonth={setMonth}
            onShowHistory={() => setShowMonthlyHistory(true)}
            onDraftChange={setMonthlyDraft}
            onAdd={addMonthlyTask}
            onToggle={toggleMonthlyTask}
            onStartEdit={startMonthlyEdit}
            onEditDraftChange={setMonthlyEditDraft}
            onSaveEdit={saveMonthlyEdit}
            onCancelEdit={() => {
              setEditingMonthlyTaskId(null);
              setMonthlyEditDraft({ text: "", description: "" });
            }}
            onDelete={deleteMonthlyTask}
          />
        ) : activeView === "inspiration" ? (
          <InspirationPanel
            records={visibleInspirations}
            draft={inspirationDraft}
            query={inspirationQuery}
            editingRecordId={editingInspirationId}
            editingDraft={inspirationEditDraft}
            saveStatus={projectSaveStatus}
            onDraftChange={setInspirationDraft}
            onAdd={addInspiration}
            onQueryChange={setInspirationQuery}
            onTogglePinned={toggleInspirationPinned}
            onStartEdit={startInspirationEdit}
            onEditDraftChange={setInspirationEditDraft}
            onSaveEdit={saveInspirationEdit}
            onCancelEdit={() => {
              setEditingInspirationId(null);
              setInspirationEditDraft({ title: "", body: "" });
            }}
            onArchive={archiveInspiration}
          />
        ) : activeView === "dailyReading" ? (
          <DailyReadingPanel
            records={visibleDailyReadings}
            totalCount={activeData.dailyReadings.filter((record) => !record.archived_at).length}
            draft={dailyReadingDraft}
            query={dailyReadingQuery}
            editingRecordId={editingDailyReadingId}
            editingDraft={dailyReadingEditDraft}
            saveStatus={projectSaveStatus}
            onDraftChange={setDailyReadingDraft}
            onAdd={addDailyReading}
            onQueryChange={setDailyReadingQuery}
            onStartEdit={startDailyReadingEdit}
            onEditDraftChange={setDailyReadingEditDraft}
            onSaveEdit={saveDailyReadingEdit}
            onCancelEdit={() => {
              setEditingDailyReadingId(null);
              setDailyReadingEditDraft({ title: "", body: "", source: "", sortOrder: "" });
            }}
            onArchive={archiveDailyReading}
          />
        ) : activeView === "books" ? (
          <BooksPanel
            books={visibleBooks}
            draft={bookDraft}
            query={bookQuery}
            statusFilter={bookStatusFilter}
            editingBookId={editingBookId}
            editingDraft={bookEditDraft}
            saveStatus={projectSaveStatus}
            onDraftChange={setBookDraft}
            onAdd={addBook}
            onQueryChange={setBookQuery}
            onStatusFilterChange={setBookStatusFilter}
            onStartEdit={startBookEdit}
            onEditDraftChange={setBookEditDraft}
            onSaveEdit={saveBookEdit}
            onCancelEdit={() => {
              setEditingBookId(null);
              setBookEditDraft(blankBookDraft);
            }}
          />
        ) : activeView === "argumentReflection" ? (
          <ArgumentReflectionPanel
            records={visibleArgumentReflections}
            draft={argumentReflectionDraft}
            query={argumentReflectionQuery}
            editingRecordId={editingArgumentReflectionId}
            editingDraft={argumentReflectionEditDraft}
            saveStatus={projectSaveStatus}
            onDraftChange={setArgumentReflectionDraft}
            onAdd={addArgumentReflection}
            onQueryChange={setArgumentReflectionQuery}
            onStartEdit={startArgumentReflectionEdit}
            onEditDraftChange={setArgumentReflectionEditDraft}
            onSaveEdit={saveArgumentReflectionEdit}
            onCancelEdit={() => {
              setEditingArgumentReflectionId(null);
              setArgumentReflectionEditDraft(createBlankArgumentReflectionDraft());
            }}
            onArchive={archiveArgumentReflection}
          />
        ) : activeView === "divorcePlan" ? (
          <DivorcePlanPanel
            records={visibleDivorcePlans}
            draft={divorcePlanDraft}
            query={divorcePlanQuery}
            editingRecordId={editingDivorcePlanId}
            editingDraft={divorcePlanEditDraft}
            saveStatus={projectSaveStatus}
            onDraftChange={setDivorcePlanDraft}
            onAdd={addDivorcePlan}
            onQueryChange={setDivorcePlanQuery}
            onStartEdit={startDivorcePlanEdit}
            onEditDraftChange={setDivorcePlanEditDraft}
            onSaveEdit={saveDivorcePlanEdit}
            onCancelEdit={() => {
              setEditingDivorcePlanId(null);
              setDivorcePlanEditDraft(createBlankDivorcePlanDraft());
            }}
            onArchive={archiveDivorcePlan}
          />
        ) : activeView === "videoInspiration" ? (
          <VideoInspirationPanel
            records={visibleVideoInspirations}
            channels={videoInspirationChannels}
            draft={videoInspirationDraft}
            query={videoInspirationQuery}
            channelFilter={videoInspirationChannelFilter}
            editingRecordId={editingVideoInspirationId}
            editingDraft={videoInspirationEditDraft}
            saveStatus={projectSaveStatus}
            onDraftChange={setVideoInspirationDraft}
            onAdd={addVideoInspiration}
            onQueryChange={setVideoInspirationQuery}
            onChannelFilterChange={setVideoInspirationChannelFilter}
            onTogglePinned={toggleVideoInspirationPinned}
            onStartEdit={startVideoInspirationEdit}
            onEditDraftChange={setVideoInspirationEditDraft}
            onSaveEdit={saveVideoInspirationEdit}
            onCancelEdit={() => {
              setEditingVideoInspirationId(null);
              setVideoInspirationEditDraft(blankVideoInspirationDraft);
            }}
            onArchive={archiveVideoInspiration}
          />
        ) : activeView === "videoNotes" ? (
          <VideoNotesPanel
            records={visibleVideoNotes}
            draft={videoNoteDraft}
            query={videoNoteQuery}
            editingRecordId={editingVideoNoteId}
            editingDraft={videoNoteEditDraft}
            saveStatus={projectSaveStatus}
            onDraftChange={setVideoNoteDraft}
            onAdd={addVideoNote}
            onQueryChange={setVideoNoteQuery}
            onTogglePinned={toggleVideoNotePinned}
            onStartEdit={startVideoNoteEdit}
            onEditDraftChange={setVideoNoteEditDraft}
            onSaveEdit={saveVideoNoteEdit}
            onCancelEdit={() => {
              setEditingVideoNoteId(null);
              setVideoNoteEditDraft(blankVideoNoteDraft);
            }}
            onArchive={archiveVideoNote}
          />
        ) : activeView === "metaLearning" ? (
          <MetaLearningPanel
            records={visibleMetaLearningAbilities}
            draft={metaLearningDraft}
            query={metaLearningQuery}
            masteryFilter={metaLearningMasteryFilter}
            editingRecordId={editingMetaLearningId}
            editingDraft={metaLearningEditDraft}
            saveStatus={projectSaveStatus}
            onDraftChange={setMetaLearningDraft}
            onAdd={addMetaLearningAbility}
            onQueryChange={setMetaLearningQuery}
            onMasteryFilterChange={setMetaLearningMasteryFilter}
            onStartEdit={startMetaLearningEdit}
            onEditDraftChange={setMetaLearningEditDraft}
            onSaveEdit={saveMetaLearningEdit}
            onCancelEdit={() => {
              setEditingMetaLearningId(null);
              setMetaLearningEditDraft(blankMetaLearningDraft);
            }}
            onArchive={archiveMetaLearningAbility}
          />
        ) : activeView === "workExperience" ? (
          <WorkExperiencePanel
            records={visibleWorkExperiences}
            months={workExperienceMonths}
            draft={workExperienceDraft}
            query={workExperienceQuery}
            monthFilter={workExperienceMonthFilter}
            editingRecordId={editingWorkExperienceId}
            editingDraft={workExperienceEditDraft}
            saveStatus={projectSaveStatus}
            onDraftChange={setWorkExperienceDraft}
            onAdd={addWorkExperience}
            onQueryChange={setWorkExperienceQuery}
            onMonthFilterChange={setWorkExperienceMonthFilter}
            onTogglePinned={toggleWorkExperiencePinned}
            onStartEdit={startWorkExperienceEdit}
            onEditDraftChange={setWorkExperienceEditDraft}
            onSaveEdit={saveWorkExperienceEdit}
            onCancelEdit={() => {
              setEditingWorkExperienceId(null);
              setWorkExperienceEditDraft({ title: "", body: "", month: monthKey(new Date()) });
            }}
            onArchive={archiveWorkExperience}
          />
        ) : activeView === "kindnessRecords" ? (
          <KindnessRecordsPanel
            records={visibleKindnessRecords}
            totalCount={activeData.kindnessRecords.length}
            draft={kindnessDraft}
            query={kindnessQuery}
            startDate={kindnessStartDate}
            endDate={kindnessEndDate}
            editingRecordId={editingKindnessId}
            editingDraft={kindnessEditDraft}
            saveStatus={projectSaveStatus}
            onDraftChange={setKindnessDraft}
            onAdd={addKindnessRecord}
            onQueryChange={setKindnessQuery}
            onStartDateChange={setKindnessStartDate}
            onEndDateChange={setKindnessEndDate}
            onStartEdit={startKindnessEdit}
            onEditDraftChange={setKindnessEditDraft}
            onSaveEdit={saveKindnessEdit}
            onCancelEdit={() => {
              setEditingKindnessId(null);
              setKindnessEditDraft(createBlankKindnessDraft());
            }}
          />
        ) : activeView === "studyGrowth" ? (
          <StudyGrowthPanel
            records={visibleStudyGrowthRecords}
            totalCount={studyGrowthTypeCount}
            activeType={studyGrowthType}
            draft={studyGrowthDraft}
            query={studyGrowthQuery}
            editingRecordId={editingStudyGrowthId}
            editingDraft={studyGrowthEditDraft}
            saveStatus={projectSaveStatus}
            onTypeChange={changeStudyGrowthType}
            onDraftChange={setStudyGrowthDraft}
            onAdd={addStudyGrowthRecord}
            onQueryChange={setStudyGrowthQuery}
            onStartEdit={startStudyGrowthEdit}
            onEditDraftChange={setStudyGrowthEditDraft}
            onSaveEdit={saveStudyGrowthEdit}
            onCancelEdit={() => {
              setEditingStudyGrowthId(null);
              setStudyGrowthEditDraft({ ...blankStudyGrowthEditDraft, type: studyGrowthType });
            }}
          />
        ) : activeView === "skincare" ? (
          <SkincarePanel
            products={visibleSkincareProducts}
            totalCount={activeData.skincareProducts.length}
            draft={skincareDraft}
            query={skincareQuery}
            categoryFilter={skincareCategoryFilter}
            editingProductId={editingSkincareId}
            editingDraft={skincareEditDraft}
            saveStatus={projectSaveStatus}
            onDraftChange={setSkincareDraft}
            onAdd={addSkincareProduct}
            onQueryChange={setSkincareQuery}
            onCategoryFilterChange={setSkincareCategoryFilter}
            onStartEdit={startSkincareEdit}
            onEditDraftChange={setSkincareEditDraft}
            onSaveEdit={saveSkincareEdit}
            onCancelEdit={() => { setEditingSkincareId(null); setSkincareEditDraft(blankSkincareDraft); }}
          />
        ) : activeView === "reward" ? (
          <RewardPanel
            rules={visibleRewardRules}
            claims={visibleRewardClaims}
            allClaims={activeData.rewardClaims}
            claimMonths={rewardClaimMonths}
            currentClaims={currentRewardClaims}
            todayDay={todayDay}
            monthRewardCents={rewardTotals.monthCents}
            totalRewardCents={rewardTotals.totalCents}
            ruleDraft={rewardRuleDraft}
            ruleQuery={rewardRuleQuery}
            ruleStatusFilter={rewardRuleStatusFilter}
            editingRuleId={editingRewardRuleId}
            editingDraft={rewardRuleEditDraft}
            claimQuery={rewardClaimQuery}
            claimMonthFilter={rewardClaimMonthFilter}
            saveStatus={projectSaveStatus}
            onRuleDraftChange={setRewardRuleDraft}
            onAddRule={addRewardRule}
            onRuleQueryChange={setRewardRuleQuery}
            onRuleStatusFilterChange={setRewardRuleStatusFilter}
            onStartEditRule={startRewardRuleEdit}
            onEditDraftChange={setRewardRuleEditDraft}
            onSaveRule={saveRewardRule}
            onCancelEdit={() => { setEditingRewardRuleId(null); setRewardRuleEditDraft(createBlankRewardRuleDraft()); }}
            onToggleRule={toggleRewardRule}
            onReorderRule={reorderRewardRule}
            onClaim={claimReward}
            onClaimQueryChange={setRewardClaimQuery}
            onClaimMonthFilterChange={setRewardClaimMonthFilter}
            onDeleteClaim={deleteRewardClaim}
          />
        ) : activeView === "learnedContents" ? (
          <LearnedContentsPanel
            records={visibleLearnedContents}
            totalCount={activeData.learnedContents.length}
            stats={learnedContentStats}
            months={learnedContentMonths}
            draft={learnedContentDraft}
            query={learnedContentQuery}
            typeFilter={learnedContentTypeFilter}
            monthFilter={learnedContentMonthFilter}
            editingRecordId={editingLearnedContentId}
            editingDraft={learnedContentEditDraft}
            saveStatus={projectSaveStatus}
            onDraftChange={setLearnedContentDraft}
            onAdd={addLearnedContent}
            onQueryChange={setLearnedContentQuery}
            onTypeFilterChange={setLearnedContentTypeFilter}
            onMonthFilterChange={setLearnedContentMonthFilter}
            onStartEdit={startLearnedContentEdit}
            onEditDraftChange={setLearnedContentEditDraft}
            onSaveEdit={saveLearnedContentEdit}
            onCancelEdit={() => { setEditingLearnedContentId(null); setLearnedContentEditDraft(createBlankLearnedContentDraft()); }}
            onDelete={deleteLearnedContent}
          />
        ) : (
          <DeliveryPanel
            tasks={deliveryTasks}
            deliveryColumns={deliveryStatusColumns}
            query={deliveryQuery}
            draft={deliveryDraft}
            editingTaskId={editingDeliveryId}
            editingDraft={deliveryEditDraft}
            platforms={deliveryPlatforms}
            saveStatus={projectSaveStatus}
            onQueryChange={setDeliveryQuery}
            onDraftChange={setDeliveryDraft}
            onAdd={addDelivery}
            onStatusChange={changeDeliveryStatus}
            onStartEdit={startDeliveryEdit}
            onEditDraftChange={setDeliveryEditDraft}
            onSaveEdit={saveDeliveryEdit}
            onCancelEdit={() => {
              setEditingDeliveryId(null);
              setDeliveryEditDraft({ sequence: "", name: "", platform: "", note: "", purchased_at: "" });
            }}
            onDelete={deleteDelivery}
          />
        )}
      </section>

      {editingTask && <EditDialog task={editingTask.task} tags={tags} onClose={() => setEditingTask(null)} onSave={saveTask} />}
      {showDailyHistory && (
        <HistoryDialog
          title="每日历史查询"
          emptyTitle="还没有每日历史记录"
          emptyText="添加每日待办或真棒记录后，这里会出现历史日期"
          dailyEntries={dailyHistoryEntries}
          dailyData={activeData}
          initialDailyDay={currentDay}
          onClose={() => setShowDailyHistory(false)}
          onDailyJump={(day) => {
            setDay(fromDateKey(day));
            setShowDailyHistory(false);
          }}
        />
      )}
      {showMonthlyHistory && (
        <HistoryDialog
          title="每月历史查询"
          emptyTitle="还没有每月历史记录"
          emptyText="添加每月待办后，这里会出现历史月份"
          monthlyEntries={monthlyHistoryEntries}
          onClose={() => setShowMonthlyHistory(false)}
          onMonthlyJump={(month) => {
            setMonth(fromMonthKey(month));
            setShowMonthlyHistory(false);
          }}
        />
      )}
      {showSettings && (
        <SettingsDialog
          tags={tags}
          defaultTasks={defaultTasks}
          deliveryPlatforms={deliveryPlatforms}
          onClose={() => setShowSettings(false)}
          onAddTag={addTag}
          onUpdateTag={updateTag}
          onDeleteTag={deleteTag}
          onAddDefaultTask={addDefaultTask}
          onUpdateDefaultTask={updateDefaultTask}
          onDeleteDefaultTask={deleteDefaultTask}
          onAddDeliveryPlatform={addDeliveryPlatform}
          onUpdateDeliveryPlatform={updateDeliveryPlatform}
          onDeleteDeliveryPlatform={deleteDeliveryPlatform}
        />
      )}
    </main>
  );
}

const emptyData: TodoData = {
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

function parseRewardAmount(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function parseRewardRuleValues(draft: RewardRuleDraft): { amountCents: number | null; tiers: RewardTier[] } | null {
  if (draft.mode === "fixed") {
    const amountCents = parseRewardAmount(draft.amount);
    return amountCents === null ? null : { amountCents, tiers: [] };
  }
  if (draft.tiers.length < 2) return null;
  const tiers = draft.tiers.map((tier) => ({ name: tier.name.trim(), amount_cents: parseRewardAmount(tier.amount) }));
  if (tiers.some((tier) => !tier.name || tier.amount_cents === null)) return null;
  const normalized = tiers as RewardTier[];
  if (normalized.some((tier, index) => index > 0 && tier.amount_cents <= normalized[index - 1].amount_cents)) return null;
  return { amountCents: null, tiers: normalized };
}

function matchesFilters(task: TodoTask, filters: Filters): boolean {
  if (filters.status !== "all" && String(task.status) !== filters.status) return false;
  if (filters.priority !== "all" && task.priority !== filters.priority) return false;
  if (filters.tag !== -1 && task.tag !== filters.tag) return false;
  const query = filters.query.trim().toLowerCase();
  if (query && !`${task.text} ${task.description}`.toLowerCase().includes(query)) return false;
  return true;
}

function isUnfilteredTaskView(filters: Filters): boolean {
  return filters.status === "all" && filters.priority === "all" && filters.tag === -1 && !filters.query.trim();
}

function parseDeliverySequence(value: string): number | null {
  const normalized = value.trim();
  if (!/^-?[1-9]\d*$/.test(normalized)) return null;
  const sequence = Number(normalized);
  return Number.isSafeInteger(sequence) ? sequence : null;
}

function isUndoRedoShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase();
  const modifier = event.ctrlKey || event.metaKey;
  return modifier && (key === "y" || key === "z");
}

function isFormField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
}

function toLocalDateTime(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
