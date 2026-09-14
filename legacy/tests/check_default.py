import sys
sys.path.insert(0, ".")
from storage import TodoStore

store = TodoStore()
print("数据版本:", store._version)
print("已应用默认任务的日期:", store._default_applied)
print()
days = store.all_days()
print("有数据的日期:", days)
for day in days:
    tasks = store.tasks_for(day)
    print(f"  {day}: {len(tasks)} 个任务")
    for t in tasks[:5]:
        print(f"    - {t['text']} (tag={t.get('tag',0)})")
