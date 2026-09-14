import sys
sys.path.insert(0, ".")
from storage import TodoStore
from datetime import date

store = TodoStore()
today = date.today().strftime("%Y-%m-%d")

print("应用前今天的任务数:", len(store.tasks_for(today)))
added = store.apply_default_tasks(today)
print("补充了", added, "个默认任务")
print("应用后今天的任务数:", len(store.tasks_for(today)))
print()
for t in store.tasks_for(today):
    print(f"  - {t['text']} (tag={t.get('tag',0)})")
