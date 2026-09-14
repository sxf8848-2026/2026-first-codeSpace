# 项目协作规则

## Codex 内容语言

- 保存 Codex 相关文件、配置、说明或自定义指令时，优先使用中文。
- 当技术规范、代码语法、专有名词、兼容性要求或现有文件语言明确要求英文时，可以保留或使用英文。

## 注意事项

- 每次交代任务后，先不要开始执行。请先向用户提问，一次只问一个问题，并根据用户回答继续追问。直到有 95% 的把握理解用户的真实需求和预期结果，再开始执行。
- 每次功能改动后，都必须编写或更新相关测试，并在交付给用户之前，确保所有测试和验证全部通过。
- 每次改动完成后，都必须创建一个对应的Git commit，以便后续追踪和回滚。

# 当前项目信息

## 项目定位

- 当前项目是一个本地运行的 Todo 工作台，主线版本已经从 Python/tkinter 桌面应用重构为 React + Vite + TypeScript Web 应用。
- 旧版 Python/tkinter 文件已统一移动到 `legacy/` 作为历史参考，例如 `legacy/main.py`、`legacy/app.py`、`legacy/storage.py`、`legacy/views/` 和 `legacy/tests/`。
- 当前推荐启动方式是 `npm run dev`，不再推荐直接运行 `legacy/main.py` 作为主线体验。

## 技术栈与启动方式

- 前端：React、TypeScript、Vite、lucide-react。
- 本地后端：Node.js 原生 `http` 服务，入口为 `server/index.mjs`。
- 开发启动：`npm run dev`，由 `server/dev.mjs` 同时启动前端和后端。
- 前端页面地址通常是 `http://127.0.0.1:5173/`。
- 后端 API 地址通常是 `http://127.0.0.1:5174/`，该端口不是页面预览地址，只提供 JSON API。
- 生产构建命令：`npm run build`。
- 后端语法检查命令：`node --check server/index.mjs`。

## 目录与职责

- `src/App.tsx`：主应用状态与业务编排，包括总控台、每日任务、每周任务、每月任务、每周快递、灵感记录、视频灵感、元学习力、习惯打卡、真棒记录、筛选、编辑、删除、撤销/重做、拖拽排序和设置入口。
- `src/components/AppSections.tsx`：页面区域组件，包括侧边栏、总控台、灵感记录、视频灵感、元学习力、顶部日期区、进度条、每周待办、每月待办、每周快递、每日任务输入区、工具栏和真棒记录区。
- `src/components/TaskRow.tsx`：每日任务卡片，支持选中、完成切换、编辑、删除和桌面鼠标拖拽排序。
- `src/components/dialogs.tsx`：编辑弹窗、历史回顾弹窗、设置弹窗。
- `src/components/Controls.tsx`：分段控件、标签按钮等基础控件。
- `src/hooks/useDataHistory.ts`：前端撤销/重做历史，默认最多保留 50 步。
- `src/services/storage.ts`：前端数据加载、保存、localStorage 兜底、项目文件 API 调用、数据归一化和任务创建。
- `src/services/habits.ts`：习惯连续天数计算等纯逻辑。
- `src/services/inspirations.ts`：灵感记录归一化、搜索过滤和排序等纯逻辑。
- `src/services/metaLearning.ts`：元学习力归一化、搜索过滤和排序等纯逻辑。
- `src/services/videoInspirations.ts`：视频灵感归一化、搜索过滤、渠道汇总和排序等纯逻辑。
- `src/types.ts`：核心类型定义。
- `src/date.ts`：日期和自然周计算。
- `src/constants.ts`：数据版本、默认标签、状态、优先级、默认任务。
- `src/styles.css`：全局样式和响应式布局。
- `server/index.mjs`：本地 JSON 文件 API，包含请求体解析、ETag 版本锁和原子写入。
- `server/schema.mjs`：后端 JSON 写入校验，供 API 和 Node 测试复用。
- `todo-data/todos.json`：当前 Web 版任务数据文件。
- `todo-data/prefs.json`：当前 Web 版偏好配置文件。
- `legacy/data/`：旧 Python 版数据目录和备份目录，通常不要把它当作当前 Web 版主数据源。

## 数据存储

- 当前 Web 版优先通过本地后端把数据保存到项目目录 `todo-data/`。
- 如果本地后端没有启动，前端会临时退回浏览器 `localStorage`，避免页面不可用。
- 正式使用和验证时应通过 `npm run dev` 同时启动前端和本地后端，确保写入 `todo-data/`。
- `/api/todos` 读写 `todo-data/todos.json`。
- `/api/prefs` 读写 `todo-data/prefs.json`。
- 后端写入使用 ETag / `If-Match` 做版本锁，并使用临时文件加 `rename` 的方式减少写坏文件风险。

## 核心数据模型

- `TodoData.version` 当前为 `13`。
- `TodoData.todos` 是每日任务，结构为 `Record<YYYY-MM-DD, TodoTask[]>`。
- `TodoData.weeklyTodos` 是每周待办，结构为 `Record<weekKey, WeeklyTask[]>`，其中 `weekKey` 使用该自然周周一的 `YYYY-MM-DD`。
- `TodoData.awesomeRecords` 是每日真棒记录，结构为 `Record<YYYY-MM-DD, AwesomeRecord[]>`。
- `TodoData.monthlyTodos` 是每月待办，结构为 `Record<YYYY-MM, MonthlyTask[]>`。
- `TodoData.weeklyDeliveries` 是每周快递，结构为 `Record<weekKey, WeeklyDelivery[]>`，其中 `weekKey` 使用该自然周周一的 `YYYY-MM-DD`。
- `TodoData.habits` 是每日固定习惯列表，删除习惯时使用 `archived_at` 归档以保留历史。
- `TodoData.habitChecks` 是习惯打卡记录，结构为 `Record<YYYY-MM-DD, Record<habitId, boolean>>`。
- `TodoData.inspirations` 是灵感记录列表，默认展示未归档记录，置顶优先并按创建时间倒序。
- `TodoData.metaLearningAbilities` 是元学习力能力卡片列表，默认展示未归档记录并按创建时间倒序。
- `TodoData.videoInspirations` 是视频灵感记录列表，默认展示未归档记录，置顶优先并按创建时间倒序。
- `TodoData.default_applied` 记录哪些日期已经批量应用过默认任务。
- `TodoTask` 包含 `id`、`text`、`status`、`description`、`tag`、`priority`、`created_at`、`done_at`。
- `WeeklyTask` 包含 `id`、`text`、`done`、`created_at`、`done_at`。
- `AwesomeRecord` 包含 `id`、`text`、`created_at`。
- `MonthlyTask` 包含 `id`、`text`、`description`、`done`、`created_at`、`done_at`。
- `WeeklyDelivery` 包含 `id`、`name`、`platform`、`note`、`picked`、`created_at`、`picked_at`。
- `Habit` 包含 `id`、`name`、`created_at`、`archived_at?`。
- `InspirationRecord` 包含 `id`、`title`、`body`、`pinned`、`created_at`、`archived_at?`。
- `MetaLearningAbility` 包含 `id`、`name`、`summary`、`usage`、`mastery`、`created_at`、`archived_at?`。
- `VideoInspirationRecord` 包含 `id`、`channel`、`title`、`content`、`url`、`pinned`、`created_at`、`archived_at?`。
- 元学习力掌握程度：`todo` 表示待学习，`learning` 表示学习中，`mastered` 表示已掌握，`skilled` 表示熟练。
- 每日任务状态：`0` 表示已完成，`1` 表示未完成，`2` 表示进行中。
- 任务优先级：`high`、`medium`、`low`。
- 标签支持自定义，默认包含未分类、生活、学习、工作。
- 偏好数据 `AppPrefs` 包含主题、标签列表和默认任务列表。

## 当前主要功能

- 日常总控台：通过左侧栏进入默认首屏，展示真实今天的任务进度、进行中数量、本周未取快递、当月未完成月待办、习惯打卡和今日重点任务。
- 每日待办：按日期展示和维护任务。
- 每周待办：按当前日期所在自然周展示和维护本周任务，独立于每日任务，不会自动同步到每日任务。
- 每月待办：通过左侧栏进入独立主视图，按自然月维护月任务，并支持年月选择器查看历史月份。
- 每周快递：通过左侧栏进入独立主视图，记录真实当前周的快递，支持未取/已取状态、状态筛选和继承上周未取快递。
- 灵感记录：通过左侧栏进入独立主视图，记录每日灵感，支持标题、正文、搜索、置顶、编辑和归档。
- 视频灵感：通过左侧栏进入独立主视图，整理刷视频遇到的高价值内容，支持渠道、标题、内容、链接、搜索、渠道筛选、置顶、编辑和归档。
- 元学习力：通过左侧栏进入独立主视图，沉淀学习能力卡片，支持名称、说明、用法、掌握程度、搜索、状态筛选、编辑和归档。
- 习惯打卡：在总控台维护每日固定习惯，支持新增、编辑、归档和真实今天打卡，并展示连续天数。
- 真棒记录：按当前日期记录当天值得纪念或有价值的事情，独立于每日任务和每周待办。
- 默认任务：首次进入某天时自动应用默认任务；在设置里新增默认任务时，会同步补到真实今天，且按任务文本去重。
- 任务编辑：每日任务编辑会保存回原任务所在日期，避免跨天编辑误写到当前日期。
- 筛选与搜索：每日任务支持按状态、标签、优先级和标题/描述搜索。
- 进度展示：展示当天任务完成数量和百分比；每周待办展示本周完成数量。
- 历史回顾：按日期查看已有每日任务记录并跳转。
- 标签和默认任务设置：可在设置中维护标签和默认任务。
- 撤销/重做：每日任务、每周待办、每月待办、每周快递、灵感记录、视频灵感、元学习力、习惯打卡和真棒记录的数据变更都走统一 `TodoData` 历史链路。
- 键盘快捷键：支持添加、删除、上下移动、撤销/重做等已有快捷操作。
- 删除保护：删除任务、删除标签、清除已完成等高风险操作会弹出确认。
- 拖拽排序：每日任务卡片在未筛选状态下支持桌面鼠标拖拽排序；筛选或搜索状态下禁用拖拽，避免可见顺序和真实顺序混乱。
- 响应式卡片布局：每日任务宽屏三列，中等屏两列，移动端一列。

## 后端接口与校验

- `GET /api/health`：健康检查。
- `GET /api/todos`：读取任务数据，并返回 `ETag`。
- `PUT /api/todos`：写入任务数据，要求 JSON 结构通过服务端校验。
- `GET /api/prefs`：读取偏好配置，并返回 `ETag`。
- `PUT /api/prefs`：写入偏好配置，要求 JSON 结构通过服务端校验。
- 无效 JSON、非法任务结构、非法枚举值、字段类型错误会返回 `400`，不会写入项目文件。
- 请求体超过 2MB 会返回 `413`。
- 如果 `If-Match` 与当前文件 ETag 不一致，会返回 `412`，避免覆盖其他更新。

## 测试与验证现状

- 当前 Web 版主要验证命令是 `npm run test`、`npm run build` 和 `node --check server/index.mjs`。
- `npm run test` 使用 Node 的 `--experimental-strip-types` 直接测试少量前端纯 TypeScript 逻辑。
- 现有 `legacy/tests/` 目录主要来自旧 Python/tkinter 版本，覆盖旧 `legacy/storage.py`、默认任务、迁移、备份等逻辑。
- 为 Web 版新增功能时，应优先补充与当前 TypeScript/Node 实现匹配的测试；如果暂时没有测试框架，至少要补充可重复的构建、后端语法检查和关键接口/行为验证。
- 每次功能落地后，需要在根目录 `CHANGELOG.md` 顶部追加变更记录，说明改了什么、涉及哪些文件、验证结果和注意事项。
- 修改 `server/index.mjs` 后，需要重启 `npm run dev`，因为后端不会像 Vite 前端一样自动热更新。

## 开发注意事项

- 当前项目目录不是 Git 仓库，`git diff` 等命令不可用；变更核对需要通过文件内容和行号确认。
- 不要把 `127.0.0.1:5174` 当作页面预览地址；它是 API 服务端口。
- 不要把旧 Python 版的 `legacy/data/` 目录误认为当前 Web 版主数据目录；Web 版主数据在 `todo-data/`。
- 修改数据结构时必须同步更新 `src/types.ts`、`src/services/storage.ts` 的归一化逻辑，以及 `server/index.mjs` 的服务端校验。
- 修改偏好结构时必须同步更新 `AppPrefs` 类型、前端归一化逻辑和 `/api/prefs` 校验。
- 修改每日任务字段时要同时考虑默认任务应用、编辑保存、拖拽排序、筛选搜索、历史回顾、撤销/重做和后端校验。
- 修改每周待办字段时要同时考虑自然周计算、`weeklyTodos` 归一化、撤销/重做、保存兜底和后端校验。
- 修改每月待办字段时要同时考虑 `monthlyTodos` 归一化、年月选择器、撤销/重做、保存兜底和后端校验。
- 修改每周快递字段时要同时考虑 `weeklyDeliveries` 归一化、真实当前周计算、继承上周、撤销/重做、保存兜底和后端校验。
- 修改灵感字段时要同时考虑 `inspirations`、归档不显示、置顶排序、搜索过滤、撤销/重做、保存兜底和后端校验。
- 修改视频灵感字段时要同时考虑 `videoInspirations`、归档不显示、置顶排序、渠道筛选、搜索过滤、撤销/重做、保存兜底和后端校验。
- 修改元学习力字段时要同时考虑 `metaLearningAbilities`、归档不显示、掌握程度筛选、搜索过滤、撤销/重做、保存兜底和后端校验。
- 修改习惯字段时要同时考虑 `habits`、`habitChecks`、软删除归档、连续天数计算、撤销/重做、保存兜底和后端校验。
- 修改真棒记录字段时要同时考虑 `awesomeRecords` 归一化、历史回顾、撤销/重做、保存兜底和后端校验。
- UI 改动要保持当前风格：工作台式、信息密度适中、卡片半径克制、优先使用 lucide-react 图标。
