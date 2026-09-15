import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleWorkExperiences, getWorkExperienceMonths, normalizeWorkExperiences } from "../src/services/workExperiences.ts";

test("sorts visible work experiences by pinned first then newest first", () => {
  const records = getVisibleWorkExperiences([
    {
      id: "old",
      title: "旧经验",
      body: "",
      month: "2026-09",
      pinned: false,
      created_at: "2026-09-10T08:00:00.000Z",
      archived_at: null,
    },
    {
      id: "pinned",
      title: "置顶经验",
      body: "",
      month: "2026-09",
      pinned: true,
      created_at: "2026-09-09T08:00:00.000Z",
      archived_at: null,
    },
    {
      id: "new",
      title: "新经验",
      body: "",
      month: "2026-09",
      pinned: false,
      created_at: "2026-09-11T08:00:00.000Z",
      archived_at: null,
    },
  ]);

  assert.deepEqual(
    records.map((record) => record.id),
    ["pinned", "new", "old"],
  );
});

test("filters work experiences by title or body", () => {
  const records = getVisibleWorkExperiences(
    [
      {
        id: "review",
        title: "需求评审经验",
        body: "提前列出风险点",
        month: "2026-09",
        pinned: false,
        created_at: "2026-09-11T08:00:00.000Z",
        archived_at: null,
      },
      {
        id: "deploy",
        title: "发布检查",
        body: "回滚方案必须明确",
        month: "2026-10",
        pinned: false,
        created_at: "2026-09-12T08:00:00.000Z",
        archived_at: null,
      },
    ],
    "风险",
  );

  assert.deepEqual(
    records.map((record) => record.id),
    ["review"],
  );
});

test("does not show archived work experiences", () => {
  const records = getVisibleWorkExperiences([
    {
      id: "archived",
      title: "已归档经验",
      body: "",
      month: "2026-09",
      pinned: true,
      created_at: "2026-09-11T08:00:00.000Z",
      archived_at: "2026-09-12T08:00:00.000Z",
    },
  ]);

  assert.deepEqual(records, []);
});

test("filters work experiences by month", () => {
  const records = getVisibleWorkExperiences(
    [
      {
        id: "sep",
        title: "九月经验",
        body: "",
        month: "2026-09",
        pinned: false,
        created_at: "2026-09-11T08:00:00.000Z",
        archived_at: null,
      },
      {
        id: "oct",
        title: "十月经验",
        body: "",
        month: "2026-10",
        pinned: false,
        created_at: "2026-10-11T08:00:00.000Z",
        archived_at: null,
      },
    ],
    "",
    "2026-09",
  );

  assert.deepEqual(
    records.map((record) => record.id),
    ["sep"],
  );
});

test("collects work experience months from unarchived records", () => {
  assert.deepEqual(
    getWorkExperienceMonths([
      {
        id: "sep",
        title: "九月经验",
        body: "",
        month: "2026-09",
        pinned: false,
        created_at: "2026-09-11T08:00:00.000Z",
        archived_at: null,
      },
      {
        id: "oct",
        title: "十月经验",
        body: "",
        month: "2026-10",
        pinned: false,
        created_at: "2026-10-11T08:00:00.000Z",
        archived_at: null,
      },
      {
        id: "archived",
        title: "归档经验",
        body: "",
        month: "2026-11",
        pinned: false,
        created_at: "2026-11-11T08:00:00.000Z",
        archived_at: "2026-11-12T08:00:00.000Z",
      },
    ]),
    ["2026-10", "2026-09"],
  );
});

test("normalizes old work experiences with month from created_at", () => {
  assert.deepEqual(
    normalizeWorkExperiences(
      [
        {
          id: "legacy",
          title: "旧经验",
          body: "",
          pinned: false,
          created_at: "2026-08-11T08:00:00.000Z",
          archived_at: null,
        },
      ],
      () => "generated",
      () => "2026-09-15T08:00:00.000Z",
    ).map((record) => record.month),
    ["2026-08"],
  );
});

test("normalizes old todo data without work experiences", () => {
  assert.deepEqual(normalizeWorkExperiences(undefined), []);
});
