"""每日待办清单 —— 桌面版入口。

运行方式：python main.py
"""
import tkinter as tk

from app import TodoApp


def center(win: tk.Tk, width: int, height: int) -> None:
    x = (win.winfo_screenwidth() - width) // 2
    y = max((win.winfo_screenheight() - height) // 2 - 30, 0)
    win.geometry(f"{width}x{height}+{x}+{y}")


def main() -> None:
    root = tk.Tk()
    root.title("每日待办清单")
    center(root, 880, 660)
    root.minsize(700, 520)
    TodoApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
