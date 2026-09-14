"""业务用例层：封装待办事项操作和撤销/重做语义。"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from storage import STATUS_DONE, STATUS_TODO, TodoStore


@dataclass(frozen=True)
class TaskPatch:
    """编辑任务时传入的字段补丁。"""

    text: str
    description: str
    tag: int


class TodoService:
    """围绕 TodoStore 编排业务动作，返回可撤销的 action。"""

    def __init__(self, store: TodoStore):
        self.store = store

    def add_task(self, day: str, text: str, *, status: int, tag: int) -> tuple[dict, dict]:
        task = self.store.add(day, text, status=status, tag=tag)
        return task, {"type": "add", "day": day, "task_id": task["id"], "task": task}

    def edit_task(self, day: str, task_id: str, patch: TaskPatch) -> dict | None:
        old = self.store.find_task(day, task_id)
        if old is None:
            return None

        new_text = patch.text.strip() or old.get("text", "")
        changed = (
            new_text != old.get("text", "")
            or patch.description != old.get("description", "")
            or patch.tag != int(old.get("tag", 0))
        )
        if not changed:
            return None

        self.store.update_text(day, task_id, new_text)
        self.store.update_description(day, task_id, patch.description)
        self.store.set_tag(day, task_id, patch.tag)
        return {
            "type": "edit",
            "day": day,
            "task_id": task_id,
            "old_task": old,
            "new_task": self.store.find_task(day, task_id),
        }

    def delete_task(self, day: str, task_id: str) -> dict | None:
        tasks = self.store.tasks_for(day)
        index = next((i for i, t in enumerate(tasks) if t.get("id") == task_id), None)
        if index is None:
            return None
        removed = self.store.remove(day, task_id)
        if removed is None:
            return None
        return {
            "type": "delete",
            "day": day,
            "task_id": task_id,
            "task": removed,
            "index": index,
        }

    def toggle_task(self, day: str, task_id: str) -> dict | None:
        before = self.store.find_task(day, task_id)
        if before is None:
            return None
        after = self.store.toggle(day, task_id)
        if after is None:
            return None
        return {
            "type": "toggle",
            "day": day,
            "task_id": task_id,
            "before_task": before,
            "after_task": after,
        }

    def clear_done(self, day: str) -> tuple[int, dict | None]:
        tasks = self.store.tasks_for(day)
        removed_with_index = [
            (i, dict(t)) for i, t in enumerate(tasks)
            if int(t.get("status", STATUS_TODO)) == STATUS_DONE
        ]
        count, _removed = self.store.clear_done(day)
        if not count:
            return 0, None
        return count, {
            "type": "clear_done",
            "day": day,
            "tasks": removed_with_index,
        }

    def undo(self, action: dict[str, Any]) -> str | None:
        day = action["day"]
        task_id = action.get("task_id")

        if action["type"] == "add":
            self.store.remove(day, task_id)
            return None

        if action["type"] == "delete":
            self.store.insert_at(day, action["index"], action["task"])
            return task_id

        if action["type"] == "toggle":
            self._restore_task(day, task_id, action["before_task"])
            return task_id

        if action["type"] == "edit":
            self._restore_task(day, task_id, action["old_task"])
            return task_id

        if action["type"] == "clear_done":
            for index, task in action["tasks"]:
                self.store.insert_at(day, index, task)
            return None

        return None

    def redo(self, action: dict[str, Any]) -> str | None:
        day = action["day"]
        task_id = action.get("task_id")

        if action["type"] == "add":
            self.store.insert_at(day, len(self.store.tasks_for(day)), action["task"])
            return task_id

        if action["type"] == "delete":
            self.store.remove(day, task_id)
            return None

        if action["type"] == "toggle":
            self._restore_task(day, task_id, action["after_task"])
            return task_id

        if action["type"] == "edit":
            self._restore_task(day, task_id, action["new_task"])
            return task_id

        if action["type"] == "clear_done":
            for _index, task in action["tasks"]:
                self.store.remove(day, task["id"])
            return None

        return None

    def _restore_task(self, day: str, task_id: str, task: dict | None) -> None:
        if task is None:
            return
        tasks = self.store.tasks_for(day)
        index = next((i for i, item in enumerate(tasks) if item.get("id") == task_id), None)
        if index is None:
            self.store.insert_at(day, len(tasks), task)
            return
        self.store.remove(day, task_id)
        self.store.insert_at(day, index, task)
