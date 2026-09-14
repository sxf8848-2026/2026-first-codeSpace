"""单条待办事项的行组件。"""
from __future__ import annotations

import tkinter as tk
from datetime import datetime
from typing import Callable

from storage import TIME_FMT, STATUS_DONE, STATUS_TODO, STATUS_IN_PROGRESS, TAG_NONE, TAG_LIFE, TAG_STUDY, TAG_WORK, TAG_NAMES
from widgets import CheckCircle, RoundedButton, Tooltip, round_rect, wrap_text


def bind_tree(widget: tk.Misc, sequence: str, func) -> None:
    """把事件绑到控件和它所有子控件上。"""
    widget.bind(sequence, func, add="+")
    for child in widget.winfo_children():
        bind_tree(child, sequence, func)


class TaskRow:
    """一条待办事项的可视化行。

    负责：
    - 渲染单行 UI（勾选框、文字、操作按钮、时间标签）
    - 悬停高亮、选中状态
    - 点击选中、双击编辑等交互
    - 文本自动换行
    """

    def __init__(self, parent: tk.Misc, task: dict, palette: dict, fonts: dict,
                 on_toggle: Callable[[str], None],
                 on_edit: Callable[[str], None],
                 on_delete: Callable[[str], None],
                 on_select: Callable[[str], None],
                 is_selected: bool = False,
                 auto_pack: bool = True):
        self.task = task
        self.p = palette
        self.f = fonts
        self.tid = task["id"]
        self.status = int(task.get("status", STATUS_TODO))  # 0已完成, 1未完成, 2进行中
        self.priority = task.get("priority", "medium")

        self._on_toggle = on_toggle
        self._on_edit = on_edit
        self._on_delete = on_delete
        self._on_select = on_select
        self._selected = is_selected
        self._hover = False
        self._wrap_width = -1
        self._desc_wrap_width = -1
        self._auto_pack = auto_pack

        # 行容器在 __init__ 中创建，子控件由 _build_children 填充
        # 这样 update_task 重建子控件时不会破坏外部的 grid/pack 布局
        c = self.p
        self.row = tk.Frame(parent, bg=c["surface"], highlightthickness=1,
                            highlightbackground=c["border"],
                            highlightcolor=c["border"])
        if auto_pack:
            self.row.pack(fill="x", pady=(0, 8))

        self._build_children()
        self._wire_events()
        self._paint()

    def _build_children(self) -> None:
        """填充行容器内的所有子控件（不创建 row 本身，也不做布局）。"""
        c, f = self.p, self.f
        tid = self.tid
        is_done = self.status == STATUS_DONE
        is_in_progress = self.status == STATUS_IN_PROGRESS

        # 优先级指示条
        self.stripe = tk.Frame(self.row, bg=self._priority_color(), width=3)
        self.stripe.pack(side="left", fill="y")

        body = tk.Frame(self.row, bg=c["surface"])
        body.pack(side="left", fill="both", expand=True, padx=(9, 12), pady=10)

        CheckCircle(body, palette=c, done=is_done, bg=c["surface"],
                    command=lambda: self._on_toggle(tid)).pack(side="left")

        # 右侧控件先 pack，文字过长时才不会把它们挤出去
        remove = RoundedButton(body, "✕", lambda: self._on_delete(tid), palette=c,
                               font=f["icon"], variant="danger", width=30, height=28,
                               radius=8, bg=c["surface"])
        remove.pack(side="right")
        Tooltip(remove, "删除", palette=c, font=f["small"])

        edit = RoundedButton(body, "改", lambda: self._on_edit(tid), palette=c,
                             font=f["small"], variant="ghost", width=30, height=28,
                             radius=8, bg=c["surface"])
        edit.pack(side="right", padx=(0, 6))
        Tooltip(edit, "编辑内容", palette=c, font=f["small"])

        # 优先级标签
        if self.priority != "medium":
            self._priority_chip(body).pack(side="right", padx=(0, 8))

        # 标签（非未分类才显示）
        tag = int(self.task.get("tag", TAG_NONE))
        if tag != TAG_NONE:
            tag_colors = {
                TAG_LIFE: (c.get("success", "#10b981"), c.get("success_soft", "#d1fae5")),
                TAG_STUDY: (c.get("accent", "#3b82f6"), c.get("accent_soft", "#dbeafe")),
                TAG_WORK: (c.get("warning", "#f59e0b"), c.get("warning_soft", "#fef3c7")),
            }
            fg, bg_soft = tag_colors.get(tag, (c["muted"], c["surface_alt"]))
            self._chip(body, TAG_NAMES.get(tag, ""), fg, bg_soft,
                       bg=c["surface"], height=20, pad=8).pack(side="right", padx=(0, 8))

        # 状态标签：进行中显示橙色标签，已完成显示时间
        if is_in_progress:
            self._chip(body, "进行中", c.get("warning", "#f59e0b"),
                       c.get("warning_soft", "#fef3c7"), bg=c["surface"],
                       height=20, pad=8).pack(side="right", padx=(0, 8))
        elif is_done and self.task.get("done_at"):
            self._chip(body, self._hhmm(self.task["done_at"]), c["success"],
                       c["surface_alt"], bg=c["surface"], height=20,
                       pad=8).pack(side="right", padx=(0, 8))

        text = self.task.get("text", "")
        font = f["body_done"] if is_done else f["body"]
        # 已完成灰色，进行中用主题色，未完成正常色
        if is_done:
            text_color = c["faint"]
        elif is_in_progress:
            text_color = c.get("warning", "#f59e0b")
        else:
            text_color = c["text"]
        # 文本区域：标题 + 描述
        text_frame = tk.Frame(body, bg=c["surface"])
        text_frame.pack(side="left", fill="x", expand=True, padx=(10, 8))

        self.label = tk.Label(text_frame, text=text, anchor="w", justify="left",
                              bg=c["surface"], font=font, fg=text_color)
        self.label.pack(side="top", fill="x")

        # 描述（有内容才显示）
        description = self.task.get("description", "")
        self.desc_label = None
        if description:
            self.desc_label = tk.Label(text_frame, text=description, anchor="w",
                                       justify="left", bg=c["surface"],
                                       font=f["small"], fg=c["muted"])
            self.desc_label.pack(side="top", fill="x", pady=(2, 0))

    def _priority_color(self) -> str:
        colors = {
            "high": self.p["danger"],
            "medium": self.p["accent"],
            "low": self.p["success"],
        }
        return colors.get(self.priority, self.p["accent"])

    def _priority_chip(self, parent: tk.Misc) -> tk.Canvas:
        labels = {"high": "高", "low": "低"}
        colors = {
            "high": (self.p["danger"], self.p["danger_soft"]),
            "low": (self.p["success"], self.p["accent_soft"]),
        }
        fg, bg = colors.get(self.priority, (self.p["muted"], self.p["surface_alt"]))
        return self._chip(parent, labels.get(self.priority, "中"), fg, bg,
                          bg=self.p["surface"], height=20, pad=8)

    def _chip(self, parent, text, fg, fill, *, bg=None, height=22, pad=10):
        f = self.f["small"]
        w = f.measure(text) + pad * 2
        cv = tk.Canvas(parent, width=w, height=height, bd=0, highlightthickness=0,
                       bg=bg or self.p["bg"])
        round_rect(cv, 0, 0, w, height, height / 2, fill=fill, outline=fill)
        cv.create_text(w / 2, height / 2 + 1, text=text, fill=fg, font=f)
        return cv

    def _wire_events(self) -> None:
        bind_tree(self.row, "<Enter>", lambda e: self._set_hover(True))
        bind_tree(self.row, "<Leave>", lambda e: self._set_hover(False))
        bind_tree(self.row, "<Button-1>", lambda e: self._on_select(self.tid))
        bind_tree(self.row, "<Double-Button-1>", lambda e: self._on_edit(self.tid))

        # 自动换行
        self.row.bind("<Configure>", self._on_configure, add="+")

    def _on_configure(self, event) -> None:
        width = max(120, event.width - self._reserve_width())
        if abs(self._wrap_width - width) > 4:
            self._wrap_width = width
            text = self.task.get("text", "")
            is_done = self.status == STATUS_DONE
            font = self.f["body_done"] if is_done else self.f["body"]
            self.label.config(text=wrap_text(text, font, width))
        if self.desc_label and abs(self._desc_wrap_width - width) > 4:
            self._desc_wrap_width = width
            self.desc_label.config(
                text=wrap_text(self.task.get("description", ""), self.f["small"], width))

    def _reserve_width(self) -> int:
        # 勾选框 + 左右内边距 + 右侧按钮区
        base = 145
        if self.status == STATUS_DONE and self.task.get("done_at"):
            base += 55
        if self.status == STATUS_IN_PROGRESS:
            base += 50  # "进行中"标签宽度
        if self.priority != "medium":
            base += 40
        if int(self.task.get("tag", TAG_NONE)) != TAG_NONE:
            base += 55
        return base

    def _set_hover(self, flag: bool) -> None:
        self._hover = flag
        self._paint()

    def set_selected(self, selected: bool) -> None:
        self._selected = selected
        self._paint()

    def _paint(self) -> None:
        if not self.row.winfo_exists():
            return
        c = self.p
        if self._selected:
            border = c["accent"]
        elif self._hover:
            border = c["border_hover"]
        else:
            border = c["border"]
        self.row.config(highlightbackground=border)
        self.stripe.config(bg=c["accent"] if self._selected else self._priority_color())

    def update_task(self, task: dict) -> None:
        """更新任务数据并重绘子控件（不重建 row，不破坏外部 grid/pack 布局）。"""
        self.task = task
        self.status = int(task.get("status", STATUS_TODO))
        self.priority = task.get("priority", "medium")
        self._wrap_width = -1
        self._desc_wrap_width = -1
        # 清空子控件并重建
        for w in self.row.winfo_children():
            w.destroy()
        self._build_children()
        self._wire_events()
        self._paint()

    def destroy(self) -> None:
        if self.row.winfo_exists():
            self.row.destroy()

    @staticmethod
    def _hhmm(stamp: str) -> str:
        try:
            return datetime.strptime(stamp, TIME_FMT).strftime("%H:%M")
        except (ValueError, TypeError):
            return ""
