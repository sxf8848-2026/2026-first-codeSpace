# 主要漏洞 / 风险
1. [server/index.mjs (line 42)](D:/AICoding/codexWorkSpace/first-codex/server/index.mjs:42) 写入接口直接接受任意 JSON，没有校验数据结构。
   本地工具问题不算大，但如果误写入坏数据，todo-data/todos.json 可能变成前端无法预期的形状。建议后端也做 schema 校验。
2. [src/storage.ts (line 53)](D:/AICoding/codexWorkSpace/first-codex/src/storage.ts:53) 保存失败被静默吞掉。
   如果本地后端挂了，页面看起来还能用，但用户不会知道数据只是临时存在浏览器里。建议加一个“文件存储已连接 / 已离线”的状态提示。
3. [src/App.tsx (line 85)](D:/AICoding/codexWorkSpace/first-codex/src/App.tsx:85) 首次加载项目文件是异步的。
   如果用户刚打开页面立刻操作，后端数据加载完成后可能覆盖这几秒内的操作。建议加载完成前显示轻量 loading，或做合并策略。
4. [src/App.tsx (line 146)](D:/AICoding/codexWorkSpace/first-codex/src/App.tsx:146) 编辑保存使用的是当前日期 currentDay。
   如果打开编辑弹窗后切换日期，再点保存，编辑可能写到错误日期或无效。建议 editingTask 同时保存所属日期。
5. [server/index.mjs (line 82)](D:/AICoding/codexWorkSpace/first-codex/server/index.mjs:82) 文件写入没有版本锁。
   多个浏览器窗口同时打开时，后保存的窗口会覆盖前一个窗口的数据。建议加 updatedAt / revision，比对后再写入。
# 功能缺口
- Web 重构版目前还没有恢复“撤销/重做”。
- 没有键盘快捷键：如 Enter 添加已有，其他如 Delete 删除、上下移动、Ctrl+Z 还没加。
- 删除和清除已完成没有确认，也没有恢复入口，误操作风险偏高。
- 目前标签固定为 4 个，不能自定义标签。
- 默认任务写在 [src/constants.ts (line 29)](D:/AICoding/codexWorkSpace/first-codex/src/constants.ts:29)，还不能在界面里配置。
# 值得优化
- 把 [src/App.tsx](D:/AICoding/codexWorkSpace/first-codex/src/App.tsx) 拆成 components/、hooks/、services/，现在文件已经偏大。
- 增加数据导入/导出按钮，方便备份 todo-data/todos.json。
- 后端增加自动备份，比如每次写入前备份到 todo-data/backups/。
- 增加 Toast 提示：继承昨日成功、保存失败、删除成功等。
- 移动任务建议改成拖拽排序，比上下箭头自然。
- 历史回顾可以加按月份聚合、完成率趋势。
- 生产运行可以加一个 npm run start，先启动 API，再预览构建产物。