"""主视图：界面布局与渲染。"""
from __future__ import annotations

import tkinter as tk
from datetime import date
from typing import Callable

from storage import STATUS_DONE, STATUS_TODO, STATUS_IN_PROGRESS, TAG_NONE, TAG_LIFE, TAG_STUDY, TAG_WORK
from theme import PALETTES, make_fonts
from widgets import (RoundedButton, ScrollFrame, SegmentedControl,
                     SlimProgress, Tooltip, round_rect, wrap_text)
from .task_row import TaskRow
from .modal import apply_titlebar

WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
PLACEHOLDER = "添加今天要做的事，按回车保存…"

# 添加时的状态选项
ADD_STATUS_OPTIONS = [
    ("未完成", STATUS_TODO),
    ("进行中", STATUS_IN_PROGRESS),
    ("已完成", STATUS_DONE),
]


def fmt_day(d: date) -> str:
    return d.strftime("%Y-%m-%d")


class MainView:
    """主界面视图。

    负责界面渲染和用户交互事件的转发，不包含业务逻辑。
    业务逻辑通过回调函数传给控制器。
    """

    def __init__(self, root: tk.Tk, theme_name: str,
                 on_add: Callable[[str, int, int], None],
                 on_toggle: Callable[[str], None],
                 on_edit: Callable[[str], None],
                 on_delete: Callable[[str], None],
                 on_select: Callable[[str], None],
                 on_search: Callable[[str], None],
                 on_priority_filter: Callable[[str], None],
                 on_status_filter: Callable[[str], None],
                 on_tag_filter: Callable[[int], None],
                 on_go_day: Callable[[int], None],
                 on_go_today: Callable[[], None],
                 on_toggle_theme: Callable[[], None],
                 on_show_history: Callable[[], None],
                 on_carry_over: Callable[[], None],
                 on_clear_done: Callable[[], None],
                 on_move: Callable[[int], None]):
        self.root = root
        self.theme_name = theme_name
        self.fonts = make_fonts(root)

        # 回调
        self._on_add = on_add
        self._on_toggle = on_toggle
        self._on_edit = on_edit
        self._on_delete = on_delete
        self._on_select = on_select
        self._on_search = on_search
        self._on_priority_filter = on_priority_filter
        self._on_status_filter = on_status_filter
        self._on_tag_filter = on_tag_filter
        self._on_go_day = on_go_day
        self._on_go_today = on_go_today
        self._on_toggle_theme = on_toggle_theme
        self._on_show_history = on_show_history
        self._on_carry_over = on_carry_over
        self._on_clear_done = on_clear_done
        self._on_move = on_move

        self.container: tk.Frame | None = None
        self._rows: dict[str, TaskRow] = {}
        self._placeholder_on = False
        self._resize_job = None

        self.build()

    @property
    def c(self) -> dict[str, str]:
        return PALETTES[self.theme_name]

    # ---------------- 搭界面 ----------------

    def build(self) -> None:
        if self.container is not None:
            self.container.destroy()
        c = self.c
        self.root.configure(bg=c["bg"])
        apply_titlebar(self.root, self.theme_name == "dark")
        self.container = tk.Frame(self.root, bg=c["bg"])
        self.container.pack(fill="both", expand=True, padx=18, pady=16)

        self._build_header()
        self._build_input()
        self._build_toolbar()
        # 任务列表区域（左侧标签栏 + 右侧任务列表）
        list_container = tk.Frame(self.container, bg=c["bg"])
        list_container.pack(fill="both", expand=True)

        # 左侧标签栏
        self.sidebar = tk.Frame(list_container, bg=c["surface_alt"], width=128)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        # 右侧任务列表
        self.list_area = ScrollFrame(list_container, palette=c)
        self.list_area.pack(side="left", fill="both", expand=True, padx=(12, 0))
        self._build_footer()

    def _build_header(self) -> None:
        c, f = self.c, self.fonts
        head = tk.Frame(self.container, bg=c["bg"])
        head.pack(fill="x")

        top = tk.Frame(head, bg=c["bg"])
        top.pack(fill="x")
        tk.Label(top, text="每日待办", font=f["h2"], bg=c["bg"],
                 fg=c["muted"]).pack(side="left")

        history = RoundedButton(top, "历史回顾", self._on_show_history, palette=c,
                                font=f["small"], variant="ghost", height=30, pad=12)
        history.pack(side="right")
        Tooltip(history, "看看每天都完成了什么", palette=c, font=f["small"])

        theme = RoundedButton(top, "☀" if self.theme_name == "dark" else "☾",
                              self._on_toggle_theme, palette=c, font=f["icon"],
                              variant="ghost", width=34, height=30)
        theme.pack(side="right", padx=(0, 8))
        Tooltip(theme, "切换浅色 / 深色", palette=c, font=f["small"])

        mid = tk.Frame(head, bg=c["bg"])
        mid.pack(fill="x", pady=(4, 0))
        self.date_label = tk.Label(mid, font=f["display"], bg=c["bg"], fg=c["text"])
        self.date_label.pack(side="left")
        self.chip_holder = tk.Frame(mid, bg=c["bg"])
        self.chip_holder.pack(side="left", padx=(10, 0))

        nxt = RoundedButton(mid, "›", lambda: self._on_go_day(1), palette=c,
                            font=f["h1"], variant="ghost", width=34, height=32)
        nxt.pack(side="right")
        Tooltip(nxt, "后一天（Ctrl+→）", palette=c, font=f["small"])

        RoundedButton(mid, "今天", self._on_go_today, palette=c, font=f["small"],
                      variant="ghost", height=32, pad=12).pack(side="right", padx=6)

        prev = RoundedButton(mid, "‹", lambda: self._on_go_day(-1), palette=c,
                             font=f["h1"], variant="ghost", width=34, height=32)
        prev.pack(side="right")
        Tooltip(prev, "前一天（Ctrl+←）", palette=c, font=f["small"])

        bottom = tk.Frame(head, bg=c["bg"])
        bottom.pack(fill="x", pady=(14, 0))
        self.stat_label = tk.Label(bottom, font=f["small"], bg=c["bg"], fg=c["muted"])
        self.stat_label.pack(side="right", padx=(12, 0))
        self.progress = SlimProgress(bottom, palette=c, bg=c["bg"])
        self.progress.pack(side="left", fill="x", expand=True)

    def _build_input(self) -> None:
        c, f = self.c, self.fonts
        card = tk.Frame(self.container, bg=c["surface"], highlightthickness=1,
                        highlightbackground=c["border"], highlightcolor=c["border"])
        card.pack(fill="x", pady=(16, 12))
        inner = tk.Frame(card, bg=c["surface"])
        inner.pack(fill="x", padx=10, pady=8)

        self.entry = tk.Entry(inner, font=f["body"], bg=c["surface"], fg=c["text"],
                              relief="flat", bd=0, highlightthickness=0,
                              insertbackground=c["accent"])
        self.entry.pack(side="left", fill="x", expand=True, padx=(4, 10), ipady=4)

        # 添加时的状态选择器（按钮 + 弹出菜单）
        self._add_status = STATUS_TODO  # 默认未完成
        self.status_btn = RoundedButton(inner, "未完成", self._show_status_menu,
                                        palette=c, font=f["small"], variant="soft",
                                        height=32, pad=10, bg=c["surface"])
        self.status_btn.pack(side="right", padx=(0, 8))
        Tooltip(self.status_btn, "选择任务状态", palette=c, font=f["small"])

        # 添加时的标签选择器（按钮 + 弹出菜单）
        self._add_tag = TAG_NONE  # 默认未分类
        self.tag_btn = RoundedButton(inner, "未分类", self._show_tag_menu,
                                     palette=c, font=f["small"], variant="soft",
                                     height=32, pad=10, bg=c["surface"])
        self.tag_btn.pack(side="right", padx=(0, 8))
        Tooltip(self.tag_btn, "选择任务标签", palette=c, font=f["small"])

        RoundedButton(inner, "添加", self._add_task, palette=c, font=f["body"],
                      variant="primary", height=32, bg=c["surface"]).pack(side="right")

        self.entry.bind("<Return>", lambda e: self._add_task())
        self.entry.bind("<FocusIn>", lambda e: self._focus_input(card, True))
        self.entry.bind("<FocusOut>", lambda e: self._focus_input(card, False))
        self._show_placeholder()

    def _show_status_menu(self) -> None:
        """弹出状态选择菜单。"""
        c = self.c
        menu = tk.Menu(self.root, tearoff=0, bg=c["surface"], fg=c["text"],
                       activebackground=c["accent_soft"], activeforeground=c["accent"],
                       borderwidth=0)
        for name, val in ADD_STATUS_OPTIONS:
            menu.add_command(label=name, command=lambda v=val, n=name: self._set_add_status(v, n))
        x = self.status_btn.winfo_rootx()
        y = self.status_btn.winfo_rooty() + self.status_btn.winfo_height()
        menu.tk_popup(x, y)

    def _set_add_status(self, value: int, name: str) -> None:
        self._add_status = value
        self.status_btn.set_text(name)

    def _show_tag_menu(self) -> None:
        """弹出标签选择菜单。"""
        c = self.c
        menu = tk.Menu(self.root, tearoff=0, bg=c["surface"], fg=c["text"],
                       activebackground=c["accent_soft"], activeforeground=c["accent"],
                       borderwidth=0)
        tag_options = [("未分类", TAG_NONE), ("生活", TAG_LIFE), ("学习", TAG_STUDY), ("工作", TAG_WORK)]
        for name, val in tag_options:
            menu.add_command(label=name, command=lambda v=val, n=name: self._set_add_tag(v, n))
        x = self.tag_btn.winfo_rootx()
        y = self.tag_btn.winfo_rooty() + self.tag_btn.winfo_height()
        menu.tk_popup(x, y)

    def _set_add_tag(self, value: int, name: str) -> None:
        self._add_tag = value
        self.tag_btn.set_text(name)

    def _build_toolbar(self) -> None:
        c, f = self.c, self.fonts
        bar = tk.Frame(self.container, bg=c["bg"])
        bar.pack(fill="x", pady=(0, 12))

        actions = tk.Frame(bar, bg=c["bg"])
        actions.pack(fill="x")

        # 左侧操作按钮
        RoundedButton(actions, "继承昨日", self._on_carry_over, palette=c,
                      font=f["small"], variant="soft", height=30, pad=12).pack(side="left")
        RoundedButton(actions, "清除已完成", self._on_clear_done, palette=c, font=f["small"],
                      variant="ghost", height=30, pad=12).pack(side="left", padx=6)

        up = RoundedButton(actions, "↑", lambda: self._on_move(-1), palette=c,
                           font=f["small"], variant="ghost", width=32, height=30)
        up.pack(side="left")
        Tooltip(up, "把选中的事项上移", palette=c, font=f["small"])

        down = RoundedButton(actions, "↓", lambda: self._on_move(1), palette=c,
                             font=f["small"], variant="ghost", width=32, height=30)
        down.pack(side="left", padx=(4, 0))
        Tooltip(down, "把选中的事项下移", palette=c, font=f["small"])

        filters = tk.Frame(bar, bg=c["bg"])
        filters.pack(fill="x", pady=(8, 0))

        # 优先级筛选
        self.priority_segment = SegmentedControl(
            filters, [("全部", "all"), ("高", "high"), ("中", "medium"), ("低", "low")],
            self._on_priority_filter, palette=c, font=f["small"], bg=c["bg"], height=30)
        self.priority_segment.pack(side="right")
        Tooltip(self.priority_segment, "按优先级筛选", palette=c, font=f["small"])

        # 搜索框
        search_box = tk.Frame(filters, bg=c["surface"], highlightthickness=1,
                              highlightbackground=c["border"],
                              highlightcolor=c["border"])
        search_box.pack(side="right", padx=(0, 8))
        self.search_entry = tk.Entry(search_box, font=f["small"], bg=c["surface"],
                                     fg=c["text"], relief="flat", bd=0,
                                     highlightthickness=0, width=16,
                                     insertbackground=c["accent"])
        self.search_entry.pack(side="left", padx=(8, 4), pady=4)
        self.search_entry.insert(0, "搜索…")
        self.search_entry.config(fg=c["faint"])
        self._search_placeholder = True

        def search_focus_in(_e):
            if self._search_placeholder:
                self.search_entry.delete(0, "end")
                self.search_entry.config(fg=c["text"])
                self._search_placeholder = False
            search_box.config(highlightbackground=c["accent"])

        def search_focus_out(_e):
            search_box.config(highlightbackground=c["border"])
            if not self.search_entry.get():
                self.search_entry.insert(0, "搜索…")
                self.search_entry.config(fg=c["faint"])
                self._search_placeholder = True

        self.search_entry.bind("<FocusIn>", search_focus_in)
        self.search_entry.bind("<FocusOut>", search_focus_out)
        self.search_entry.bind("<KeyRelease>", lambda e: self._on_search(
            "" if self._search_placeholder else self.search_entry.get()))

        # 状态筛选分段控件（四态：全部/未完成/进行中/已完成）
        self.status_segment = SegmentedControl(
            filters, [("全部", "all"), ("未完成", "1"), ("进行中", "2"), ("已完成", "0")],
            self._on_status_filter, palette=c, font=f["small"], bg=c["bg"], height=30)
        self.status_segment.pack(side="right", padx=(0, 8))
        Tooltip(self.status_segment, "按状态筛选", palette=c, font=f["small"])


    def _build_footer(self) -> None:
        c, f = self.c, self.fonts
        tk.Label(self.container, bg=c["bg"], fg=c["faint"], font=f["small"],
                 text="Enter 添加 · 单击选中 · 空格完成 · F2 编辑 · Delete 删除 · "
                      "Ctrl+←/→ 换一天 · Ctrl+Z 撤销").pack(anchor="w", pady=(10, 0))

    # ---------------- 输入框 ----------------

    def _add_task(self) -> None:
        text = "" if self._placeholder_on else self.entry.get().strip()
        if not text:
            return
        self._on_add(text, self._add_status, self._add_tag)
        self.entry.delete(0, "end")

    def _focus_input(self, card: tk.Frame, focused: bool) -> None:
        card.config(highlightbackground=self.c["accent"] if focused else self.c["border"])
        if focused:
            self._hide_placeholder()
        else:
            self._show_placeholder()

    def _show_placeholder(self) -> None:
        if not self.entry.get():
            self.entry.insert(0, PLACEHOLDER)
            self.entry.config(fg=self.c["faint"])
            self._placeholder_on = True

    def _hide_placeholder(self) -> None:
        if self._placeholder_on:
            self.entry.delete(0, "end")
            self.entry.config(fg=self.c["text"])
            self._placeholder_on = False

    def focus_input(self) -> None:
        self.entry.focus_set()

    # ---------------- 列表渲染 ----------------

    def render_list(self, tasks: list[dict], selected_id: str | None,
                    current_day: date, filter_value: str,
                    done_n: int, total: int, animate: bool = True,
                    all_tasks: list[dict] | None = None,
                    active_tag: int = -1) -> None:
        """渲染完整列表（左侧标签栏 + 右侧任务列表）。"""
        c = self.c
        self.date_label.config(text=current_day.strftime("%Y 年 %m 月 %d 日"))

        # 更新日期标签
        for w in self.chip_holder.winfo_children():
            w.destroy()
        is_today = current_day == date.today()
        self._chip(self.chip_holder, self._day_tag(current_day),
                   c["accent"] if is_today else c["muted"],
                   c["accent_soft"] if is_today else c["surface_alt"]).pack()

        if all_tasks is None:
            all_tasks = tasks

        # ========== 左侧标签栏 ==========
        for w in self.sidebar.winfo_children():
            w.destroy()

        tag_counts = {-1: len(all_tasks)}
        for tag in [TAG_NONE, TAG_LIFE, TAG_STUDY, TAG_WORK]:
            tag_counts[tag] = sum(1 for t in all_tasks if int(t.get("tag", TAG_NONE)) == tag)

        tag_buttons = [
            (-1, "全部", c["accent"], c.get("accent_soft", "#dbeafe")),
            (TAG_NONE, "未分类", c["muted"], c["surface_alt"]),
            (TAG_LIFE, "生活", c.get("success", "#10b981"), c.get("success_soft", "#d1fae5")),
            (TAG_STUDY, "学习", c["accent"], c.get("accent_soft", "#dbeafe")),
            (TAG_WORK, "工作", c.get("warning", "#f59e0b"), c.get("warning_soft", "#fef3c7")),
        ]

        for tag, name, fg, bg in tag_buttons:
            is_active = (active_tag == tag)
            btn_bg = bg if is_active else c["surface_alt"]
            btn_fg = fg if is_active else c["text"]
            btn_frame = tk.Frame(self.sidebar, bg=btn_bg, cursor="hand2")
            btn_frame.pack(fill="x", pady=1)
            if is_active:
                tk.Frame(btn_frame, bg=fg, width=3).pack(side="left", fill="y")
            lbl = tk.Label(btn_frame, text=f"{name}  {tag_counts[tag]}",
                          font=self.fonts["small"], bg=btn_bg, fg=btn_fg,
                          padx=10, pady=10, anchor="w")
            lbl.pack(side="left", fill="x", expand=True)
            def on_click(e=None, t=tag):
                self._on_tag_filter(t)
            btn_frame.bind("<Button-1>", on_click)
            lbl.bind("<Button-1>", on_click)

        # ========== 右侧任务列表 ==========
        inner = self.list_area.inner
        for w in inner.winfo_children():
            w.destroy()
        self._rows.clear()

        if tasks:
            for task in tasks:
                row = TaskRow(
                    inner, task, c, self.fonts,
                    on_toggle=self._on_toggle,
                    on_edit=self._on_edit,
                    on_delete=self._on_delete,
                    on_select=self._on_select,
                    is_selected=task["id"] == selected_id,
                    auto_pack=False,
                )
                row.row.pack(fill="x", pady=(0, 6), padx=4)
                self._rows[task["id"]] = row
        else:
            self._build_empty(bool(total), filter_value)

        self.progress.set(done_n / total if total else 0.0, animate=animate)
        self.stat_label.config(
            text=f"已完成 {done_n} / {total}" if total else "还没有记录")
    def update_row(self, task: dict, selected_id: str | None) -> None:
        """增量更新单条任务。"""
        if task["id"] in self._rows:
            self._rows[task["id"]].update_task(task)
            self._rows[task["id"]].set_selected(task["id"] == selected_id)

    def update_selection(self, prev_id: str | None, new_id: str | None) -> None:
        """更新选中状态。"""
        if prev_id and prev_id in self._rows:
            self._rows[prev_id].set_selected(False)
        if new_id and new_id in self._rows:
            self._rows[new_id].set_selected(True)

    def _build_empty(self, has_tasks: bool, filter_value: str) -> None:
        c, f = self.c, self.fonts
        if not has_tasks:
            title, hint = "这一天还是空的", "在上面的输入框写下第一件事吧"
        elif filter_value == "1":
            title, hint = "全部搞定了", "这一天没有待办事项了"
        elif filter_value == "0":
            title, hint = "还没有完成的事项", "勾选左边的圆圈就能标记完成"
        elif filter_value == "2":
            title, hint = "没有进行中的事项", "添加时选择「进行中」状态"
        else:
            title, hint = "没有匹配的结果", "试试换个搜索词或筛选条件"

        inner = self.list_area.inner
        box = tk.Frame(inner, bg=c["bg"])
        box.pack(fill="x", pady=60)
        tk.Label(box, text=title, font=f["h1"], bg=c["bg"], fg=c["muted"]).pack()
        tk.Label(box, text=hint, font=f["small"], bg=c["bg"],
                 fg=c["faint"]).pack(pady=(6, 0))

    def _day_tag(self, d: date) -> str:
        diff = (d - date.today()).days
        extra = {0: " · 今天", -1: " · 昨天", 1: " · 明天"}.get(diff, "")
        return WEEKDAYS[d.weekday()] + extra

    def _chip(self, parent, text, fg, fill, *, bg=None, height=22, pad=10):
        f = self.fonts["small"]
        w = f.measure(text) + pad * 2
        cv = tk.Canvas(parent, width=w, height=height, bd=0, highlightthickness=0,
                       bg=bg or self.c["bg"])
        round_rect(cv, 0, 0, w, height, height / 2, fill=fill, outline=fill)
        cv.create_text(w / 2, height / 2 + 1, text=text, fill=fg, font=f)
        return cv

    def scroll_to_top(self) -> None:
        self.list_area.scroll_to_top()

    def set_status_filter(self, value: str) -> None:
        """设置状态筛选器的当前值（不触发回调）。"""
        self.status_segment.set(value, notify=False)

    def set_tag_filter(self, value: int) -> None:
        """设置标签筛选（左侧标签栏通过 render_list 的 active_tag 参数高亮）。"""
        pass
    def set_priority_filter(self, value: str) -> None:
        self.priority_segment.set(value, notify=False)

    def rebuild(self, theme_name: str) -> None:
        """主题切换时重建整个界面。"""
        self.theme_name = theme_name
        self._rows.clear()
        self.build()
