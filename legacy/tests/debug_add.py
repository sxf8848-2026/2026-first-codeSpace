import sys
sys.path.insert(0, ".")
from storage import TodoStore
from datetime import date

store = TodoStore()
today = date.today().strftime("%Y-%m-%d")

print("应用前今天的任务数:", len(store.tasks_for(today)))

# 手动执行添加逻辑
defaults = store.load_default_tasks()
existing_texts = {t.get("text", "") for t in store.tasks_for(today)}
print("existing_texts:", existing_texts)

added = 0
for item in defaults:
    text = item.get("text", "").strip()
    if not text or text in existing_texts:
        print(f"跳过: {text}")
        continue
    print(f"添加: {text}")
    store.add(today, text, priority=item.get("priority", "medium"), tag=int(item.get("tag", 0)))
    existing_texts.add(text)
    added += 1

print(f"手动添加了 {added} 个")
print("应用后今天的任务数:", len(store.tasks_for(today)))
