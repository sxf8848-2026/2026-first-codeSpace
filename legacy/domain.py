"""领域规则：任务筛选和统计这类纯业务判断。"""
from __future__ import annotations

from dataclasses import dataclass

from storage import STATUS_TODO


@dataclass(frozen=True)
class TaskFilters:
    """当前列表筛选条件。"""

    status: str = "all"
    priority: str = "all"
    search_text: str = ""
    tag: int = -1


def matches_task(task: dict, filters: TaskFilters) -> bool:
    """判断任务是否匹配当前筛选条件。"""
    if filters.status != "all":
        if int(task.get("status", STATUS_TODO)) != int(filters.status):
            return False

    if filters.priority != "all":
        if task.get("priority", "medium") != filters.priority:
            return False

    if filters.search_text:
        haystack = " ".join([
            task.get("text", ""),
            task.get("description", ""),
        ]).lower()
        if filters.search_text not in haystack:
            return False

    if filters.tag >= 0:
        if int(task.get("tag", 0)) != filters.tag:
            return False

    return True
