import sys
sys.path.insert(0, ".")
from storage import TodoStore
from datetime import date, timedelta

store = TodoStore()
tomorrow = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")

print("测试日期:", tomorrow)
print("应用前任务数:", len(store.tasks_for(tomorrow)))

added1 = store.apply_default_tasks(tomorrow)
print(f"第一次应用: 添加了 {added1} 个")
print("应用后任务数:", len(store.tasks_for(tomorrow)))

added2 = store.apply_default_tasks(tomorrow)
print(f"第二次应用: 添加了 {added2} 个（应该是0，因为都已有了）")
print("最终任务数:", len(store.tasks_for(tomorrow)))

print()
for t in store.tasks_for(tomorrow):
    print(f"  - {t['text']} (tag={t.get('tag',0)})")
