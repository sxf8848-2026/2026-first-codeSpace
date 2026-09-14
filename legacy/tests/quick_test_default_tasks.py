"""测试每日默认任务功能。"""
import sys
import os
import tempfile
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from storage import TodoStore, TAG_LIFE


def main():
    tmpdir = tempfile.mkdtemp()
    data_dir = os.path.join(tmpdir, "data")
    os.makedirs(data_dir, exist_ok=True)
    test_file = os.path.join(data_dir, "todos.json")
    
    # 创建默认任务配置文件
    default_file = os.path.join(data_dir, "default_tasks.json")
    with open(default_file, "w", encoding="utf-8") as f:
        json.dump({"tasks": [
            {"text": "起床", "tag": 1, "priority": "medium"},
            {"text": "洗脸", "tag": 1, "priority": "medium"},
        ]}, f)
    
    # 修改 DEFAULT_TASKS_FILE 指向测试文件
    import storage
    storage.DEFAULT_TASKS_FILE = default_file
    
    store = TodoStore(path=test_file)
    
    # 测试1: 第一次应用默认任务
    added = store.apply_default_tasks("2026-08-16")
    assert added == 2, f"应添加2个，实际{added}"
    tasks = store.tasks_for("2026-08-16")
    assert len(tasks) == 2
    assert tasks[0]["text"] == "起床"
    assert tasks[0]["tag"] == TAG_LIFE
    print(f"测试1 - 第一次应用默认任务: PASS (添加了{added}个)")
    
    # 测试2: 同一天再次应用，不应重复添加
    added2 = store.apply_default_tasks("2026-08-16")
    assert added2 == 0, f"应添加0个，实际{added2}"
    tasks2 = store.tasks_for("2026-08-16")
    assert len(tasks2) == 2
    print(f"测试2 - 同一天重复应用: PASS (添加了{added2}个)")
    
    # 测试3: 另一天应用默认任务
    added3 = store.apply_default_tasks("2026-08-17")
    assert added3 == 2
    tasks3 = store.tasks_for("2026-08-17")
    assert len(tasks3) == 2
    print(f"测试3 - 另一天应用: PASS (添加了{added3}个)")
    
    # 测试4: 持久化后 default_applied 记录
    store2 = TodoStore(path=test_file)
    assert "2026-08-16" in store2._default_applied
    assert "2026-08-17" in store2._default_applied
    print("测试4 - default_applied 持久化: PASS")
    
    # 测试5: 已有相同任务时跳过
    store.add("2026-08-18", "起床", tag=TAG_LIFE)
    added5 = store.apply_default_tasks("2026-08-18")
    assert added5 == 1, f"应添加1个（洗脸），实际{added5}"
    print(f"测试5 - 已有任务时跳过: PASS (添加了{added5}个)")
    
    print()
    print("所有默认任务测试通过！")


if __name__ == "__main__":
    main()
