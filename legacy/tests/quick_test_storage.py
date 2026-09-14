"""快速测试 storage 层功能。"""
import sys
import os
import tempfile
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from storage import TodoStore, DATA_VERSION


def main():
    tmpdir = tempfile.mkdtemp()

    # 测试 1: 添加任务
    test_file = os.path.join(tmpdir, "todos.json")
    store = TodoStore(path=test_file)
    task1 = store.add("2026-08-10", "测试任务1")
    task2 = store.add("2026-08-10", "测试任务2", priority="high")
    assert len(store.tasks_for("2026-08-10")) == 2
    print("测试1 - 添加任务: PASS")

    # 测试 2: 优先级
    assert task2["priority"] == "high"
    print("测试2 - 优先级: PASS")

    # 测试 3: 切换完成
    store.toggle("2026-08-10", task1["id"])
    done, total = store.stats("2026-08-10")
    assert done == 1 and total == 2
    print(f"测试3 - 切换完成: PASS (已完成 {done}/{total})")

    # 测试 4: 删除任务
    removed = store.remove("2026-08-10", task1["id"])
    assert removed is not None
    assert len(store.tasks_for("2026-08-10")) == 1
    print("测试4 - 删除任务: PASS")

    # 测试 5: 数据版本
    assert store._version == DATA_VERSION
    print(f"测试5 - 数据版本: PASS (v{store._version})")

    # 测试 6: 持久化
    store2 = TodoStore(path=test_file)
    assert len(store2.tasks_for("2026-08-10")) == 1
    print("测试6 - 持久化: PASS")

    # 测试 7: v1 数据迁移
    v1_file = os.path.join(tmpdir, "v1_todos.json")
    v1_data = {
        "2026-08-10": [
            {"id": "1", "text": "旧任务", "done": False,
             "created_at": "2026-08-10 10:00:00", "done_at": None}
        ]
    }
    with open(v1_file, "w", encoding="utf-8") as f:
        json.dump(v1_data, f)

    store3 = TodoStore(path=v1_file)
    assert store3._version == DATA_VERSION
    tasks = store3.tasks_for("2026-08-10")
    assert len(tasks) == 1
    assert tasks[0]["priority"] == "medium"
    print("测试7 - v1 数据迁移: PASS")

    # 测试 8: 清除已完成
    store4 = TodoStore(path=os.path.join(tmpdir, "test4.json"))
    t1 = store4.add("2026-08-10", "任务1")
    t2 = store4.add("2026-08-10", "任务2")
    t3 = store4.add("2026-08-10", "任务3")
    store4.toggle("2026-08-10", t1["id"])
    store4.toggle("2026-08-10", t3["id"])
    count, removed = store4.clear_done("2026-08-10")
    assert count == 2
    assert len(store4.tasks_for("2026-08-10")) == 1
    print(f"测试8 - 清除已完成: PASS (清除 {count} 条)")

    # 测试 9: 继承昨日
    store5 = TodoStore(path=os.path.join(tmpdir, "test5.json"))
    store5.add("2026-08-09", "已完成任务")
    store5.add("2026-08-09", "未完成任务")
    tasks_09 = store5.tasks_for("2026-08-09")
    store5.toggle("2026-08-09", tasks_09[0]["id"])

    count = store5.carry_over("2026-08-09", "2026-08-10")
    assert count == 1
    tasks_10 = store5.tasks_for("2026-08-10")
    assert len(tasks_10) == 1
    assert tasks_10[0]["text"] == "未完成任务"
    print(f"测试9 - 继承昨日: PASS (继承 {count} 条)")

    # 测试 10: 移动任务
    store6 = TodoStore(path=os.path.join(tmpdir, "test6.json"))
    ta = store6.add("2026-08-10", "任务A")
    tb = store6.add("2026-08-10", "任务B")
    tc = store6.add("2026-08-10", "任务C")
    assert store6.move("2026-08-10", ta["id"], 1)
    tasks = store6.tasks_for("2026-08-10")
    assert tasks[0]["id"] == tb["id"]
    assert tasks[1]["id"] == ta["id"]
    print("测试10 - 移动任务: PASS")

    # 测试 11: insert_at
    store7 = TodoStore(path=os.path.join(tmpdir, "test7.json"))
    store7.add("2026-08-10", "原任务1")
    store7.add("2026-08-10", "原任务2")
    new_task = {"id": "inserted", "text": "插入的任务", "done": False,
                "priority": "medium", "created_at": "2026-08-10 10:00:00",
                "done_at": None}
    store7.insert_at("2026-08-10", 1, new_task)
    tasks = store7.tasks_for("2026-08-10")
    assert len(tasks) == 3
    assert tasks[1]["id"] == "inserted"
    print("测试11 - insert_at: PASS")

    # 测试 12: find_task
    store8 = TodoStore(path=os.path.join(tmpdir, "test8.json"))
    tx = store8.add("2026-08-10", "查找测试")
    found = store8.find_task("2026-08-10", tx["id"])
    assert found is not None
    assert found["text"] == "查找测试"
    not_found = store8.find_task("2026-08-10", "nonexistent")
    assert not_found is None
    print("测试12 - find_task: PASS")

    print()
    print("所有 storage 层测试通过！")


if __name__ == "__main__":
    main()
