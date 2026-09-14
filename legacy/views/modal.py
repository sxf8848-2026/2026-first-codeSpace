"""统一风格的弹窗，替代 messagebox / simpledialog 的系统默认样式。"""
from __future__ import annotations

import sys
import tkinter as tk
from typing import Callable


def apply_titlebar(win: tk.Misc, dark: bool) -> None:
    """让 Windows 的标题栏跟着主题走，深色模式下不再是一条白边。"""
    if not sys.platform.startswith("win"):
        return
    try:
        import ctypes

        win.update_idletasks()
        hwnd = ctypes.windll.user32.GetParent(win.winfo_id()) or win.winfo_id()
        value = ctypes.c_int(1 if dark else 0)
        for attribute in (20, 19):   # 新旧两个版本的 DWMWA_USE_IMMERSIVE_DARK_MODE
            ctypes.windll.dwmapi.DwmSetWindowAttribute(
                hwnd, attribute, ctypes.byref(value), ctypes.sizeof(value))
        if win.winfo_viewable():     # 已经显示出来的窗口需要重画一次才生效
            win.withdraw()
            win.deiconify()
    except Exception:
        pass                          # 非 Windows 或系统不支持时忽略即可


class Modal(tk.Toplevel):
    """通用弹窗组件。

    支持三种类型：
    - confirm: 确认弹窗（确定/取消）
    - info: 信息弹窗（只有确定）
    - input: 输入弹窗（带输入框）
    """

    def __init__(self, parent: tk.Misc, palette: dict, fonts: dict,
                 title: str, message: str, *,
                 kind: str = "confirm", initial: str = "",
                 with_description: bool = False, initial_description: str = "",
                 with_tag: bool = False, initial_tag: int = 0,
                 ok_text: str = "确定", cancel_text: str = "取消",
                 on_ok: Callable | None = None):
        super().__init__(parent)
        self.p = palette
        self.f = fonts
        self.result = None
        self._with_description = with_description
        self.desc_entry = None
        self._with_tag = with_tag
        self._tag = initial_tag
        self.tag_btn = None
        self._on_ok = on_ok

        self.title(title)
        self.configure(bg=palette["surface"])
        self.resizable(False, False)
        self.transient(parent)

        wrap = tk.Frame(self, bg=palette["surface"])
        wrap.pack(fill="both", expand=True, padx=22, pady=18)

        tk.Label(wrap, text=message, font=fonts["body"], bg=palette["surface"],
                 fg=palette["text"], justify="left", wraplength=380).pack(anchor="w")

        self.entry = None
        if kind == "input":
            tk.Label(wrap, text="事项", font=fonts["small"],
                     bg=palette["surface"], fg=palette["muted"]).pack(
                anchor="w", pady=(14, 4))
            box = tk.Frame(wrap, bg=palette["surface"], highlightthickness=1,
                           highlightbackground=palette["accent"],
                           highlightcolor=palette["accent"])
            box.pack(fill="x")
            self.entry = tk.Entry(box, font=fonts["body"], bg=palette["surface"],
                                  fg=palette["text"], relief="flat", bd=0,
                                  highlightthickness=0,
                                  insertbackground=palette["accent"], width=36)
            self.entry.pack(fill="x", padx=10, pady=8)
            self.entry.insert(0, initial)
            self.entry.select_range(0, "end")

            # 标签选择器
            if with_tag:
                self._build_tag_selector(wrap, palette, fonts)

            # 描述输入（多行文本框）
            if with_description:
                tk.Label(wrap, text="描述（可选）", font=fonts["small"],
                         bg=palette["surface"], fg=palette["muted"]).pack(
                    anchor="w", pady=(10, 4))
                desc_box = tk.Frame(wrap, bg=palette["surface"], highlightthickness=1,
                                    highlightbackground=palette["border"],
                                    highlightcolor=palette["accent"])
                desc_box.pack(fill="x")
                self.desc_entry = tk.Text(desc_box, font=fonts["body"],
                                          bg=palette["surface"], fg=palette["text"],
                                          relief="flat", bd=0, highlightthickness=0,
                                          insertbackground=palette["accent"],
                                          height=3, wrap="word")
                self.desc_entry.pack(fill="x", padx=10, pady=8)
                self.desc_entry.insert("1.0", initial_description)

        btns = tk.Frame(wrap, bg=palette["surface"])
        btns.pack(fill="x", pady=(18, 0))

        # 延迟导入避免循环依赖
        from widgets import RoundedButton

        RoundedButton(btns, ok_text, self._ok, palette=palette, font=fonts["body"],
                      variant="primary", height=32, bg=palette["surface"]).pack(side="right")
        if kind != "info":
            RoundedButton(btns, cancel_text, self._cancel, palette=palette,
                          font=fonts["body"], variant="ghost", height=32,
                          bg=palette["surface"]).pack(side="right", padx=(0, 8))

        if kind == "input" and self.entry:
            self.entry.bind("<Return>", lambda e: self._ok())
            if self.desc_entry:
                self.desc_entry.bind("<Control-Return>", lambda e: self._ok())
        else:
            self.bind("<Return>", lambda e: self._ok())
        self.bind("<Escape>", lambda e: self._cancel())
        self.protocol("WM_DELETE_WINDOW", self._cancel)

        apply_titlebar(self, palette.get("_is_dark", False))
        self.update_idletasks()
        self._center(parent)
        self.grab_set()
        (self.entry or self).focus_set()

    def _center(self, parent: tk.Misc) -> None:
        w, h = self.winfo_width(), self.winfo_height()
        x = parent.winfo_rootx() + (parent.winfo_width() - w) // 2
        y = parent.winfo_rooty() + (parent.winfo_height() - h) // 3
        self.geometry(f"+{max(x, 0)}+{max(y, 0)}")

    def _build_tag_selector(self, parent, palette, fonts) -> None:
        """构建标签选择器（按钮 + 弹出菜单）。"""
        from storage import TAG_NONE, TAG_LIFE, TAG_STUDY, TAG_WORK, TAG_NAMES
        from widgets import RoundedButton

        tag_row = tk.Frame(parent, bg=palette["surface"])
        tag_row.pack(fill="x", pady=(10, 0))
        tk.Label(tag_row, text="标签：", font=fonts["small"],
                 bg=palette["surface"], fg=palette["muted"]).pack(side="left")

        tag_names = TAG_NAMES
        self.tag_btn = RoundedButton(tag_row, tag_names.get(self._tag, "未分类"),
                                     self._show_tag_menu, palette=palette,
                                     font=fonts["small"], variant="soft",
                                     height=28, pad=10, bg=palette["surface"])
        self.tag_btn.pack(side="left", padx=(8, 0))

    def _show_tag_menu(self) -> None:
        """弹出标签选择菜单。"""
        from storage import TAG_NONE, TAG_LIFE, TAG_STUDY, TAG_WORK, TAG_NAMES
        c = self.p
        menu = tk.Menu(self, tearoff=0, bg=c["surface"], fg=c["text"],
                       activebackground=c["accent_soft"], activeforeground=c["accent"],
                       borderwidth=0)
        for name, val in [("未分类", TAG_NONE), ("生活", TAG_LIFE), ("学习", TAG_STUDY), ("工作", TAG_WORK)]:
            menu.add_command(label=name, command=lambda v=val, n=name: self._set_tag(v, n))
        x = self.tag_btn.winfo_rootx()
        y = self.tag_btn.winfo_rooty() + self.tag_btn.winfo_height()
        menu.tk_popup(x, y)

    def _set_tag(self, value: int, name: str) -> None:
        self._tag = value
        self.tag_btn.set_text(name)

    def _ok(self) -> None:
        if self.entry:
            text = self.entry.get().strip()
            desc = self.desc_entry.get("1.0", "end").strip() if self.desc_entry else ""
            if self._with_tag:
                self.result = (text, desc, self._tag)
            elif self._with_description:
                self.result = (text, desc)
            else:
                self.result = text
        else:
            self.result = True
        if self._on_ok:
            self._on_ok(self.result)
        self.destroy()

    def _cancel(self) -> None:
        self.result = None if self.entry else False
        self.destroy()

    def wait(self):
        """等待弹窗关闭并返回结果。"""
        self.wait_window(self)
        return self.result
