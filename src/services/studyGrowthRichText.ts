export type StudyGrowthTextColor = "black" | "red" | "blue" | "green" | "orange" | "purple";

export const STUDY_GROWTH_TEXT_COLORS: ReadonlyArray<readonly [StudyGrowthTextColor, string, string]> = [
  ["black", "黑色", "#111827"],
  ["red", "红色", "#dc2626"],
  ["blue", "蓝色", "#2563eb"],
  ["green", "绿色", "#15803d"],
  ["orange", "橙色", "#ea580c"],
  ["purple", "紫色", "#7e22ce"],
];

const colorAliases = new Map<string, StudyGrowthTextColor>([
  ...STUDY_GROWTH_TEXT_COLORS.flatMap(([name, , hex]) => [[name, name], [hex, name]] as Array<[string, StudyGrowthTextColor]>),
  ["rgb(17, 24, 39)", "black"],
  ["rgb(220, 38, 38)", "red"],
  ["rgb(37, 99, 235)", "blue"],
  ["rgb(21, 128, 61)", "green"],
  ["rgb(234, 88, 12)", "orange"],
  ["rgb(126, 34, 206)", "purple"],
]);

export function plainTextToStudyGrowthHtml(text: string): string {
  return escapeHtml(text).replace(/\r?\n/g, "<br>");
}

export function sanitizeStudyGrowthHtml(raw: string): string {
  const source = raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  const tokens = source.match(/<[^>]*>|[^<]+/g) ?? [];
  const stack: Array<"strong" | "span"> = [];
  let output = "";

  const closeTag = (expected: "strong" | "span") => {
    const index = stack.lastIndexOf(expected);
    if (index < 0) return;
    while (stack.length > index) output += `</${stack.pop()}>`;
  };

  for (const token of tokens) {
    if (!token.startsWith("<")) {
      output += escapeHtml(decodeHtml(token));
      continue;
    }
    const normalized = token.trim().toLowerCase();
    if (/^<br\s*\/?\s*>$/.test(normalized)) {
      output += "<br>";
    } else if (/^<(strong|b)>$/.test(normalized)) {
      output += "<strong>";
      stack.push("strong");
    } else if (/^<\/(strong|b)>$/.test(normalized)) {
      closeTag("strong");
    } else if (/^<(div|p)(\s[^>]*)?>$/.test(normalized)) {
      if (output && !output.endsWith("<br>")) output += "<br>";
    } else if (/^<\/(div|p)>$/.test(normalized)) {
      if (output && !output.endsWith("<br>")) output += "<br>";
    } else if (/^<(span|font)\b/.test(normalized)) {
      const color = readColor(token);
      if (color) {
        output += `<span data-color="${color}">`;
        stack.push("span");
      }
    } else if (/^<\/(span|font)>$/.test(normalized)) {
      closeTag("span");
    }
  }
  while (stack.length) output += `</${stack.pop()}>`;
  return output.replace(/(?:<br>){3,}/g, "<br><br>").replace(/<br>$/, "");
}

export function studyGrowthHtmlToPlainText(html: string): string {
  return decodeHtml(sanitizeStudyGrowthHtml(html).replace(/<br>/g, "\n").replace(/<[^>]+>/g, "")).trim();
}

function readColor(tag: string): StudyGrowthTextColor | null {
  const dataColor = tag.match(/data-color\s*=\s*["']?([^\s"'>]+)/i)?.[1];
  const colorAttribute = tag.match(/(?:^|\s)color\s*=\s*["']?([^\s"'>]+)/i)?.[1];
  const styleColor = tag.match(/color\s*:\s*([^;"']+)/i)?.[1]?.trim();
  return colorAliases.get((dataColor ?? colorAttribute ?? styleColor ?? "").toLowerCase()) ?? null;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}
