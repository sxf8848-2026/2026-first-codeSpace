# 系统变更记录

本文件记录当前 Web 主线版本的重要变更。旧版 Python/tkinter 桌面应用的历史记录保留在 `legacy/CHANGELOG.md`。

## 维护规则

以后每次功能落地后，在本文件顶部追加一个新版本或新日期条目，并至少包含：

- 改了什么：说明本次功能、修复或重构的结果。
- 涉及文件：列出主要修改过的文件或目录。
- 验证结果：记录已运行的测试、构建、语法检查或手动验证。
- 注意事项：记录启动方式、数据兼容、需要重启服务、已知限制等。

---

## [34.1.1] - 2026-10-30

### 改了什么

- 在“个人奖励”页面标题下方增加“个人奖励系统从2026-10-28开始计算”说明。
- 说明采用低对比度提示样式，并位于本月奖励与历史累计统计上方。

### 涉及文件

- `src/components/AppSections.tsx`
- `src/styles.css`
- `tests-web/rewards.test.mjs`

### 验证结果

- `npm run test`：通过，210/210。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 本次仅增加静态页面说明，不修改奖励计算逻辑、数据结构或数据版本。

## [34.1.0] - 2026-10-29

### 改了什么

- 个人奖励页的“历史累计”改为可点击入口，打开后可查看累计总金额、完成次数和产生奖励的规则数量。
- 历史领取记录按奖励规则聚合，展示每条规则的累计金额、完成次数，以及每次奖励的归属日期、档位、金额和实际领取时间。
- 补领记录会在明细中显示“补领”标识；规则改名后仍按原规则 ID 合并，并使用最近一次领取时保存的名称。
- 累计构成直接基于现有领取记录计算，没有新增持久化字段，数据版本保持 `34`。

### 涉及文件

- `src/components/AppSections.tsx`
- `src/services/rewards.ts`
- `src/styles.css`
- `tests-web/rewards.test.mjs`

### 验证结果

- `npm run test`：通过，209/209。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 明细弹窗为只读页面，第一版不提供日期筛选、编辑或删除操作。
- 本次没有修改后端代码或数据结构，开发服务运行中时刷新页面即可看到效果。

## [34.0.0] - 2026-10-29

### 改了什么

- 个人奖励规则新增“补领”入口，可补领昨天至 7 天前遗漏的固定奖励或阶梯奖励。
- 补领继续遵守同一规则同一天一条记录；阶梯奖励可以在历史日期升级档位，并且只增加差额。
- 领取记录新增奖励归属日期，同时保留实际领取或升级时间；跨日操作会显示“补领于”。
- 本月金额、历史累计、月份筛选和流水排序统一按奖励归属日期计算。
- 旧领取记录会从原领取时间自动补齐奖励归属日期，数据版本升级至 `34`。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/rewards.ts`
- `src/types.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/rewards.test.mjs`
- `tests-web/schema.test.mjs`

### 验证结果

- `npm run test`：通过，208/208。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。
- 当前项目数据经前端归一化后通过后端 Schema 校验。

### 注意事项

- 补领仅支持过去 7 个完整自然日，今天仍使用现有领取按钮。
- 补领采用当前启用规则，不保存奖励规则历史版本，也不与每日待办或习惯打卡自动关联。
- 后端数据校验已更新，完成代码更新后需要重启 `npm run dev`。

## [33.0.0] - 2026-10-28

### 改了什么

- 个人奖励规则新增“固定奖励”和“阶梯奖励”两种模式，阶梯档位支持自定义名称与递增金额。
- 阶梯奖励由用户手动选择达到的档位；同一天升级时只补领差额，并更新当天唯一领取记录的最终档位、总金额和时间。
- 固定规则与阶梯规则可以互相转换；当天已经领取时，新模式从次日生效，历史领取快照不受规则编辑影响。
- 领取记录支持展示和搜索档位名称，停用、误领删除、本月金额和历史累计逻辑保持不变。
- 旧固定奖励规则与领取记录会自动补齐新字段，数据版本升级至 `33`。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/rewards.ts`
- `src/services/storage.ts`
- `src/types.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/rewards.test.mjs`
- `tests-web/schema.test.mjs`

### 验证结果

- `npm run test`：通过，207/207。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 阶梯达成情况由用户手动选择，不与每日待办或习惯打卡自动关联。
- 金额继续以整数分保存；升级领取只更新当天最终记录，不额外生成差额流水。
- 后端数据校验已更新，完成代码更新后需要重启 `npm run dev`。

## [32.1.0] - 2026-10-28

### 改了什么

- 每日待办按“进行中、未完成、已完成”稳定展示，任务完成后自动进入列表底部的已完成区域。
- 自动排序只影响显示，不改任务的底层保存顺序；取消完成后会回到原来的手动位置。
- 同一状态组内继续支持拖拽和 `Ctrl + ↑/↓` 排序，不同状态之间不允许手动跨组排序。
- 搜索、分类和优先级筛选后的任务继续应用相同的状态顺序。

### 涉及文件

- `src/App.tsx`
- `src/services/dailyTasks.ts`
- `tests-web/dailyTasks.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，205/205。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 本次不修改数据结构，不升级 `TodoData.version`，也不影响总控台、周/月待办或历史详情。
- 已完成任务之间继续保持原有手动顺序，不按完成时间重新排序。

## [32.0.0] - 2026-10-28

### 改了什么

- “学会当学霸”的正文编辑改为 Markdown，桌面端左侧编辑、右侧实时预览，窄屏自动切换为上下布局。
- 支持标题、粗体、斜体、列表、引用、代码块、分隔线和链接；原始 HTML 不会被渲染。
- 保存后的学习方法、学习习惯和思维模型正文统一按 Markdown 展示，关键词搜索继续基于纯文本内容。
- 旧版富文本自动迁移：加粗转换为 Markdown 粗体，颜色格式移除但保留原文字和段落。
- 正文字段从 `content_html` 调整为 `content_markdown`，`TodoData.version` 升级至 `32`，并新增 `react-markdown` 渲染依赖。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/components/StudyGrowthMarkdownEditor.tsx`
- `src/services/studyGrowthMarkdown.ts`
- `src/services/studyGrowthRecords.ts`
- `src/services/storage.ts`
- `src/types.ts`
- `src/styles.css`
- `server/`
- `tests-web/`
- `package.json`
- `package-lock.json`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，200/200。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- 本地 API 健康检查：通过，后端数据版本为 `32`。
- `git diff --check`：通过。

### 注意事项

- 旧颜色样式无法用标准 Markdown 等价表示，迁移时只保留文字内容。
- 原始 HTML 使用 `skipHtml` 禁止渲染，避免把任意 HTML 注入预览区域。

## [31.0.0] - 2026-10-28

### 改了什么

- “学会当学霸”的学习方法、学习习惯和思维模型均支持为每条记录单独选择标题字号。
- 标题字号固定为 `18px`、`22px`、`26px` 和 `30px`，新增记录与旧记录默认使用 `22px`。
- 新增和编辑时标题输入框会即时按所选字号显示，保存后的标题继续使用该记录自己的字号。
- 新增 `title_size` 数据字段，`TodoData.version` 升级至 `31`，前端归一化和后端写入校验同步更新。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/studyGrowthRecords.ts`
- `src/services/storage.ts`
- `src/types.ts`
- `src/styles.css`
- `server/`
- `tests-web/`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，202/202。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 旧版记录没有 `title_size` 时会自动补为 `22px`，不会修改原有标题、正文和富文本格式。
- 字号使用四档固定选项，不提供自由输入，避免标题过大导致列表布局失控。

## [30.0.1] - 2026-10-28

### 改了什么

- 修复“学会当学霸”正文富文本输入区边框不可见的问题，边框现在完整包住格式工具栏和正文输入区。
- 输入焦点进入该区域时，整个外框使用主题强调色，桌面端和移动端保持一致。
- 修正富文本输入区遗留的无效主题变量，使浅色和深色主题均使用当前项目的颜色变量。

### 涉及文件

- `src/styles.css`
- `tests-web/studyGrowthRichText.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，201/201。
- `npm run build`：通过。
- `git diff --check`：通过。

### 注意事项

- 本次仅调整输入区域边框与聚焦样式，不修改数据结构和正文内容。

## [30.0.0] - 2026-10-27

### 改了什么

- “学会当学霸”的学习方法、学习习惯和思维模型三个标签页均支持为正文局部文字加粗和设置颜色。
- 正文颜色使用固定色板：黑色、红色、蓝色、绿色、橙色和紫色；标题与来源保持原有纯文本输入。
- 新增受限富文本保存字段 `content_html`，旧记录会根据原正文自动补齐格式内容，关键词搜索继续使用纯文本正文。
- 前后端仅允许保存加粗、固定色板和换行格式，粘贴内容按纯文本处理，避免任意 HTML 写入。
- `TodoData.version` 升级至 `30`，后端默认数据与写入校验同步更新。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/components/StudyGrowthRichTextEditor.tsx`
- `src/services/studyGrowthRecords.ts`
- `src/services/studyGrowthRichText.ts`
- `src/services/storage.ts`
- `src/types.ts`
- `src/styles.css`
- `server/`
- `tests-web/`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，200/200。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 更新后需要重启 `npm run dev`，使本地后端加载版本 30 的写入校验。
- 本次只提供正文加粗和固定六色，不增加字号、下划线、背景色或任意颜色选择。

## [29.0.0] - 2026-10-27

### 改了什么

- 在“私人复盘”之后新增“个人管理”一级菜单，包含“个人护肤”和“个人奖励”两个页面。
- “个人护肤”支持维护全部护肤品清单，按名称、品牌和说明搜索，按固定品类筛选，并可编辑已有产品。
- “个人奖励”支持奖励规则新增、搜索、编辑、停用和重新启用；同一规则每天只能领取一次。
- 领取流水保存规则名称和金额快照，支持关键词和月份查询、误领删除，并展示本月奖励和历史累计金额。
- 数据模型新增 `skincareProducts`、`rewardRules` 和 `rewardClaims`，前后端保存与校验链路同步支持。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/skincareProducts.ts`
- `src/services/rewards.ts`
- `src/services/storage.ts`
- `src/services/sidebarNavigation.ts`
- `src/types.ts`
- `src/styles.css`
- `server/`
- `tests-web/`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，196/196。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。
- 已通过 1440px 桌面端和 390px 移动端截图检查，两个页面均无横向溢出。

### 注意事项

- 数据版本升级至 29；旧数据缺少新增字段时自动补为空数组。
- 奖励金额以整数分保存，界面按人民币元展示；规则修改不会改写历史领取流水。
- 第一版不提供护肤品删除、归档、状态和早晚流程，也不提供奖励规则删除、分类或消费兑换。

---

## [28.0.0] - 2026-10-27

### 改了什么

- “学会当学霸”页面新增“思维模型”标签页，继续使用标题、正文和可选来源字段。
- 思维模型支持新增、关键词搜索和编辑，并按创建时间倒序展示。
- 学习方法与学习习惯仍可互相转换；思维模型类型固定，不能与前两类互转。
- 数据模型的 `StudyGrowthType` 新增 `mental_model`，前端归一化和后端写入校验同步支持。

### 涉及文件

- `src/components/AppSections.tsx`
- `src/services/studyGrowthRecords.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，181/181。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。
- 已通过 1440px 桌面端和 390px 移动端截图检查，三个标签无溢出或重叠。

### 注意事项

- 数据版本升级至 28；现有学习方法和学习习惯数据无需迁移。
- 不增加删除、归档、置顶、标签或统计功能。

---

## [27.0.0] - 2026-10-26

### 改了什么

- 在“成长经验”一级菜单下新增“学会当学霸”页面，放在“善意足迹”之后。
- 页面通过“学习方法”和“学习习惯”两个标签页管理记录，支持新增、关键词搜索和编辑。
- 编辑时可以修改记录类型；保存后记录会移动到对应标签页，列表按创建时间倒序展示。
- 数据模型新增 `studyGrowthRecords`，前端归一化、项目文件保存、localStorage 兜底和后端写入校验同步支持。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/studyGrowthRecords.ts`
- `src/services/storage.ts`
- `src/services/sidebarNavigation.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，180/180。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。
- 已通过 1440px 桌面端和 390px 移动端截图检查，无横向溢出或界面重叠。

### 注意事项

- 数据版本升级至 27；旧数据首次读取时会自动补充空的 `studyGrowthRecords` 数组。
- 第一版不提供删除、归档、置顶、标签或统计功能。

---

## [26.0.0] - 2026-10-21

### 改了什么

- 在“成长经验”一级菜单下新增“善意足迹”页面，放在“工作经验”之后。
- 支持记录必填标题、发生时间和正文，列表按发生时间倒序展示，并允许编辑已有记录。
- 支持按标题或正文搜索，以及按包含边界的开始日期、结束日期组合查询。
- 数据模型新增 `kindnessRecords`，前端归一化、项目文件保存、localStorage 兜底和后端写入校验同步支持。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/kindnessRecords.ts`
- `src/services/storage.ts`
- `src/services/sidebarNavigation.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，172/172。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 数据版本升级至 26；旧数据首次读取时会自动补充空的 `kindnessRecords` 数组。
- 第一版不提供删除、归档、置顶或统计功能；查询日期以记录的发生时间为准。
- 数据继续明文保存在当前本地项目数据文件中。

---

## [25.0.0] - 2026-10-20

### 改了什么

- 在“阅读灵感”一级菜单下新增独立的“刷视频随记”页面，现有“视频灵感”数据与功能保持不变。
- 支持记录必填标题、可选摘录、可选感悟、来源和视频链接；摘录与感悟至少填写一项。
- 列表支持关键词搜索、置顶、编辑和归档，默认按置顶优先、创建时间倒序展示。
- 数据模型新增 `videoNotes`，前端归一化、本地保存、localStorage 兜底和后端写入校验同步支持。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/videoNotes.ts`
- `src/services/storage.ts`
- `src/services/sidebarNavigation.ts`
- `src/types.ts`
- `src/constants.ts`
- `src/styles.css`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，162/162。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 数据版本升级至 25；旧数据首次读取时会自动补充空的 `videoNotes` 数组。
- “刷视频随记”与现有“视频灵感”完全独立，不迁移或合并已有记录。
- 来源和链接均为可选自由文本，第一版不提供平台筛选、标签或归档查看页。

---

## [24.2.0] - 2026-10-20

### 改了什么

- 左侧导航升级为一级、二级菜单结构，“总控台”作为独立入口固定在分类上方。
- “日常计划、阅读灵感、成长经验、私人复盘”作为一级菜单，仅负责展开或收起；具体页面作为二级菜单展示。
- 一级菜单采用手风琴交互，始终最多展开一组；切换页面时自动展开该页面所属分组。

### 涉及文件

- `src/components/AppSections.tsx`
- `src/services/sidebarNavigation.ts`
- `src/styles.css`
- `tests-web/sidebarNavigation.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，152/152。
- `npm run build`：通过。
- `git diff --check`：通过。

### 注意事项

- 本次只调整导航层级和交互，不修改业务页面、数据结构或 `TodoData.version`。
- 展开状态仅保存在当前页面会话中，不写入项目数据或浏览器存储。

---

## [24.1.0] - 2026-10-20

### 改了什么

- 左侧菜单按使用目的划分为“日常计划、阅读灵感、成长经验、私人复盘”四个静态分组。
- 菜单改为统一配置驱动，保留现有图标、数量、选中状态和页面切换行为。
- 中等屏幕和移动端按分组保持三列、两列响应式排列，分组标题始终独占一行。

### 涉及文件

- `src/components/AppSections.tsx`
- `src/services/sidebarNavigation.ts`
- `src/styles.css`
- `tests-web/sidebarNavigation.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，151/151。
- `npm run build`：通过。
- `git diff --check`：通过。

### 注意事项

- 本次只调整导航结构和样式，不修改业务页面、数据结构或 `TodoData.version`。
- 分组始终展开，暂不支持自定义分类、折叠或拖拽排序。

---

## [24.0.0] - 2026-10-16

### 改了什么

- 新增左侧 `Divorce Plan` 页面，用于以时间线形式记录长期冲突事件。
- 支持发生时间、标题和正文的新增、编辑、关键词搜索与归档；默认按发生时间从新到旧展示。
- 保留“吵架整理”原有的单次复盘数据与页面，两类记录相互独立。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/divorcePlans.ts`
- `src/services/storage.ts`
- `src/types.ts`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/divorcePlans.test.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/storage.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，149/149。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。

### 注意事项

- 数据版本升级至 24；本地开发服务运行中时，需要重启 `npm run dev` 才会加载新的后端默认数据和校验逻辑。
- Divorce Plan 内容保存在当前项目本地数据文件中，第一版未提供加密、登录或云端同步。

---

## [23.0.0] - 2026-10-13

### 改了什么

- 移除“每日必读”的当前必读展示区和“已读，下一条”轮读操作。
- 移除每日必读轮读游标状态；页面保留新增、搜索、编辑、归档和自定义排序能力。
- 旧数据中残留的轮读游标会在读取时自动忽略，文案和排序数据保持不变。

### 涉及文件

- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/services/dailyReadings.ts`
- `src/services/storage.ts`
- `src/types.ts`
- `server/index.mjs`
- `server/schema.mjs`
- `tests-web/dailyReadings.test.mjs`
- `tests-web/storage.test.mjs`
- `tests-web/schema.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，140/140。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 数据版本升级至 23；使用中的本地服务需要重启后才会加载新的后端默认数据和校验逻辑。

---

## [22.0.0] - 2026-10-13

### 改了什么

- 每日必读文案支持自定义排序序号；轮读和列表均按序号从小到大展示。
- 编辑排序序号时，其他未归档文案自动顺延，序号保持连续且唯一。
- 旧数据会按原创建时间自动补齐排序序号；新增文案默认追加到末尾。

### 涉及文件

- `src/services/dailyReadings.ts`
- `src/App.tsx`
- `src/components/AppSections.tsx`
- `src/types.ts`
- `src/services/storage.ts`
- `server/schema.mjs`
- `server/index.mjs`
- `tests-web/dailyReadings.test.mjs`
- `tests-web/schema.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，143/143。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- 每日必读数据结构已升级到版本 22；本地后端运行中时，需要重启 `npm run dev` 才会加载新的服务端默认数据和校验逻辑。

---

## [21.0.0] - 2026-10-11

### 改了什么

- 新增“书籍整理”菜单，支持记录书名、作者、简短笔记和阅读状态。
- 支持“想读 / 在读 / 已读”状态筛选，以及按书名、作者、笔记搜索。
- 支持新增和编辑书籍，列表按创建时间从新到旧展示。

### 涉及文件

- `src/types.ts`
- `src/services/books.ts`
- `src/services/storage.ts`
- `src/components/AppSections.tsx`
- `src/App.tsx`
- `server/schema.mjs`
- `server/index.mjs`
- `tests-web/books.test.mjs`
- `tests-web/schema.test.mjs`
- `tests-web/storage.test.mjs`
- `CHANGELOG.md`

### 验证结果

- `npm run test`：通过，139/139。
- `npm run build`：通过。
- `node --check server/index.mjs`：通过。
- `node --check server/schema.mjs`：通过。
- `git diff --check`：通过。

### 注意事项

- `TodoData.version` 已升级到 `21`；旧数据缺少 `books` 时自动补为空数组。
- 第一版不提供删除、归档、评分、阅读进度和历史查询。

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
