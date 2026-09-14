import { type DragEvent, type MouseEvent } from "react";
import { Check, X } from "lucide-react";
import { TAGS } from "../constants";
import { formatTime } from "../date";
import { Priority, STATUS_DONE, STATUS_IN_PROGRESS, TodoTag, TodoTask } from "../types";

export function TaskRow({
  task,
  tags,
  selected,
  onSelect,
  onToggle,
  onEdit,
  onDelete,
  draggable,
  dragging,
  dragOver,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  task: TodoTask;
  tags: TodoTag[];
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  draggable: boolean;
  dragging: boolean;
  dragOver: boolean;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnter: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}) {
  const tag = tags.find((item) => item.id === task.tag) ?? tags[0] ?? TAGS[0];
  const done = task.status === STATUS_DONE;
  const classes = [
    "task-row",
    selected ? "selected" : "",
    done ? "done" : "",
    draggable ? "draggable" : "",
    dragging ? "dragging" : "",
    dragOver ? "drag-over" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={classes}
      draggable={draggable}
      onClick={onSelect}
      onDragStart={(event) => {
        if (isInteractiveElement(event.target)) {
          event.preventDefault();
          return;
        }
        onDragStart(event);
      }}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="task-card-header">
        <button className="check-button" onClick={(event) => preventRow(event, onToggle)} title="切换完成状态">
          {done && <Check size={16} />}
        </button>
        <div className="task-content">
          <div className="task-title-line">
            <strong title={task.text}>{task.text}</strong>
            {task.status === STATUS_IN_PROGRESS && <span className="status-chip">进行中</span>}
            {done && task.done_at && <span className="muted-chip">{formatTime(task.done_at)}</span>}
          </div>
          {task.description && <p>{task.description}</p>}
        </div>
      </div>
      <div className="task-footer">
        <div className="task-meta">
          <span className={`tag-chip ${tag.tone}`}>{tag.name}</span>
          {task.priority !== "medium" && <span className={`priority-chip ${task.priority}`}>{priorityLabel(task.priority)}</span>}
        </div>
        <div className="row-actions">
          <button onClick={(event) => preventRow(event, onEdit)}>编辑</button>
          <button className="danger" onClick={(event) => preventRow(event, onDelete)} title="删除任务">
            <X size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}

function priorityLabel(priority: Priority): string {
  return priority === "high" ? "高优先级" : priority === "low" ? "低优先级" : "中优先级";
}

function preventRow(event: MouseEvent<HTMLButtonElement>, action: () => void) {
  event.stopPropagation();
  action();
}

function isInteractiveElement(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest("button, input, select, textarea, a"));
}
