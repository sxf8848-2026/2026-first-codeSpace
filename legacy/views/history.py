"""历史回顾窗口。"""
from __future__ import annotations

import tkinter as tk
from datetime import datetime
from typing import Callable

from widgets import ScrollFrame, Tooltip, round_rect, wrap_text
from storage import STATUS_DONE, TAG_NONE, TAG_LIFE, TAG_STUDY, TAG_WORK, TAG_NAMES
from .modal import apply_titlebar

WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]


def bind_tree(widget: tk.Misc, sequence: str, func) -> None:
    """把事件绑到控件和它所有子控件上。"""
    widget.bind(sequence, func, add="+")
    for child in widget.winfo_children():
        bind_tree(child, sequence, func)


class HistoryWindow:
    """历史回顾弹窗，展示每天的完成情况。"""

    def __init__(self, parent: tk.Misc, store, palette: dict, fonts: dict,
                 on_jump: Callable[[datetime.date], None]):
        self.store = store
        self.p = palette
        self.f = fonts
        self._on_jump = on_jump
        self._tag_filter = -1  # -1=全部

        self.win = tk.Toplevel(parent)
        self.win.title("历史回顾")
        self.win.geometry("660x540")
        self.win.minsize(480, 360)
        self.win.configure(bg=palette["bg"])
        self.win.transient(parent)
        apply_titlebar(self.win, palette.get("_is_dark", False))

        self._build()

    def _build(self) -> None:
        c, f = self.p, self.f
        wrap = tk.Frame(self.win, bg=c["bg"])
        wrap.pack(fill="both", expand=True, padx=18, pady=16)

        tk.Label(wrap, text="每天做完的事", font=f["h1"], bg=c["bg"],
                 fg=c["text"]).pack(anchor="w")
        tk.Label(wrap, text="点击任意一天，可以跳到那天的清单", font=f["small"],
                 bg=c["bg"], fg=c["muted"]).pack(anchor="w", pady=(3, 12))

        # 标签筛选
        filter_bar = tk.Frame(wrap, bg=c["bg"])
        filter_bar.pack(fill="x", pady=(0, 10))
        tk.Label(filter_bar, text="标签筛选：", font=f["small"], bg=c["bg"],
                 fg=c["muted"]).pack(side="left")
        self._tag_buttons = {}
        tag_options = [("全部", -1), ("未分类", 0), ("生活", 1), ("学习", 2), ("工作", 3)]
        for name, val in tag_options:
            btn = tk.Label(filter_bar, text=name, font=f["small"], bg=c["surface_alt"],
                          fg=c["muted"], padx=10, pady=3, cursor="hand2")
            btn.pack(side="left", padx=(4, 0))
            btn.bind("<Button-1>", lambda e, v=val: self._set_tag_filter(v))
            self._tag_buttons[val] = btn
        self._update_tag_buttons()

        self._area = ScrollFrame(wrap, palette=c)
        self._area.pack(fill="both", expand=True)

        self._render_history()
    def _render_history(self) -> None:
        """渲染历史列表（支持标签筛选）。"""
        c = self.p
        # 清空旧内容
        for w in self._area.inner.winfo_children():
            w.destroy()

        days = list(reversed(self.store.all_days()))
        if not days:
            tk.Label(self._area.inner, text="还没有任何记录", font=self.f["body"], bg=c["bg"],
                     fg=c["faint"]).pack(pady=60)
            return

        for day in days:
            self._history_card(self._area.inner, day)

    def _set_tag_filter(self, value: int) -> None:
        self._tag_filter = value
        self._update_tag_buttons()
        self._render_history()

    def _update_tag_buttons(self) -> None:
        c = self.p
        for val, btn in self._tag_buttons.items():
            if val == self._tag_filter:
                btn.config(bg=c["accent"], fg=c["accent_text"])
            else:
                btn.config(bg=c["surface_alt"], fg=c["muted"])

    def _history_card(self, parent: tk.Misc, day: str) -> None:
        c, f = self.p, self.f
        done_n, total = self.store.stats(day)
        tasks = self.store.tasks_for(day)
        d = datetime.strptime(day, "%Y-%m-%d").date()

        card = tk.Frame(parent, bg=c["surface"], highlightthickness=1,
                        highlightbackground=c["border"], cursor="hand2")
        card.pack(fill="x", pady=(0, 8))
        inner = tk.Frame(card, bg=c["surface"])
        inner.pack(fill="x", padx=14, pady=12)

        head = tk.Frame(inner, bg=c["surface"])
        head.pack(fill="x")
        tk.Label(head, text=f"{day}  {WEEKDAYS[d.weekday()]}", font=f["h2"],
                 bg=c["surface"], fg=c["text"]).pack(side="left")
        all_done = total and done_n == total
        self._chip(head, f"{done_n}/{total}",
                   c["success"] if all_done else c["muted"],
                   c["surface_alt"], bg=c["surface"], height=20, pad=9).pack(side="right")

        # 标签筛选
        if self._tag_filter >= 0:
            tasks = [t for t in tasks if int(t.get("tag", 0)) == self._tag_filter]
        finished = [t for t in tasks if t.get("status") == STATUS_DONE]
        if finished:
            for task in finished:
                line = tk.Frame(inner, bg=c["surface"])
                line.pack(fill="x", pady=(6, 0))
                text = f"✓  {task.get('text', '')}"
                item = tk.Label(line, text=text, font=f["small"], bg=c["surface"],
                                fg=c["muted"], anchor="w", justify="left")
                item.pack(side="left")
                self._auto_wrap(card, item, text, f["small"], reserve=110)
                stamp = self._hhmm(task.get("done_at", ""))
                if stamp:
                    tk.Label(line, text=stamp, font=f["small"], bg=c["surface"],
                             fg=c["faint"]).pack(side="right")
        else:
            tk.Label(inner, text="这一天没有完成的事项", font=f["small"],
                     bg=c["surface"], fg=c["faint"]).pack(anchor="w", pady=(6, 0))

        pending = total - done_n
        if pending:
            tk.Label(inner, text=f"还有 {pending} 项没做完", font=f["small"],
                     bg=c["surface"], fg=c["faint"]).pack(anchor="w", pady=(6, 0))

        def jump(_event=None) -> None:
            self._on_jump(d)
            self.win.destroy()

        bind_tree(card, "<Button-1>", jump)
        bind_tree(card, "<Enter>",
                  lambda e: card.config(highlightbackground=c["border_hover"]))
        bind_tree(card, "<Leave>",
                  lambda e: card.config(highlightbackground=c["border"]))

    def _chip(self, parent, text, fg, fill, *, bg=None, height=22, pad=10):
        f = self.f["small"]
        w = f.measure(text) + pad * 2
        cv = tk.Canvas(parent, width=w, height=height, bd=0, highlightthickness=0,
                       bg=bg or self.p["bg"])
        round_rect(cv, 0, 0, w, height, height / 2, fill=fill, outline=fill)
        cv.create_text(w / 2, height / 2 + 1, text=text, fill=fg, font=f)
        return cv

    def _auto_wrap(self, host: tk.Misc, label: tk.Label, text: str, font,
                   reserve: int) -> None:
        """容器宽度变化时重新给标签断行。"""
        def handler(event) -> None:
            width = max(120, event.width - reserve)
            if abs(getattr(label, "_wrap_width", -1) - width) > 4:
                label._wrap_width = width
                label.config(text=wrap_text(text, font, width))
        host.bind("<Configure>", handler, add="+")

    @staticmethod
    def _hhmm(stamp: str) -> str:
        from storage import TIME_FMT
        try:
            return datetime.strptime(stamp, TIME_FMT).strftime("%H:%M")
        except (ValueError, TypeError):
            return ""
