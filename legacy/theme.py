"""配色与字体。

所有颜色集中在这里，切换主题时整个界面按同一套色板重建，
避免颜色散落在各个控件里改不动。
"""
from __future__ import annotations

import tkinter.font as tkfont

PALETTES: dict[str, dict[str, str]] = {
    "light": {
        "bg": "#f2f4f8",          # 页面底色
        "surface": "#ffffff",     # 卡片
        "surface_hover": "#f7f9fc",
        "surface_alt": "#eceff5",  # 分段控件槽、进度条底
        "border": "#e3e7ee",
        "border_hover": "#c9d2e3",
        "text": "#1f2329",
        "muted": "#666e7d",
        "faint": "#98a1b0",
        "accent": "#4f6ef7",
        "accent_hover": "#3f5ce0",
        "accent_soft": "#e8edff",
        "accent_soft_hover": "#dbe4ff",
        "accent_text": "#ffffff",
        "success": "#2fa36b",
        "success_hover": "#28905e",
        "warning": "#f59e0b",
        "warning_soft": "#fef3c7",
        "danger": "#e05252",
        "danger_soft": "#fdecec",
        "shadow": "#dfe4ec",
    },
    "dark": {
        "bg": "#14161b",
        "surface": "#1e2128",
        "surface_hover": "#262a33",
        "surface_alt": "#23262e",
        "border": "#2f343e",
        "border_hover": "#454c5a",
        "text": "#e8eaed",
        "muted": "#9aa1ad",
        "faint": "#6f7681",
        "accent": "#6b8afd",
        "accent_hover": "#8098ff",
        "accent_soft": "#242c42",
        "accent_soft_hover": "#2c3550",
        "accent_text": "#ffffff",
        "success": "#4bbd85",
        "success_hover": "#5cc994",
        "warning": "#fbbf24",
        "warning_soft": "#3a2e1a",
        "danger": "#f07171",
        "danger_soft": "#3a2626",
        "shadow": "#0f1115",
    },
}

FONT_CANDIDATES = ("Microsoft YaHei UI", "Microsoft YaHei", "Segoe UI", "SimHei")


def pick_family(root) -> str:
    """挑一个系统里存在的中文字体，避免出现方框。"""
    available = set(tkfont.families(root))
    for name in FONT_CANDIDATES:
        if name in available:
            return name
    return "TkDefaultFont"


def make_fonts(root) -> dict[str, tkfont.Font]:
    fam = pick_family(root)
    return {
        "display": tkfont.Font(root=root, family=fam, size=19, weight="bold"),
        "h1": tkfont.Font(root=root, family=fam, size=13, weight="bold"),
        "h2": tkfont.Font(root=root, family=fam, size=11, weight="bold"),
        "body": tkfont.Font(root=root, family=fam, size=11),
        "body_done": tkfont.Font(root=root, family=fam, size=11, overstrike=True),
        "small": tkfont.Font(root=root, family=fam, size=9),
        "icon": tkfont.Font(root=root, family=fam, size=12),
    }
