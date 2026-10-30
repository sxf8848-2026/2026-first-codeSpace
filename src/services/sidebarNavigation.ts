export type SidebarIconName =
  | "dashboard"
  | "habits"
  | "calendar"
  | "delivery"
  | "inspiration"
  | "video"
  | "reading"
  | "learning"
  | "experience"
  | "kindness"
  | "studyGrowth"
  | "skincare"
  | "reward"
  | "learnedContents"
  | "reflection"
  | "divorcePlan";

export type SidebarCountKey = "dashboardCount" | "dailyCount" | "monthlyCount" | "deliveryCount";

type SidebarGroup = {
  label: string;
  items: Array<{
    view: string;
    label: string;
    icon: SidebarIconName;
    count?: SidebarCountKey;
  }>;
};

export const SIDEBAR_PRIMARY_ITEM = {
  view: "dashboard",
  label: "总控台",
  icon: "dashboard",
  count: "dashboardCount",
} as const;

export const SIDEBAR_GROUPS = [
  {
    label: "日常计划",
    items: [
      { view: "habits", label: "习惯打卡", icon: "habits" },
      { view: "daily", label: "每日待办", icon: "calendar", count: "dailyCount" },
      { view: "monthly", label: "每月待办", icon: "calendar", count: "monthlyCount" },
      { view: "delivery", label: "每周快递", icon: "delivery", count: "deliveryCount" },
    ],
  },
  {
    label: "阅读灵感",
    items: [
      { view: "inspiration", label: "灵感记录", icon: "inspiration" },
      { view: "videoInspiration", label: "视频灵感", icon: "video" },
      { view: "videoNotes", label: "刷视频随记", icon: "video" },
      { view: "dailyReading", label: "每日必读文案", icon: "reading" },
      { view: "books", label: "书籍整理", icon: "reading" },
    ],
  },
  {
    label: "成长经验",
    items: [
      { view: "metaLearning", label: "元学习力", icon: "learning" },
      { view: "workExperience", label: "工作经验", icon: "experience" },
      { view: "kindnessRecords", label: "善意足迹", icon: "kindness" },
      { view: "studyGrowth", label: "学会当学霸", icon: "studyGrowth" },
    ],
  },
  {
    label: "私人复盘",
    items: [
      { view: "argumentReflection", label: "吵架整理", icon: "reflection" },
      { view: "divorcePlan", label: "Divorce Plan", icon: "divorcePlan" },
    ],
  },
  {
    label: "个人管理",
    items: [
      { view: "skincare", label: "个人护肤", icon: "skincare" },
      { view: "reward", label: "个人奖励", icon: "reward" },
      { view: "learnedContents", label: "个人已学习", icon: "learnedContents" },
    ],
  },
] as const satisfies readonly SidebarGroup[];

export type SidebarGroupLabel = (typeof SIDEBAR_GROUPS)[number]["label"];
export type AppView = typeof SIDEBAR_PRIMARY_ITEM.view | (typeof SIDEBAR_GROUPS)[number]["items"][number]["view"];

export function getSidebarGroupLabel(view: AppView): SidebarGroupLabel | null {
  return SIDEBAR_GROUPS.find((group) => group.items.some((item) => item.view === view))?.label ?? null;
}
