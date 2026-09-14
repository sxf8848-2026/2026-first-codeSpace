import sys
sys.path.insert(0, ".")
from storage import TodoStore
from datetime import date

store = TodoStore()
today = date.today().strftime("%Y-%m-%d")

defaults = store.load_default_tasks()
print("默认任务配置:")
for d in defaults:
    print(f"  text='{d['text']}' (len={len(d['text'])})")

print()
existing = store.tasks_for(today)
print("今天已有的任务:")
for t in existing:
    print(f"  text='{t['text']}' (len={len(t['text'])})")

print()
existing_texts = {t.get("text", "") for t in existing}
print("existing_texts 集合:", existing_texts)
print()
for d in defaults:
    text = d.get("text", "").strip()
    print(f"检查 '{text}': in existing = {text in existing_texts}")
