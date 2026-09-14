"""storage.py 的单元测试。"""
import os
import tempfile

from storage import (
    DATA_VERSION,
    STATUS_DONE,
    STATUS_TODO,
    TAG_LIFE,
    TodoStore,
    load_prefs,
    save_prefs,
)


class TestTodoStore:
    """TodoStore 单元测试。"""

    def setup_method(self):
        """每个测试前创建临时文件。"""
        self.tmpdir = tempfile.mkdtemp()
        self.test_file = os.path.join(self.tmpdir, "todos.json")
        self.store = TodoStore(path=self.test_file)

    def test_add_task(self):
        """测试添加任务。"""
        task = self.store.add("2026-08-10", "测试任务")
        assert task["text"] == "测试任务"
        assert task["status"] == STATUS_TODO
        assert task["priority"] == "medium"
        assert task["description"] == ""
        assert task["tag"] == 0
        assert "id" in task
        assert "created_at" in task

        tasks = self.store.tasks_for("2026-08-10")
        assert len(tasks) == 1
        assert tasks[0]["text"] == "测试任务"

    def test_add_with_priority(self):
        """测试带优先级添加任务。"""
        task = self.store.add("2026-08-10", "高优先级任务", priority="high")
        assert task["priority"] == "high"

    def test_toggle_task(self):
        """测试切换完成状态。"""
        task = self.store.add("2026-08-10", "测试任务")
        assert task["status"] == STATUS_TODO

        toggled = self.store.toggle("2026-08-10", task["id"])
        assert toggled["status"] == STATUS_DONE
        assert toggled["done_at"] is not None

        toggled2 = self.store.toggle("2026-08-10", task["id"])
        assert toggled2["status"] == STATUS_TODO
        assert toggled2["done_at"] is None

    def test_update_text(self):
        """测试更新任务文本。"""
        task = self.store.add("2026-08-10", "原始文本")
        updated = self.store.update_text("2026-08-10", task["id"], "新文本")
        assert updated["text"] == "新文本"

    def test_set_priority(self):
        """测试设置优先级。"""
        task = self.store.add("2026-08-10", "测试任务")
        updated = self.store.set_priority("2026-08-10", task["id"], "high")
        assert updated["priority"] == "high"

    def test_remove_task(self):
        """测试删除任务。"""
        task = self.store.add("2026-08-10", "要删除的任务")
        removed = self.store.remove("2026-08-10", task["id"])
        assert removed["text"] == "要删除的任务"

        tasks = self.store.tasks_for("2026-08-10")
        assert len(tasks) == 0

    def test_remove_nonexistent(self):
        """测试删除不存在的任务。"""
        result = self.store.remove("2026-08-10", "nonexistent-id")
        assert result is None

    def test_stats(self):
        """测试统计功能。"""
        self.store.add("2026-08-10", "任务1")
        task2 = self.store.add("2026-08-10", "任务2")
        self.store.add("2026-08-10", "任务3")
        self.store.toggle("2026-08-10", task2["id"])

        done, total = self.store.stats("2026-08-10")
        assert done == 1
        assert total == 3

    def test_stats_empty_day(self):
        """测试空日期的统计。"""
        done, total = self.store.stats("2026-08-10")
        assert done == 0
        assert total == 0

    def test_all_days(self):
        """测试获取所有有记录的日期。"""
        self.store.add("2026-08-10", "任务1")
        self.store.add("2026-08-09", "任务2")
        self.store.add("2026-08-11", "任务3")

        days = self.store.all_days()
        assert days == ["2026-08-09", "2026-08-10", "2026-08-11"]

    def test_move_task(self):
        """测试移动任务顺序。"""
        task1 = self.store.add("2026-08-10", "任务1")
        task2 = self.store.add("2026-08-10", "任务2")
        task3 = self.store.add("2026-08-10", "任务3")

        # 下移第一个任务
        assert self.store.move("2026-08-10", task1["id"], 1)
        tasks = self.store.tasks_for("2026-08-10")
        assert tasks[0]["id"] == task2["id"]
        assert tasks[1]["id"] == task1["id"]

        # 上移最后一个任务
        assert self.store.move("2026-08-10", task3["id"], -1)
        tasks = self.store.tasks_for("2026-08-10")
        assert tasks[1]["id"] == task3["id"]
        assert tasks[2]["id"] == task1["id"]

    def test_move_out_of_bounds(self):
        """测试越界移动。"""
        task = self.store.add("2026-08-10", "任务1")
        assert not self.store.move("2026-08-10", task["id"], 1)
        assert not self.store.move("2026-08-10", task["id"], -1)

    def test_clear_done(self):
        """测试清除已完成任务。"""
        task1 = self.store.add("2026-08-10", "任务1")
        task2 = self.store.add("2026-08-10", "任务2")
        task3 = self.store.add("2026-08-10", "任务3")
        self.store.toggle("2026-08-10", task1["id"])
        self.store.toggle("2026-08-10", task3["id"])

        count, removed = self.store.clear_done("2026-08-10")
        assert count == 2
        assert len(removed) == 2

        tasks = self.store.tasks_for("2026-08-10")
        assert len(tasks) == 1
        assert tasks[0]["id"] == task2["id"]

    def test_carry_over(self):
        """测试继承昨日未完成。"""
        self.store.add("2026-08-09", "已完成的任务")
        task2 = self.store.add("2026-08-09", "未完成的任务")
        self.store.toggle("2026-08-09", "已完成的任务" if False else self.store.tasks_for("2026-08-09")[0]["id"])

        count = self.store.carry_over("2026-08-09", "2026-08-10")
        assert count == 1

        tasks = self.store.tasks_for("2026-08-10")
        assert len(tasks) == 1
        assert tasks[0]["text"] == "未完成的任务"
        assert tasks[0]["status"] == STATUS_TODO

    def test_carry_over_duplicate(self):
        """测试继承时跳过重复内容。"""
        self.store.add("2026-08-09", "重复的任务")
        self.store.add("2026-08-10", "重复的任务")

        count = self.store.carry_over("2026-08-09", "2026-08-10")
        assert count == 0  # 应该跳过重复

    def test_insert_at(self):
        """测试在指定位置插入任务。"""
        task1 = self.store.add("2026-08-10", "任务1")
        task2 = self.store.add("2026-08-10", "任务2")

        new_task = {"id": "test-id", "text": "插入的任务", "status": STATUS_TODO,
                    "priority": "medium", "created_at": "2026-08-10 10:00:00",
                    "done_at": None}
        self.store.insert_at("2026-08-10", 1, new_task)

        tasks = self.store.tasks_for("2026-08-10")
        assert len(tasks) == 3
        assert tasks[1]["id"] == "test-id"
        assert tasks[1]["description"] == ""
        assert tasks[1]["tag"] == 0

    def test_carry_over_preserves_task_details(self):
        """测试继承昨日时保留描述和标签。"""
        self.store.add(
            "2026-08-09",
            "带详情的任务",
            description="不要丢掉这段说明",
            tag=TAG_LIFE,
        )

        count = self.store.carry_over("2026-08-09", "2026-08-10")

        assert count == 1
        task = self.store.tasks_for("2026-08-10")[0]
        assert task["description"] == "不要丢掉这段说明"
        assert task["tag"] == TAG_LIFE
        assert task["status"] == STATUS_TODO

    def test_find_task(self):
        """测试查找任务。"""
        task = self.store.add("2026-08-10", "测试任务")
        found = self.store.find_task("2026-08-10", task["id"])
        assert found is not None
        assert found["text"] == "测试任务"

        not_found = self.store.find_task("2026-08-10", "nonexistent")
        assert not_found is None

    def test_persistence(self):
        """测试数据持久化。"""
        self.store.add("2026-08-10", "持久化测试")

        # 重新加载
        store2 = TodoStore(path=self.test_file)
        tasks = store2.tasks_for("2026-08-10")
        assert len(tasks) == 1
        assert tasks[0]["text"] == "持久化测试"

    def test_data_version(self):
        """测试数据版本号。"""
        self.store.add("2026-08-10", "测试")
        assert self.store._version == DATA_VERSION

        # 重新加载，版本号应该保持
        store2 = TodoStore(path=self.test_file)
        assert store2._version == DATA_VERSION

    def test_empty_day_deleted(self):
        """测试空日期会被删除。"""
        task = self.store.add("2026-08-10", "测试任务")
        self.store.remove("2026-08-10", task["id"])

        assert "2026-08-10" not in self.store._data
        assert "2026-08-10" not in self.store.all_days()


class TestPrefs:
    """偏好设置测试。"""

    def setup_method(self):
        self.tmpdir = tempfile.mkdtemp()
        self.pref_file = os.path.join(self.tmpdir, "prefs.json")

    def test_save_and_load_prefs(self):
        """测试保存和加载偏好。"""
        prefs = {"theme": "dark", "font_size": 12}
        save_prefs(prefs, path=self.pref_file)

        loaded = load_prefs(path=self.pref_file)
        assert loaded == prefs

    def test_load_nonexistent_prefs(self):
        """测试加载不存在的偏好文件返回空字典。"""
        loaded = load_prefs(path="/nonexistent/path/prefs.json")
        assert loaded == {}

    def test_load_invalid_prefs(self):
        """测试加载损坏的偏好文件返回空字典。"""
        with open(self.pref_file, "w") as f:
            f.write("invalid json")

        loaded = load_prefs(path=self.pref_file)
        assert loaded == {}


class TestMigration:
    """数据迁移测试。"""

    def test_v1_to_v2_migration(self):
        """测试从 v1 格式迁移到 v2。"""
        import json

        # v1 格式：直接是日期->列表的映射
        v1_data = {
            "2026-08-10": [
                {"id": "1", "text": "任务1", "done": False,
                 "created_at": "2026-08-10 10:00:00", "done_at": None},
                {"id": "2", "text": "任务2", "done": True,
                 "created_at": "2026-08-10 11:00:00", "done_at": "2026-08-10 12:00:00"},
            ]
        }

        tmpdir = tempfile.mkdtemp()
        test_file = os.path.join(tmpdir, "todos.json")
        with open(test_file, "w", encoding="utf-8") as f:
            json.dump(v1_data, f)

        store = TodoStore(path=test_file)
        assert store._version == DATA_VERSION  # 应该已迁移到最新版本

        tasks = store.tasks_for("2026-08-10")
        assert len(tasks) == 2
        # 迁移后应该有 priority 字段，默认值为 medium
        assert tasks[0]["priority"] == "medium"
        assert tasks[1]["priority"] == "medium"
        assert tasks[0]["status"] == STATUS_TODO
        assert tasks[1]["status"] == STATUS_DONE
