import assert from "node:assert/strict";
import test from "node:test";
import { isValidPrefsPayload, isValidTodosPayload } from "../server/schema.mjs";

const validTodo = {
  id: "task-1",
  text: "起床",
  status: 1,
  priority: "medium",
  tag: 1,
  description: "",
  created_at: "2026-09-12 08:00",
  done_at: null,
};

const validWeeklyTask = {
  id: "weekly-1",
  text: "完成周总结",
  done: false,
  created_at: "2026-09-12 08:00",
  done_at: null,
};

const validAwesomeRecord = {
  id: "awesome-1",
  text: "完成了一次很顺的重构",
  created_at: "2026-09-12 08:30",
};

const validMonthlyTask = {
  id: "monthly-1",
  text: "完成月度总结",
  description: "整理本月关键成果和待改进项",
  done: false,
  created_at: "2026-09-12 08:40",
  done_at: null,
};

const validWeeklyDelivery = {
  id: "delivery-1",
  name: "技术书籍",
  platform: "京东",
  note: "到站后周末去取",
  purchased_at: "2026-09-13",
  picked: false,
  created_at: "2026-09-13 09:00",
  picked_at: null,
};

const validHabit = {
  id: "habit-1",
  name: "阅读",
  note: "每天至少 10 分钟",
  created_at: "2026-09-13 09:10",
  archived_at: null,
};

const validInspiration = {
  id: "inspiration-1",
  title: "灵感标题",
  body: "这里记录正文",
  pinned: false,
  created_at: "2026-09-14T08:00:00.000Z",
  archived_at: null,
};

const validMetaLearningAbility = {
  id: "meta-learning-1",
  name: "费曼学习法",
  summary: "用自己的话解释概念",
  usage: "用于检验是否真正理解知识点",
  mastery: "mastered",
  created_at: "2026-09-14T08:10:00.000Z",
  archived_at: null,
};

const validVideoInspiration = {
  id: "video-inspiration-1",
  channel: "B站",
  title: "高价值视频",
  content: "这里整理视频内容",
  url: "https://example.com/video",
  pinned: false,
  created_at: "2026-09-14T08:20:00.000Z",
  archived_at: null,
};

const validWorkExperience = {
  id: "work-experience-1",
  title: "需求评审经验",
  body: "提前列出风险点和验收口径",
  month: "2026-09",
  pinned: false,
  created_at: "2026-09-15T08:30:00.000Z",
  archived_at: null,
};

const validDailyReading = {
  id: "daily-reading-1",
  title: "保持清醒",
  body: "把注意力放回当下能做的事情。",
  source: "个人笔记",
  sort_order: 1,
  created_at: "2026-09-17T08:00:00.000Z",
  archived_at: null,
};

const validArgumentReflection = {
  id: "argument-reflection-1",
  topic: "沟通节奏不同",
  occurred_at: "2026-09-18T20:30",
  content: "讨论安排时彼此打断。下次先复述对方的重点，再表达自己的需求。",
  created_at: "2026-09-18T20:40:00.000Z",
  archived_at: null,
};

const validBook = {
  id: "book-1",
  title: "原则",
  author: "瑞·达利欧",
  note: "记录值得回看的观点",
  status: "want_to_read",
  created_at: "2026-09-19T08:00:00.000Z",
  updated_at: "2026-09-19T08:00:00.000Z",
};

function makeTodosPayload(overrides = {}) {
  return {
    version: 21,
    todos: {
      "2026-09-12": [validTodo],
    },
    weeklyTodos: {
      "2026-09-07": [validWeeklyTask],
    },
    awesomeRecords: {
      "2026-09-12": [validAwesomeRecord],
    },
    monthlyTodos: {
      "2026-09": [validMonthlyTask],
    },
    weeklyDeliveries: {
      "2026-09-07": [validWeeklyDelivery],
    },
    habits: [validHabit],
    habitChecks: {
      "2026-09-13": {
        "habit-1": true,
      },
    },
    inspirations: [validInspiration],
    metaLearningAbilities: [validMetaLearningAbility],
    videoInspirations: [validVideoInspiration],
    workExperiences: [validWorkExperience],
    dailyReadings: [validDailyReading],
    argumentReflections: [validArgumentReflection],
    books: [validBook],
    default_applied: ["2026-09-12"],
    ...overrides,
  };
}

test("validates todos payload with awesome records", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload()), true);
});

test("accepts old daily reading cursor fields for backward compatibility", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ dailyReadingCursorId: "legacy-reading" })), true);
});

test("rejects todos payload without awesomeRecords", () => {
  const payload = makeTodosPayload();
  delete payload.awesomeRecords;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects awesome records grouped by invalid day key", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        awesomeRecords: {
          today: [validAwesomeRecord],
        },
      }),
    ),
    false,
  );
});

test("rejects empty awesome record text", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        awesomeRecords: {
          "2026-09-12": [{ ...validAwesomeRecord, text: " " }],
        },
      }),
    ),
    false,
  );
});

test("rejects todos payload without monthlyTodos", () => {
  const payload = makeTodosPayload();
  delete payload.monthlyTodos;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects monthly todos grouped by invalid month key", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        monthlyTodos: {
          "2026-09-12": [validMonthlyTask],
        },
      }),
    ),
    false,
  );
});

test("rejects empty monthly todo title", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        monthlyTodos: {
          "2026-09": [{ ...validMonthlyTask, text: " " }],
        },
      }),
    ),
    false,
  );
});

test("rejects monthly todo with invalid done type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        monthlyTodos: {
          "2026-09": [{ ...validMonthlyTask, done: "no" }],
        },
      }),
    ),
    false,
  );
});

test("rejects todos payload without weeklyDeliveries", () => {
  const payload = makeTodosPayload();
  delete payload.weeklyDeliveries;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects weekly deliveries grouped by invalid week key", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        weeklyDeliveries: {
          thisWeek: [validWeeklyDelivery],
        },
      }),
    ),
    false,
  );
});

test("rejects empty weekly delivery name", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        weeklyDeliveries: {
          "2026-09-07": [{ ...validWeeklyDelivery, name: " " }],
        },
      }),
    ),
    false,
  );
});

test("rejects empty weekly delivery platform", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        weeklyDeliveries: {
          "2026-09-07": [{ ...validWeeklyDelivery, platform: " " }],
        },
      }),
    ),
    false,
  );
});

test("rejects weekly delivery with invalid picked type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        weeklyDeliveries: {
          "2026-09-07": [{ ...validWeeklyDelivery, picked: "no" }],
        },
      }),
    ),
    false,
  );
});

test("rejects weekly delivery without purchased_at", () => {
  const delivery = { ...validWeeklyDelivery };
  delete delivery.purchased_at;
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        weeklyDeliveries: {
          "2026-09-07": [delivery],
        },
      }),
    ),
    false,
  );
});

test("rejects weekly delivery with invalid purchased_at", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        weeklyDeliveries: {
          "2026-09-07": [{ ...validWeeklyDelivery, purchased_at: false }],
        },
      }),
    ),
    false,
  );
});

test("rejects todos payload without habits", () => {
  const payload = makeTodosPayload();
  delete payload.habits;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects empty habit name", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        habits: [{ ...validHabit, name: " " }],
      }),
    ),
    false,
  );
});

test("rejects habit without note", () => {
  const habit = { ...validHabit };
  delete habit.note;
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        habits: [habit],
      }),
    ),
    false,
  );
});

test("rejects habit with invalid note type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        habits: [{ ...validHabit, note: null }],
      }),
    ),
    false,
  );
});

test("rejects habit with invalid archived_at type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        habits: [{ ...validHabit, archived_at: false }],
      }),
    ),
    false,
  );
});

test("rejects todos payload without habitChecks", () => {
  const payload = makeTodosPayload();
  delete payload.habitChecks;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects habit checks grouped by invalid day key", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        habitChecks: {
          today: {
            "habit-1": true,
          },
        },
      }),
    ),
    false,
  );
});

test("rejects habit check with invalid checked type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        habitChecks: {
          "2026-09-13": {
            "habit-1": "yes",
          },
        },
      }),
    ),
    false,
  );
});

test("rejects todos payload without inspirations", () => {
  const payload = makeTodosPayload();
  delete payload.inspirations;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects empty inspiration title", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        inspirations: [{ ...validInspiration, title: " " }],
      }),
    ),
    false,
  );
});

test("rejects inspiration with invalid body type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        inspirations: [{ ...validInspiration, body: null }],
      }),
    ),
    false,
  );
});

test("rejects inspiration with invalid pinned type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        inspirations: [{ ...validInspiration, pinned: "yes" }],
      }),
    ),
    false,
  );
});

test("rejects inspiration with invalid archived_at type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        inspirations: [{ ...validInspiration, archived_at: false }],
      }),
    ),
    false,
  );
});

test("rejects todos payload without metaLearningAbilities", () => {
  const payload = makeTodosPayload();
  delete payload.metaLearningAbilities;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects empty meta learning ability name", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        metaLearningAbilities: [{ ...validMetaLearningAbility, name: " " }],
      }),
    ),
    false,
  );
});

test("rejects meta learning ability with missing summary", () => {
  const ability = { ...validMetaLearningAbility };
  delete ability.summary;
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        metaLearningAbilities: [ability],
      }),
    ),
    false,
  );
});

test("rejects meta learning ability with invalid mastery", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        metaLearningAbilities: [{ ...validMetaLearningAbility, mastery: "expert" }],
      }),
    ),
    false,
  );
});

test("rejects meta learning ability with invalid archived_at type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        metaLearningAbilities: [{ ...validMetaLearningAbility, archived_at: false }],
      }),
    ),
    false,
  );
});

test("rejects todos payload without videoInspirations", () => {
  const payload = makeTodosPayload();
  delete payload.videoInspirations;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects empty video inspiration channel", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        videoInspirations: [{ ...validVideoInspiration, channel: " " }],
      }),
    ),
    false,
  );
});

test("rejects empty video inspiration title", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        videoInspirations: [{ ...validVideoInspiration, title: " " }],
      }),
    ),
    false,
  );
});

test("rejects video inspiration with missing content", () => {
  const record = { ...validVideoInspiration };
  delete record.content;
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        videoInspirations: [record],
      }),
    ),
    false,
  );
});

test("rejects video inspiration with invalid pinned type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        videoInspirations: [{ ...validVideoInspiration, pinned: "yes" }],
      }),
    ),
    false,
  );
});

test("rejects video inspiration with invalid archived_at type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        videoInspirations: [{ ...validVideoInspiration, archived_at: false }],
      }),
    ),
    false,
  );
});

test("rejects todos payload without workExperiences", () => {
  const payload = makeTodosPayload();
  delete payload.workExperiences;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects empty work experience title", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        workExperiences: [{ ...validWorkExperience, title: " " }],
      }),
    ),
    false,
  );
});

test("rejects work experience with missing body", () => {
  const record = { ...validWorkExperience };
  delete record.body;
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        workExperiences: [record],
      }),
    ),
    false,
  );
});

test("rejects work experience with empty body", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        workExperiences: [{ ...validWorkExperience, body: " " }],
      }),
    ),
    false,
  );
});

test("rejects work experience with missing month", () => {
  const record = { ...validWorkExperience };
  delete record.month;
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        workExperiences: [record],
      }),
    ),
    false,
  );
});

test("rejects work experience with invalid month", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        workExperiences: [{ ...validWorkExperience, month: "2026-9" }],
      }),
    ),
    false,
  );
});

test("rejects work experience with invalid pinned type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        workExperiences: [{ ...validWorkExperience, pinned: "yes" }],
      }),
    ),
    false,
  );
});

test("rejects work experience with invalid archived_at type", () => {
  assert.equal(
    isValidTodosPayload(
      makeTodosPayload({
        workExperiences: [{ ...validWorkExperience, archived_at: false }],
      }),
    ),
    false,
  );
});

test("rejects todos payload without daily readings", () => {
  const payload = makeTodosPayload();
  delete payload.dailyReadings;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects daily reading with empty title", () => {
  assert.equal(
    isValidTodosPayload(makeTodosPayload({ dailyReadings: [{ ...validDailyReading, title: " " }] })),
    false,
  );
});

test("rejects daily reading with empty body", () => {
  assert.equal(
    isValidTodosPayload(makeTodosPayload({ dailyReadings: [{ ...validDailyReading, body: " " }] })),
    false,
  );
});

test("rejects daily reading with invalid source", () => {
  assert.equal(
    isValidTodosPayload(makeTodosPayload({ dailyReadings: [{ ...validDailyReading, source: false }] })),
    false,
  );
});

test("rejects daily reading with invalid archived_at", () => {
  assert.equal(
    isValidTodosPayload(makeTodosPayload({ dailyReadings: [{ ...validDailyReading, archived_at: false }] })),
    false,
  );
});

test("rejects daily reading with invalid sort order", () => {
  assert.equal(
    isValidTodosPayload(makeTodosPayload({ dailyReadings: [{ ...validDailyReading, sort_order: 0 }] })),
    false,
  );
});

test("rejects todos payload without argumentReflections", () => {
  const payload = makeTodosPayload();
  delete payload.argumentReflections;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects todos payload without books", () => {
  const payload = makeTodosPayload();
  delete payload.books;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects book with empty title", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ books: [{ ...validBook, title: " " }] })), false);
});

test("rejects book with invalid status", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ books: [{ ...validBook, status: "finished" }] })), false);
});

test("rejects book with invalid updated_at", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ books: [{ ...validBook, updated_at: false }] })), false);
});

test("rejects argument reflection with empty topic", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ argumentReflections: [{ ...validArgumentReflection, topic: " " }] })), false);
});

test("rejects argument reflection with invalid occurred_at", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ argumentReflections: [{ ...validArgumentReflection, occurred_at: "2026-09-18 20:30" }] })), false);
});

test("rejects argument reflection with empty content", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ argumentReflections: [{ ...validArgumentReflection, content: " " }] })), false);
});

test("rejects argument reflection with invalid content type", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ argumentReflections: [{ ...validArgumentReflection, content: false }] })), false);
});

test("rejects argument reflection with invalid archived_at", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ argumentReflections: [{ ...validArgumentReflection, archived_at: false }] })), false);
});

test("validates prefs payload", () => {
  assert.equal(
    isValidPrefsPayload({
      theme: "light",
      tags: [{ id: 0, name: "未分类", tone: "neutral" }],
      defaultTasks: [{ text: "喝水", tag: 1, priority: "medium" }],
      deliveryPlatforms: ["淘宝", "京东"],
    }),
    true,
  );
});

test("rejects invalid prefs theme", () => {
  assert.equal(
    isValidPrefsPayload({
      theme: "blue",
      tags: [{ id: 0, name: "未分类", tone: "neutral" }],
      defaultTasks: [{ text: "喝水", tag: 1, priority: "medium" }],
      deliveryPlatforms: ["淘宝"],
    }),
    false,
  );
});

test("rejects prefs without delivery platforms", () => {
  assert.equal(
    isValidPrefsPayload({
      theme: "light",
      tags: [{ id: 0, name: "未分类", tone: "neutral" }],
      defaultTasks: [{ text: "喝水", tag: 1, priority: "medium" }],
    }),
    false,
  );
});

test("rejects prefs with empty delivery platform", () => {
  assert.equal(
    isValidPrefsPayload({
      theme: "light",
      tags: [{ id: 0, name: "未分类", tone: "neutral" }],
      defaultTasks: [{ text: "喝水", tag: 1, priority: "medium" }],
      deliveryPlatforms: ["淘宝", " "],
    }),
    false,
  );
});
