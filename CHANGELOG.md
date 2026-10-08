# 系统变更记录

本文件记录当前 Web 主线版本的重要变更。旧版 Python/tkinter 桌面应用的历史记录保留在 `legacy/CHANGELOG.md`。

## 维护规则

以后每次功能落地后，在本文件顶部追加一个新版本或新日期条目，并至少包含：

- 改了什么：说明本次功能、修复或重构的结果。
- 涉及文件：列出主要修改过的文件或目录。
- 验证结果：记录已运行的测试、构建、语法检查或手动验证。
- 注意事项：记录启动方式、数据兼容、需要重启服务、已知限制等。

---

## [20.2.0] - 2026-10-08

### 改了什么

- 每周快递“继承未取快递”会从当前周之前向前查找，跳过空周和全已取周，继承最近一个仍有未取快递的历史周。
- 保持原有按“名称 + 平台”去重规则，不会重复加入当前周已有的快递。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/weeklyDeliveries.ts`
- `tests-web/weeklyDeliveries.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，129/129。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 不新增数据结构；仅从当前周之前的历史周中查找，当前周和未来周不会作为继承来源。

---

## [20.1.0] - 2026-10-08

### 改了什么

- 每周快递的“平台”字段改为下拉选择，默认提供抖音、拼夕夕、淘宝、京东、小红书、快手、咸鱼和其他。
- 设置页面新增“快递平台”管理区，支持新增、修改和删除自定义平台选项。
- 删除平台选项不会改写已有快递记录；编辑旧记录时，已删除的平台会作为临时选项保留显示。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/components/dialogs.tsx`
- `src/services/storage.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/storage.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，126/126。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 旧偏好数据缺少平台列表时，会自动补齐默认 8 个平台；修改后端默认偏好或校验后，需要重启 `npm run dev`。

---

## [20.0.0] - 2026-10-07

### 改了什么

- “冲突复盘”页面标题调整为“吵架复盘”。
- 复盘录入与编辑收敛为“争执主题”“发生时间”和一个必填的“复盘内容”文本框，不再单独维护涉及对象、经过、双方反应和改进字段。
- 数据版本升级到 `20`；已有版本 19 的多字段复盘会自动合并为带字段标题的复盘正文，避免数据丢失。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/argumentReflections.ts`
- `src/services/storage.ts`
- `src/types.ts`
- `src/constants.ts`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/argumentReflections.test.mjs`
- `tests-web/schema.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，122/122。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 旧格式记录会在前端归一化并于下一次保存时写回为新格式。

---

## [19.0.0] - 2026-10-07

### 改了什么

- 新增“吵架整理”独立菜单和“冲突复盘”页面，可记录争执主题、发生时间、涉及对象、争执经过、双方反应及下次改进方式。
- 支持关键词搜索、编辑和归档；未归档记录按发生时间从新到旧展示，归档后保留原始数据。
- 数据版本升级到 `19`，旧数据会自动补齐空的 `argumentReflections` 数组。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/argumentReflections.ts`
- `src/services/storage.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/argumentReflections.test.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/storage.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，122/122。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- “发生时间”使用本地 `YYYY-MM-DDTHH:mm` 格式；编辑该时间后，列表会按新时间重新排序。
- 修改本地后端默认数据和校验后，需要重启 `npm run dev` 使 API 进程加载新代码。

---

## [18.0.0] - 2026-09-28

### 改了什么

- 新增“每日必读文案”独立菜单，可收录标题、正文和可选来源。
- 文案按添加时间从早到晚轮读；点击“已读，下一条”后推进，到末尾自动循环。
- 支持搜索、编辑和归档；归档当前文案时会自动跳到下一条可读内容。
- 数据版本升级到 `18`，旧数据会自动补齐每日必读文案和阅读游标字段。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/dailyReadings.ts`
- `src/services/storage.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/dailyReadings.test.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/storage.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，112/112。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- “已读”只推进当前轮读位置，不记录阅读日期或历史次数；同一天可以连续推进多条。
- 后端新增默认数据和校验后，需要重启 `npm run dev` 才能加载新的本地 API 代码。

## [17.1.0] - 2026-09-17

### 改了什么

- 习惯打卡统计由连续完成天数改为累计完成天数；中断打卡不会清零。
- 查看今天或历史日期时，均统计截至所选日期的全部有效打卡记录。
- 移除连续天数和“完成后变为 N+1 天”的预测文案。

### 涉及文件

- `src/services/habits.ts`
- `src/components/AppSections.tsx`
- `tests-web/habits.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，99/99。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 未改变 `habitChecks` 数据结构或数据版本，已有历史打卡和补卡会自动纳入累计统计。

## [17.0.0] - 2026-09-16

### 改了什么

- 每周快递新增“购买时间”字段，新增和编辑快递时都可以选择购买日期。
- 快递卡片展示购买时间，方便回看历史购买记录。
- 数据版本升级到 `17`，旧快递记录会自动补齐空购买时间。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/storage.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/history.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，99/99。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 购买时间为可选日期；旧数据不会丢失，会显示为空。
- 修改后端默认数据和校验后，需要重启 `npm run dev` 才能加载新的本地 API 代码。

## [16.1.0] - 2026-09-16

### 改了什么

- 为“每周快递”页面新增“历史查询”入口。
- 每周快递历史按有记录的周展示，包含周范围、未取/总数、已取数量和快递摘要。
- 点击历史周后会切换到对应周查看和维护快递记录。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/components/dialogs.tsx`
- `src/services/history.ts`
- `tests-web/history.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，97/97。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 本次不新增数据结构，不升级 `TodoData.version`，直接基于现有 `weeklyDeliveries` 生成历史列表。

## [16.0.2] - 2026-09-15

### 改了什么

- 缩短编辑工作经验时的月份选择框宽度，避免占用一整行。

### 涉及文件

- `src/components/AppSections.tsx`
- `src/styles.css`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，95/95。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 仅调整工作经验编辑状态下的月份选择框，不影响新增表单和其他页面。

## [16.0.1] - 2026-09-15

### 改了什么

- 优化工作经验新增表单布局：月份选择器变窄，正文输入区加长。
- 工作经验正文改为必填，新增、编辑和后端写入校验都会拒绝空正文。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/styles.css`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，95/95。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 现有正文为空的工作经验需要补充正文后再保存。
- 修改后端校验后，需要重启 `npm run dev` 才能加载新的本地 API 代码。

## [16.0.0] - 2026-09-15

### 改了什么

- 工作经验新增“所属月份”字段，新增和编辑时都可以选择月份。
- 工作经验列表在标题右侧展示所属月份，并支持按月份筛选；默认仍展示全部月份。
- 月份筛选选项会从未归档工作经验中自动汇总，并按月份倒序展示。
- 搜索和月份筛选可同时生效，排序仍保持置顶优先、创建时间从新到旧。
- 数据版本升级到 `16`，旧工作经验会按 `created_at` 自动补齐所属月份。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/storage.ts`
- `src/services/workExperiences.ts`
- `src/types.ts`
- `src/constants.ts`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/workExperiences.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，94/94。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 第一版只做月份筛选，不按月份分组展示。
- 新增工作经验默认属于当前月份；页面默认筛选为“全部月份”。
- 修改后端默认数据和校验后，需要重启 `npm run dev` 才能加载新的本地 API 代码。

## [15.0.1] - 2026-09-15

### 改了什么

- 优化“工作经验”列表正文显示：正文改为主文本色并加粗，提升阅读辨识度。

### 涉及文件

- `src/components/AppSections.tsx`
- `src/styles.css`
- `CHANGELOG.md`

### 验证结果

- `npm run build`：通过。

### 注意事项

- 本次仅调整工作经验正文样式，不影响灵感记录、视频灵感或其他记录列表。

## [15.0.0] - 2026-09-15

### 改了什么

- 新增左侧“工作经验”独立菜单，作为轻量的工作经验复盘库。
- 工作经验支持标题和正文输入，默认展示未归档记录。
- 列表支持搜索、置顶/取消置顶、编辑和归档，排序为置顶优先、创建时间从新到旧。
- 新增 `workExperiences` 数据字段，并将 `TodoData.version` 升级到 `15`。
- 前端归一化、本地保存、localStorage 兜底和后端 `/api/todos` 校验同步支持工作经验数据。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/storage.ts`
- `src/services/workExperiences.ts`
- `src/types.ts`
- `src/constants.ts`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/storage.test.mjs`
- `tests-web/workExperiences.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，89/89。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 第一版不做分类、标签、日期分组、历史查询、回收站或统计页。
- 旧数据缺少 `workExperiences` 时会自动补为空数组。
- 修改后端默认数据和校验后，需要重启 `npm run dev` 才能加载新的本地 API 代码。

## [14.2.0] - 2026-09-15

### 改了什么

- 将“每日历史查询”从列表卡片改为左侧日历、右侧只读详情的布局。
- 日历按周一到周日展示，支持上月、本月、下月切换；有数据的日期会高亮并显示完成进度。
- 右侧详情展示所选日期的完成进度、真棒数量、进行中/未完成/已完成任务和真棒记录。
- 右侧提供“跳转到这一天”按钮，用于进入每日待办页面编辑；弹窗内保持只读。
- “每月历史查询”保持原有月份列表，不做改动。

### 涉及文件

- `src/components/dialogs.tsx`
- `src/services/history.ts`
- `src/styles.css`
- `tests-web/history.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，79/79。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 本次不新增数据字段，不升级 `TodoData.version`。
- 日历详情只读，任务编辑仍通过“跳转到这一天”进入每日待办页完成。

## [14.1.0] - 2026-09-15

### 改了什么

- 为“每日待办”页面顶部新增“历史查询”入口，按有内容的日期展示历史列表并支持点击跳转。
- 为“每月待办”页面顶部新增“历史查询”入口，按有月待办的月份展示历史列表并支持点击跳转。
- 移除左侧栏底部旧“历史回顾”按钮，避免和页面内历史查询重复。
- 新增历史列表纯逻辑，直接基于现有 `todos`、`awesomeRecords`、`monthlyTodos` 派生，不新增数据字段，不升级数据版本。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/components/dialogs.tsx`
- `src/services/history.ts`
- `tests-web/history.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，76/76。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 第一版不提供关键词搜索、完成状态筛选或日期范围筛选。
- 每周快递、灵感记录、视频灵感、元学习力暂不增加历史查询。
- 普通沙箱运行 `npm run test` 和 `npm run build` 时仍可能遇到 Windows `spawn EPERM`，提升权限重跑后验证通过。

## [14.0.0] - 2026-09-14

### 改了什么

- 新增“习惯打卡”独立主视图，左侧栏新增入口且不显示右侧数字。
- 习惯页默认显示今天，支持切换日期；过去日期可补卡或取消补卡，未来日期只读不可打卡。
- 总控台移除完整习惯管理区，改为只显示今日习惯完成概览和进入习惯页的入口。
- 习惯记录新增 `note` 备注字段，支持新增和编辑时维护“名称 + 备注”。
- 连续天数改为按所选日期计算，历史补卡后会反映到对应日期的连续记录。
- 修复历史日期下输入已有习惯名再点“添加”没有反馈的问题：现在会作为该日期的补卡快捷操作。
- 优化习惯连续天数显示：未打卡时保留截至前一天的连续天数，所选日完成后显示为 `N + 1` 天。
- 优化习惯继承提示：未打卡但已有连续记录时，显示“已连续完成 N 天，今天/所选日完成后变为 N+1 天”。
- 数据版本升级到 `14`，前端归一化和后端 `/api/todos` 校验同步支持习惯备注。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/habits.ts`
- `src/services/storage.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/habits.test.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/storage.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，72/72。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 旧习惯数据缺少 `note` 时会自动补为空字符串。
- 未来日期允许查看，但新增、编辑、归档和打卡都会禁用。
- 习惯归档后默认不展示，历史打卡记录仍保留。
- 修改后端默认数据和校验后，需要重启 `npm run dev` 才能加载新的本地 API 代码。
- `npm run test` 和 `npm run build` 在沙箱内遇到 Windows 子进程 `spawn EPERM`，提升权限重跑后均通过。

---

## [13.0.0] - 2026-09-14

### 改了什么

- 新增“视频灵感”独立主视图，用于整理刷视频遇到的高价值内容。
- 左侧栏新增 `视频灵感` 菜单，不显示右侧数字。
- 每条视频灵感支持渠道、标题、内容、可选链接、置顶/取消置顶、编辑和归档。
- 视频灵感列表默认展示未归档记录，排序为置顶优先，再按创建时间从新到旧。
- 页面支持关键词搜索和按渠道筛选，渠道选项从未归档记录中自动汇总。
- 数据模型新增 `videoInspirations: VideoInspirationRecord[]`，数据版本升级到 `13`，后端 `/api/todos` 校验同步支持视频灵感。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/storage.ts`
- `src/services/videoInspirations.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/videoInspirations.test.mjs`
- `tests-web/storage.test.mjs`
- `todo-data/todos.json`
- `README.md`
- `AGENTS.md`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，56/56。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 视频灵感归档后不会在列表展示，但数据仍保留在 `todo-data/todos.json`。
- 第一版不自动解析视频链接，不抓取封面、作者、发布时间或平台元数据。
- 第一版不做标签、日期分组、回收站、独立统计页，也不并入总控台或灵感记录。
- 修改后端校验后，需要重启 `npm run dev` 才能加载新的本地 API 代码。
- `npm run test` 和 `npm run build` 在沙箱内曾因 Windows 子进程启动限制出现 `spawn EPERM`，提升权限重跑后均通过。

---

## [12.0.0] - 2026-09-14

### 改了什么

- 新增“元学习力”独立主视图，用于沉淀个人学习能力卡片。
- 左侧栏新增 `元学习力` 菜单，不显示右侧数字。
- 每张卡片支持名称、是什么、如何使用/适用场景、掌握程度、创建时间、编辑和归档。
- 页面支持关键词搜索和按掌握程度筛选，默认展示未归档记录并按创建时间从新到旧排序。
- 数据模型新增 `metaLearningAbilities: MetaLearningAbility[]`，数据版本升级到 `12`，后端 `/api/todos` 校验同步支持元学习力数据。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/storage.ts`
- `src/services/metaLearning.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/metaLearning.test.mjs`
- `tests-web/storage.test.mjs`
- `README.md`
- `AGENTS.md`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，44/44。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 元学习力归档后不会在列表展示，但数据仍保留在 `todo-data/todos.json`。
- 第一版不做标签、置顶、日期分组、独立统计页，也不并入总控台。
- 修改后端校验后，需要重启 `npm run dev` 才能加载新的本地 API 代码。
- `npm run test` 和 `npm run build` 在沙箱内曾因 Windows 子进程启动限制出现 `spawn EPERM`，提升权限重跑后均通过。

---

## [11.0.0] - 2026-09-14

### 改了什么

- 新增“灵感记录”独立主视图，用于记录每日产生的灵感。
- 左侧栏新增 `灵感记录` 菜单，不显示右侧数字。
- 每条灵感支持标题、正文、搜索、置顶/取消置顶、编辑和归档。
- 灵感列表默认展示全部未归档记录，排序为置顶优先，再按创建时间从新到旧。
- 数据模型新增 `inspirations: InspirationRecord[]`，数据版本升级到 `11`，后端 `/api/todos` 校验同步支持灵感记录。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/storage.ts`
- `src/services/inspirations.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/inspirations.test.mjs`
- `tests-web/storage.test.mjs`
- `README.md`
- `AGENTS.md`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `npm run build`：通过。

### 注意事项

- 灵感归档后不会在列表展示，但数据仍保留在 `todo-data/todos.json`。
- 第一版不做标签、日期分组、日期筛选、回收站，也不并入总控台或历史回顾。
- 修改后端校验后，需要重启 `npm run dev` 才能加载新的本地 API 代码。

---

## [10.0.0] - 2026-09-14

### 改了什么

- 新增“总控台”默认首屏，用于集中查看真实今天的任务进度、进行中数量、本周未取快递和当月未完成月待办。
- 左侧栏新增 `总控台` 菜单，保留 `每日待办`、`每月待办` 和 `每周快递` 原有独立入口。
- 总控台新增习惯打卡，支持新增、编辑、归档每日固定习惯，并显示今天是否完成和连续天数。
- 总控台新增今日重点任务列表，支持切换完成状态、标记进行中，并可跳转到每日待办完整管理。
- 数据模型新增 `habits` 和 `habitChecks`，数据版本升级到 `10`，后端 `/api/todos` 校验同步支持习惯数据。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/storage.ts`
- `src/services/habits.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/habits.test.mjs`
- `package.json`
- `package-lock.json`
- `README.md`
- `AGENTS.md`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `npm run build`：通过。

### 注意事项

- 习惯删除采用归档，不会删除历史打卡记录。
- 总控台今日重点只展示真实今天的未完成任务，不受每日待办历史日期切换影响。
- `npm run test` 现在使用 Node 的 `--experimental-strip-types` 测试前端纯 TypeScript 逻辑，运行时会显示实验性提示。
- 修改后端校验后，需要重启 `npm run dev` 才能加载新的本地 API 代码。

---

## [9.0.0] - 2026-09-13

### 改了什么

- 新增“每周快递”独立主视图，用于记录真实当前周买了哪些快递。
- 左侧栏新增 `每周快递` 菜单，右侧数字显示本周未取快递数量。
- 每条快递支持名称、平台、备注、未取/已取状态。
- 支持新增、编辑、删除、切换取件状态和按 `全部 / 未取 / 已取` 筛选。
- 新增“继承上周”：只复制上周未取快递到本周，并按 `名称 + 平台` 去重。
- 数据模型新增 `weeklyDeliveries: Record<weekKey, WeeklyDelivery[]>`。
- 数据版本升级到 `9`，后端 `/api/todos` 校验同步支持每周快递。
- README 和 AGENTS 项目信息同步更新。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/storage.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `README.md`
- `AGENTS.md`
- `todo-data/todos.json`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `npm run build`：通过。

### 注意事项

- 每周快递保存到项目本地 `todo-data/todos.json`，不新增后端接口。
- 每周快递只展示真实当前周，不跟每日页面查看日期或每月待办强绑定。
- 历史周快递数据仍保留在项目文件中，用于后续“继承上周”。
- 修改后端校验后，需要重启 `npm run dev` 才能加载新的本地 API 代码。

---

## [8.1.1] - 2026-09-13

### 改了什么

- 删除每日任务工具栏里的“上移”和“下移”两个低频按钮。
- 保留任务卡片拖拽排序能力。
- 保留已有键盘快捷键 `Ctrl + ↑` / `Ctrl + ↓` 的任务移动逻辑。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过。
- `npm run build`：通过。

### 注意事项

- 本次只调整每日任务页面工具栏展示，不修改数据结构、后端接口或存储方式。
- 如需调整任务顺序，优先使用任务卡片拖拽。

---

## [8.1.0] - 2026-09-13

### 改了什么

- 将每日任务分类从全局左侧栏迁移到右侧主页面的每日任务区域左侧。
- 左侧栏现在只保留品牌、`每日待办` / `每月待办` 主视图入口、历史回顾和设置。
- 新增主页面内的每日任务分类面板，继续支持全部、默认标签和自定义标签筛选。
- 每日任务区调整为“左侧分类 + 右侧任务卡片网格”的布局。
- 窄屏下分类面板会移动到任务列表上方，避免挤压任务卡片。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/styles.css`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过。
- `npm run build`：通过。
- 手动验证待确认：左侧栏不再显示任务分类，右侧每日任务区显示分类面板。
- 手动验证待确认：分类筛选、搜索、状态筛选、优先级筛选可以继续组合使用。
- 手动验证待确认：拖拽排序仍只在未筛选状态下启用。

### 注意事项

- 本次只调整 UI 布局和组件职责，不修改数据结构、后端接口或存储方式。
- 每日任务分类只在每日待办视图显示，每月待办视图不显示该分类面板。

---

## [8.0.0] - 2026-09-12

### 改了什么

- 新增“每月待办”独立主视图。
- 左侧栏新增 `每日待办` / `每月待办` 视图入口，并支持当前视图高亮。
- 每月待办按自然月归档，支持新增、查看、编辑、删除、勾选完成。
- 每月待办支持 `上一月`、`本月`、`下一月` 和年月选择器，可查看历史月份，例如半年前的月待办。
- 数据模型新增 `monthlyTodos: Record<YYYY-MM, MonthlyTask[]>`。
- 数据版本升级到 `8`。
- 后端 `/api/todos` 校验同步支持 `monthlyTodos`。
- README 和 AGENTS 项目信息同步更新。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/storage.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/date.ts`
- `src/styles.css`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `README.md`
- `AGENTS.md`
- `todo-data/todos.json`

### 验证结果

- `npm run test`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `npm run build`：通过。

### 注意事项

- 每月待办保存到项目本地 `todo-data/todos.json`。
- 正常使用时需要通过 `npm run dev` 同时启动前端和本地后端，浏览器 `localStorage` 只作为后端不可用时的临时兜底。
- 每月待办独立于每日任务、本周待办和真棒记录，不参与每日完成进度。

---

## [7.0.0] - 2026-09-12

### 改了什么

- 新增“真棒”每日记录列表，用于记录每天做过的值得纪念或有价值的事情。
- “真棒”区域展示在每日任务列表下方。
- 支持新增、编辑、删除真棒记录。
- 真棒记录按日期归档，并纳入历史回顾日期范围。
- 数据模型新增 `awesomeRecords: Record<YYYY-MM-DD, AwesomeRecord[]>`。
- 数据版本升级到 `7`。
- 后端 `/api/todos` 校验同步支持 `awesomeRecords`。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/storage.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `README.md`
- `AGENTS.md`
- `todo-data/todos.json`

### 验证结果

- `npm run test`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `npm run build`：通过。

### 注意事项

- 真棒记录保存到项目本地 `todo-data/todos.json`。
- 真棒记录独立于每日任务，不影响每日任务完成率。

---

## [6.0.0] - 2026-09-12

### 改了什么

- 新增“本周待办”区域，展示在每日待办页面上方。
- 本周待办按当前查看日期所在自然周展示，周一到周日为一周。
- 支持新增、编辑、删除、勾选完成本周待办。
- 切换到同一周内任意日期时，显示同一组本周待办。
- 数据模型新增 `weeklyTodos: Record<weekKey, WeeklyTask[]>`，其中 `weekKey` 为该周周一的 `YYYY-MM-DD`。
- 后端 `/api/todos` 校验同步支持 `weeklyTodos`。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/storage.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/date.ts`
- `src/styles.css`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `README.md`
- `AGENTS.md`
- `todo-data/todos.json`

### 验证结果

- `npm run test`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `npm run build`：通过。

### 注意事项

- 本周待办保存到项目本地 `todo-data/todos.json`。
- 本周待办独立于每日任务，不会自动同步成某一天的每日任务。

---

## [5.0.0] - 2026-09-12

### 改了什么

- 每日任务列表从“一条任务占一整行”改为响应式卡片网格。
- 宽屏默认每行 3 个任务，中等宽度每行 2 个任务，移动端每行 1 个任务。
- 每日任务卡片支持长标题省略和描述截断，避免内容撑坏布局。
- 新增每日任务卡片桌面鼠标拖拽排序。
- 拖拽排序仅在未筛选、无搜索的普通列表状态下启用，避免可见顺序和真实顺序混乱。
- 拖拽排序结果写回当天任务数组，并进入统一撤销/重做历史链路。

### 涉及文件

- `src/App.tsx`
- `src/components/TaskRow.tsx`
- `src/styles.css`

### 验证结果

- `npm run build`：通过。
- 手动验证：宽屏三列、中屏两列、窄屏一列。
- 手动验证：同一行、跨行、从前往后、从后往前拖拽排序可用。
- 手动验证：筛选或搜索状态下禁用拖拽排序。

### 注意事项

- 当前拖拽排序主要面向桌面鼠标操作，未专门覆盖手机触屏拖拽。
- 拖拽排序只调整当前日期任务顺序，不支持跨日期移动。

---

## [4.0.0] - 2026-09-12

### 改了什么

- 恢复并完善 Web 版撤销/重做能力。
- 新增键盘快捷键，包括添加、删除、上下移动、撤销/重做等。
- 删除任务、清除已完成、删除标签等高风险操作增加确认。
- 新增自定义标签维护能力。
- 设置中新增默认任务维护能力。
- 修复“设置里新增默认任务后，今天任务列表不立即出现”的问题：新增默认任务会同步补到真实今天，并按任务文本去重。
- 将偏大的 `src/App.tsx` 拆分出 `components/`、`hooks/`、`services/` 等模块，降低主文件复杂度。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/components/Controls.tsx`
- `src/components/TaskRow.tsx`
- `src/components/dialogs.tsx`
- `src/hooks/useDataHistory.ts`
- `src/services/storage.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`

### 验证结果

- `npm run build`：通过。
- 手动验证：撤销/重做、快捷键、标签维护、默认任务维护、删除确认可用。
- 手动验证：新增默认任务后，真实今天的每日任务列表立即补充同名任务且不重复。

### 注意事项

- 新增默认任务只即时补到真实今天，不自动补到过去日期。
- 修改或删除默认任务不会反向改动已经生成的历史任务。

---

## [3.0.0] - 2026-09-12

### 改了什么

- 为本地 Node 后端写入接口增加严格 JSON 结构校验。
- `/api/todos` 写入前校验每日任务、每周任务、真棒记录、每月任务等数据结构。
- `/api/prefs` 写入前校验主题、标签和默认任务配置。
- 无效 JSON、字段类型错误、枚举值非法时返回 `400 Bad Request`，不写入项目文件。
- 修复前端保存失败被静默吞掉的问题，保存失败会反馈到页面状态。
- 修复首次加载项目文件是异步的风险，避免加载完成前把空数据误保存覆盖项目文件。
- 修复编辑保存误用当前日期的问题，编辑每日任务时会保存回任务原本所在日期。
- 为文件写入增加 ETag / `If-Match` 版本锁，降低并发覆盖风险。
- 后端写入使用临时文件加 `rename` 的方式，减少写坏文件风险。
- 新增 `server/schema.mjs`，让接口校验和 Node 测试复用同一套规则。

### 涉及文件

- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/schema.test.mjs`
- `src/App.tsx`
- `src/services/storage.ts`
- `src/types.ts`

### 验证结果

- `npm run test`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `npm run build`：通过。
- 手动验证：非法 `/api/todos`、非法 `/api/prefs` 返回 `400`，不会覆盖项目文件。
- 手动验证：合法数据可正常写入项目文件。

### 注意事项

- 修改 `server/index.mjs` 或 `server/schema.mjs` 后，需要重启 `npm run dev` 才能让本地后端加载新代码。
- 浏览器本地存储只是兜底，正式数据应以 `todo-data/` 为准。

---

## [2.0.0] - 2026-09-12

### 改了什么

- 将项目主线从 Python/tkinter 桌面应用重构为 React + Vite + TypeScript Web 应用。
- 新增本地 Node API，用项目目录下的 JSON 文件持久化数据。
- `npm run dev` 改为同时启动前端页面和本地数据 API。
- 前端页面通常运行在 `http://127.0.0.1:5173/`。
- 后端 API 通常运行在 `http://127.0.0.1:5174/`。
- 保留浏览器 `localStorage` 兜底，避免本地后端未启动时页面完全不可用。
- 重建每日待办主体验：日期切换、添加、编辑、删除、状态、标签、优先级、搜索、进度、历史回顾、继承昨日等。

### 涉及文件

- `package.json`
- `package-lock.json`
- `index.html`
- `vite.config.ts`
- `tsconfig.json`
- `src/`
- `server/`
- `todo-data/`
- `README.md`

### 验证结果

- `npm run build`：通过。
- 手动验证：`npm run dev` 可同时启动前端和本地后端。
- 手动验证：前端页面访问 `5173`，后端 API 访问 `5174`。

### 注意事项

- `127.0.0.1:5174` 是 API 地址，不是页面预览地址；直接打开可能看到 JSON 或 `Not found`。
- 主线体验不再推荐直接运行 `python main.py`。

---

## [1.0.0] - 2026-08-16 之前

### 改了什么

- 旧版 Python/tkinter 桌面应用实现每日待办基础能力。
- 包含每日任务增删改查、完成状态、日期切换、历史回顾、继承昨日、清除已完成、快捷键、主题、标签、优先级、描述、默认任务等能力。
- 后续旧版文件统一移动到 `legacy/` 作为历史参考。

### 涉及文件

- `legacy/main.py`
- `legacy/app.py`
- `legacy/domain.py`
- `legacy/state.py`
- `legacy/services.py`
- `legacy/storage.py`
- `legacy/theme.py`
- `legacy/widgets.py`
- `legacy/views/`
- `legacy/tests/`
- `legacy/data/`
- `legacy/CHANGELOG.md`

### 验证结果

- 旧版测试和历史记录保留在 `legacy/tests/` 与 `legacy/CHANGELOG.md`。

### 注意事项

- `legacy/` 只作为旧版实现参考，不是当前 Web 主线。
- 当前 Web 主线数据目录是 `todo-data/`，不是 `legacy/data/`。
