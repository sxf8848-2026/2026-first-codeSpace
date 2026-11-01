import {
  DefaultTask,
  Priority,
  STATUS_DONE,
  STATUS_IN_PROGRESS,
  STATUS_TODO,
  TagId,
  TagTone,
  TaskStatus,
  TodoTag,
} from "./types";
import { DEFAULT_DELIVERY_PLATFORMS } from "./services/deliveryPlatforms";

export const DATA_VERSION = 42;

export const TAG_TONES: Array<{ value: TagTone; label: string }> = [
  { value: "neutral", label: "灰" },
  { value: "green", label: "绿" },
  { value: "blue", label: "蓝" },
  { value: "amber", label: "黄" },
];

export const TAGS: TodoTag[] = [
  { id: 0, name: "未分类", tone: "neutral" },
  { id: 1, name: "生活", tone: "green" },
  { id: 2, name: "学习", tone: "blue" },
  { id: 3, name: "工作", tone: "amber" },
];

export const DELIVERY_PLATFORMS = DEFAULT_DELIVERY_PLATFORMS;

export const STATUSES: Array<{ value: TaskStatus; label: string }> = [
  { value: STATUS_TODO, label: "未完成" },
  { value: STATUS_IN_PROGRESS, label: "进行中" },
  { value: STATUS_DONE, label: "已完成" },
];

export const PRIORITIES: Array<{ value: Priority; label: string }> = [
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

export const DEFAULT_TASKS: DefaultTask[] = [
  { text: "起床", tag: 1 as TagId, priority: "medium" as Priority },
  { text: "洗脸", tag: 1 as TagId, priority: "medium" as Priority },
  { text: "刷牙", tag: 1 as TagId, priority: "medium" as Priority },
  { text: "喝水", tag: 1 as TagId, priority: "medium" as Priority },
  { text: "护肤", tag: 1 as TagId, priority: "medium" as Priority },
  { text: "吃早饭", tag: 1 as TagId, priority: "medium" as Priority },
  { text: "吃水果", tag: 1 as TagId, priority: "medium" as Priority },
];
