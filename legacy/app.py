"""ToDoList 桌面程序控制器。

重构后采用 MVC 模式：
- Model: storage.py（数据存储） + state.py（应用状态）
- View: views/ 目录下的各个视图组件
- Controller: 本文件（TodoApp），负责业务逻辑和协调

职责：
- 初始化各层
- 处理用户交互事件（来自视图的回调）
- 操作数据存储
- 管理应用状态
- 触发视图更新
"""
from __future__ import annotations

import tkinter as tk
from datetime import date, timedelta

from domain import TaskFilters, matches_task
from services import TaskPatch, TodoService
from storage import TodoStore, load_prefs, save_prefs, STATUS_TODO
from state import AppState
from theme import PALETTES
from views import Modal, HistoryWindow, MainView


def fmt_day(d: date) -> str:
    return d.strftime("%Y-%m-%d")


class TodoApp:
    """待办应用控制器。"""

    def __init__(self, root: tk.Tk):
        self.root = root
        self.store = TodoStore()
        self.service = TodoService(self.store)
        self.prefs = load_prefs()

        # 初始化状态
        self.state = AppState()
        self.state.theme_name = self.prefs.get("theme", "light")
        if self.state.theme_name not in PALETTES:
            self.state.theme_name = "light"

        # 创建视图
        self.view = MainView(
            root,
            theme_name=self.state.theme_name,
            on_add=self.add_task,
            on_toggle=self.toggle_task,
            on_edit=self.edit_task,
            on_delete=self.delete_task,
            on_select=self.select_task,
            on_search=self.set_search,
            on_priority_filter=self.set_priority_filter,
            on_status_filter=self.set_status_filter,
            on_tag_filter=self.set_tag_filter,
            on_go_day=self.go_day,
            on_go_today=self.go_today,
            on_toggle_theme=self.toggle_theme,
            on_show_history=self.show_history,
            on_carry_over=self.carry_over,
            on_clear_done=self.clear_done,
            on_move=self.move_task,
        )

        self._bind_keys()
        self._bind_state_events()

        # 应用当日默认任务（同一天只应用一次）
        self.store.apply_default_tasks(self.day)
        self._refresh_list(animate=False)

    @property
    def day(self) -> str:
        return fmt_day(self.state.current_day)

    # ---------------- 快捷键 ----------------

    def _bind_keys(self) -> None:
        r = self.root
        r.bind("<Control-Left>", lambda e: self.go_day(-1))
        r.bind("<Control-Right>", lambda e: self.go_day(1))
        r.bind("<space>", lambda e: self._shortcut(self.toggle_task))
        r.bind("<F2>", lambda e: self._shortcut(self.edit_task))
        r.bind("<Delete>", lambda e: self._shortcut(self.delete_task))
        r.bind("<Control-z>", lambda e: self.undo())
        r.bind("<Control-y>", lambda e: self.redo())
        r.bind("<Control-Z>", lambda e: self.redo())  # Shift+Ctrl+Z

    def _shortcut(self, action) -> None:
        # 光标在输入框里时，这些键该交给输入框
        if isinstance(self.root.focus_get(), tk.Entry):
            return
        if self.state.selected_id:
            action(self.state.selected_id)

    # ---------------- 状态事件绑定 ----------------

    def _bind_state_events(self) -> None:
        """订阅状态变化事件，驱动视图更新。"""
        self.state.on("selection_changed", self._on_selection_changed)
        self.state.on("day_changed", self._on_day_changed)
        self.state.on("filter_changed", lambda v: self._refresh_list(animate=False))
        self.state.on("search_changed", lambda t: self._refresh_list(animate=False))
        self.state.on("priority_filter_changed",
                      lambda v: self._refresh_list(animate=False))
        self.state.on("status_filter_changed",
                      lambda v: self._refresh_list(animate=False))
        self.state.on("tag_filter_changed",
                      lambda v: self._refresh_list(animate=False))
        self.state.on("task_changed", self._on_task_changed)
        self.state.on("list_changed", lambda: self._refresh_list(animate=False))

    def _on_selection_changed(self, prev_id: str | None, new_id: str | None) -> None:
        self.view.update_selection(prev_id, new_id)

    def _on_task_changed(self, task_id: str) -> None:
        """单条任务变化时增量更新。"""
        task = self.store.find_task(self.day, task_id)
        if task and self._match(task):
            self.view.update_row(task, self.state.selected_id)
        else:
            # 任务不再匹配当前筛选条件，全量刷新
            self._refresh_list(animate=False)

    # ---------------- 列表刷新 ----------------

    def _refresh_list(self, animate: bool = True) -> None:
        """根据当前状态刷新列表。"""
        tasks = self.store.tasks_for(self.day)
        visible = [t for t in tasks if self._match(t)]

        # 检查选中项是否还在可见列表中
        if self.state.selected_id and all(
            t.get("id") != self.state.selected_id for t in visible
        ):
            self.state.selected_id = None

        done_n, total = self.store.stats(self.day)

        self.view.render_list(
            tasks=visible,
            all_tasks=tasks,
            active_tag=self.state.tag_filter,
            selected_id=self.state.selected_id,
            current_day=self.state.current_day,
            filter_value=self.state.status_filter,
            done_n=done_n,
            total=total,
            animate=animate,
        )

    def _match(self, task: dict) -> bool:
        """判断任务是否匹配当前筛选条件。"""
        return matches_task(task, TaskFilters(
            status=self.state.status_filter,
            priority=self.state.priority_filter,
            search_text=self.state.search_text,
            tag=self.state.tag_filter,
        ))

    # ---------------- 交互处理 ----------------

    def select_task(self, task_id: str) -> None:
        self.state.set_selected(task_id)

    def set_status_filter(self, value: str) -> None:
        self.state.set_status_filter(value)

    def set_tag_filter(self, value: int) -> None:
        self.state.set_tag_filter(value)

    def set_search(self, text: str) -> None:
        self.state.set_search(text)

    def set_priority_filter(self, value: str) -> None:
        self.state.set_priority_filter(value)

    def go_day(self, delta: int) -> None:
        new_day = self.state.current_day + timedelta(days=delta)
        self.state.set_day(new_day)
        self.view.scroll_to_top()

    def go_today(self) -> None:
        self.state.set_day(date.today())
        self.view.scroll_to_top()

    def toggle_theme(self) -> None:
        new_theme = "dark" if self.state.theme_name == "light" else "light"
        self.state.set_theme(new_theme)
        self.prefs["theme"] = new_theme
        save_prefs(self.prefs)
        self.view.rebuild(new_theme)
        self._refresh_list(animate=False)

    # ---------- 任务操作（带撤销） ----------

    def add_task(self, text: str, status: int = STATUS_TODO, tag: int = 0) -> None:
        if not text.strip():
            return
        task, action = self.service.add_task(self.day, text, status=status, tag=tag)
        self.state.set_selected(task["id"])
        self.state.push_undo(action)
        self._refresh_list()

    def toggle_task(self, task_id: str) -> None:
        action = self.service.toggle_task(self.day, task_id)
        if not action:
            return
        self.state.set_selected(task_id)
        self.state.push_undo(action)
        self.state.notify_task_changed(task_id)
        self._refresh_list()

    def edit_task(self, task_id: str) -> None:
        task = self.store.find_task(self.day, task_id)
        if task is None:
            return

        palette = dict(PALETTES[self.state.theme_name])
        palette["_is_dark"] = self.state.theme_name == "dark"
        result = Modal(
            self.root, palette, self.view.fonts,
            "编辑事项", "修改这条事项的内容、描述和标签：",
            kind="input", initial=task.get("text", ""),
            with_description=True,
            initial_description=task.get("description", ""),
            with_tag=True,
            initial_tag=int(task.get("tag", 0)),
        ).wait()

        if result is None:
            return

        new_text, new_desc, new_tag = result
        action = self.service.edit_task(
            self.day, task_id, TaskPatch(new_text, new_desc, new_tag))
        if action:
            self.state.push_undo(action)
            self.state.notify_task_changed(task_id)

    def delete_task(self, task_id: str) -> None:
        task = self.store.find_task(self.day, task_id)
        if task is None:
            return

        palette = dict(PALETTES[self.state.theme_name])
        palette["_is_dark"] = self.state.theme_name == "dark"
        confirmed = Modal(
            self.root, palette, self.view.fonts,
            "删除事项", f"确定删除「{task.get('text', '')}」？",
            kind="confirm", ok_text="删除",
        ).wait()

        if confirmed:
            action = self.service.delete_task(self.day, task_id)
            if not action:
                return
            if self.state.selected_id == task_id:
                self.state.set_selected(None)
            self.state.push_undo(action)
            self._refresh_list()

    def move_task(self, delta: int) -> None:
        if not self.state.selected_id:
            self._show_info("提示", "请先点一下要移动的事项。")
            return
        if self.state.status_filter != "all" or self.state.search_text:
            self._show_info("提示", "调整顺序前请先切回「全部」并清空搜索。")
            return
        if self.store.move(self.day, self.state.selected_id, delta):
            self.state.notify_list_changed()

    def clear_done(self) -> None:
        done_n, _ = self.store.stats(self.day)
        if not done_n:
            self._show_info("提示", "这一天没有已完成的事项。")
            return

        palette = dict(PALETTES[self.state.theme_name])
        palette["_is_dark"] = self.state.theme_name == "dark"
        confirmed = Modal(
            self.root, palette, self.view.fonts,
            "清除已完成", f"将删除 {done_n} 条已完成记录，确定吗？",
            kind="confirm", ok_text="清除",
        ).wait()

        if confirmed:
            count, action = self.service.clear_done(self.day)
            if action:
                self.state.push_undo(action)

            removed_ids = {task["id"] for _index, task in action["tasks"]} if action else set()
            if self.state.selected_id in removed_ids:
                self.state.set_selected(None)
            self._refresh_list()

    def carry_over(self) -> None:
        prev = fmt_day(self.state.current_day - timedelta(days=1))
        count = self.store.carry_over(prev, self.day)
        self._refresh_list()

        message = (f"已把前一天 {count} 条未完成事项复制过来。" if count
                   else "前一天没有需要继承的未完成事项。")
        self._show_info("继承昨日未完成", message)

    # ---------------- 撤销/重做 ----------------

    def undo(self) -> None:
        """撤销上一步操作。"""
        if isinstance(self.root.focus_get(), tk.Entry):
            return  # 输入框里 Ctrl+Z 应该是撤销输入

        action = self.state.pop_undo()
        if not action:
            return

        selected_id = self.service.undo(action)
        self.state.set_selected(selected_id)

        self._refresh_list(animate=False)

    def redo(self) -> None:
        """重做被撤销的操作。"""
        if isinstance(self.root.focus_get(), tk.Entry):
            return

        action = self.state.pop_redo()
        if not action:
            return

        selected_id = self.service.redo(action)
        self.state.set_selected(selected_id)

        self._refresh_list(animate=False)

    # ---------------- 历史回顾 ----------------

    def show_history(self) -> None:
        palette = dict(PALETTES[self.state.theme_name])
        palette["_is_dark"] = self.state.theme_name == "dark"

        def on_jump(d: date) -> None:
            self.state.set_day(d)
            self.view.scroll_to_top()

        HistoryWindow(
            self.root, self.store, palette, self.view.fonts,
            on_jump=on_jump,
        )

    # ---------------- 工具方法 ----------------

    def _show_info(self, title: str, message: str) -> None:
        palette = dict(PALETTES[self.state.theme_name])
        palette["_is_dark"] = self.state.theme_name == "dark"
        Modal(self.root, palette, self.view.fonts, title, message, kind="info")

    def _on_day_changed(self, new_day) -> None:
        """切换日期时应用默认任务并刷新列表。"""
        day_str = fmt_day(new_day) if not isinstance(new_day, str) else new_day
        self.store.apply_default_tasks(day_str)
        self._refresh_list()
