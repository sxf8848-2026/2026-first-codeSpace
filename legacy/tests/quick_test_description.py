"""测试 v3 -> v4 数据迁移和描述功能。"""
import sys
import os
import tempfile
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from storage import TodoStore, DATA_VERSION


def main():
    tmpdir = tempfile.mkdtemp()

    # 构造 v3 格式数据（没有 description 字段）
    v3_file = os.path.join(tmpdir, "v3_todos.json")
    v3_data = {
        "version": 3,
        "todos": {
            "2026-08-10": [
                {"id": "1", "text": "测试任务", "status": 1, "priority": "medium",
                 "created_at": "2026-08-10 10:00:00", "done_at": None},
            ]
        }
    }
    with open(v3_file, "w", encoding="utf-8") as f:
        json.dump(v3_data, f)

    # 加载，应该自动迁移到 v4
    store = TodoStore(path=v3_file)
    assert store._version == DATA_VERSION, f"版本应为 {DATA_VERSION}"
    print(f"测试1 - v3->v4 迁移: PASS (v{store._version})")

    tasks = store.tasks_for("2026-08-10")
    assert "description" in tasks[0]
    assert tasks[0]["description"] == ""
    print(f"测试2 - 迁移后有 description 字段: PASS (值='{tasks[0]['description']}')")

    # 测试 add 带 description
    store2 = TodoStore(path=os.path.join(tmpdir, "test2.json"))
    t1 = store2.add("2026-08-10", "有描述的任务", description="这是任务的详细描述")
    assert t1["description"] == "这是任务的详细描述"
    print(f"测试3 - add 带描述: PASS (description='{t1['description']}')")

    t2 = store2.add("2026-08-10", "无描述的任务")
    assert t2["description"] == ""
    print(f"测试4 - add 不带描述: PASS (description='{t2['description']}')")

    # 测试 update_description
    updated = store2.update_description("2026-08-10", t2["id"], "新增的描述")
    assert updated["description"] == "新增的描述"
    print(f"测试5 - update_description: PASS (description='{updated['description']}')")

    # 测试 find_task 返回 description
    found = store2.find_task("2026-08-10", t1["id"])
    assert found["description"] == "这是任务的详细描述"
    print(f"测试6 - find_task 包含描述: PASS")

    # 测试持久化
    store3 = TodoStore(path=os.path.join(tmpdir, "test2.json"))
    tasks3 = store3.tasks_for("2026-08-10")
    assert tasks3[0]["description"] == "这是任务的详细描述"
    print(f"测试7 - 描述持久化: PASS")

    print()
    print("所有描述功能测试通过！")


if __name__ == "__main__":
    main()
