"""快速测试 state 层功能。"""
import sys
import os
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from state import AppState


def main():
    state = AppState()

    # 测试 1: 初始状态
    assert state.current_day == date.today()
    assert state.filter == "all"
    assert state.selected_id is None
    assert state.search_text == ""
    assert state.priority_filter == "all"
    print("测试1 - 初始状态: PASS")

    # 测试 2: 事件订阅和触发
    events = []
    def on_day_changed(d):
        events.append(("day_changed", d))
    def on_filter_changed(v):
        events.append(("filter_changed", v))
    def on_selection_changed(prev, new):
        events.append(("selection_changed", prev, new))

    state.on("day_changed", on_day_changed)
    state.on("filter_changed", on_filter_changed)
    state.on("selection_changed", on_selection_changed)

    # 测试 set_day
    from datetime import timedelta
    new_day = date.today() + timedelta(days=1)
    state.set_day(new_day)
    assert state.current_day == new_day
    assert len(events) == 1
    assert events[0][0] == "day_changed"
    print("测试2 - 事件系统 (day_changed): PASS")

    # 测试 set_filter
    state.set_filter("todo")
    assert state.filter == "todo"
    assert len(events) == 2
    assert events[1][0] == "filter_changed"
    print("测试3 - 事件系统 (filter_changed): PASS")

    # 测试 set_selected
    state.set_selected("task-1")
    assert state.selected_id == "task-1"
    assert len(events) == 3
    assert events[2] == ("selection_changed", None, "task-1")
    print("测试4 - 事件系统 (selection_changed): PASS")

    # 测试取消订阅
    state.off("day_changed", on_day_changed)
    state.set_day(date.today())
    # 不应该再触发 day_changed 事件
    assert len(events) == 3  # 事件数不变
    print("测试5 - 取消订阅: PASS")

    # 测试 6: 撤销栈
    state2 = AppState()
    assert not state2.can_undo()
    assert not state2.can_redo()

    state2.push_undo({"type": "add", "id": "1"})
    assert state2.can_undo()
    assert not state2.can_redo()
    print("测试6 - 撤销栈 (push): PASS")

    # 测试 7: 弹出撤销
    action = state2.pop_undo()
    assert action["type"] == "add"
    assert not state2.can_undo()
    assert state2.can_redo()
    print("测试7 - 撤销栈 (pop_undo): PASS")

    # 测试 8: 重做
    action2 = state2.pop_redo()
    assert action2["type"] == "add"
    assert not state2.can_redo()
    print("测试8 - 撤销栈 (pop_redo): PASS")

    # 测试 9: 新操作清空重做栈
    state3 = AppState()
    state3.push_undo({"type": "add", "id": "1"})
    state3.pop_undo()  # 撤销
    assert state3.can_redo()
    state3.push_undo({"type": "add", "id": "2"})  # 新操作
    assert not state3.can_redo()  # 重做栈应该被清空
    print("测试9 - 新操作清空重做栈: PASS")

    # 测试 10: 搜索和优先级
    state4 = AppState()
    search_events = []
    priority_events = []
    status_events = []
    state4.on("search_changed", lambda t: search_events.append(t))
    state4.on("priority_filter_changed", lambda v: priority_events.append(v))
    state4.on("status_filter_changed", lambda v: status_events.append(v))

    state4.set_search("测试")
    assert state4.search_text == "测试"
    assert len(search_events) == 1
    print("测试10 - 搜索状态: PASS")

    state4.set_priority_filter("high")
    assert state4.priority_filter == "high"
    assert len(priority_events) == 1
    print("测试11 - 优先级筛选状态: PASS")

    state4.set_selected("task-1")
    state4.set_status_filter("2")
    assert state4.status_filter == "2"
    assert state4.selected_id is None
    assert status_events == ["2"]
    print("测试11.1 - 状态筛选事件: PASS")

    # 测试 12: task_changed 和 list_changed 事件
    state5 = AppState()
    task_events = []
    list_events = []
    state5.on("task_changed", lambda tid: task_events.append(tid))
    state5.on("list_changed", lambda: list_events.append(True))

    state5.notify_task_changed("task-123")
    assert len(task_events) == 1
    assert task_events[0] == "task-123"
    print("测试12 - task_changed 事件: PASS")

    state5.notify_list_changed()
    assert len(list_events) == 1
    print("测试13 - list_changed 事件: PASS")

    print()
    print("所有 state 层测试通过！")


if __name__ == "__main__":
    main()
