"""数据存取层：按日期把待办事项保存到本地 JSON 文件。

数据结构（v3）：
{
    "version": 4,
    "todos": {
        "2026-08-10": [
            {
                "id": "唯一标识",
                "text": "事项内容",
                "status": 1,          # 0-已完成, 1-未完成, 2-进行中
                "description": "",       # 任务描述（非必填）
                "tag": 0,              # 0-未分类, 1-生活, 2-学习, 3-工作
                "priority": "medium", # high / medium / low
                "created_at": "2026-08-10 09:30:00",
                "done_at": null        # 完成时间，仅 status=0 时有值
            },
            ...
        ],
        ...
    }
}
"""
from __future__ import annotations

import json
import os
import shutil
import uuid
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "todos.json")
PREF_FILE = os.path.join(BASE_DIR, "data", "prefs.json")
DEFAULT_TASKS_FILE = os.path.join(BASE_DIR, "data", "default_tasks.json")

TIME_FMT = "%Y-%m-%d %H:%M:%S"
DATA_VERSION = 5  # 数据结构版本号，用于迁移

# 状态码常量
STATUS_DONE = 0        # 已完成
STATUS_TODO = 1        # 未完成
STATUS_IN_PROGRESS = 2  # 进行中

# 标签常量
TAG_NONE = 0      # 未分类
TAG_LIFE = 1      # 生活
TAG_STUDY = 2     # 学习
TAG_WORK = 3      # 工作

TAG_NAMES = {0: '未分类', 1: '生活', 2: '学习', 3: '工作'}


def _now() -> str:
    return datetime.now().strftime(TIME_FMT)


def load_prefs(path: str = PREF_FILE) -> dict:
    """界面偏好（主题等）。读不出来就用默认值，不影响主流程。"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def save_prefs(prefs: dict, path: str = PREF_FILE) -> None:
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(prefs, f, ensure_ascii=False, indent=2)
    except OSError:
        pass


class TodoStore:
    """所有增删改都会立即落盘，避免程序意外退出丢数据。"""

    def __init__(self, path: str = DATA_FILE):
        self.path = path
        self._data: dict[str, list[dict]] = {}
        self._version: int = DATA_VERSION
        self._default_applied: set[str] = set()  # 已应用默认任务的日期
        self.load()

    # ---------- 读写文件 ----------

    def load(self) -> None:
        if not os.path.exists(self.path):
            self._data = {}
            self._version = DATA_VERSION
            return
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                raw = json.load(f)
        except (json.JSONDecodeError, OSError):
            # 文件损坏时先备份，再从空数据重新开始，避免直接崩溃
            shutil.copy(self.path, self.path + ".bak")
            self._data = {}
            self._version = DATA_VERSION
            return

        # 解析数据结构（兼容旧版本）
        if isinstance(raw, dict) and "todos" in raw:
            # 新版本格式
            self._version = raw.get("version", 1)
            todos = raw.get("todos", {})
        elif isinstance(raw, dict):
            # 旧版本格式（直接就是日期->列表的映射）
            self._version = 1
            todos = raw
        else:
            self._data = {}
            self._version = DATA_VERSION
            return

        # 数据迁移
        if self._version < DATA_VERSION:
            backup_path = self._backup(self._version)
            todos = self._migrate(todos, self._version, DATA_VERSION)
            self._version = DATA_VERSION
            self.save()  # 迁移后保存新版本

        # 验证并清理数据
        if isinstance(todos, dict):
            self._data = {
                day: [t for t in tasks if isinstance(t, dict)]
                for day, tasks in todos.items()
                if isinstance(tasks, list)
            }
        else:
            self._data = {}

        # 加载已应用默认任务的日期记录
        if isinstance(raw, dict):
            applied = raw.get("default_applied", [])
            if isinstance(applied, list):
                self._default_applied = set(d for d in applied if isinstance(d, str))

    def _migrate(self, todos: dict, from_ver: int, to_ver: int) -> dict:
        """数据迁移：从旧版本升级到新版本。"""
        result = {}
        for day, tasks in todos.items():
            new_tasks = []
            for t in tasks:
                if not isinstance(t, dict):
                    continue
                new_task = dict(t)
                # v1 -> v2: 添加 priority 字段
                if from_ver < 2 and "priority" not in new_task:
                    new_task["priority"] = "medium"
                # v2 -> v3: done 布尔值 -> status 状态码
                if from_ver < 3 and "status" not in new_task:
                    new_task["status"] = STATUS_DONE if new_task.get("done") else STATUS_TODO
                # v3 -> v4: 添加 description 字段
                if from_ver < 4 and "description" not in new_task:
                    new_task["description"] = ""
                # v4 -> v5: 添加 tag 字段
                if from_ver < 5 and "tag" not in new_task:
                    new_task["tag"] = TAG_NONE
                new_tasks.append(new_task)
            result[day] = new_tasks
        return result

    def _backup(self, from_version: int) -> str:
        """迁移前备份原数据文件，返回备份路径。

        备份文件放在 data/backups/ 目录下，文件名包含原版本号和时间戳，
        例如：todos_v3_20260816_143022.json.bak
        """
        import time
        backup_dir = os.path.join(os.path.dirname(self.path), "backups")
        os.makedirs(backup_dir, exist_ok=True)
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(
            backup_dir, f"todos_v{from_version}_{timestamp}.json.bak")
        shutil.copy2(self.path, backup_file)
        return backup_file

    def save(self) -> None:
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        tmp = self.path + ".tmp"
        # 先写临时文件再替换，写一半断电也不会毁掉原文件
        data = {
            "version": self._version,
            "todos": self._data,
            "default_applied": sorted(self._default_applied),
        }
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self.path)

    # ---------- 查询 ----------

    def tasks_for(self, day: str) -> list[dict]:
        return self._data.get(day, [])

    def stats(self, day: str) -> tuple[int, int]:
        """返回 (已完成数, 总数)。"""
        tasks = self.tasks_for(day)
        return sum(1 for t in tasks if t.get("status") == STATUS_DONE), len(tasks)

    def all_days(self) -> list[str]:
        """有记录的日期，按时间正序。"""
        return sorted(d for d, tasks in self._data.items() if tasks)

    def _find(self, day: str, task_id: str) -> dict | None:
        for t in self.tasks_for(day):
            if t.get("id") == task_id:
                return t
        return None

    def find_task(self, day: str, task_id: str) -> dict | None:
        """公开的查找方法，返回任务的副本（避免外部直接修改内部数据）。"""
        task = self._find(day, task_id)
        return dict(task) if task else None

    # ---------- 修改 ----------

    def add(self, day: str, text: str, priority: str = "medium",
            status: int = STATUS_TODO, description: str = "", tag: int = TAG_NONE) -> dict:
        task = {
            "id": uuid.uuid4().hex,
            "text": text.strip(),
            "status": status,  # 0-已完成, 1-未完成, 2-进行中
            "priority": priority,
            "created_at": _now(),
            "done_at": _now() if status == STATUS_DONE else None,
            "description": description.strip(),
            "tag": tag,
        }
        day = day.strftime("%Y-%m-%d") if hasattr(day, "strftime") else str(day)
        self._data.setdefault(day, []).append(task)
        self.save()
        return dict(task)  # 返回副本

    def update_text(self, day: str, task_id: str, text: str) -> dict | None:
        task = self._find(day, task_id)
        if task is not None:
            task["text"] = text.strip()
            self.save()
            return dict(task)
        return None

    def set_priority(self, day: str, task_id: str, priority: str) -> dict | None:
        """设置任务优先级。"""
        task = self._find(day, task_id)
        if task is not None:
            task["priority"] = priority
            self.save()
            return dict(task)
        return None


    def update_description(self, day: str, task_id: str, description: str) -> dict | None:
        """更新任务描述。"""
        task = self._find(day, task_id)
        if task is not None:
            task["description"] = description.strip()
            self.save()
            return dict(task)
        return None

    def set_tag(self, day: str, task_id: str, tag: int) -> dict | None:
        """设置任务标签（0-未分类, 1-生活, 2-学习, 3-工作）。"""
        task = self._find(day, task_id)
        if task is not None:
            task["tag"] = tag
            self.save()
            return dict(task)
        return None
    def set_status(self, day: str, task_id: str, status: int) -> dict | None:
        """设置任务状态（0-已完成, 1-未完成, 2-进行中）。"""
        task = self._find(day, task_id)
        if task is not None:
            task["status"] = status
            task["done_at"] = _now() if status == STATUS_DONE else None
            self.save()
            return dict(task)
        return None

    def toggle(self, day: str, task_id: str) -> dict | None:
        """切换完成状态：未完成/进行中 -> 已完成；已完成 -> 未完成。"""
        task = self._find(day, task_id)
        if task is None:
            return None
        if task.get("status") == STATUS_DONE:
            task["status"] = STATUS_TODO
            task["done_at"] = None
        else:
            task["status"] = STATUS_DONE
            task["done_at"] = _now()
        self.save()
        return dict(task)

    def remove(self, day: str, task_id: str) -> dict | None:
        """删除任务，返回被删除的任务（用于撤销）。"""
        tasks = self.tasks_for(day)
        idx = next((i for i, t in enumerate(tasks) if t.get("id") == task_id), None)
        if idx is None:
            return None
        removed = tasks.pop(idx)
        if not tasks:
            del self._data[day]
        self.save()
        return dict(removed)

    def insert_at(self, day: str, index: int, task: dict) -> None:
        """在指定位置插入任务（用于撤销删除）。"""
        tasks = self._data.setdefault(day, [])
        safe_index = max(0, min(index, len(tasks)))
        tasks.insert(safe_index, self._normalize_task(task))
        self.save()

    def clear_done(self, day: str) -> tuple[int, list[dict]]:
        """删掉当天所有已完成的事项，返回 (删除条数, 被删除的任务列表)。"""
        tasks = self.tasks_for(day)
        keep = []
        removed = []
        for t in tasks:
            if t.get("status") == STATUS_DONE:
                removed.append(t)
            else:
                keep.append(t)
        if removed:
            if keep:
                self._data[day] = keep
            else:
                del self._data[day]
            self.save()
        return len(removed), [dict(t) for t in removed]

    def move(self, day: str, task_id: str, delta: int) -> bool:
        """在当天列表内上移/下移一个事项。"""
        tasks = self.tasks_for(day)
        idx = next((i for i, t in enumerate(tasks) if t.get("id") == task_id), None)
        if idx is None:
            return False
        new_idx = idx + delta
        if not 0 <= new_idx < len(tasks):
            return False
        tasks[idx], tasks[new_idx] = tasks[new_idx], tasks[idx]
        self.save()
        return True

    def carry_over(self, from_day: str, to_day: str) -> int:
        """把 from_day 未完成的事项复制到 to_day，返回复制条数。

        原来那天的记录保持不变，这样历史仍然如实反映"当天没做完"。
        目标日期里已有同样内容的事项会跳过，避免重复点击产生副本。
        """
        existing = {t.get("text") for t in self.tasks_for(to_day)}
        pending = [
            t for t in self.tasks_for(from_day)
            if t.get("status") != STATUS_DONE and t.get("text") not in existing
        ]
        for t in pending:
            self._data.setdefault(to_day, []).append({
                "id": uuid.uuid4().hex,
                "text": t.get("text", ""),
                "status": STATUS_TODO,
                "priority": t.get("priority", "medium"),
                "created_at": _now(),
                "done_at": None,
                "description": t.get("description", ""),
                "tag": int(t.get("tag", TAG_NONE)),
            })
        if pending:
            self.save()
        return len(pending)

    def _normalize_task(self, task: dict) -> dict:
        """补齐任务字段，避免旧数据或撤销恢复后形状不一致。"""
        normalized = dict(task)
        normalized.setdefault("id", uuid.uuid4().hex)
        normalized["text"] = str(normalized.get("text", "")).strip()
        normalized.setdefault("status", STATUS_DONE if normalized.get("done") else STATUS_TODO)
        normalized.setdefault("priority", "medium")
        normalized.setdefault("created_at", _now())
        normalized.setdefault("done_at", None)
        normalized.setdefault("description", "")
        normalized.setdefault("tag", TAG_NONE)
        return normalized

    # ---------- 默认任务 ----------

    def load_default_tasks(self) -> list[dict]:
        """从配置文件加载每日默认任务。"""
        try:
            with open(DEFAULT_TASKS_FILE, "r", encoding="utf-8-sig") as f:
                data = json.load(f)
            if isinstance(data, dict) and isinstance(data.get("tasks"), list):
                return data["tasks"]
        except (OSError, json.JSONDecodeError):
            pass
        return []

    def apply_default_tasks(self, day: str) -> int:
        """把默认任务补充到指定日期（只添加缺失的，已有相同内容的不重复添加）。返回添加的任务数。"""

        defaults = self.load_default_tasks()
        if not defaults:
            return 0

        # 避免重复：检查当天是否已有相同内容的任务
        existing_texts = {t.get("text", "") for t in self.tasks_for(day)}
        added = 0
        for item in defaults:
            text = item.get("text", "").strip()
            if not text or text in existing_texts:
                continue
            self.add(
                day, text,
                priority=item.get("priority", "medium"),
                status=STATUS_TODO,
                tag=int(item.get("tag", TAG_NONE)),
            )
            existing_texts.add(text)
            added += 1

        # 标记当天已应用默认任务
        self._default_applied.add(day)
        if added > 0:
            self.save()
        return added
