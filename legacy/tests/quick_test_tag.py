"""测试标签功能。"""
import sys
import os
import tempfile
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from storage import TodoStore, TAG_NONE, TAG_LIFE, TAG_STUDY, TAG_WORK, TAG_NAMES, DATA_VERSION


def main():
    tmpdir = tempfile.mkdtemp()
    data_dir = os.path.join(tmpdir, "data")
    os.makedirs(data_dir, exist_ok=True)
    test_file = os.path.join(data_dir, "todos.json")

    # 测试1: v4->v5 迁移
    v4_data = {
        "version": 4,
        "todos": {
            "2026-08-10": [
                {"id": "1", "text": "旧任务", "status": 1, "priority": "medium",
                 "created_at": "2026-08-10 10:00:00", "done_at": None, "description": ""},
            ]
        }
    }
    with open(test_file, "w", encoding="utf-8") as f:
        json.dump(v4_data, f)

    store = TodoStore(path=test_file)
    assert store._version == 5, f"版本应为5，实际{store._version}"
    tasks = store.tasks_for("2026-08-10")
    assert "tag" in tasks[0], "迁移后应有 tag 字段"
    assert tasks[0]["tag"] == TAG_NONE, f"默认标签应为0，实际{tasks[0]['tag']}"
    print("测试1 - v4->v5 迁移: PASS")

    # 测试2: add 带标签
    task = store.add("2026-08-10", "学习任务", tag=TAG_STUDY)
    assert task["tag"] == TAG_STUDY
    print(f"测试2 - add 带标签: PASS (tag={task['tag']}={TAG_NAMES[task['tag']]})")

    # 测试3: add 不带标签（默认未分类）
    task2 = store.add("2026-08-10", "普通任务")
    assert task2["tag"] == TAG_NONE
    print(f"测试3 - add 默认标签: PASS (tag={task2['tag']})")

    # 测试4: set_tag 修改标签
    updated = store.set_tag("2026-08-10", task2["id"], TAG_WORK)
    assert updated["tag"] == TAG_WORK
    print(f"测试4 - set_tag: PASS (tag={updated['tag']}={TAG_NAMES[updated['tag']]})")

    # 测试5: 标签筛选（手动模拟）
    all_tasks = store.tasks_for("2026-08-10")
    study_tasks = [t for t in all_tasks if int(t.get("tag", 0)) == TAG_STUDY]
    work_tasks = [t for t in all_tasks if int(t.get("tag", 0)) == TAG_WORK]
    assert len(study_tasks) == 1
    assert len(work_tasks) == 1
    print(f"测试5 - 标签筛选: PASS (学习={len(study_tasks)}, 工作={len(work_tasks)})")

    # 测试6: 持久化
    store2 = TodoStore(path=test_file)
    tasks2 = store2.tasks_for("2026-08-10")
    tags = [t["tag"] for t in tasks2]
    assert TAG_STUDY in tags
    assert TAG_WORK in tags
    print("测试6 - 标签持久化: PASS")

    print()
    print("所有标签功能测试通过！")


if __name__ == "__main__":
    main()
