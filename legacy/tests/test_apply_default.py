import sys
sys.path.insert(0, ".")
from storage import TodoStore, DEFAULT_TASKS_FILE
import json

store = TodoStore()

# 检查默认任务配置文件
print("默认任务文件:", DEFAULT_TASKS_FILE)
try:
    with open(DEFAULT_TASKS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    print("默认任务配置:", data)
except Exception as e:
    print("读取默认任务文件失败:", e)

print()
print("当前日期:", store.day if hasattr(store, 'day') else "N/A")
print("default_applied:", store._default_applied)

# 手动应用默认任务到今天
from datetime import date
today = date.today().strftime("%Y-%m-%d")
print("今天:", today)
added = store.apply_default_tasks(today)
print("应用默认任务结果: 添加了", added, "个")
print("应用后 default_applied:", store._default_applied)

tasks = store.tasks_for(today)
print(f"今天的任务数: {len(tasks)}")
for t in tasks:
    print(f"  - {t['text']} (tag={t.get('tag',0)})")
