import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleWorkExperiences, normalizeWorkExperiences } from "../src/services/workExperiences.ts";

test("sorts visible work experiences by pinned first then newest first", () => {
  const records = getVisibleWorkExperiences([
    {
      id: "old",
      title: "旧经验",
      body: "",
      pinned: false,
      created_at: "2026-09-10T08:00:00.000Z",
      archived_at: null,
    },
    {
      id: "pinned",
      title: "置顶经验",
      body: "",
      pinned: true,
      created_at: "2026-09-09T08:00:00.000Z",
      archived_at: null,
    },
    {
      id: "new",
      title: "新经验",
      body: "",
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
        pinned: false,
        created_at: "2026-09-11T08:00:00.000Z",
        archived_at: null,
      },
      {
        id: "deploy",
        title: "发布检查",
        body: "回滚方案必须明确",
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
      pinned: true,
      created_at: "2026-09-11T08:00:00.000Z",
      archived_at: "2026-09-12T08:00:00.000Z",
    },
  ]);

  assert.deepEqual(records, []);
});

test("normalizes old todo data without work experiences", () => {
  assert.deepEqual(normalizeWorkExperiences(undefined), []);
});
