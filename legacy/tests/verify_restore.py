import sys
sys.path.insert(0, ".")
from storage import TodoStore

store = TodoStore()
print("数据版本:", store._version)
days = store.all_days()
print("有数据的日期:", days)
for day in days:
    tasks = store.tasks_for(day)
    print(f"  {day}: {len(tasks)} 个任务")
    for t in tasks:
        print(f"    - {t['text']} (status={t['status']}, tag={t.get('tag', '无')})")
