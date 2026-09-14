"""测试迁移前自动备份功能。"""
import sys
import os
import tempfile
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from storage import TodoStore, DATA_VERSION


def main():
    tmpdir = tempfile.mkdtemp()
    data_dir = os.path.join(tmpdir, "data")
    os.makedirs(data_dir, exist_ok=True)
    test_file = os.path.join(data_dir, "todos.json")

    # 构造 v3 格式数据
    v3_data = {
        "version": 3,
        "todos": {
            "2026-08-10": [
                {"id": "1", "text": "测试任务", "status": 1, "priority": "medium",
                 "created_at": "2026-08-10 10:00:00", "done_at": None},
            ]
        }
    }
    with open(test_file, "w", encoding="utf-8") as f:
        json.dump(v3_data, f)

    print(f"原始数据文件: {test_file}")
    print(f"原始版本: v3")

    # 加载，应该自动迁移并备份
    store = TodoStore(path=test_file)
    assert store._version == DATA_VERSION
    print(f"迁移后版本: v{store._version}")

    # 检查备份目录
    backup_dir = os.path.join(data_dir, "backups")
    assert os.path.exists(backup_dir), "备份目录不存在"
    print(f"备份目录: {backup_dir}")

    # 列出备份文件
    backups = os.listdir(backup_dir)
    assert len(backups) > 0, "没有生成备份文件"
    print(f"备份文件: {backups}")

    # 验证备份文件内容是原始 v3 数据
    backup_file = os.path.join(backup_dir, backups[0])
    with open(backup_file, "r", encoding="utf-8") as f:
        backup_data = json.load(f)
    assert backup_data["version"] == 3, "备份文件版本不对"
    assert "description" not in backup_data["todos"]["2026-08-10"][0], "备份文件不应有 description"
    print(f"备份文件版本: v{backup_data['version']} (正确，是原始版本)")

    # 验证迁移后的数据有 description
    tasks = store.tasks_for("2026-08-10")
    assert "description" in tasks[0]
    print(f"迁移后数据有 description 字段: {tasks[0]['description']!r}")

    print()
    print("所有备份功能测试通过！")
    print(f"备份文件位置: {backup_dir}")


if __name__ == "__main__":
    main()
