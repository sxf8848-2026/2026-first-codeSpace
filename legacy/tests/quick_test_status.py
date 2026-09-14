"""测试 v2 -> v3 数据迁移。"""
import sys
import os
import tempfile
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from storage import TodoStore, DATA_VERSION, STATUS_DONE, STATUS_TODO, STATUS_IN_PROGRESS


def main():
    tmpdir = tempfile.mkdtemp()

    # 构造 v2 格式数据
    v2_file = os.path.join(tmpdir, "v2_todos.json")
    v2_data = {
        "version": 2,
        "todos": {
            "2026-08-10": [
                {"id": "1", "text": "已完成任务", "done": True, "priority": "high",
                 "created_at": "2026-08-10 10:00:00", "done_at": "2026-08-10 11:00:00"},
                {"id": "2", "text": "未完成任务", "done": False, "priority": "medium",
                 "created_at": "2026-08-10 10:00:00", "done_at": None},
            ]
        }
    }
    with open(v2_file, "w", encoding="utf-8") as f:
        json.dump(v2_data, f)

    # 加载，应该自动迁移到 v3
    store = TodoStore(path=v2_file)
    assert store._version == DATA_VERSION, f"版本应为 {DATA_VERSION}，实际 {store._version}"
    print(f"测试1 - 版本迁移: PASS (v{store._version})")

    tasks = store.tasks_for("2026-08-10")
    assert len(tasks) == 2
    print(f"测试2 - 任务数量: PASS ({len(tasks)} 条)")

    # 已完成 -> status=0
    assert tasks[0]["status"] == STATUS_DONE
    assert tasks[0]["done_at"] is not None
    print(f"测试3 - 已完成迁移: PASS (status={tasks[0]['status']})")

    # 未完成 -> status=1
    assert tasks[1]["status"] == STATUS_TODO
    assert tasks[1]["done_at"] is None
    print(f"测试4 - 未完成迁移: PASS (status={tasks[1]['status']})")

    # 测试 add 带 status
    store2 = TodoStore(path=os.path.join(tmpdir, "test2.json"))
    t1 = store2.add("2026-08-10", "进行中任务", status=STATUS_IN_PROGRESS)
    assert t1["status"] == STATUS_IN_PROGRESS
    assert t1["done_at"] is None
    print(f"测试5 - 添加进行中: PASS (status={t1['status']})")

    t2 = store2.add("2026-08-10", "已完成任务", status=STATUS_DONE)
    assert t2["status"] == STATUS_DONE
    assert t2["done_at"] is not None
    print(f"测试6 - 添加已完成: PASS (status={t2['status']})")

    # 测试 set_status
    store2.set_status("2026-08-10", t1["id"], STATUS_DONE)
    updated = store2.find_task("2026-08-10", t1["id"])
    assert updated["status"] == STATUS_DONE
    assert updated["done_at"] is not None
    print(f"测试7 - set_status: PASS (status={updated['status']})")

    # 测试 toggle（进行中 -> 已完成 -> 未完成）
    t3 = store2.add("2026-08-10", "切换测试", status=STATUS_IN_PROGRESS)
    toggled = store2.toggle("2026-08-10", t3["id"])
    assert toggled["status"] == STATUS_DONE
    print(f"测试8 - toggle(进行中->已完成): PASS (status={toggled['status']})")

    toggled2 = store2.toggle("2026-08-10", t3["id"])
    assert toggled2["status"] == STATUS_TODO
    print(f"测试9 - toggle(已完成->未完成): PASS (status={toggled2['status']})")

    # 测试 stats
    done, total = store2.stats("2026-08-10")
    print(f"测试10 - stats: PASS (已完成 {done}/{total})")

    print()
    print("所有状态功能测试通过！")


if __name__ == "__main__":
    main()
