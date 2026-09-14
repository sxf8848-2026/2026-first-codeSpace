import sys
sys.path.insert(0, ".")
from storage import TodoStore
from datetime import date

store = TodoStore()
today = date.today().strftime("%Y-%m-%d")

print("今天:", today)
print("已应用默认任务的日期:", store._default_applied)
print("今天是否已应用:", today in store._default_applied)
print()

tasks = store.tasks_for(today)
print(f"今天的任务数: {len(tasks)}")
for t in tasks:
    print(f"  - {t['text']} (tag={t.get('tag',0)})")

print()
defaults = store.load_default_tasks()
print(f"默认任务配置数: {len(defaults)}")
for d in defaults:
    print(f"  - {d['text']} (tag={d.get('tag',0)})")
