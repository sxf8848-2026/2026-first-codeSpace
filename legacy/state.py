"""轻量状态管理：观察者模式，数据变化自动通知 UI。

用法：
    state = AppState()
    state.on("task_added", lambda task: ...)
    state.add_task(...)  # 自动触发 task_added 事件
"""
from __future__ import annotations

from datetime import date
from typing import Callable, Any


class AppState:
    """应用状态容器，集中管理所有可变状态。"""

    def __init__(self) -> None:
        self._listeners: dict[str, list[Callable]] = {}
        self._undo_stack: list[dict] = []
        self._redo_stack: list[dict] = []

        # 核心状态
        self.current_day: date = date.today()
        self.filter: str = "all"          # all / todo / done (保留兼容，实际用 status_filter)
        self.selected_id: str | None = None
        self.theme_name: str = "light"
        self.search_text: str = ""        # 搜索关键词
        self.priority_filter: str = "all"  # all / high / medium / low
        self.status_filter: str = "all"    # all / 0 / 1 / 2 (0已完成, 1未完成, 2进行中)
        self.tag_filter: int = -1           # -1=全部, 0=未分类, 1=生活, 2=学习, 3=工作

    # ---------- 事件系统 ----------

    def on(self, event: str, callback: Callable) -> None:
        """订阅事件。"""
        self._listeners.setdefault(event, []).append(callback)

    def off(self, event: str, callback: Callable) -> None:
        """取消订阅。"""
        if event in self._listeners:
            self._listeners[event] = [
                cb for cb in self._listeners[event] if cb is not callback
            ]

    def _emit(self, event: str, *args: Any, **kwargs: Any) -> None:
        """触发事件。"""
        for cb in self._listeners.get(event, []):
            try:
                cb(*args, **kwargs)
            except Exception:
                pass  # 单个监听器出错不影响其他

    # ---------- 撤销/重做 ----------

    def push_undo(self, action: dict) -> None:
        """压入一个可撤销操作。"""
        self._undo_stack.append(action)
        self._redo_stack.clear()  # 新操作清空重做栈
        self._emit("undo_stack_changed", len(self._undo_stack), len(self._redo_stack))

    def can_undo(self) -> bool:
        return len(self._undo_stack) > 0

    def can_redo(self) -> bool:
        return len(self._redo_stack) > 0

    def pop_undo(self) -> dict | None:
        if not self._undo_stack:
            return None
        action = self._undo_stack.pop()
        self._redo_stack.append(action)
        self._emit("undo_stack_changed", len(self._undo_stack), len(self._redo_stack))
        return action

    def pop_redo(self) -> dict | None:
        if not self._redo_stack:
            return None
        action = self._redo_stack.pop()
        self._undo_stack.append(action)
        self._emit("undo_stack_changed", len(self._undo_stack), len(self._redo_stack))
        return action

    # ---------- 状态变更（带事件通知） ----------

    def set_day(self, day: date) -> None:
        self.current_day = day
        self.selected_id = None
        self._emit("day_changed", day)

    def set_filter(self, value: str) -> None:
        self.filter = value
        self.selected_id = None
        self._emit("filter_changed", value)

    def set_search(self, text: str) -> None:
        self.search_text = text.strip().lower()
        self.selected_id = None
        self._emit("search_changed", self.search_text)

    def set_priority_filter(self, value: str) -> None:
        self.priority_filter = value
        self.selected_id = None
        self._emit("priority_filter_changed", value)

    def set_status_filter(self, value: str) -> None:
        """设置状态筛选：all / 0 / 1 / 2。"""
        self.status_filter = value
        self.selected_id = None
        self._emit("status_filter_changed", value)

    def set_tag_filter(self, value: int) -> None:
        """设置标签筛选。-1=全部, 0=未分类, 1=生活, 2=学习, 3=工作。"""
        self.tag_filter = value
        self.selected_id = None
        self._emit("tag_filter_changed", value)

    def set_selected(self, task_id: str | None) -> None:
        prev = self.selected_id
        self.selected_id = task_id
        self._emit("selection_changed", prev, task_id)

    def set_theme(self, name: str) -> None:
        self.theme_name = name
        self._emit("theme_changed", name)

    def notify_task_changed(self, task_id: str) -> None:
        """单条任务变化时触发，用于增量更新。"""
        self._emit("task_changed", task_id)

    def notify_list_changed(self) -> None:
        """列表整体变化时触发（增删、排序等）。"""
        self._emit("list_changed")
