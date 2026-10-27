import { type CSSProperties, useEffect, useRef } from "react";
import { Bold } from "lucide-react";
import {
  sanitizeStudyGrowthHtml,
  STUDY_GROWTH_TEXT_COLORS,
  studyGrowthHtmlToPlainText,
} from "../services/studyGrowthRichText";

export function StudyGrowthRichTextEditor({
  html,
  placeholder,
  autoFocus = false,
  onChange,
}: {
  html: string;
  placeholder: string;
  autoFocus?: boolean;
  onChange: (value: { html: string; text: string }) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    const sanitized = sanitizeStudyGrowthHtml(html);
    if (editor.innerHTML !== sanitized) editor.innerHTML = sanitized;
    if (autoFocus) editor.focus();
  }, [autoFocus, html]);

  function emitChange(normalizeDom = false) {
    const editor = editorRef.current;
    if (!editor) return;
    const sanitized = sanitizeStudyGrowthHtml(editor.innerHTML);
    if (normalizeDom && editor.innerHTML !== sanitized) editor.innerHTML = sanitized;
    onChange({ html: sanitized, text: studyGrowthHtmlToPlainText(sanitized) });
  }

  function applyFormat(command: "bold" | "foreColor", value?: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value);
    emitChange();
  }

  return (
    <div className="study-growth-rich-editor">
      <div className="study-growth-rich-toolbar" aria-label="正文格式工具栏">
        <button type="button" onMouseDown={(event) => { event.preventDefault(); applyFormat("bold"); }} title="加粗选中文字"><Bold size={16} />加粗</button>
        <div className="study-growth-color-palette" aria-label="文字颜色">
          {STUDY_GROWTH_TEXT_COLORS.map(([name, label, hex]) => (
            <button
              type="button"
              className={`study-growth-color ${name}`}
              aria-label={`${label}文字`}
              title={label}
              style={{ "--text-color": hex } as CSSProperties}
              onMouseDown={(event) => { event.preventDefault(); applyFormat("foreColor", hex); }}
              key={name}
            />
          ))}
        </div>
      </div>
      <div
        ref={editorRef}
        className="study-growth-rich-input"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        data-placeholder={placeholder}
        onInput={() => emitChange()}
        onBlur={() => emitChange(true)}
        onPaste={(event) => {
          event.preventDefault();
          document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
        }}
      />
    </div>
  );
}
