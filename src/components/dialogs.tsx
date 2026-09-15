import { Plus, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { PRIORITIES, TAG_TONES } from "../constants";
import { formatDisplayDate, formatMonthTitle, fromDateKey, fromMonthKey } from "../date";
import { DailyHistoryEntry, MonthlyHistoryEntry } from "../services/history";
import { DefaultTask, Priority, TagId, TodoTag, TodoTask } from "../types";

export function EditDialog({
  task,
  tags,
  onClose,
  onSave,
}: {
  task: TodoTask;
  tags: TodoTag[];
  onClose: () => void;
  onSave: (task: TodoTask) => void;
}) {
  const [draft, setDraft] = useState(task);
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <form
        className="dialog"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ ...draft, text: draft.text.trim() || task.text, description: draft.description.trim() });
        }}
      >
        <header>
          <strong>编辑事项</strong>
          <button type="button" className="icon-button compact" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <label>
          事项
          <input value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} autoFocus />
        </label>
        <div className="dialog-grid">
          <label>
            标签
            <select value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: Number(event.target.value) as TagId })}>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            优先级
            <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}>
              {PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          描述
          <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </label>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button className="primary-button" type="submit">
            保存
          </button>
        </footer>
      </form>
    </div>
  );
}

export function HistoryDialog({
  title,
  emptyTitle,
  emptyText,
  dailyEntries,
  monthlyEntries,
  onClose,
  onDailyJump,
  onMonthlyJump,
}: {
  title: string;
  emptyTitle: string;
  emptyText: string;
  dailyEntries?: DailyHistoryEntry[];
  monthlyEntries?: MonthlyHistoryEntry[];
  onClose: () => void;
  onDailyJump?: (day: string) => void;
  onMonthlyJump?: (month: string) => void;
}) {
  const entries = dailyEntries ?? monthlyEntries ?? [];
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <section className="dialog history-dialog" onClick={(event) => event.stopPropagation()}>
        <header>
          <strong>{title}</strong>
          <button type="button" className="icon-button compact" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="history-list">
          {entries.length ? (
            dailyEntries ? (
              dailyEntries.map((entry) => (
                <button className="history-card" key={entry.day} onClick={() => onDailyJump?.(entry.day)}>
                  <span>{formatDisplayDate(fromDateKey(entry.day))}</span>
                  <strong>
                    {entry.doneCount}/{entry.totalCount} · 真棒 {entry.awesomeCount}
                  </strong>
                  <small>{entry.summary}</small>
                </button>
              ))
            ) : (
              monthlyEntries?.map((entry) => (
                <button className="history-card" key={entry.month} onClick={() => onMonthlyJump?.(entry.month)}>
                  <span>{formatMonthTitle(fromMonthKey(entry.month))}</span>
                  <strong>
                    {entry.doneCount}/{entry.totalCount}
                  </strong>
                  <small>{entry.summary}</small>
                </button>
              ))
            )
          ) : (
            <div className="empty-state">
              <strong>{emptyTitle}</strong>
              <span>{emptyText}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function SettingsDialog({
  tags,
  defaultTasks,
  onClose,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  onAddDefaultTask,
  onUpdateDefaultTask,
  onDeleteDefaultTask,
}: {
  tags: TodoTag[];
  defaultTasks: DefaultTask[];
  onClose: () => void;
  onAddTag: (name: string, tone: TodoTag["tone"]) => void;
  onUpdateTag: (tag: TodoTag) => void;
  onDeleteTag: (tagId: TagId) => void;
  onAddDefaultTask: (task: DefaultTask) => void;
  onUpdateDefaultTask: (index: number, task: DefaultTask) => void;
  onDeleteDefaultTask: (index: number) => void;
}) {
  const firstTagId = tags[1]?.id ?? tags[0]?.id ?? 0;
  const [tagDraft, setTagDraft] = useState({ name: "", tone: "blue" as TodoTag["tone"] });
  const [taskDraft, setTaskDraft] = useState<DefaultTask>({
    text: "",
    tag: firstTagId,
    priority: "medium",
  });

  useEffect(() => {
    if (!tags.some((tag) => tag.id === taskDraft.tag)) {
      setTaskDraft((value) => ({ ...value, tag: firstTagId }));
    }
  }, [firstTagId, tags, taskDraft.tag]);

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <section className="dialog settings-dialog" onClick={(event) => event.stopPropagation()}>
        <header>
          <strong>设置</strong>
          <button type="button" className="icon-button compact" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <SettingsSection title="标签">
          <div className="settings-list">
            {tags.map((tag) => (
              <div className="settings-row" key={tag.id}>
                <input value={tag.name} onChange={(event) => onUpdateTag({ ...tag, name: event.target.value })} />
                <select value={tag.tone} onChange={(event) => onUpdateTag({ ...tag, tone: event.target.value as TodoTag["tone"] })}>
                  {TAG_TONES.map((tone) => (
                    <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>
                  ))}
                </select>
                <button type="button" className="danger text-button" disabled={tag.id === 0} onClick={() => onDeleteTag(tag.id)}>
                  删除
                </button>
              </div>
            ))}
          </div>
          <form
            className="settings-row add-row"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              onAddTag(tagDraft.name, tagDraft.tone);
              setTagDraft({ name: "", tone: "blue" });
            }}
          >
            <input value={tagDraft.name} onChange={(event) => setTagDraft({ ...tagDraft, name: event.target.value })} placeholder="新标签" />
            <select value={tagDraft.tone} onChange={(event) => setTagDraft({ ...tagDraft, tone: event.target.value as TodoTag["tone"] })}>
              {TAG_TONES.map((tone) => (
                <option key={tone.value} value={tone.value}>
                  {tone.label}
                </option>
              ))}
            </select>
            <button className="primary-button" type="submit">
              <Plus size={16} />
              添加
            </button>
          </form>
        </SettingsSection>

        <SettingsSection title="默认任务">
          <div className="settings-list">
            {defaultTasks.map((task, index) => (
              <div className="settings-row default-task-row" key={`${task.text}-${index}`}>
                <input value={task.text} onChange={(event) => onUpdateDefaultTask(index, { ...task, text: event.target.value })} />
                <TagSelect value={task.tag} tags={tags} onChange={(tag) => onUpdateDefaultTask(index, { ...task, tag })} />
                <PrioritySelect value={task.priority} onChange={(priority) => onUpdateDefaultTask(index, { ...task, priority })} />
                <button type="button" className="danger text-button" onClick={() => onDeleteDefaultTask(index)}>
                  删除
                </button>
              </div>
            ))}
          </div>
          <form
            className="settings-row default-task-row add-row"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              onAddDefaultTask(taskDraft);
              setTaskDraft({ text: "", tag: firstTagId, priority: "medium" });
            }}
          >
            <input value={taskDraft.text} onChange={(event) => setTaskDraft({ ...taskDraft, text: event.target.value })} placeholder="新默认任务" />
            <TagSelect value={taskDraft.tag} tags={tags} onChange={(tag) => setTaskDraft({ ...taskDraft, tag })} />
            <PrioritySelect value={taskDraft.priority} onChange={(priority) => setTaskDraft({ ...taskDraft, priority })} />
            <button className="primary-button" type="submit">
              <Plus size={16} />
              添加
            </button>
          </form>
        </SettingsSection>
      </section>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="settings-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function TagSelect({ value, tags, onChange }: { value: TagId; tags: TodoTag[]; onChange: (tag: TagId) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {tags.map((tag) => (
        <option key={tag.id} value={tag.id}>
          {tag.name}
        </option>
      ))}
    </select>
  );
}

function PrioritySelect({ value, onChange }: { value: Priority; onChange: (priority: Priority) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value as Priority)}>
      {PRIORITIES.map((priority) => (
        <option key={priority.value} value={priority.value}>
          {priority.label}
        </option>
      ))}
    </select>
  );
}
