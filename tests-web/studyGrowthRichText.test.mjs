import assert from "node:assert/strict";
import test from "node:test";
import {
  plainTextToStudyGrowthHtml,
  sanitizeStudyGrowthHtml,
  studyGrowthHtmlToPlainText,
} from "../src/services/studyGrowthRichText.ts";

test("converts plain text to safe rich text with line breaks", () => {
  assert.equal(plainTextToStudyGrowthHtml("第一行\n第二行 <重点>"), "第一行<br>第二行 &lt;重点&gt;");
});

test("keeps bold and fixed colors while removing unsafe markup", () => {
  const html = '<script>alert(1)</script><b>重点</b><font color="#dc2626">红色</font><img src=x onerror=alert(1)>';
  assert.equal(sanitizeStudyGrowthHtml(html), '<strong>重点</strong><span data-color="red">红色</span>');
});

test("normalizes browser color styles to fixed palette colors", () => {
  assert.equal(
    sanitizeStudyGrowthHtml('<span style="color: rgb(37, 99, 235);">蓝色内容</span>'),
    '<span data-color="blue">蓝色内容</span>',
  );
});

test("extracts searchable plain text from formatted content", () => {
  assert.equal(studyGrowthHtmlToPlainText('<strong>费曼</strong><br><span data-color="purple">复述知识</span>'), "费曼\n复述知识");
});
