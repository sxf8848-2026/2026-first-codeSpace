import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  studyGrowthHtmlToMarkdown,
  studyGrowthMarkdownToPlainText,
} from "../src/services/studyGrowthMarkdown.ts";

test("migrates old bold and colored rich text to markdown without losing text", () => {
  assert.equal(
    studyGrowthHtmlToMarkdown('<strong>重点</strong><br><span data-color="red">继续学习</span>'),
    "**重点**\n继续学习",
  );
});

test("extracts searchable plain text from supported markdown", () => {
  const markdown = "# 标题\n\n- **重点**\n- [参考资料](https://example.com)\n\n> 持续行动\n\n```ts\nconst answer = 42;\n```";
  assert.equal(
    studyGrowthMarkdownToPlainText(markdown),
    "标题\n重点\n参考资料\n持续行动\n\nconst answer = 42;",
  );
});

test("markdown editor uses split preview, disables raw html, and stacks on narrow screens", () => {
  const component = readFileSync(new URL("../src/components/StudyGrowthMarkdownEditor.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(component, /skipHtml/);
  assert.match(component, /Markdown 编辑/);
  assert.match(component, /实时预览/);
  assert.match(styles, /\.study-growth-markdown-editor\s*{[^}]*grid-template-columns:\s*repeat\(2/s);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*\.study-growth-markdown-editor\s*{[^}]*grid-template-columns:\s*1fr/s);
});
