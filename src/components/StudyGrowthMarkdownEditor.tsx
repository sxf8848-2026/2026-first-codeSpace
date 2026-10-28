import ReactMarkdown from "react-markdown";

export function StudyGrowthMarkdownEditor({
  markdown,
  placeholder,
  autoFocus = false,
  onChange,
}: {
  markdown: string;
  placeholder: string;
  autoFocus?: boolean;
  onChange: (markdown: string) => void;
}) {
  return (
    <div className="study-growth-markdown-editor">
      <label className="study-growth-markdown-pane">
        <span>Markdown 编辑</span>
        <textarea
          value={markdown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(event) => onChange(event.target.value)}
          required
        />
      </label>
      <div className="study-growth-markdown-pane">
        <span>实时预览</span>
        <StudyGrowthMarkdownPreview markdown={markdown} emptyText="预览会显示在这里" />
      </div>
    </div>
  );
}

export function StudyGrowthMarkdownPreview({ markdown, emptyText }: { markdown: string; emptyText?: string }) {
  if (!markdown.trim()) return <div className="study-growth-markdown-empty">{emptyText}</div>;
  return (
    <div className="study-growth-markdown-preview">
      <ReactMarkdown
        skipHtml
        components={{
          a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
