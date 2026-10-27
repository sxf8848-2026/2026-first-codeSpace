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

const validVideoNote = {
  id: "video-note-1",
  title: "关于长期主义",
  quote: "慢就是快",
  reflection: "持续行动比短期冲刺更重要",
  source: "抖音 · 某账号",
  url: "https://example.com/note",
  pinned: false,
  created_at: "2026-10-20T08:20:00.000Z",
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

const validDivorcePlan = {
  id: "divorce-plan-1",
  title: "居住安排沟通",
  occurred_at: "2026-10-16T20:30",
  content: "讨论后续居住安排和需要继续确认的问题。",
  created_at: "2026-10-16T20:40:00.000Z",
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

const validKindnessRecord = {
  id: "kindness-1",
  title: "帮助同事排查问题",
  occurred_at: "2026-10-20T09:30",
  content: "一起定位并解决了接口报错。",
  created_at: "2026-10-20T09:40:00.000Z",
};

const validStudyGrowthRecord = {
  id: "study-growth-1",
  type: "method",
  title: "费曼学习法",
  content: "用自己的话解释知识点。",
  source: "学习笔记",
  created_at: "2026-10-26T08:00:00.000Z",
  updated_at: "2026-10-26T08:00:00.000Z",
};

const validSkincareProduct = {
  id: "skin-1",
  name: "修护精华",
  brand: "品牌甲",
  category: "serum",
  description: "晚间使用",
  created_at: "2026-10-27T08:00:00.000Z",
  updated_at: "2026-10-27T08:00:00.000Z",
};

const validRewardRule = {
  id: "reward-rule-1",
  name: "早起早睡",
  amount_cents: 200,
  description: "当天按计划作息",
  active: true,
  created_at: "2026-10-27T08:00:00.000Z",
  updated_at: "2026-10-27T08:00:00.000Z",
};

const validRewardClaim = {
  id: "reward-claim-1",
  rule_id: "reward-rule-1",
  rule_name: "早起早睡",
  amount_cents: 200,
  claimed_at: "2026-10-27T07:30",
};

function makeTodosPayload(overrides = {}) {
  return {
    version: 29,
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
    videoNotes: [validVideoNote],
    workExperiences: [validWorkExperience],
    dailyReadings: [validDailyReading],
    argumentReflections: [validArgumentReflection],
    divorcePlans: [validDivorcePlan],
    books: [validBook],
    kindnessRecords: [validKindnessRecord],
    studyGrowthRecords: [validStudyGrowthRecord],
    skincareProducts: [validSkincareProduct],
    rewardRules: [validRewardRule],
    rewardClaims: [validRewardClaim],
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

test("rejects todos payload without videoNotes", () => {
  const payload = makeTodosPayload();
  delete payload.videoNotes;
  assert.equal(isValidTodosPayload(payload), false);
});

test("accepts video note with only a quote or only a reflection", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ videoNotes: [{ ...validVideoNote, reflection: "" }] })), true);
  assert.equal(isValidTodosPayload(makeTodosPayload({ videoNotes: [{ ...validVideoNote, quote: "" }] })), true);
});

test("rejects video note with empty title", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ videoNotes: [{ ...validVideoNote, title: " " }] })), false);
});

test("rejects video note without a quote or reflection", () => {
  assert.equal(
    isValidTodosPayload(makeTodosPayload({ videoNotes: [{ ...validVideoNote, quote: " ", reflection: " " }] })),
    false,
  );
});

test("rejects video note with invalid pinned type", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ videoNotes: [{ ...validVideoNote, pinned: "yes" }] })), false);
});

test("rejects video note with invalid archived_at type", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ videoNotes: [{ ...validVideoNote, archived_at: false }] })), false);
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

test("rejects todos payload without divorcePlans", () => {
  const payload = makeTodosPayload();
  delete payload.divorcePlans;
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

test("rejects divorce plan with empty title", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ divorcePlans: [{ ...validDivorcePlan, title: " " }] })), false);
});

test("rejects divorce plan with invalid occurred_at", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ divorcePlans: [{ ...validDivorcePlan, occurred_at: "2026-10-16 20:30" }] })), false);
});

test("rejects divorce plan with empty content", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ divorcePlans: [{ ...validDivorcePlan, content: " " }] })), false);
});

test("rejects divorce plan with invalid archived_at", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ divorcePlans: [{ ...validDivorcePlan, archived_at: false }] })), false);
});

test("accepts a valid kindness record", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ kindnessRecords: [validKindnessRecord] })), true);
});

test("rejects todos payload without kindness records", () => {
  const payload = makeTodosPayload();
  delete payload.kindnessRecords;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects kindness record with empty title or content", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ kindnessRecords: [{ ...validKindnessRecord, title: " " }] })), false);
  assert.equal(isValidTodosPayload(makeTodosPayload({ kindnessRecords: [{ ...validKindnessRecord, content: " " }] })), false);
});

test("rejects kindness record with invalid occurred_at or created_at", () => {
  assert.equal(
    isValidTodosPayload(makeTodosPayload({ kindnessRecords: [{ ...validKindnessRecord, occurred_at: "2026-10-20 09:30" }] })),
    false,
  );
  assert.equal(
    isValidTodosPayload(makeTodosPayload({ kindnessRecords: [{ ...validKindnessRecord, created_at: "not-a-date" }] })),
    false,
  );
});

test("accepts a valid study growth record", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ studyGrowthRecords: [validStudyGrowthRecord] })), true);
  assert.equal(isValidTodosPayload(makeTodosPayload({ studyGrowthRecords: [{ ...validStudyGrowthRecord, type: "mental_model" }] })), true);
});

test("rejects todos payload without study growth records", () => {
  const payload = makeTodosPayload();
  delete payload.studyGrowthRecords;
  assert.equal(isValidTodosPayload(payload), false);
});

test("rejects invalid study growth fields", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ studyGrowthRecords: [{ ...validStudyGrowthRecord, type: "other" }] })), false);
  assert.equal(isValidTodosPayload(makeTodosPayload({ studyGrowthRecords: [{ ...validStudyGrowthRecord, title: " " }] })), false);
  assert.equal(isValidTodosPayload(makeTodosPayload({ studyGrowthRecords: [{ ...validStudyGrowthRecord, content: " " }] })), false);
  assert.equal(isValidTodosPayload(makeTodosPayload({ studyGrowthRecords: [{ ...validStudyGrowthRecord, source: null }] })), false);
  assert.equal(isValidTodosPayload(makeTodosPayload({ studyGrowthRecords: [{ ...validStudyGrowthRecord, updated_at: "invalid" }] })), false);
});

test("accepts valid personal management records", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({
    skincareProducts: [validSkincareProduct],
    rewardRules: [validRewardRule],
    rewardClaims: [validRewardClaim],
  })), true);
});

test("rejects missing personal management arrays", () => {
  for (const field of ["skincareProducts", "rewardRules", "rewardClaims"]) {
    const payload = makeTodosPayload();
    delete payload[field];
    assert.equal(isValidTodosPayload(payload), false);
  }
});

test("rejects invalid skincare products", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ skincareProducts: [{ ...validSkincareProduct, name: " " }] })), false);
  assert.equal(isValidTodosPayload(makeTodosPayload({ skincareProducts: [{ ...validSkincareProduct, category: "unknown" }] })), false);
  assert.equal(isValidTodosPayload(makeTodosPayload({ skincareProducts: [{ ...validSkincareProduct, created_at: "invalid" }] })), false);
});

test("rejects invalid reward rules and claims", () => {
  assert.equal(isValidTodosPayload(makeTodosPayload({ rewardRules: [{ ...validRewardRule, amount_cents: 0 }] })), false);
  assert.equal(isValidTodosPayload(makeTodosPayload({ rewardRules: [{ ...validRewardRule, amount_cents: 1.5 }] })), false);
  assert.equal(isValidTodosPayload(makeTodosPayload({ rewardRules: [{ ...validRewardRule, active: "yes" }] })), false);
  assert.equal(isValidTodosPayload(makeTodosPayload({ rewardClaims: [{ ...validRewardClaim, rule_name: " " }] })), false);
  assert.equal(isValidTodosPayload(makeTodosPayload({ rewardClaims: [{ ...validRewardClaim, claimed_at: "2026-10-27" }] })), false);
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
