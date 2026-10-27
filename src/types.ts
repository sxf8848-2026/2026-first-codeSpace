export const STATUS_DONE = 0;
export const STATUS_TODO = 1;
export const STATUS_IN_PROGRESS = 2;

export type TaskStatus = typeof STATUS_DONE | typeof STATUS_TODO | typeof STATUS_IN_PROGRESS;
export type Priority = "high" | "medium" | "low";
export type TagId = number;
export type TagTone = "neutral" | "green" | "blue" | "amber";

export type TodoTag = {
  id: TagId;
  name: string;
  tone: TagTone;
};

export type DefaultTask = {
  text: string;
  tag: TagId;
  priority: Priority;
};

export type TodoTask = {
  id: string;
  text: string;
  status: TaskStatus;
  description: string;
  tag: TagId;
  priority: Priority;
  created_at: string;
  done_at: string | null;
};

export type WeeklyTask = {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
  done_at: string | null;
};

export type AwesomeRecord = {
  id: string;
  text: string;
  created_at: string;
};

export type MonthlyTask = {
  id: string;
  text: string;
  description: string;
  done: boolean;
  created_at: string;
  done_at: string | null;
};

export type WeeklyDelivery = {
  id: string;
  name: string;
  platform: string;
  note: string;
  purchased_at: string;
  picked: boolean;
  created_at: string;
  picked_at: string | null;
};

export type Habit = {
  id: string;
  name: string;
  note: string;
  created_at: string;
  archived_at?: string | null;
};

export type InspirationRecord = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
  archived_at?: string | null;
};

export type MetaLearningMastery = "todo" | "learning" | "mastered" | "skilled";

export type MetaLearningAbility = {
  id: string;
  name: string;
  summary: string;
  usage: string;
  mastery: MetaLearningMastery;
  created_at: string;
  archived_at?: string | null;
};

export type VideoInspirationRecord = {
  id: string;
  channel: string;
  title: string;
  content: string;
  url: string;
  pinned: boolean;
  created_at: string;
  archived_at?: string | null;
};

export type VideoNoteRecord = {
  id: string;
  title: string;
  quote: string;
  reflection: string;
  source: string;
  url: string;
  pinned: boolean;
  created_at: string;
  archived_at?: string | null;
};

export type WorkExperienceRecord = {
  id: string;
  title: string;
  body: string;
  month: string;
  pinned: boolean;
  created_at: string;
  archived_at?: string | null;
};

export type DailyReadingRecord = {
  id: string;
  title: string;
  body: string;
  source: string;
  sort_order: number;
  created_at: string;
  archived_at?: string | null;
};

export type ArgumentReflectionRecord = {
  id: string;
  topic: string;
  occurred_at: string;
  content: string;
  created_at: string;
  archived_at?: string | null;
};

export type DivorcePlanRecord = {
  id: string;
  title: string;
  occurred_at: string;
  content: string;
  created_at: string;
  archived_at?: string | null;
};

export type BookRecord = {
  id: string;
  title: string;
  author: string;
  note: string;
  status: "want_to_read" | "reading" | "read";
  created_at: string;
  updated_at: string;
};

export type KindnessRecord = {
  id: string;
  title: string;
  occurred_at: string;
  content: string;
  created_at: string;
};

export type StudyGrowthType = "method" | "habit" | "mental_model";

export type StudyGrowthRecord = {
  id: string;
  type: StudyGrowthType;
  title: string;
  content: string;
  content_html: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export type SkincareCategory = "cleanser" | "toner" | "serum" | "lotion" | "cream" | "sunscreen" | "mask" | "other";

export type SkincareProductRecord = {
  id: string;
  name: string;
  brand: string;
  category: SkincareCategory;
  description: string;
  created_at: string;
  updated_at: string;
};

export type RewardRuleRecord = {
  id: string;
  name: string;
  amount_cents: number;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type RewardClaimRecord = {
  id: string;
  rule_id: string;
  rule_name: string;
  amount_cents: number;
  claimed_at: string;
};

export type TodoData = {
  version: number;
  todos: Record<string, TodoTask[]>;
  weeklyTodos: Record<string, WeeklyTask[]>;
  awesomeRecords: Record<string, AwesomeRecord[]>;
  monthlyTodos: Record<string, MonthlyTask[]>;
  weeklyDeliveries: Record<string, WeeklyDelivery[]>;
  habits: Habit[];
  habitChecks: Record<string, Record<string, boolean>>;
  inspirations: InspirationRecord[];
  metaLearningAbilities: MetaLearningAbility[];
  videoInspirations: VideoInspirationRecord[];
  videoNotes: VideoNoteRecord[];
  workExperiences: WorkExperienceRecord[];
  dailyReadings: DailyReadingRecord[];
  argumentReflections: ArgumentReflectionRecord[];
  divorcePlans: DivorcePlanRecord[];
  books: BookRecord[];
  kindnessRecords: KindnessRecord[];
  studyGrowthRecords: StudyGrowthRecord[];
  skincareProducts: SkincareProductRecord[];
  rewardRules: RewardRuleRecord[];
  rewardClaims: RewardClaimRecord[];
  default_applied: string[];
};

export type AppPrefs = {
  theme: "light" | "dark";
  tags: TodoTag[];
  defaultTasks: DefaultTask[];
  deliveryPlatforms: string[];
};

export type StatusFilter = "all" | "0" | "1" | "2";
export type PriorityFilter = "all" | Priority;
export type TagFilter = -1 | TagId;

export type Filters = {
  status: StatusFilter;
  priority: PriorityFilter;
  tag: TagFilter;
  query: string;
};

export type TaskDraft = {
  text: string;
  status: TaskStatus;
  tag: TagId;
  priority: Priority;
  description: string;
};
