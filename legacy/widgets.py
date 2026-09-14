"""一组自绘小控件。

tkinter 自带控件是方角 + 系统外观，改不动。这里用 Canvas 画出圆角、
悬停高亮这些效果，界面风格才能统一。
"""
from __future__ import annotations

import tkinter as tk
from tkinter import ttk


def round_rect(canvas: tk.Canvas, x1, y1, x2, y2, r, **kwargs):
    """在 Canvas 上画圆角矩形（用平滑多边形近似）。"""
    r = max(0, min(r, (x2 - x1) / 2, (y2 - y1) / 2))
    points = [
        x1 + r, y1, x2 - r, y1, x2, y1, x2, y1 + r,
        x2, y2 - r, x2, y2, x2 - r, y2, x1 + r, y2,
        x1, y2, x1, y2 - r, x1, y1 + r, x1, y1,
    ]
    return canvas.create_polygon(points, smooth=True, **kwargs)


def wrap_text(text: str, font, width: int) -> str:
    """按像素宽度给文本断行。

    Tk 自带的 wraplength 只在空格处断行，一整句中文会被当成一个词直接溢出，
    所以这里自己逐字量宽度：英文优先在空格处断，中文可以任意位置断。
    """
    if width <= 0 or not text:
        return text
    lines = []
    for paragraph in text.split("\n"):
        line, last_space = "", -1
        for ch in paragraph:
            if not line or font.measure(line + ch) <= width:
                line += ch
                if ch == " ":
                    last_space = len(line) - 1
                continue
            # 断点落在英文单词中间时，退回到上一个空格更好看
            if last_space > 0 and ch.isascii() and not ch.isspace():
                lines.append(line[:last_space])
                line = line[last_space + 1:] + ch
            else:
                lines.append(line)
                line = ch
            last_space = -1
        lines.append(line)
    return "\n".join(lines)


class RoundedButton(tk.Canvas):
    """圆角按钮，支持 primary / soft / ghost / danger / plain 五种样式。

    新增：disabled 状态，禁用时变灰且不响应点击。
    """

    def __init__(self, master, text, command=None, *, palette, font,
                 variant="ghost", width=None, height=34, radius=10,
                 pad=16, bg=None, enabled=True):
        self.p = palette
        self.variant = variant
        self.command = command
        self._font = font
        self._enabled = enabled
        self._text = text
        w = width if width is not None else font.measure(text) + pad * 2
        super().__init__(master, width=w, height=height, bd=0,
                         highlightthickness=0,
                         cursor="hand2" if enabled else "arrow",
                         bg=bg or palette["bg"])
        self._width = w
        self._height = height
        self._radius = radius

        fill, hover, outline, fg = self._colors()
        self._shape = round_rect(self, 1, 1, w - 1, height - 1, radius,
                                 fill=fill, outline=outline)
        self._text_item = self.create_text(w / 2, height / 2 + 1, text=text,
                                           fill=fg, font=font)
        self._fill, self._hover = fill, hover
        self._normal_fg = fg

        if enabled:
            self.bind("<Enter>", lambda e: self.itemconfig(self._shape, fill=self._hover))
            self.bind("<Leave>", lambda e: self.itemconfig(self._shape, fill=self._fill))
            self.bind("<ButtonRelease-1>", self._on_release)

    def _colors(self) -> tuple[str, str, str, str]:
        p = self.p
        if not self._enabled:
            return (p["surface_alt"], p["surface_alt"], p["border"], p["faint"])
        return {
            "primary": (p["accent"], p["accent_hover"], p["accent"], p["accent_text"]),
            "soft": (p["accent_soft"], p["accent_soft_hover"], p["accent_soft"], p["accent"]),
            "danger": (p["surface"], p["danger_soft"], p["border"], p["danger"]),
            "plain": (p["bg"], p["surface_hover"], p["bg"], p["muted"]),
        }.get(self.variant,
              (p["surface"], p["surface_hover"], p["border"], p["text"]))

    def _on_release(self, event) -> None:
        if not self._enabled:
            return
        inside = 0 <= event.x <= self.winfo_width() and 0 <= event.y <= self.winfo_height()
        if inside and self.command:
            self.command()

    def set_text(self, text: str) -> None:
        self._text = text
        self.itemconfig(self._text_item, text=text)

    def set_enabled(self, enabled: bool) -> None:
        """设置按钮启用/禁用状态。"""
        if self._enabled == enabled:
            return
        self._enabled = enabled
        self.config(cursor="hand2" if enabled else "arrow")

        fill, hover, outline, fg = self._colors()
        self.itemconfig(self._shape, fill=fill, outline=outline)
        self.itemconfig(self._text_item, fill=fg)
        self._fill, self._hover = fill, hover
        self._normal_fg = fg

        if enabled:
            self.bind("<Enter>", lambda e: self.itemconfig(self._shape, fill=self._hover))
            self.bind("<Leave>", lambda e: self.itemconfig(self._shape, fill=self._fill))
            self.bind("<ButtonRelease-1>", self._on_release)
        else:
            self.unbind("<Enter>")
            self.unbind("<Leave>")
            self.unbind("<ButtonRelease-1>")


class CheckCircle(tk.Canvas):
    """待办前面的圆形勾选框，完成后填充绿色并画对勾。"""

    def __init__(self, master, *, palette, done, command, bg, size=22):
        super().__init__(master, width=size, height=size, bd=0,
                         highlightthickness=0, cursor="hand2", bg=bg)
        self.p = palette
        self.command = command
        self.done = done
        s = size
        self._oval = self.create_oval(2, 2, s - 2, s - 2, width=2)
        self._tick = self.create_line(
            s * 0.29, s * 0.52, s * 0.44, s * 0.68, s * 0.72, s * 0.34,
            width=2, capstyle="round", joinstyle="round",
            fill=palette["accent_text"],
        )
        self._paint(hover=False)
        self.bind("<Enter>", lambda e: self._paint(hover=True))
        self.bind("<Leave>", lambda e: self._paint(hover=False))
        self.bind("<ButtonRelease-1>", lambda e: self.command and self.command())

    def _paint(self, hover: bool) -> None:
        p = self.p
        if self.done:
            fill = p["success_hover"] if hover else p["success"]
            self.itemconfig(self._oval, fill=fill, outline=fill)
            self.itemconfig(self._tick, state="normal")
        else:
            outline = p["accent"] if hover else p["border_hover"]
            self.itemconfig(self._oval, fill=p["surface"], outline=outline)
            self.itemconfig(self._tick, state="hidden")


class SegmentedControl(tk.Canvas):
    """分段筛选器：一个圆角槽 + 一块会移动的高亮滑块。"""

    def __init__(self, master, options, command=None, *, palette, font, bg,
                 height=32, pad=16, radius=9):
        self.p = palette
        self.options = list(options)          # [(显示文字, 值), ...]
        self.command = command
        self._widths = [font.measure(label) + pad * 2 for label, _ in self.options]
        total = sum(self._widths)
        super().__init__(master, width=total + 6, height=height, bd=0,
                         highlightthickness=0, cursor="hand2", bg=bg)
        round_rect(self, 0, 0, total + 6, height, radius + 2,
                   fill=palette["surface_alt"], outline=palette["surface_alt"])
        self._pill = round_rect(self, 3, 3, 3, height - 3, radius,
                                fill=palette["surface"], outline=palette["border"])
        self._labels = []
        x = 3
        for (label, _), w in zip(self.options, self._widths):
            self._labels.append(
                self.create_text(x + w / 2, height / 2 + 1, text=label,
                                 font=font, fill=palette["muted"]))
            x += w
        self._height = height
        self._radius = radius
        self.value = self.options[0][1]
        self.bind("<ButtonRelease-1>", self._on_click)
        self.set(self.value, notify=False)

    def _on_click(self, event) -> None:
        x = 3
        for (_, value), w in zip(self.options, self._widths):
            if x <= event.x < x + w:
                self.set(value)
                return
            x += w

    def set(self, value, notify: bool = True) -> None:
        idx = next((i for i, (_, v) in enumerate(self.options) if v == value), 0)
        left = 3 + sum(self._widths[:idx])
        right = left + self._widths[idx]
        self.coords(self._pill, *self._pill_points(left, right))
        for i, item in enumerate(self._labels):
            self.itemconfig(item, fill=self.p["text"] if i == idx else self.p["muted"])
        self.value = self.options[idx][1]
        if notify and self.command:
            self.command(self.value)

    def _pill_points(self, x1, x2):
        y1, y2, r = 3, self._height - 3, self._radius
        r = max(0, min(r, (x2 - x1) / 2, (y2 - y1) / 2))
        return [
            x1 + r, y1, x2 - r, y1, x2, y1, x2, y1 + r,
            x2, y2 - r, x2, y2, x2 - r, y2, x1 + r, y2,
            x1, y2, x1, y2 - r, x1, y1 + r, x1, y1,
        ]


class SlimProgress(tk.Canvas):
    """细长的圆角进度条，数值变化时有一小段过渡动画。"""

    def __init__(self, master, *, palette, bg, height=8):
        super().__init__(master, height=height, bd=0, highlightthickness=0, bg=bg)
        self.p = palette
        self._h = height
        self._target = 0.0
        self._shown = 0.0
        self._job = None
        self._track = None
        self._fill = None
        self.bind("<Configure>", lambda e: self._draw())

    def set(self, ratio: float, animate: bool = True) -> None:
        self._target = max(0.0, min(1.0, ratio))
        if not animate:
            self._shown = self._target
            self._draw()
            return
        self._animate()

    def _animate(self) -> None:
        if not self.winfo_exists():
            return
        if self._job:
            self.after_cancel(self._job)
            self._job = None
        diff = self._target - self._shown
        if abs(diff) < 0.005:
            self._shown = self._target
            self._draw()
            return
        self._shown += diff * 0.25
        self._draw()
        self._job = self.after(16, self._animate)

    def _draw(self) -> None:
        if not self.winfo_exists():
            return
        w = self.winfo_width()
        if w <= 1:
            return
        self.delete("all")
        r = self._h / 2
        self._track = round_rect(self, 0, 0, w, self._h, r,
                                 fill=self.p["surface_alt"],
                                 outline=self.p["surface_alt"])
        filled = w * self._shown
        if filled > 1:
            color = self.p["success"] if self._shown >= 1 else self.p["accent"]
            self._fill = round_rect(self, 0, 0, max(filled, self._h), self._h, r,
                                    fill=color, outline=color)


class Tooltip:
    """悬停提示。tkinter 没有自带的，用一个无边框小窗口模拟。

    新增：边界检测，靠近屏幕边缘时自动调整位置，不会超出屏幕。
    """

    def __init__(self, widget: tk.Misc, text: str, *, palette, font, delay=450):
        self.widget = widget
        self.text = text
        self.p = palette
        self.font = font
        self.delay = delay
        self._job = None
        self._tip = None
        widget.bind("<Enter>", self._schedule, add="+")
        widget.bind("<Leave>", self.hide, add="+")
        widget.bind("<ButtonPress>", self.hide, add="+")
        widget.bind("<Destroy>", self.hide, add="+")

    def _schedule(self, _event=None) -> None:
        self.hide()
        self._job = self.widget.after(self.delay, self._show)

    def _show(self) -> None:
        self._job = None
        if self._tip is not None or not self.widget.winfo_exists():
            return
        tip = tk.Toplevel(self.widget)
        tip.wm_overrideredirect(True)
        tip.configure(bg=self.p["border_hover"])
        tk.Label(tip, text=self.text, font=self.font, bg=self.p["surface"],
                 fg=self.p["muted"], padx=8, pady=3).pack(padx=1, pady=1)
        tip.update_idletasks()

        # 计算位置，带边界检测
        tip_w = tip.winfo_width()
        tip_h = tip.winfo_height()
        widget_w = self.widget.winfo_width()
        widget_h = self.widget.winfo_height()
        x = self.widget.winfo_rootx() + (widget_w - tip_w) // 2
        y = self.widget.winfo_rooty() + widget_h + 6

        # 屏幕边界检测
        screen_w = self.widget.winfo_screenwidth()
        screen_h = self.widget.winfo_screenheight()
        if x + tip_w > screen_w:
            x = screen_w - tip_w - 2
        if x < 0:
            x = 2
        if y + tip_h > screen_h:
            # 显示在上方
            y = self.widget.winfo_rooty() - tip_h - 6

        tip.wm_geometry(f"+{x}+{y}")
        self._tip = tip

    def hide(self, _event=None) -> None:
        if self._job is not None:
            try:
                self.widget.after_cancel(self._job)
            except tk.TclError:
                pass
            self._job = None
        if self._tip is not None:
            self._tip.destroy()
            self._tip = None


class ScrollFrame(tk.Frame):
    """可滚动容器：内容放进 self.inner 即可，滚轮跟随鼠标位置生效。

    优化：多个 ScrollFrame 共存时，只有鼠标悬停的那个响应滚轮。
    """

    _active_scroll = None  # 类变量，记录当前激活的滚动区域

    def __init__(self, master, *, palette):
        super().__init__(master, bg=palette["bg"])
        self.p = palette
        self.canvas = tk.Canvas(self, bg=palette["bg"], bd=0, highlightthickness=0)
        self.inner = tk.Frame(self.canvas, bg=palette["bg"])
        self._win = self.canvas.create_window((0, 0), window=self.inner, anchor="nw")

        self.vbar = ttk.Scrollbar(self, orient="vertical", command=self.canvas.yview,
                                  style=self._make_scrollbar_style(palette))
        self.canvas.configure(yscrollcommand=self._on_scroll)
        self.canvas.grid(row=0, column=0, sticky="nsew")
        self.canvas.bind("<Configure>", self._sync_canvas_width)
        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(0, weight=1)

        # 水平滚动条
        self.hbar = ttk.Scrollbar(self, orient="horizontal", command=self.canvas.xview,
                                  style=self._make_hscrollbar_style(palette))
        self.canvas.configure(xscrollcommand=self._on_hscroll)
        self.hbar.grid(row=1, column=0, sticky="ew")

        self.inner.bind("<Configure>", self._sync_region)

        # 绑定到顶层窗口，但只在鼠标悬停时响应
        self._bind_wheel()

        # 鼠标进入/离开时设置激活状态
        self.bind("<Enter>", lambda e: self._set_active(True))
        self.bind("<Leave>", lambda e: self._set_active(False))

    def _set_active(self, active: bool) -> None:
        if active:
            ScrollFrame._active_scroll = self
        else:
            if ScrollFrame._active_scroll is self:
                ScrollFrame._active_scroll = None

    def _bind_wheel(self) -> None:
        top = self.winfo_toplevel()
        # 检查是否已经绑定过（避免重复绑定）
        if not getattr(top, "_scroll_wheel_bound", False):
            top.bind("<MouseWheel>", self._on_wheel_global, add="+")
            top._scroll_wheel_bound = True

    @staticmethod
    def _on_wheel_global(event) -> None:
        """全局滚轮事件处理：只让激活的滚动区域响应。"""
        if ScrollFrame._active_scroll is not None:
            ScrollFrame._active_scroll._on_wheel(event)

    @staticmethod
    def _make_scrollbar_style(p: dict[str, str]) -> str:
        """ttk 只有 clam 主题能自由改滚动条配色，这里按当前色板配一套细滚动条。"""
        style = ttk.Style()
        if "clam" in style.theme_names():
            style.theme_use("clam")
        name = "App.Vertical.TScrollbar"
        style.configure(name, gripcount=0, borderwidth=0, arrowsize=12, width=10,
                        troughcolor=p["bg"], bordercolor=p["bg"],
                        background=p["border_hover"], arrowcolor=p["faint"],
                        darkcolor=p["border_hover"], lightcolor=p["border_hover"])
        style.map(name, background=[("active", p["faint"])])
        return name

    @staticmethod
    def _make_hscrollbar_style(p: dict[str, str]) -> str:
        style = ttk.Style()
        if "clam" in style.theme_names():
            style.theme_use("clam")
        name = "App.Horizontal.TScrollbar"
        style.configure(name, gripcount=0, borderwidth=0, arrowsize=12, width=10,
                        troughcolor=p["bg"], bordercolor=p["bg"],
                        background=p["border_hover"], arrowcolor=p["faint"],
                        darkcolor=p["border_hover"], lightcolor=p["border_hover"])
        style.map(name, background=[("active", p["faint"])])
        return name

    def _on_scroll(self, first, last) -> None:
        # 内容不够长时不显示滚动条，界面更干净
        if float(first) <= 0.0 and float(last) >= 1.0:
            self.vbar.grid_remove()
        else:
            self.vbar.grid(row=0, column=1, sticky="ns")
            self.vbar.set(first, last)

    def _on_hscroll(self, first, last) -> None:
        # 内容不够宽时不显示水平滚动条
        if float(first) <= 0.0 and float(last) >= 1.0:
            self.hbar.grid_remove()
        else:
            self.hbar.grid(row=1, column=0, sticky="ew")
            self.hbar.set(first, last)

    def _sync_region(self, _event=None) -> None:
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def _sync_canvas_width(self, event) -> None:
        self.canvas.itemconfigure(self._win, width=max(event.width, 1))
        self._sync_region()

    def _on_wheel(self, event) -> None:
        if not self.winfo_exists():
            return
        # Shift+滚轮 水平滚动
        if event.state & 0x0001:
            first, last = self.canvas.xview()
            if first <= 0.0 and last >= 1.0:
                return
            self.canvas.xview_scroll(-int(event.delta / 120), "units")
            return
        first, last = self.canvas.yview()
        if first <= 0.0 and last >= 1.0:
            return
        self.canvas.yview_scroll(-int(event.delta / 120), "units")

    def scroll_to_top(self) -> None:
        self.canvas.yview_moveto(0)
