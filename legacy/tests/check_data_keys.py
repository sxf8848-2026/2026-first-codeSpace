import sys, json
sys.path.insert(0, ".")

# 直接读取数据文件，检查 key 类型
with open("data/todos.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("数据版本:", data.get("version"))
print("todos 的 keys:", list(data.get("todos", {}).keys()))
print()

# 检查是否有非字符串的 key（JSON 中 key 都是字符串，但可能格式不对）
for key in data.get("todos", {}).keys():
    print(f"  key='{key}' (type={type(key).__name__})")
