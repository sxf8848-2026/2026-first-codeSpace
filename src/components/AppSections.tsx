import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Archive,
  BriefcaseBusiness,
  BookOpen,
  BrainCircuit,
  ClipboardList,
  Flame,
  History,
  HandHeart,
  LayoutDashboard,
  Lightbulb,
  MessagesSquare,
  Moon,
  Pencil,
  Pin,
  PinOff,
  Play,
  Plus,
  Quote,
  Redo2,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  Truck,
  Undo2,
  X,
  GraduationCap,
  ExternalLink,
  Video,
  Droplets,
  Gift,
  CircleDollarSign,
  GripVertical,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { STATUSES, TAGS } from "../constants";
import { addDays, dateKey, dayLabel, formatDisplayDate, formatMonthTitle, formatWeekRange, fromDateKey, fromMonthKey } from "../date";
import type { HabitView } from "../services/habits";
import { META_LEARNING_MASTERY_OPTIONS, MetaLearningMasteryFilter, metaLearningMasteryLabel } from "../services/metaLearning";
import { VideoInspirationChannelFilter } from "../services/videoInspirations";
import { WorkExperienceMonthFilter } from "../services/workExperiences";
import {
  getSidebarGroupLabel,
  SIDEBAR_GROUPS,
  SIDEBAR_PRIMARY_ITEM,
  type AppView,
  type SidebarGroupLabel,
  type SidebarIconName,
} from "../services/sidebarNavigation";
import {
  AwesomeRecord,
  Filters,
  Habit,
  InspirationRecord,
  MetaLearningAbility,
  MetaLearningMastery,
  MonthlyTask,
  STATUS_DONE,
  STATUS_IN_PROGRESS,
  StatusFilter,
  TagFilter,
  TagId,
  TaskDraft,
  TaskStatus,
  TodoTask,
  TodoTag,
  VideoInspirationRecord,
  VideoNoteRecord,
  DeliveryRecord,
  DeliveryStatus,
  WeeklyTask,
  WorkExperienceRecord,
  DailyReadingRecord,
  ArgumentReflectionRecord,
  DivorcePlanRecord,
  BookRecord,
  KindnessRecord,
  StudyGrowthRecord,
  StudyGrowthTitleSize,
  StudyGrowthType,
  SkincareCategory,
  SkincareProductRecord,
  RewardRuleRecord,
  RewardClaimRecord,
  RewardRulePeriod,
  LearnedContentRecord,
  LearnedContentType,
} from "../types";
import { BookStatusFilter } from "../services/books";
import { SKINCARE_CATEGORY_OPTIONS, SkincareCategoryFilter, skincareCategoryLabel } from "../services/skincareProducts";
import {
  canReorderRewardRules,
  getEffectiveRewardPeriod,
  getPreviousWeeklyRewardKey,
  getRewardBreakdown,
  isRewardBackfillDateAllowed,
  isRewardClaimBackfill,
  isWeeklyRewardBackfillAllowed,
  RewardRuleStatusFilter,
} from "../services/rewards";
import { Segmented, TagButton } from "./Controls";
import { StudyGrowthMarkdownEditor, StudyGrowthMarkdownPreview } from "./StudyGrowthMarkdownEditor";
import { studyGrowthMarkdownToPlainText } from "../services/studyGrowthMarkdown";
import { STUDY_GROWTH_TITLE_SIZES } from "../services/studyGrowthRecords";
import {
  LEARNED_CONTENT_TYPE_OPTIONS,
  learnedContentTypeLabel,
  LearnedContentMonthFilter,
  LearnedContentStats,
  LearnedContentTypeFilter,
} from "../services/learnedContents";

export type { AppView } from "../services/sidebarNavigation";

const sidebarIcons: Record<SidebarIconName, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  habits: Flame,
  calendar: CalendarDays,
  delivery: Truck,
  inspiration: Lightbulb,
  video: Video,
  reading: BookOpen,
  learning: GraduationCap,
  experience: BriefcaseBusiness,
  kindness: HandHeart,
  studyGrowth: BrainCircuit,
  skincare: Droplets,
  reward: Gift,
  learnedContents: BookOpen,
  reflection: MessagesSquare,
  divorcePlan: ClipboardList,
};

type SaveStatus = {
  state: "idle" | "saved" | "fallback";
  message: string;
};

export function LoadingScreen() {
  return (
    <main className="app-shell loading-shell">
      <section className="workspace loading-panel" aria-live="polite">
        <div className="brand-mark">
          <Check size={18} />
        </div>
        <div>
          <div className="eyebrow">
            <CalendarDays size={16} />
            正在加载
          </div>
          <h1>正在读取项目文件</h1>
          <p>数据加载完成前暂不开放编辑，避免浏览器缓存和项目文件相互覆盖。</p>
        </div>
      </section>
    </main>
  );
}

export function Sidebar({
  activeView,
  dashboardCount,
  dailyCount,
  monthlyCount,
  deliveryCount,
  onViewChange,
  onShowSettings,
}: {
  activeView: AppView;
  dashboardCount: number;
  dailyCount: number;
  monthlyCount: number;
  deliveryCount: number;
  onViewChange: (view: AppView) => void;
  onShowSettings: () => void;
}) {
  const counts = { dashboardCount, dailyCount, monthlyCount, deliveryCount };
  const [expandedGroup, setExpandedGroup] = useState<SidebarGroupLabel | null>(() => getSidebarGroupLabel(activeView));

  useEffect(() => {
    setExpandedGroup(getSidebarGroupLabel(activeView));
  }, [activeView]);

  const PrimaryIcon = sidebarIcons[SIDEBAR_PRIMARY_ITEM.icon];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Check size={18} />
        </div>
        <div>
          <strong>每日待办</strong>
          <span>Daily Focus</span>
        </div>
      </div>

      <nav className="view-nav" aria-label="视图切换">
        <button
          type="button"
          className={`view-nav-primary ${activeView === SIDEBAR_PRIMARY_ITEM.view ? "active" : ""}`}
          onClick={() => onViewChange(SIDEBAR_PRIMARY_ITEM.view)}
        >
          <PrimaryIcon size={16} />
          <span>{SIDEBAR_PRIMARY_ITEM.label}</span>
          <strong>{counts[SIDEBAR_PRIMARY_ITEM.count]}</strong>
        </button>
        {SIDEBAR_GROUPS.map((group, groupIndex) => {
          const itemsId = `sidebar-group-${groupIndex}`;
          const expanded = expandedGroup === group.label;
          return (
            <section className="view-nav-group" key={group.label}>
              <button
                type="button"
                className="view-nav-group-toggle"
                aria-expanded={expanded}
                aria-controls={itemsId}
                onClick={() => setExpandedGroup(expanded ? null : group.label)}
              >
                <span>{group.label}</span>
                <ChevronDown className={expanded ? "expanded" : ""} size={15} />
              </button>
              {expanded ? (
                <div className="view-nav-items" id={itemsId}>
                  {group.items.map((item) => {
                    const Icon = sidebarIcons[item.icon];
                    return (
                      <button type="button" className={activeView === item.view ? "active" : ""} onClick={() => onViewChange(item.view)} key={item.view}>
                        <Icon size={16} />
                        <span>{item.label}</span>
                        {"count" in item ? <strong>{counts[item.count]}</strong> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </section>
          );
        })}
      </nav>

      <button className="side-action secondary" onClick={onShowSettings}>
        <Settings size={17} />
        设置
      </button>
    </aside>
  );
}

export function WorkExperiencePanel({
  records,
  months,
  draft,
  query,
  monthFilter,
  editingRecordId,
  editingDraft,
  saveStatus,
  onDraftChange,
  onAdd,
  onQueryChange,
  onMonthFilterChange,
  onTogglePinned,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onArchive,
}: {
  records: WorkExperienceRecord[];
  months: string[];
  draft: { title: string; body: string; month: string };
  query: string;
  monthFilter: WorkExperienceMonthFilter;
  editingRecordId: string | null;
  editingDraft: { title: string; body: string; month: string };
  saveStatus: SaveStatus;
  onDraftChange: (draft: { title: string; body: string; month: string }) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onMonthFilterChange: (month: WorkExperienceMonthFilter) => void;
  onTogglePinned: (recordId: string) => void;
  onStartEdit: (record: WorkExperienceRecord) => void;
  onEditDraftChange: (draft: { title: string; body: string; month: string }) => void;
  onSaveEdit: (recordId: string) => void;
  onCancelEdit: () => void;
  onArchive: (recordId: string) => void;
}) {
  return (
    <>
      <header className="topbar inspiration-topbar">
        <div>
          <div className="eyebrow">
            <BriefcaseBusiness size={16} />
            工作经验
          </div>
          <h1>经验复盘库</h1>
        </div>
      </header>

      <section className="inspiration-summary">
        <div>
          <span>当前展示</span>
          <strong>{records.length} 条</strong>
        </div>
        <div className={`storage-status ${saveStatus.state}`} role="status">
          {saveStatus.message}
        </div>
      </section>

      <section className="inspiration-panel" aria-label="工作经验">
        <form className="inspiration-composer work-experience-composer" onSubmit={onAdd}>
          <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder="经验标题" />
          <input type="month" value={draft.month} onChange={(event) => onDraftChange({ ...draft, month: event.target.value })} />
          <textarea value={draft.body} onChange={(event) => onDraftChange({ ...draft, body: event.target.value })} placeholder="正文，必填" required />
          <button className="primary-button" type="submit">
            <Plus size={18} />
            添加
          </button>
        </form>

        <div className="inspiration-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索标题或正文" />
          </div>
          <select value={monthFilter} onChange={(event) => onMonthFilterChange(event.target.value as WorkExperienceMonthFilter)}>
            <option value="all">全部月份</option>
            {months.map((month) => (
              <option value={month} key={month}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div className="inspiration-list">
          {records.length ? (
            records.map((record) => (
              <article className={`inspiration-item ${record.pinned ? "pinned" : ""}`} key={record.id}>
                {editingRecordId === record.id ? (
                  <div className="inspiration-edit work-experience-edit">
                    <input
                      value={editingDraft.title}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, title: event.target.value })}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) onSaveEdit(record.id);
                        if (event.key === "Escape") onCancelEdit();
                      }}
                      autoFocus
                    />
                    <textarea
                      value={editingDraft.body}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, body: event.target.value })}
                      placeholder="正文，必填"
                      required
                    />
                    <input
                      className="work-experience-edit-month"
                      type="month"
                      value={editingDraft.month}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, month: event.target.value })}
                    />
                  </div>
                ) : (
                  <div className="inspiration-content">
                    <div className="inspiration-title-line work-experience-title-line">
                      {record.pinned && <Pin size={15} />}
                      <strong title={record.title}>{record.title}</strong>
                      <span className="work-experience-month">{record.month}</span>
                    </div>
                    {record.body && <p className="work-experience-body">{record.body}</p>}
                    <small>{formatRecordStamp(record.created_at)}</small>
                  </div>
                )}
                <div className="inspiration-actions">
                  {editingRecordId === record.id ? (
                    <>
                      <button onClick={() => onSaveEdit(record.id)}>保存</button>
                      <button onClick={onCancelEdit} title="取消编辑">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onTogglePinned(record.id)} title={record.pinned ? "取消置顶" : "置顶工作经验"}>
                        {record.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                      </button>
                      <button onClick={() => onStartEdit(record)} title="编辑工作经验">
                        <Pencil size={16} />
                      </button>
                      <button className="danger" onClick={() => onArchive(record.id)} title="归档工作经验">
                        <Archive size={16} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="inspiration-empty">{query.trim() ? "没有匹配的工作经验" : "还没有工作经验"}</div>
          )}
        </div>
      </section>
    </>
  );
}

export function VideoInspirationPanel({
  records,
  channels,
  draft,
  query,
  channelFilter,
  editingRecordId,
  editingDraft,
  saveStatus,
  onDraftChange,
  onAdd,
  onQueryChange,
  onChannelFilterChange,
  onTogglePinned,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onArchive,
}: {
  records: VideoInspirationRecord[];
  channels: string[];
  draft: VideoInspirationDraft;
  query: string;
  channelFilter: VideoInspirationChannelFilter;
  editingRecordId: string | null;
  editingDraft: VideoInspirationDraft;
  saveStatus: SaveStatus;
  onDraftChange: (draft: VideoInspirationDraft) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onChannelFilterChange: (filter: VideoInspirationChannelFilter) => void;
  onTogglePinned: (recordId: string) => void;
  onStartEdit: (record: VideoInspirationRecord) => void;
  onEditDraftChange: (draft: VideoInspirationDraft) => void;
  onSaveEdit: (recordId: string) => void;
  onCancelEdit: () => void;
  onArchive: (recordId: string) => void;
}) {
  return (
    <>
      <header className="topbar video-inspiration-topbar">
        <div>
          <div className="eyebrow">
            <Video size={16} />
            视频灵感
          </div>
          <h1>高价值视频</h1>
        </div>
      </header>

      <section className="video-inspiration-summary">
        <div>
          <span>当前展示</span>
          <strong>{records.length} 条</strong>
        </div>
        <div className={`storage-status ${saveStatus.state}`} role="status">
          {saveStatus.message}
        </div>
      </section>

      <section className="video-inspiration-panel" aria-label="视频灵感">
        <form className="video-inspiration-composer" onSubmit={onAdd}>
          <input value={draft.channel} onChange={(event) => onDraftChange({ ...draft, channel: event.target.value })} placeholder="渠道，例如：抖音 / B站" />
          <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder="视频标题" />
          <textarea value={draft.content} onChange={(event) => onDraftChange({ ...draft, content: event.target.value })} placeholder="内容整理，可不填" />
          <input value={draft.url} onChange={(event) => onDraftChange({ ...draft, url: event.target.value })} placeholder="视频链接，可不填" />
          <button className="primary-button" type="submit">
            <Plus size={18} />
            添加
          </button>
        </form>

        <div className="video-inspiration-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索渠道、标题、内容或链接" />
          </div>
          <select value={channelFilter} onChange={(event) => onChannelFilterChange(event.target.value)}>
            <option value="all">全部渠道</option>
            {channels.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
        </div>

        <div className="video-inspiration-list">
          {records.length ? (
            records.map((record) => (
              <article className={`video-inspiration-item ${record.pinned ? "pinned" : ""}`} key={record.id}>
                {editingRecordId === record.id ? (
                  <div className="video-inspiration-edit">
                    <input
                      value={editingDraft.channel}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, channel: event.target.value })}
                      placeholder="渠道"
                      autoFocus
                    />
                    <input
                      value={editingDraft.title}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, title: event.target.value })}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) onSaveEdit(record.id);
                        if (event.key === "Escape") onCancelEdit();
                      }}
                      placeholder="视频标题"
                    />
                    <textarea
                      value={editingDraft.content}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, content: event.target.value })}
                      placeholder="内容整理，可不填"
                    />
                    <input
                      value={editingDraft.url}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, url: event.target.value })}
                      placeholder="视频链接，可不填"
                    />
                  </div>
                ) : (
                  <div className="video-inspiration-content">
                    <div className="video-inspiration-title-line">
                      {record.pinned && <Pin size={15} />}
                      <span className="channel-chip">{record.channel}</span>
                      <strong title={record.title}>{record.title}</strong>
                    </div>
                    {record.content && <p>{record.content}</p>}
                    <div className="video-inspiration-meta">
                      <small>{formatRecordStamp(record.created_at)}</small>
                      {record.url && (
                        <a href={normalizeExternalHref(record.url)} target="_blank" rel="noreferrer" title={record.url}>
                          <ExternalLink size={14} />
                          打开链接
                        </a>
                      )}
                    </div>
                  </div>
                )}
                <div className="video-inspiration-actions">
                  {editingRecordId === record.id ? (
                    <>
                      <button onClick={() => onSaveEdit(record.id)}>保存</button>
                      <button onClick={onCancelEdit} title="取消编辑">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onTogglePinned(record.id)} title={record.pinned ? "取消置顶" : "置顶视频灵感"}>
                        {record.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                      </button>
                      <button onClick={() => onStartEdit(record)} title="编辑视频灵感">
                        <Pencil size={16} />
                      </button>
                      <button className="danger" onClick={() => onArchive(record.id)} title="归档视频灵感">
                        <Archive size={16} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="video-inspiration-empty">{query.trim() || channelFilter !== "all" ? "没有匹配的视频灵感" : "还没有视频灵感"}</div>
          )}
        </div>
      </section>
    </>
  );
}

export type VideoInspirationDraft = {
  channel: string;
  title: string;
  content: string;
  url: string;
};

export function VideoNotesPanel({
  records,
  draft,
  query,
  editingRecordId,
  editingDraft,
  saveStatus,
  onDraftChange,
  onAdd,
  onQueryChange,
  onTogglePinned,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onArchive,
}: {
  records: VideoNoteRecord[];
  draft: VideoNoteDraft;
  query: string;
  editingRecordId: string | null;
  editingDraft: VideoNoteDraft;
  saveStatus: SaveStatus;
  onDraftChange: (draft: VideoNoteDraft) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onTogglePinned: (recordId: string) => void;
  onStartEdit: (record: VideoNoteRecord) => void;
  onEditDraftChange: (draft: VideoNoteDraft) => void;
  onSaveEdit: (recordId: string) => void;
  onCancelEdit: () => void;
  onArchive: (recordId: string) => void;
}) {
  return (
    <>
      <header className="topbar video-note-topbar">
        <div>
          <div className="eyebrow">
            <Video size={16} />
            刷视频随记
          </div>
          <h1>视频里的好句与想法</h1>
        </div>
      </header>

      <section className="video-note-summary">
        <div>
          <span>当前展示</span>
          <strong>{records.length} 条</strong>
        </div>
        <div className={`storage-status ${saveStatus.state}`} role="status">
          {saveStatus.message}
        </div>
      </section>

      <section className="video-note-panel" aria-label="刷视频随记">
        <form className="video-note-composer" onSubmit={onAdd}>
          <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder="标题，必填" />
          <input value={draft.source} onChange={(event) => onDraftChange({ ...draft, source: event.target.value })} placeholder="来源，例如：抖音 · 某账号" />
          <input value={draft.url} onChange={(event) => onDraftChange({ ...draft, url: event.target.value })} placeholder="视频链接，可不填" />
          <textarea value={draft.quote} onChange={(event) => onDraftChange({ ...draft, quote: event.target.value })} placeholder="名言、金句或原话" />
          <textarea value={draft.reflection} onChange={(event) => onDraftChange({ ...draft, reflection: event.target.value })} placeholder="我的感悟" />
          <button className="primary-button" type="submit">
            <Plus size={18} />
            添加
          </button>
        </form>

        <div className="video-note-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索标题、摘录、感悟、来源或链接" />
          </div>
        </div>

        <div className="video-note-list">
          {records.length ? (
            records.map((record) => (
              <article className={`video-note-item ${record.pinned ? "pinned" : ""}`} key={record.id}>
                {editingRecordId === record.id ? (
                  <div className="video-note-edit">
                    <input value={editingDraft.title} onChange={(event) => onEditDraftChange({ ...editingDraft, title: event.target.value })} placeholder="标题，必填" autoFocus />
                    <input value={editingDraft.source} onChange={(event) => onEditDraftChange({ ...editingDraft, source: event.target.value })} placeholder="来源，可不填" />
                    <input value={editingDraft.url} onChange={(event) => onEditDraftChange({ ...editingDraft, url: event.target.value })} placeholder="视频链接，可不填" />
                    <textarea value={editingDraft.quote} onChange={(event) => onEditDraftChange({ ...editingDraft, quote: event.target.value })} placeholder="名言、金句或原话" />
                    <textarea value={editingDraft.reflection} onChange={(event) => onEditDraftChange({ ...editingDraft, reflection: event.target.value })} placeholder="我的感悟" />
                  </div>
                ) : (
                  <div className="video-note-content">
                    <div className="video-note-title-line">
                      {record.pinned && <Pin size={15} />}
                      <strong>{record.title}</strong>
                    </div>
                    {record.quote && (
                      <blockquote>
                        <Quote size={16} />
                        <p>{record.quote}</p>
                      </blockquote>
                    )}
                    {record.reflection && (
                      <div className="video-note-reflection">
                        <strong>我的感悟</strong>
                        <p>{record.reflection}</p>
                      </div>
                    )}
                    <div className="video-note-meta">
                      {record.source && <span>来源：{record.source}</span>}
                      <small>{formatRecordStamp(record.created_at)}</small>
                      {record.url && (
                        <a href={normalizeExternalHref(record.url)} target="_blank" rel="noreferrer" title={record.url}>
                          <ExternalLink size={14} />
                          打开视频
                        </a>
                      )}
                    </div>
                  </div>
                )}
                <div className="video-note-actions">
                  {editingRecordId === record.id ? (
                    <>
                      <button onClick={() => onSaveEdit(record.id)}>保存</button>
                      <button onClick={onCancelEdit} title="取消编辑">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onTogglePinned(record.id)} title={record.pinned ? "取消置顶" : "置顶刷视频随记"}>
                        {record.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                      </button>
                      <button onClick={() => onStartEdit(record)} title="编辑刷视频随记">
                        <Pencil size={16} />
                      </button>
                      <button className="danger" onClick={() => onArchive(record.id)} title="归档刷视频随记">
                        <Archive size={16} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="video-note-empty">{query.trim() ? "没有匹配的刷视频随记" : "还没有刷视频随记"}</div>
          )}
        </div>
      </section>
    </>
  );
}

export type VideoNoteDraft = {
  title: string;
  quote: string;
  reflection: string;
  source: string;
  url: string;
};

export function MetaLearningPanel({
  records,
  draft,
  query,
  masteryFilter,
  editingRecordId,
  editingDraft,
  saveStatus,
  onDraftChange,
  onAdd,
  onQueryChange,
  onMasteryFilterChange,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onArchive,
}: {
  records: MetaLearningAbility[];
  draft: MetaLearningDraft;
  query: string;
  masteryFilter: MetaLearningMasteryFilter;
  editingRecordId: string | null;
  editingDraft: MetaLearningDraft;
  saveStatus: SaveStatus;
  onDraftChange: (draft: MetaLearningDraft) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onMasteryFilterChange: (filter: MetaLearningMasteryFilter) => void;
  onStartEdit: (record: MetaLearningAbility) => void;
  onEditDraftChange: (draft: MetaLearningDraft) => void;
  onSaveEdit: (recordId: string) => void;
  onCancelEdit: () => void;
  onArchive: (recordId: string) => void;
}) {
  return (
    <>
      <header className="topbar meta-learning-topbar">
        <div>
          <div className="eyebrow">
            <GraduationCap size={16} />
            元学习力
          </div>
          <h1>学习能力库</h1>
        </div>
      </header>

      <section className="meta-learning-summary">
        <div>
          <span>当前展示</span>
          <strong>{records.length} 项</strong>
        </div>
        <div className={`storage-status ${saveStatus.state}`} role="status">
          {saveStatus.message}
        </div>
      </section>

      <section className="meta-learning-panel" aria-label="元学习力">
        <form className="meta-learning-composer" onSubmit={onAdd}>
          <input value={draft.name} onChange={(event) => onDraftChange({ ...draft, name: event.target.value })} placeholder="能力名称，例如：费曼学习法" />
          <select value={draft.mastery} onChange={(event) => onDraftChange({ ...draft, mastery: event.target.value as MetaLearningMastery })}>
            {META_LEARNING_MASTERY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea value={draft.summary} onChange={(event) => onDraftChange({ ...draft, summary: event.target.value })} placeholder="是什么" />
          <textarea value={draft.usage} onChange={(event) => onDraftChange({ ...draft, usage: event.target.value })} placeholder="如何使用 / 适用场景" />
          <button className="primary-button" type="submit">
            <Plus size={18} />
            添加
          </button>
        </form>

        <div className="meta-learning-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索名称、说明或用法" />
          </div>
          <Segmented
            value={masteryFilter}
            options={[
              ["all", "全部"],
              ...META_LEARNING_MASTERY_OPTIONS.map((option) => [option.value, option.label] as [string, string]),
            ]}
            onChange={(value) => onMasteryFilterChange(value as MetaLearningMasteryFilter)}
          />
        </div>

        <div className="meta-learning-list">
          {records.length ? (
            records.map((record) => (
              <article className={`meta-learning-item ${record.mastery}`} key={record.id}>
                {editingRecordId === record.id ? (
                  <div className="meta-learning-edit">
                    <input
                      value={editingDraft.name}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, name: event.target.value })}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) onSaveEdit(record.id);
                        if (event.key === "Escape") onCancelEdit();
                      }}
                      autoFocus
                    />
                    <select
                      value={editingDraft.mastery}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, mastery: event.target.value as MetaLearningMastery })}
                    >
                      {META_LEARNING_MASTERY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={editingDraft.summary}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, summary: event.target.value })}
                      placeholder="是什么"
                    />
                    <textarea
                      value={editingDraft.usage}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, usage: event.target.value })}
                      placeholder="如何使用 / 适用场景"
                    />
                  </div>
                ) : (
                  <div className="meta-learning-content">
                    <div className="meta-learning-title-line">
                      <strong title={record.name}>{record.name}</strong>
                      <span className={`mastery-chip ${record.mastery}`}>{metaLearningMasteryLabel(record.mastery)}</span>
                    </div>
                    {record.summary && <p>{record.summary}</p>}
                    {record.usage && <p>{record.usage}</p>}
                    <small>{formatRecordStamp(record.created_at)}</small>
                  </div>
                )}
                <div className="meta-learning-actions">
                  {editingRecordId === record.id ? (
                    <>
                      <button onClick={() => onSaveEdit(record.id)}>保存</button>
                      <button onClick={onCancelEdit} title="取消编辑">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onStartEdit(record)} title="编辑学习能力">
                        <Pencil size={16} />
                      </button>
                      <button className="danger" onClick={() => onArchive(record.id)} title="归档学习能力">
                        <Archive size={16} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="meta-learning-empty">{query.trim() || masteryFilter !== "all" ? "没有匹配的学习能力" : "还没有学习能力卡片"}</div>
          )}
        </div>
      </section>
    </>
  );
}

export type MetaLearningDraft = {
  name: string;
  summary: string;
  usage: string;
  mastery: MetaLearningMastery;
};

export function DailyReadingPanel({
  records,
  totalCount,
  draft,
  query,
  editingRecordId,
  editingDraft,
  saveStatus,
  onDraftChange,
  onAdd,
  onQueryChange,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onArchive,
}: {
  records: DailyReadingRecord[];
  totalCount: number;
  draft: { title: string; body: string; source: string };
  query: string;
  editingRecordId: string | null;
  editingDraft: { title: string; body: string; source: string; sortOrder: string };
  saveStatus: SaveStatus;
  onDraftChange: (draft: { title: string; body: string; source: string }) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onStartEdit: (record: DailyReadingRecord) => void;
  onEditDraftChange: (draft: { title: string; body: string; source: string; sortOrder: string }) => void;
  onSaveEdit: (recordId: string) => void;
  onCancelEdit: () => void;
  onArchive: (recordId: string) => void;
}) {
  return (
    <>
      <header className="topbar daily-reading-topbar">
        <div>
          <div className="eyebrow">
            <BookOpen size={16} />
            每日必读文案
          </div>
          <h1>每日必读</h1>
        </div>
      </header>

      <section className="daily-reading-summary">
        <div>
          <span>当前收录</span>
          <strong>{totalCount} 条</strong>
        </div>
        <div className={`storage-status ${saveStatus.state}`} role="status">
          {saveStatus.message}
        </div>
      </section>

      <section className="daily-reading-panel" aria-label="全部必读文案">
        <form className="daily-reading-composer" onSubmit={onAdd}>
          <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder="文案标题" />
          <input value={draft.source} onChange={(event) => onDraftChange({ ...draft, source: event.target.value })} placeholder="来源，可不填" />
          <textarea value={draft.body} onChange={(event) => onDraftChange({ ...draft, body: event.target.value })} placeholder="文案正文，必填" />
          <button className="primary-button" type="submit">
            <Plus size={18} />
            添加
          </button>
        </form>

        <div className="daily-reading-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索标题、正文或来源" />
          </div>
        </div>

        <div className="daily-reading-list">
          {records.length ? (
            records.map((record) => (
              <article className="daily-reading-item" key={record.id}>
                {editingRecordId === record.id ? (
                  <div className="daily-reading-edit">
                    <input value={editingDraft.title} onChange={(event) => onEditDraftChange({ ...editingDraft, title: event.target.value })} autoFocus />
                    <input value={editingDraft.source} onChange={(event) => onEditDraftChange({ ...editingDraft, source: event.target.value })} placeholder="来源，可不填" />
                    <input type="number" min="1" max={totalCount} value={editingDraft.sortOrder} onChange={(event) => onEditDraftChange({ ...editingDraft, sortOrder: event.target.value })} placeholder="排序序号" />
                    <textarea value={editingDraft.body} onChange={(event) => onEditDraftChange({ ...editingDraft, body: event.target.value })} placeholder="文案正文，必填" />
                  </div>
                ) : (
                  <div className="daily-reading-content">
                    <div className="daily-reading-title-line">
                      <span>{record.sort_order}</span>
                      <strong title={record.title}>{record.title}</strong>
                    </div>
                    <p>{record.body}</p>
                    {record.source && <small>来源：{record.source}</small>}
                  </div>
                )}
                <div className="daily-reading-actions">
                  {editingRecordId === record.id ? (
                    <>
                      <button onClick={() => onSaveEdit(record.id)}>保存</button>
                      <button onClick={onCancelEdit} title="取消编辑"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onStartEdit(record)} title="编辑必读文案"><Pencil size={16} /></button>
                      <button className="danger" onClick={() => onArchive(record.id)} title="归档必读文案"><Archive size={16} /></button>
                    </>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="daily-reading-empty">{query.trim() ? "没有匹配的必读文案" : "还没有必读文案"}</div>
          )}
        </div>
      </section>
    </>
  );
}

const BOOK_STATUS_OPTIONS: Array<[BookRecord["status"], string]> = [
  ["want_to_read", "想读"],
  ["reading", "在读"],
  ["read", "已读"],
];

export function BooksPanel({
  books,
  draft,
  query,
  statusFilter,
  editingBookId,
  editingDraft,
  saveStatus,
  onDraftChange,
  onAdd,
  onQueryChange,
  onStatusFilterChange,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
}: {
  books: BookRecord[];
  draft: { title: string; author: string; note: string; status: BookRecord["status"] };
  query: string;
  statusFilter: BookStatusFilter;
  editingBookId: string | null;
  editingDraft: { title: string; author: string; note: string; status: BookRecord["status"] };
  saveStatus: SaveStatus;
  onDraftChange: (draft: { title: string; author: string; note: string; status: BookRecord["status"] }) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (filter: BookStatusFilter) => void;
  onStartEdit: (book: BookRecord) => void;
  onEditDraftChange: (draft: { title: string; author: string; note: string; status: BookRecord["status"] }) => void;
  onSaveEdit: (bookId: string) => void;
  onCancelEdit: () => void;
}) {
  return (
    <>
      <header className="topbar books-topbar">
        <div>
          <div className="eyebrow"><BookOpen size={16} />书籍整理</div>
          <h1>我的书库</h1>
        </div>
      </header>

      <section className="books-summary">
        <div><span>当前展示</span><strong>{books.length} 本</strong></div>
        <div className={`storage-status ${saveStatus.state}`} role="status">{saveStatus.message}</div>
      </section>

      <section className="books-panel" aria-label="书籍整理">
        <form className="books-composer" onSubmit={onAdd}>
          <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder="书名，必填" />
          <input value={draft.author} onChange={(event) => onDraftChange({ ...draft, author: event.target.value })} placeholder="作者，可不填" />
          <select value={draft.status} onChange={(event) => onDraftChange({ ...draft, status: event.target.value as BookRecord["status"] })} aria-label="阅读状态">
            {BOOK_STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <textarea value={draft.note} onChange={(event) => onDraftChange({ ...draft, note: event.target.value })} placeholder="简短笔记，可不填" />
          <button className="primary-button" type="submit"><Plus size={18} />添加书籍</button>
        </form>

        <div className="books-toolbar">
          <div className="search-box"><Search size={16} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索书名、作者或笔记" /></div>
          <Segmented
            value={statusFilter}
            options={[["all", "全部"], ...BOOK_STATUS_OPTIONS]}
            onChange={(value) => onStatusFilterChange(value as BookStatusFilter)}
          />
        </div>

        <div className="books-list">
          {books.length ? books.map((book) => (
            <article className={`book-item ${book.status}`} key={book.id}>
              {editingBookId === book.id ? (
                <div className="book-edit">
                  <input value={editingDraft.title} onChange={(event) => onEditDraftChange({ ...editingDraft, title: event.target.value })} autoFocus />
                  <input value={editingDraft.author} onChange={(event) => onEditDraftChange({ ...editingDraft, author: event.target.value })} placeholder="作者，可不填" />
                  <select value={editingDraft.status} onChange={(event) => onEditDraftChange({ ...editingDraft, status: event.target.value as BookRecord["status"] })}>
                    {BOOK_STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <textarea value={editingDraft.note} onChange={(event) => onEditDraftChange({ ...editingDraft, note: event.target.value })} placeholder="简短笔记，可不填" />
                </div>
              ) : (
                <div className="book-content">
                  <div className="book-title-line"><strong>{book.title}</strong><span>{BOOK_STATUS_OPTIONS.find(([value]) => value === book.status)?.[1]}</span></div>
                  {book.author && <small>作者：{book.author}</small>}
                  {book.note && <p>{book.note}</p>}
                  <time>{book.updated_at === book.created_at ? `添加于 ${book.created_at.slice(0, 10)}` : `更新于 ${book.updated_at.slice(0, 10)}`}</time>
                </div>
              )}
              <div className="book-actions">
                {editingBookId === book.id ? <><button onClick={() => onSaveEdit(book.id)}>保存</button><button onClick={onCancelEdit} title="取消编辑"><X size={16} /></button></> : <button onClick={() => onStartEdit(book)} title="编辑书籍"><Pencil size={16} /></button>}
              </div>
            </article>
          )) : <div className="books-empty">{query.trim() || statusFilter !== "all" ? "没有匹配的书籍" : "还没有书籍记录"}</div>}
        </div>
      </section>
    </>
  );
}

type KindnessDraft = {
  title: string;
  occurred_at: string;
  content: string;
};

export function KindnessRecordsPanel({
  records,
  totalCount,
  draft,
  query,
  startDate,
  endDate,
  editingRecordId,
  editingDraft,
  saveStatus,
  onDraftChange,
  onAdd,
  onQueryChange,
  onStartDateChange,
  onEndDateChange,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
}: {
  records: KindnessRecord[];
  totalCount: number;
  draft: KindnessDraft;
  query: string;
  startDate: string;
  endDate: string;
  editingRecordId: string | null;
  editingDraft: KindnessDraft;
  saveStatus: SaveStatus;
  onDraftChange: (draft: KindnessDraft) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onStartEdit: (record: KindnessRecord) => void;
  onEditDraftChange: (draft: KindnessDraft) => void;
  onSaveEdit: (recordId: string) => void;
  onCancelEdit: () => void;
}) {
  return (
    <>
      <header className="topbar kindness-topbar">
        <div>
          <div className="eyebrow"><HandHeart size={16} />成长经验</div>
          <h1>善意足迹</h1>
        </div>
      </header>

      <section className="kindness-summary">
        <div><span>当前展示</span><strong>{records.length} 条</strong></div>
        <div className={`storage-status ${saveStatus.state}`} role="status">{saveStatus.message}</div>
      </section>

      <section className="kindness-panel" aria-label="善意足迹">
        <form className="kindness-composer" onSubmit={onAdd}>
          <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder="标题，必填" required />
          <input type="datetime-local" value={draft.occurred_at} onChange={(event) => onDraftChange({ ...draft, occurred_at: event.target.value })} aria-label="发生时间" required />
          <textarea value={draft.content} onChange={(event) => onDraftChange({ ...draft, content: event.target.value })} placeholder="记录这次善意，必填" required />
          <button className="primary-button" type="submit"><Plus size={18} />添加记录</button>
        </form>

        <div className="kindness-toolbar">
          <div className="search-box"><Search size={16} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索标题或正文" /></div>
          <label className="kindness-date-filter"><span>开始日期</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => onStartDateChange(event.target.value)} /></label>
          <label className="kindness-date-filter"><span>结束日期</span><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => onEndDateChange(event.target.value)} /></label>
        </div>

        <div className="kindness-list">
          {records.length ? records.map((record) => (
            <article className="kindness-item" key={record.id}>
              {editingRecordId === record.id ? (
                <div className="kindness-edit">
                  <input value={editingDraft.title} onChange={(event) => onEditDraftChange({ ...editingDraft, title: event.target.value })} placeholder="标题，必填" autoFocus required />
                  <input type="datetime-local" value={editingDraft.occurred_at} onChange={(event) => onEditDraftChange({ ...editingDraft, occurred_at: event.target.value })} required />
                  <textarea value={editingDraft.content} onChange={(event) => onEditDraftChange({ ...editingDraft, content: event.target.value })} placeholder="记录这次善意，必填" required />
                </div>
              ) : (
                <div className="kindness-content">
                  <div className="kindness-heading"><strong>{record.title}</strong><time>{formatArgumentDateTime(record.occurred_at)}</time></div>
                  <p>{record.content}</p>
                </div>
              )}
              <div className="kindness-actions">
                {editingRecordId === record.id ? (
                  <><button type="button" onClick={() => onSaveEdit(record.id)}>保存</button><button type="button" onClick={onCancelEdit} title="取消编辑"><X size={16} /></button></>
                ) : (
                  <button type="button" onClick={() => onStartEdit(record)} title="编辑记录"><Pencil size={16} /></button>
                )}
              </div>
            </article>
          )) : <div className="kindness-empty">{totalCount ? "没有匹配的善意足迹" : "还没有善意足迹"}</div>}
        </div>
      </section>
    </>
  );
}

type StudyGrowthDraft = {
  title: string;
  title_size: StudyGrowthTitleSize;
  content: string;
  content_markdown: string;
  source: string;
};

type StudyGrowthEditDraft = StudyGrowthDraft & {
  type: StudyGrowthType;
};

export function StudyGrowthPanel({
  records,
  totalCount,
  activeType,
  draft,
  query,
  editingRecordId,
  editingDraft,
  saveStatus,
  onTypeChange,
  onDraftChange,
  onAdd,
  onQueryChange,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
}: {
  records: StudyGrowthRecord[];
  totalCount: number;
  activeType: StudyGrowthType;
  draft: StudyGrowthDraft;
  query: string;
  editingRecordId: string | null;
  editingDraft: StudyGrowthEditDraft;
  saveStatus: SaveStatus;
  onTypeChange: (type: StudyGrowthType) => void;
  onDraftChange: (draft: StudyGrowthDraft) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onStartEdit: (record: StudyGrowthRecord) => void;
  onEditDraftChange: (draft: StudyGrowthEditDraft) => void;
  onSaveEdit: (recordId: string) => void;
  onCancelEdit: () => void;
}) {
  const typeLabel = activeType === "method" ? "学习方法" : activeType === "habit" ? "学习习惯" : "思维模型";
  return (
    <>
      <header className="topbar study-growth-topbar">
        <div>
          <div className="eyebrow"><BrainCircuit size={16} />成长经验</div>
          <h1>学会当学霸</h1>
        </div>
      </header>

      <section className="study-growth-summary">
        <div><span>当前展示</span><strong>{records.length} 条</strong></div>
        <div className={`storage-status ${saveStatus.state}`} role="status">{saveStatus.message}</div>
      </section>

      <section className="study-growth-panel" aria-label="学会当学霸">
        <Segmented
          value={activeType}
          options={[["method", "学习方法"], ["habit", "学习习惯"], ["mental_model", "思维模型"]]}
          onChange={(value) => onTypeChange(value as StudyGrowthType)}
        />

        <form className="study-growth-composer" onSubmit={onAdd}>
          <input style={{ fontSize: `${draft.title_size}px` }} value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder={`${typeLabel}标题，必填`} required />
          <select value={draft.title_size} onChange={(event) => onDraftChange({ ...draft, title_size: Number(event.target.value) as StudyGrowthTitleSize })} aria-label="标题字号">
            {STUDY_GROWTH_TITLE_SIZES.map((size) => <option key={size} value={size}>{size}px</option>)}
          </select>
          <input value={draft.source} onChange={(event) => onDraftChange({ ...draft, source: event.target.value })} placeholder="来源，可不填" />
          <StudyGrowthMarkdownEditor
            markdown={draft.content_markdown}
            placeholder={`记录${typeLabel}的具体内容，必填`}
            onChange={(markdown) => onDraftChange({ ...draft, content: studyGrowthMarkdownToPlainText(markdown), content_markdown: markdown })}
          />
          <button className="primary-button" type="submit"><Plus size={18} />添加记录</button>
        </form>

        <div className="study-growth-toolbar">
          <div className="search-box"><Search size={16} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索标题、正文或来源" /></div>
        </div>

        <div className="study-growth-list">
          {records.length ? records.map((record) => (
            <article className="study-growth-item" key={record.id}>
              {editingRecordId === record.id ? (
                <div className={`study-growth-edit ${record.type === "mental_model" ? "fixed-type" : ""}`}>
                  {record.type === "mental_model" ? null : <select value={editingDraft.type} onChange={(event) => onEditDraftChange({ ...editingDraft, type: event.target.value as StudyGrowthType })} aria-label="记录类型">
                    <option value="method">学习方法</option>
                    <option value="habit">学习习惯</option>
                  </select>}
                  <input style={{ fontSize: `${editingDraft.title_size}px` }} value={editingDraft.title} onChange={(event) => onEditDraftChange({ ...editingDraft, title: event.target.value })} placeholder="标题，必填" autoFocus required />
                  <select value={editingDraft.title_size} onChange={(event) => onEditDraftChange({ ...editingDraft, title_size: Number(event.target.value) as StudyGrowthTitleSize })} aria-label="标题字号">
                    {STUDY_GROWTH_TITLE_SIZES.map((size) => <option key={size} value={size}>{size}px</option>)}
                  </select>
                  <input value={editingDraft.source} onChange={(event) => onEditDraftChange({ ...editingDraft, source: event.target.value })} placeholder="来源，可不填" />
                  <StudyGrowthMarkdownEditor
                    markdown={editingDraft.content_markdown}
                    placeholder="正文，必填"
                    autoFocus
                    onChange={(markdown) => onEditDraftChange({ ...editingDraft, content: studyGrowthMarkdownToPlainText(markdown), content_markdown: markdown })}
                  />
                </div>
              ) : (
                <div className="study-growth-content">
                  <div className="study-growth-heading"><strong style={{ fontSize: `${record.title_size}px` }}>{record.title}</strong><time>{record.updated_at === record.created_at ? `添加于 ${formatRecordStamp(record.created_at)}` : `更新于 ${formatRecordStamp(record.updated_at)}`}</time></div>
                  <StudyGrowthMarkdownPreview markdown={record.content_markdown} />
                  {record.source ? <small>来源：{record.source}</small> : null}
                </div>
              )}
              <div className="study-growth-actions">
                {editingRecordId === record.id ? (
                  <><button type="button" onClick={() => onSaveEdit(record.id)}>保存</button><button type="button" onClick={onCancelEdit} title="取消编辑"><X size={16} /></button></>
                ) : (
                  <button type="button" onClick={() => onStartEdit(record)} title="编辑记录"><Pencil size={16} /></button>
                )}
              </div>
            </article>
          )) : <div className="study-growth-empty">{totalCount ? `没有匹配的${typeLabel}` : `还没有${typeLabel}记录`}</div>}
        </div>
      </section>
    </>
  );
}

type SkincareDraft = {
  name: string;
  brand: string;
  category: SkincareCategory;
  description: string;
};

export function SkincarePanel({
  products,
  totalCount,
  draft,
  query,
  categoryFilter,
  editingProductId,
  editingDraft,
  saveStatus,
  onDraftChange,
  onAdd,
  onQueryChange,
  onCategoryFilterChange,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
}: {
  products: SkincareProductRecord[];
  totalCount: number;
  draft: SkincareDraft;
  query: string;
  categoryFilter: SkincareCategoryFilter;
  editingProductId: string | null;
  editingDraft: SkincareDraft;
  saveStatus: SaveStatus;
  onDraftChange: (draft: SkincareDraft) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onCategoryFilterChange: (filter: SkincareCategoryFilter) => void;
  onStartEdit: (product: SkincareProductRecord) => void;
  onEditDraftChange: (draft: SkincareDraft) => void;
  onSaveEdit: (productId: string) => void;
  onCancelEdit: () => void;
}) {
  return (
    <>
      <header className="topbar personal-topbar">
        <div><div className="eyebrow"><Droplets size={16} />个人管理</div><h1>个人护肤</h1></div>
      </header>
      <section className="personal-summary">
        <div><span>当前展示</span><strong>{products.length} 件</strong></div>
        <div className={`storage-status ${saveStatus.state}`} role="status">{saveStatus.message}</div>
      </section>
      <section className="personal-panel" aria-label="个人护肤">
        <form className="skincare-composer" onSubmit={onAdd}>
          <input value={draft.name} onChange={(event) => onDraftChange({ ...draft, name: event.target.value })} placeholder="产品名称，必填" required />
          <input value={draft.brand} onChange={(event) => onDraftChange({ ...draft, brand: event.target.value })} placeholder="品牌，可不填" />
          <select value={draft.category} onChange={(event) => onDraftChange({ ...draft, category: event.target.value as SkincareCategory })} aria-label="护肤品品类">
            {SKINCARE_CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <textarea value={draft.description} onChange={(event) => onDraftChange({ ...draft, description: event.target.value })} placeholder="用途说明，可不填" />
          <button className="primary-button" type="submit"><Plus size={18} />添加产品</button>
        </form>
        <div className="personal-toolbar">
          <div className="search-box"><Search size={16} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索名称、品牌或说明" /></div>
          <select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value as SkincareCategoryFilter)} aria-label="按品类筛选">
            <option value="all">全部品类</option>
            {SKINCARE_CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="personal-list">
          {products.length ? products.map((product) => (
            <article className="personal-item" key={product.id}>
              {editingProductId === product.id ? (
                <div className="skincare-edit">
                  <input value={editingDraft.name} onChange={(event) => onEditDraftChange({ ...editingDraft, name: event.target.value })} placeholder="产品名称，必填" required autoFocus />
                  <input value={editingDraft.brand} onChange={(event) => onEditDraftChange({ ...editingDraft, brand: event.target.value })} placeholder="品牌，可不填" />
                  <select value={editingDraft.category} onChange={(event) => onEditDraftChange({ ...editingDraft, category: event.target.value as SkincareCategory })}>
                    {SKINCARE_CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <textarea value={editingDraft.description} onChange={(event) => onEditDraftChange({ ...editingDraft, description: event.target.value })} placeholder="用途说明，可不填" />
                </div>
              ) : (
                <div className="personal-content">
                  <div className="personal-heading"><strong>{product.name}</strong><span>{skincareCategoryLabel(product.category)}</span></div>
                  {product.brand ? <small>品牌：{product.brand}</small> : null}
                  {product.description ? <p>{product.description}</p> : null}
                  <time>{product.updated_at === product.created_at ? `添加于 ${formatRecordStamp(product.created_at)}` : `更新于 ${formatRecordStamp(product.updated_at)}`}</time>
                </div>
              )}
              <div className="personal-actions">
                {editingProductId === product.id ? <><button type="button" onClick={() => onSaveEdit(product.id)}>保存</button><button type="button" onClick={onCancelEdit} title="取消编辑"><X size={16} /></button></> : <button type="button" onClick={() => onStartEdit(product)} title="编辑产品"><Pencil size={16} /></button>}
              </div>
            </article>
          )) : <div className="personal-empty">{totalCount ? "没有匹配的护肤品" : "还没有护肤品记录"}</div>}
        </div>
      </section>
    </>
  );
}

type RewardTierDraft = { name: string; amount: string };
type RewardRuleDraft = { name: string; mode: "fixed" | "tiered"; period: RewardRulePeriod; amount: string; tiers: RewardTierDraft[]; description: string };

function RewardRuleFields({
  draft,
  onChange,
  autoFocus = false,
  periodLocked = false,
  modeLocked = false,
}: {
  draft: RewardRuleDraft;
  onChange: (draft: RewardRuleDraft) => void;
  autoFocus?: boolean;
  periodLocked?: boolean;
  modeLocked?: boolean;
}) {
  function updateTier(index: number, patch: Partial<RewardTierDraft>) {
    onChange({ ...draft, tiers: draft.tiers.map((tier, tierIndex) => tierIndex === index ? { ...tier, ...patch } : tier) });
  }
  return (
    <>
      <div className="reward-mode">
        {modeLocked
          ? <span className="reward-period-badge">每周阶梯奖励</span>
          : <Segmented value={draft.mode} options={[["fixed", "固定奖励"], ["tiered", "阶梯奖励"]]} onChange={(mode) => onChange({ ...draft, mode: mode as RewardRuleDraft["mode"], period: mode === "fixed" ? "daily" : draft.period })} />}
      </div>
      <input value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} placeholder="规则名称，必填" required autoFocus={autoFocus} />
      {draft.mode === "fixed" ? (
        <input type="number" min="0.01" step="0.01" value={draft.amount} onChange={(event) => onChange({ ...draft, amount: event.target.value })} placeholder="奖励金额（元），必填" required />
      ) : (
        <div className="reward-tier-editor">
          <div className="reward-period-editor">
            <span>奖励周期</span>
            {periodLocked
              ? <span className="reward-period-badge">{draft.period === "weekly" ? "每周" : "每日"}</span>
              : <Segmented value={draft.period} options={[["daily", "每日"], ["weekly", "每周"]]} onChange={(period) => onChange({ ...draft, period: period as RewardRulePeriod })} />}
            <small>{periodLocked ? "奖励周期创建后不可修改。" : "保存后奖励周期不可修改。"}</small>
          </div>
          {draft.tiers.map((tier, index) => (
            <div className="reward-tier-row" key={index}>
              <input value={tier.name} onChange={(event) => updateTier(index, { name: event.target.value })} placeholder={`第 ${index + 1} 档名称，必填`} required />
              <input type="number" min="0.01" step="0.01" value={tier.amount} onChange={(event) => updateTier(index, { amount: event.target.value })} placeholder="奖励金额（元）" required />
              <button type="button" onClick={() => onChange({ ...draft, tiers: draft.tiers.filter((_, tierIndex) => tierIndex !== index) })} disabled={draft.tiers.length <= 2}>移除</button>
            </div>
          ))}
          <button type="button" className="reward-add-tier" onClick={() => onChange({ ...draft, tiers: [...draft.tiers, { name: "", amount: "" }] })}><Plus size={16} />增加档位</button>
          <small>档位按从低到高排列，后一档金额必须高于前一档。</small>
        </div>
      )}
      <textarea value={draft.description} onChange={(event) => onChange({ ...draft, description: event.target.value })} placeholder="达成说明，可不填" />
    </>
  );
}

export function RewardPanel({
  rules,
  claims,
  allClaims,
  claimMonths,
  currentClaims,
  todayDay,
  monthRewardCents,
  totalRewardCents,
  ruleDraft,
  ruleQuery,
  ruleStatusFilter,
  editingRuleId,
  editingDraft,
  claimQuery,
  claimMonthFilter,
  saveStatus,
  onRuleDraftChange,
  onAddRule,
  onRuleQueryChange,
  onRuleStatusFilterChange,
  onStartEditRule,
  onEditDraftChange,
  onSaveRule,
  onCancelEdit,
  onToggleRule,
  onReorderRule,
  onClaim,
  onClaimQueryChange,
  onClaimMonthFilterChange,
  onDeleteClaim,
}: {
  rules: RewardRuleRecord[];
  claims: RewardClaimRecord[];
  allClaims: RewardClaimRecord[];
  claimMonths: string[];
  currentClaims: Map<string, RewardClaimRecord>;
  todayDay: string;
  monthRewardCents: number;
  totalRewardCents: number;
  ruleDraft: RewardRuleDraft;
  ruleQuery: string;
  ruleStatusFilter: RewardRuleStatusFilter;
  editingRuleId: string | null;
  editingDraft: RewardRuleDraft;
  claimQuery: string;
  claimMonthFilter: string;
  saveStatus: SaveStatus;
  onRuleDraftChange: (draft: RewardRuleDraft) => void;
  onAddRule: (event: FormEvent) => void;
  onRuleQueryChange: (query: string) => void;
  onRuleStatusFilterChange: (filter: RewardRuleStatusFilter) => void;
  onStartEditRule: (rule: RewardRuleRecord) => void;
  onEditDraftChange: (draft: RewardRuleDraft) => void;
  onSaveRule: (ruleId: string) => void;
  onCancelEdit: () => void;
  onToggleRule: (ruleId: string) => void;
  onReorderRule: (sourceId: string, targetId: string) => void;
  onClaim: (ruleId: string, tierIndex?: number, rewardDate?: string) => boolean;
  onClaimQueryChange: (query: string) => void;
  onClaimMonthFilterChange: (month: string) => void;
  onDeleteClaim: (claimId: string) => void;
}) {
  const [tierSelections, setTierSelections] = useState<Record<string, number>>({});
  const [backfillRuleId, setBackfillRuleId] = useState<string | null>(null);
  const [showRewardBreakdown, setShowRewardBreakdown] = useState(false);
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);
  const [dragOverRuleId, setDragOverRuleId] = useState<string | null>(null);
  const [backfillDate, setBackfillDate] = useState(() => dateKey(addDays(fromDateKey(todayDay), -1)));
  const [backfillTierIndex, setBackfillTierIndex] = useState(0);
  const rewardBreakdown = useMemo(() => getRewardBreakdown(allClaims), [allClaims]);
  const backfillRule = rules.find((rule) => rule.id === backfillRuleId) ?? null;
  const backfillPeriod = backfillRule ? getEffectiveRewardPeriod(backfillRule) : "daily";
  const backfillExisting = backfillRule
    ? allClaims.find((claim) => claim.rule_id === backfillRule.id && claim.reward_date === backfillDate)
    : undefined;
  const backfillModeChanged = Boolean(backfillExisting) && Boolean(backfillRule)
    && (((backfillRule!.mode === "fixed") !== (backfillExisting?.tier_name === null)) || backfillExisting?.period !== backfillPeriod);
  const backfillTier = backfillRule?.mode === "tiered" ? backfillRule.tiers[backfillTierIndex] ?? null : null;
  const canBackfill = Boolean(backfillRule?.active)
    && (backfillPeriod === "weekly"
      ? isWeeklyRewardBackfillAllowed(backfillDate, todayDay)
      : isRewardBackfillDateAllowed(backfillDate, todayDay))
    && !backfillModeChanged
    && (backfillRule?.mode === "fixed"
      ? !backfillExisting
      : Boolean(backfillTier) && (!backfillExisting || backfillTier!.amount_cents > backfillExisting.amount_cents));
  const backfillAddedCents = backfillRule?.mode === "fixed"
    ? backfillRule.amount_cents ?? 0
    : Math.max(0, (backfillTier?.amount_cents ?? 0) - (backfillExisting?.amount_cents ?? 0));
  const backfillMin = dateKey(addDays(fromDateKey(todayDay), -7));
  const backfillMax = dateKey(addDays(fromDateKey(todayDay), -1));
  const dragEnabled = canReorderRewardRules(ruleQuery, ruleStatusFilter, editingRuleId);

  useEffect(() => {
    if (!backfillRuleId) return;
    const rule = rules.find((item) => item.id === backfillRuleId);
    if (!rule || rule.mode !== "tiered") return;
    const existing = allClaims.find((claim) => claim.rule_id === rule.id && claim.reward_date === backfillDate);
    const nextTierIndex = rule.tiers.findIndex((tier) => tier.amount_cents > (existing?.amount_cents ?? 0));
    setBackfillTierIndex(nextTierIndex >= 0 ? nextTierIndex : Math.max(0, rule.tiers.length - 1));
  }, [allClaims, backfillDate, backfillRuleId, rules]);

  return (
    <>
      <header className="topbar personal-topbar"><div><div className="eyebrow"><Gift size={16} />个人管理</div><h1>个人奖励</h1><p className="reward-start-note">个人奖励系统从2026-10-28开始计算</p></div></header>
      <section className="reward-summary">
        <div><span>本月奖励</span><strong>{formatRewardAmount(monthRewardCents)}</strong></div>
        <button type="button" className="reward-summary-button" onClick={() => setShowRewardBreakdown(true)} aria-label="查看历史累计金额构成">
          <span>历史累计</span><strong>{formatRewardAmount(totalRewardCents)}</strong>
        </button>
        <div className={`storage-status ${saveStatus.state}`} role="status">{saveStatus.message}</div>
      </section>
      <section className="personal-panel reward-rules" aria-label="奖励规则">
        <h2>奖励规则</h2>
        <form className="reward-composer" onSubmit={onAddRule}>
          <RewardRuleFields draft={ruleDraft} onChange={onRuleDraftChange} />
          <button className="primary-button" type="submit"><Plus size={18} />添加规则</button>
        </form>
        <div className="personal-toolbar reward-toolbar">
          <div className="search-box"><Search size={16} /><input value={ruleQuery} onChange={(event) => onRuleQueryChange(event.target.value)} placeholder="搜索规则名称或说明" /></div>
          <Segmented value={ruleStatusFilter} options={[["active", "启用"], ["all", "全部"], ["inactive", "已停用"]]} onChange={(value) => onRuleStatusFilterChange(value as RewardRuleStatusFilter)} />
        </div>
        <div className="reward-rule-list">
          {rules.length ? rules.map((rule) => {
            const currentClaim = currentClaims.get(rule.id);
            const rewardPeriod = getEffectiveRewardPeriod(rule);
            const isWeekly = rewardPeriod === "weekly";
            const modeChangedToday = Boolean(currentClaim) && (
              ((rule.mode === "fixed") !== (currentClaim?.tier_name === null))
              || currentClaim?.period !== rewardPeriod
            );
            const nextTierIndex = rule.mode === "tiered" ? rule.tiers.findIndex((tier) => tier.amount_cents > (currentClaim?.amount_cents ?? 0)) : -1;
            const selectedTierIndex = tierSelections[rule.id] ?? (nextTierIndex >= 0 ? nextTierIndex : Math.max(0, rule.tiers.length - 1));
            const selectedTier = rule.mode === "tiered" ? rule.tiers[selectedTierIndex] : null;
            const canReceive = rule.active && !modeChangedToday && (
              rule.mode === "fixed" ? !currentClaim : Boolean(selectedTier) && (!currentClaim || selectedTier!.amount_cents > currentClaim.amount_cents)
            );
            const claimLabel = modeChangedToday
              ? isWeekly ? "下周按新规则" : "明日按新规则"
              : !currentClaim
                ? isWeekly ? "领取本周奖励" : "获得奖励"
                : rule.mode === "tiered" && selectedTier && selectedTier.amount_cents > currentClaim.amount_cents
                  ? `升级奖励（补 ${formatRewardAmount(selectedTier.amount_cents - currentClaim.amount_cents)}）`
                  : isWeekly ? "本周已领取" : "今日已领取";
            const statusLabel = !rule.active
              ? "已停用"
              : modeChangedToday
                ? isWeekly ? "下周生效" : "明日生效"
                : currentClaim
                  ? isWeekly ? "本周已领取" : "今日已领取"
                  : "可领取";
            const statusTone = !rule.active ? "inactive" : modeChangedToday ? "pending" : currentClaim ? "claimed" : "ready";
            return (
              <article
                className={`reward-rule-item ${rule.active ? "" : "inactive"} ${editingRuleId === rule.id ? "editing" : ""} ${dragEnabled ? "can-drag" : ""} ${draggingRuleId === rule.id ? "dragging" : ""} ${dragOverRuleId === rule.id ? "drag-over" : ""}`}
                key={rule.id}
                onDragOver={(event) => {
                  if (!dragEnabled || !draggingRuleId || draggingRuleId === rule.id) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverRuleId(rule.id);
                }}
                onDrop={(event) => {
                  if (!dragEnabled || !draggingRuleId || draggingRuleId === rule.id) return;
                  event.preventDefault();
                  onReorderRule(draggingRuleId, rule.id);
                  setDraggingRuleId(null);
                  setDragOverRuleId(null);
                }}
              >
                {editingRuleId === rule.id ? (
                  <div className="reward-edit">
                    <RewardRuleFields
                      draft={editingDraft}
                      onChange={onEditDraftChange}
                      autoFocus
                      periodLocked={rule.period !== null}
                      modeLocked={rule.period === "weekly"}
                    />
                  </div>
                ) : (
                  <div className="personal-content">
                    <header className="reward-card-header">
                      <div className="reward-card-title-group">
                        {dragEnabled ? (
                          <button
                            type="button"
                            className="reward-drag-handle"
                            draggable
                            tabIndex={-1}
                            aria-label={`拖动排序：${rule.name}`}
                            title="拖动调整规则顺序"
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData("text/plain", rule.id);
                              setDraggingRuleId(rule.id);
                              setDragOverRuleId(null);
                            }}
                            onDragEnd={() => {
                              setDraggingRuleId(null);
                              setDragOverRuleId(null);
                            }}
                          >
                            <GripVertical size={18} />
                          </button>
                        ) : null}
                        <div className="reward-card-title">
                          <strong>{rule.name}</strong>
                          <div className="reward-card-tags">
                            <span>{rule.mode === "fixed" ? "固定奖励" : "阶梯奖励"}</span>
                            <span>{rule.period === null ? "周期待确认" : isWeekly ? "每周" : "每日"}</span>
                            {rule.mode === "fixed" ? <span className="amount">{formatRewardAmount(rule.amount_cents!)}</span> : null}
                          </div>
                        </div>
                      </div>
                      <span className={`reward-status-badge ${statusTone}`}>{statusLabel}</span>
                    </header>
                    <div className="reward-card-body">
                      {isWeekly ? <small className="reward-week-range">本周：{formatWeekRange(fromDateKey(todayDay))}</small> : null}
                      {rule.mode === "tiered" ? <div className="reward-tier-list">{rule.tiers.map((tier, index) => <span className={`${index === selectedTierIndex ? "selected" : ""} ${currentClaim && tier.amount_cents <= currentClaim.amount_cents ? "claimed" : ""}`.trim()} key={`${tier.name}-${index}`}><b>{index + 1}</b><span>{tier.name}</span><strong>{formatRewardAmount(tier.amount_cents)}</strong></span>)}</div> : null}
                      {rule.description ? <p className="reward-rule-description">{rule.description}</p> : null}
                      {currentClaim ? <small className="reward-current-summary">{isWeekly ? "本周" : "今日"}最终：{currentClaim.tier_name ? `${currentClaim.tier_name} · ` : ""}{formatRewardAmount(currentClaim.amount_cents)}</small> : null}
                    </div>
                  </div>
                )}
                <div className="reward-actions">
                  {editingRuleId === rule.id ? <><button type="button" onClick={() => onSaveRule(rule.id)}>保存</button><button type="button" onClick={onCancelEdit} title="取消编辑"><X size={16} /></button></> : <>
                    {rule.mode === "tiered" ? <select value={selectedTierIndex} onChange={(event) => setTierSelections((current) => ({ ...current, [rule.id]: Number(event.target.value) }))} aria-label={`${rule.name}达到的奖励档位`}>{rule.tiers.map((tier, index) => <option value={index} key={`${tier.name}-${index}`}>{tier.name} · {formatRewardAmount(tier.amount_cents)}</option>)}</select> : null}
                    <button className="primary-button reward-claim-button" type="button" onClick={() => { onClaim(rule.id, rule.mode === "tiered" ? selectedTierIndex : undefined); if (rule.mode === "tiered" && selectedTierIndex < rule.tiers.length - 1) setTierSelections((current) => ({ ...current, [rule.id]: selectedTierIndex + 1 })); }} disabled={!canReceive}><CircleDollarSign size={16} />{claimLabel}</button>
                    <button className="reward-backfill-button" type="button" onClick={() => { setBackfillDate(isWeekly ? getPreviousWeeklyRewardKey(todayDay) : backfillMax); setBackfillRuleId(rule.id); }} disabled={!rule.active}><History size={16} />补领</button>
                    <button className="reward-icon-action" type="button" onClick={() => onStartEditRule(rule)} title="编辑规则" aria-label={`编辑规则：${rule.name}`}><Pencil size={16} /></button><button className="reward-toggle-button" type="button" onClick={() => onToggleRule(rule.id)}>{rule.active ? "停用" : "重新启用"}</button>
                  </>}
                </div>
              </article>
            );
          }) : <div className="personal-empty">还没有匹配的奖励规则</div>}
        </div>
      </section>
      <section className="personal-panel reward-history" aria-label="领取记录">
        <h2>领取记录</h2>
        <div className="personal-toolbar">
          <div className="search-box"><Search size={16} /><input value={claimQuery} onChange={(event) => onClaimQueryChange(event.target.value)} placeholder="搜索规则名称或档位" /></div>
          <select value={claimMonthFilter} onChange={(event) => onClaimMonthFilterChange(event.target.value)} aria-label="按月份筛选领取记录"><option value="all">全部月份</option>{claimMonths.map((month) => <option key={month} value={month}>{month}</option>)}</select>
        </div>
        <div className="reward-claim-list">
          {claims.length ? claims.map((claim) => {
            const isBackfill = isRewardClaimBackfill(claim);
            const rewardPeriodLabel = claim.period === "weekly" ? `奖励周：${formatWeekRange(fromDateKey(claim.reward_date))}` : `奖励日期：${claim.reward_date}`;
            return <article className="reward-claim-item" key={claim.id}><div><strong>{claim.rule_name}{claim.tier_name ? ` · ${claim.tier_name}` : ""}</strong><time>{rewardPeriodLabel} · {isBackfill ? "补领于" : "领取于"} {formatArgumentDateTime(claim.claimed_at)}</time></div><span>{formatRewardAmount(claim.amount_cents)}</span><button type="button" onClick={() => onDeleteClaim(claim.id)} title="删除领取记录"><Trash2 size={16} /></button></article>;
          }) : <div className="personal-empty">还没有匹配的领取记录</div>}
        </div>
      </section>
      {showRewardBreakdown ? (
        <div className="dialog-backdrop" role="presentation" onClick={() => setShowRewardBreakdown(false)}>
          <section className="dialog reward-breakdown-dialog" role="dialog" aria-modal="true" aria-labelledby="reward-breakdown-title" onClick={(event) => event.stopPropagation()}>
            <header><strong id="reward-breakdown-title">历史累计金额构成</strong><button type="button" className="icon-button compact" onClick={() => setShowRewardBreakdown(false)} aria-label="关闭历史累计明细"><X size={18} /></button></header>
            <div className="reward-breakdown-summary">
              <div><span>历史累计</span><strong>{formatRewardAmount(totalRewardCents)}</strong></div>
              <div><span>完成次数</span><strong>{allClaims.length} 次</strong></div>
              <div><span>奖励规则</span><strong>{rewardBreakdown.length} 个</strong></div>
            </div>
            <div className="reward-breakdown-list">
              {rewardBreakdown.length ? rewardBreakdown.map((group) => (
                <article className="reward-breakdown-group" key={group.rule_id}>
                  <div className="reward-breakdown-group-heading">
                    <div><strong>{group.rule_name}</strong><span>完成 {group.completion_count} 次</span></div>
                    <strong>{formatRewardAmount(group.total_cents)}</strong>
                  </div>
                  <div className="reward-breakdown-details">
                    {group.claims.map((claim) => {
                      const isBackfill = isRewardClaimBackfill(claim);
                      const rewardPeriodLabel = claim.period === "weekly" ? formatWeekRange(fromDateKey(claim.reward_date)) : claim.reward_date;
                      return (
                        <div className="reward-breakdown-detail" key={claim.id}>
                          <div>
                            <strong>{rewardPeriodLabel}{claim.tier_name ? ` · ${claim.tier_name}` : ""}{isBackfill ? <span className="reward-backfill-badge">补领</span> : null}</strong>
                            <span>{isBackfill ? "实际补领于" : "领取于"} {formatArgumentDateTime(claim.claimed_at)}</span>
                          </div>
                          <strong>{formatRewardAmount(claim.amount_cents)}</strong>
                        </div>
                      );
                    })}
                  </div>
                </article>
              )) : <div className="personal-empty">还没有奖励领取记录</div>}
            </div>
            <footer><button type="button" onClick={() => setShowRewardBreakdown(false)}>关闭</button></footer>
          </section>
        </div>
      ) : null}
      {backfillRule ? (
        <div className="dialog-backdrop" role="presentation" onClick={() => setBackfillRuleId(null)}>
          <form className="dialog reward-backfill-dialog" onClick={(event) => event.stopPropagation()} onSubmit={(event) => {
            event.preventDefault();
            if (onClaim(backfillRule.id, backfillRule.mode === "tiered" ? backfillTierIndex : undefined, backfillDate)) setBackfillRuleId(null);
          }}>
            <header><strong>补领“{backfillRule.name}”</strong><button type="button" className="icon-button compact" onClick={() => setBackfillRuleId(null)}><X size={18} /></button></header>
            {backfillPeriod === "weekly"
              ? <div className="reward-backfill-period"><span>奖励归属周</span><strong>{formatWeekRange(fromDateKey(backfillDate))}</strong></div>
              : <label>奖励归属日期<input type="date" min={backfillMin} max={backfillMax} value={backfillDate} onChange={(event) => setBackfillDate(event.target.value)} /></label>}
            {backfillRule.mode === "tiered" ? <label>达到的档位<select value={backfillTierIndex} onChange={(event) => setBackfillTierIndex(Number(event.target.value))}>{backfillRule.tiers.map((tier, index) => <option value={index} key={`${tier.name}-${index}`}>{tier.name} · {formatRewardAmount(tier.amount_cents)}</option>)}</select></label> : null}
            <div className="reward-backfill-summary">
              {backfillModeChanged
                ? `${backfillPeriod === "weekly" ? "该周" : "该日期"}已按另一种奖励模式或周期领取，不能继续补领或升级。`
                : backfillExisting
                  ? backfillRule.mode === "fixed" ? "该日期已经领取过该奖励。" : `${backfillPeriod === "weekly" ? "该周" : "该日期"}当前为 ${backfillExisting.tier_name} · ${formatRewardAmount(backfillExisting.amount_cents)}`
                  : backfillPeriod === "weekly" ? `该周尚未领取，补领后归属 ${formatWeekRange(fromDateKey(backfillDate))}。` : `该日期尚未领取，补领后计入 ${backfillDate}。`}
            </div>
            <footer><button type="button" onClick={() => setBackfillRuleId(null)}>取消</button><button className="primary-button" type="submit" disabled={!canBackfill}>{canBackfill ? `确认补领 ${formatRewardAmount(backfillAddedCents)}` : "当前不可补领"}</button></footer>
          </form>
        </div>
      ) : null}
    </>
  );
}

function formatRewardAmount(cents: number): string {
  return `${(cents / 100).toFixed(2)} 元`;
}

type LearnedContentDraft = {
  type: LearnedContentType;
  title: string;
  completed_on: string;
  source: string;
  url: string;
  takeaway: string;
};

export function LearnedContentsPanel({
  records,
  totalCount,
  stats,
  months,
  draft,
  query,
  typeFilter,
  monthFilter,
  editingRecordId,
  editingDraft,
  saveStatus,
  onDraftChange,
  onAdd,
  onQueryChange,
  onTypeFilterChange,
  onMonthFilterChange,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  records: LearnedContentRecord[];
  totalCount: number;
  stats: LearnedContentStats;
  months: string[];
  draft: LearnedContentDraft;
  query: string;
  typeFilter: LearnedContentTypeFilter;
  monthFilter: LearnedContentMonthFilter;
  editingRecordId: string | null;
  editingDraft: LearnedContentDraft;
  saveStatus: SaveStatus;
  onDraftChange: (draft: LearnedContentDraft) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onTypeFilterChange: (filter: LearnedContentTypeFilter) => void;
  onMonthFilterChange: (filter: LearnedContentMonthFilter) => void;
  onStartEdit: (record: LearnedContentRecord) => void;
  onEditDraftChange: (draft: LearnedContentDraft) => void;
  onSaveEdit: (recordId: string) => void;
  onCancelEdit: () => void;
  onDelete: (recordId: string) => void;
}) {
  const maxTrendCount = Math.max(1, ...stats.trend.map((item) => item.count));
  const hasFilters = Boolean(query.trim()) || typeFilter !== "all" || monthFilter !== "all";
  return (
    <>
      <header className="topbar personal-topbar">
        <div><div className="eyebrow"><BookOpen size={16} />个人管理</div><h1>个人已学习</h1></div>
        <div className={`storage-status ${saveStatus.state}`} role="status">{saveStatus.message}</div>
      </header>

      <section className="learned-stats" aria-label="学习成果统计">
        <article><span>历史累计</span><strong>{stats.total}</strong><small>条学习成果</small></article>
        <article><span>本月完成</span><strong>{stats.currentMonth}</strong><small>条学习成果</small></article>
        <div className="learned-type-stats">
          {LEARNED_CONTENT_TYPE_OPTIONS.map(([type, label]) => <div key={type}><span>{label}</span><strong>{stats.typeCounts[type]}</strong></div>)}
        </div>
      </section>

      <section className="learned-trend" aria-label="最近12个月学习趋势">
        <div className="learned-section-heading"><strong>最近12个月</strong><span>按完成日期统计</span></div>
        <div className="learned-trend-chart">
          {stats.trend.map((item) => (
            <div className="learned-trend-column" key={item.month} title={`${item.month}：${item.count} 条`}>
              <span>{item.count}</span>
              <div><i style={{ height: `${item.count ? Math.max(10, item.count / maxTrendCount * 100) : 0}%` }} /></div>
              <small>{item.month.slice(5)}月</small>
            </div>
          ))}
        </div>
      </section>

      <section className="personal-panel learned-panel" aria-label="个人已学习">
        <form className="learned-composer" onSubmit={onAdd}>
          <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder="学习内容标题，必填" required />
          <select value={draft.type} onChange={(event) => onDraftChange({ ...draft, type: event.target.value as LearnedContentType })} aria-label="内容类型">
            {LEARNED_CONTENT_TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input type="date" value={draft.completed_on} onChange={(event) => onDraftChange({ ...draft, completed_on: event.target.value })} aria-label="完成日期" required />
          <input value={draft.source} onChange={(event) => onDraftChange({ ...draft, source: event.target.value })} placeholder="来源，可不填" />
          <input value={draft.url} onChange={(event) => onDraftChange({ ...draft, url: event.target.value })} placeholder="原文或课程链接，可不填" />
          <textarea value={draft.takeaway} onChange={(event) => onDraftChange({ ...draft, takeaway: event.target.value })} placeholder="学习收获，必填" required />
          <button className="primary-button" type="submit"><Plus size={18} />添加记录</button>
        </form>

        <div className="personal-toolbar learned-toolbar">
          <div className="search-box"><Search size={16} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索标题、来源或学习收获" /></div>
          <select value={typeFilter} onChange={(event) => onTypeFilterChange(event.target.value as LearnedContentTypeFilter)} aria-label="按内容类型筛选">
            <option value="all">全部类型</option>
            {LEARNED_CONTENT_TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={monthFilter} onChange={(event) => onMonthFilterChange(event.target.value)} aria-label="按完成月份筛选">
            <option value="all">全部月份</option>
            {months.map((month) => <option key={month} value={month}>{month.replace("-", " 年 ")} 月</option>)}
          </select>
          <span>当前展示 <strong>{records.length}</strong> 条</span>
        </div>

        <div className="personal-list learned-list">
          {records.length ? records.map((record) => (
            <article className="personal-item learned-item" key={record.id}>
              {editingRecordId === record.id ? (
                <div className="learned-edit">
                  <input value={editingDraft.title} onChange={(event) => onEditDraftChange({ ...editingDraft, title: event.target.value })} placeholder="学习内容标题，必填" required autoFocus />
                  <select value={editingDraft.type} onChange={(event) => onEditDraftChange({ ...editingDraft, type: event.target.value as LearnedContentType })}>
                    {LEARNED_CONTENT_TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <input type="date" value={editingDraft.completed_on} onChange={(event) => onEditDraftChange({ ...editingDraft, completed_on: event.target.value })} required />
                  <input value={editingDraft.source} onChange={(event) => onEditDraftChange({ ...editingDraft, source: event.target.value })} placeholder="来源，可不填" />
                  <input value={editingDraft.url} onChange={(event) => onEditDraftChange({ ...editingDraft, url: event.target.value })} placeholder="原文或课程链接，可不填" />
                  <textarea value={editingDraft.takeaway} onChange={(event) => onEditDraftChange({ ...editingDraft, takeaway: event.target.value })} placeholder="学习收获，必填" required />
                </div>
              ) : (
                <div className="personal-content learned-content">
                  <div className="personal-heading"><strong>{record.title}</strong><span>{learnedContentTypeLabel(record.type)}</span></div>
                  <div className="learned-meta"><time>完成于 {record.completed_on}</time>{record.source ? <span>来源：{record.source}</span> : null}</div>
                  <p>{record.takeaway}</p>
                  {record.url ? <a href={normalizeExternalHref(record.url)} target="_blank" rel="noreferrer"><ExternalLink size={15} />查看原文或课程</a> : null}
                </div>
              )}
              <div className="personal-actions learned-actions">
                {editingRecordId === record.id ? (
                  <><button type="button" onClick={() => onSaveEdit(record.id)}>保存</button><button type="button" onClick={onCancelEdit} title="取消编辑"><X size={16} /></button></>
                ) : (
                  <><button type="button" onClick={() => onStartEdit(record)} title="编辑记录"><Pencil size={16} /></button><button type="button" className="danger" onClick={() => onDelete(record.id)} title="删除记录"><Trash2 size={16} /></button></>
                )}
              </div>
            </article>
          )) : <div className="personal-empty">{totalCount && hasFilters ? "没有匹配的学习记录" : "还没有学习记录"}</div>}
        </div>
      </section>
    </>
  );
}

export function ArgumentReflectionPanel({
  records,
  draft,
  query,
  editingRecordId,
  editingDraft,
  saveStatus,
  onDraftChange,
  onAdd,
  onQueryChange,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onArchive,
}: {
  records: ArgumentReflectionRecord[];
  draft: ArgumentReflectionDraft;
  query: string;
  editingRecordId: string | null;
  editingDraft: ArgumentReflectionDraft;
  saveStatus: SaveStatus;
  onDraftChange: (draft: ArgumentReflectionDraft) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onStartEdit: (record: ArgumentReflectionRecord) => void;
  onEditDraftChange: (draft: ArgumentReflectionDraft) => void;
  onSaveEdit: (recordId: string) => void;
  onCancelEdit: () => void;
  onArchive: (recordId: string) => void;
}) {
  return (
    <>
      <header className="topbar argument-reflection-topbar">
        <div>
          <div className="eyebrow">
            <MessagesSquare size={16} />
            吵架整理
          </div>
          <h1>吵架复盘</h1>
        </div>
      </header>

      <section className="argument-reflection-summary">
        <div><span>当前展示</span><strong>{records.length} 条</strong></div>
        <div className={`storage-status ${saveStatus.state}`} role="status">{saveStatus.message}</div>
      </section>

      <section className="argument-reflection-panel" aria-label="吵架整理">
        <form className="argument-reflection-composer" onSubmit={onAdd}>
          <input value={draft.topic} onChange={(event) => onDraftChange({ ...draft, topic: event.target.value })} placeholder="争执主题，必填" />
          <input type="datetime-local" value={draft.occurred_at} onChange={(event) => onDraftChange({ ...draft, occurred_at: event.target.value })} aria-label="发生时间" />
          <textarea value={draft.content} onChange={(event) => onDraftChange({ ...draft, content: event.target.value })} placeholder="复盘内容，必填" />
          <button className="primary-button" type="submit"><Plus size={18} />添加复盘</button>
        </form>

        <div className="argument-reflection-toolbar">
          <div className="search-box"><Search size={16} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索主题或复盘内容" /></div>
        </div>

        <div className="argument-reflection-list">
          {records.length ? records.map((record) => (
            <article className="argument-reflection-item" key={record.id}>
              {editingRecordId === record.id ? (
                <div className="argument-reflection-edit">
                  <input value={editingDraft.topic} onChange={(event) => onEditDraftChange({ ...editingDraft, topic: event.target.value })} autoFocus />
                  <input type="datetime-local" value={editingDraft.occurred_at} onChange={(event) => onEditDraftChange({ ...editingDraft, occurred_at: event.target.value })} />
                  <textarea value={editingDraft.content} onChange={(event) => onEditDraftChange({ ...editingDraft, content: event.target.value })} placeholder="复盘内容，必填" />
                </div>
              ) : (
                <div className="argument-reflection-content">
                  <div className="argument-reflection-heading"><strong>{record.topic}</strong><time>{formatArgumentDateTime(record.occurred_at)}</time></div>
                  <p>{record.content}</p>
                </div>
              )}
              <div className="argument-reflection-actions">
                {editingRecordId === record.id ? <><button onClick={() => onSaveEdit(record.id)}>保存</button><button onClick={onCancelEdit} title="取消编辑"><X size={16} /></button></> : <><button onClick={() => onStartEdit(record)} title="编辑复盘"><Pencil size={16} /></button><button className="danger" onClick={() => onArchive(record.id)} title="归档复盘"><Archive size={16} /></button></>}
              </div>
            </article>
          )) : <div className="argument-reflection-empty">{query.trim() ? "没有匹配的复盘记录" : "还没有复盘记录"}</div>}
        </div>
      </section>
    </>
  );
}

type ArgumentReflectionDraft = {
  topic: string;
  occurred_at: string;
  content: string;
};

function formatArgumentDateTime(value: string): string {
  return value.replace("T", " ");
}

export function DivorcePlanPanel({
  records,
  draft,
  query,
  editingRecordId,
  editingDraft,
  saveStatus,
  onDraftChange,
  onAdd,
  onQueryChange,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onArchive,
}: {
  records: DivorcePlanRecord[];
  draft: DivorcePlanDraft;
  query: string;
  editingRecordId: string | null;
  editingDraft: DivorcePlanDraft;
  saveStatus: SaveStatus;
  onDraftChange: (draft: DivorcePlanDraft) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onStartEdit: (record: DivorcePlanRecord) => void;
  onEditDraftChange: (draft: DivorcePlanDraft) => void;
  onSaveEdit: (recordId: string) => void;
  onCancelEdit: () => void;
  onArchive: (recordId: string) => void;
}) {
  return (
    <>
      <header className="topbar argument-reflection-topbar">
        <div>
          <div className="eyebrow">
            <ClipboardList size={16} />
            Divorce Plan
          </div>
          <h1>Divorce Plan</h1>
        </div>
      </header>

      <section className="argument-reflection-summary">
        <div><span>当前展示</span><strong>{records.length} 条</strong></div>
        <div className={`storage-status ${saveStatus.state}`} role="status">{saveStatus.message}</div>
      </section>

      <section className="argument-reflection-panel" aria-label="Divorce Plan">
        <form className="argument-reflection-composer" onSubmit={onAdd}>
          <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder="事件标题，必填" />
          <input type="datetime-local" value={draft.occurred_at} onChange={(event) => onDraftChange({ ...draft, occurred_at: event.target.value })} aria-label="发生时间" />
          <textarea value={draft.content} onChange={(event) => onDraftChange({ ...draft, content: event.target.value })} placeholder="事件内容，必填" />
          <button className="primary-button" type="submit"><Plus size={18} />添加记录</button>
        </form>

        <div className="argument-reflection-toolbar">
          <div className="search-box"><Search size={16} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索标题或正文" /></div>
        </div>

        <div className="argument-reflection-list">
          {records.length ? records.map((record) => (
            <article className="argument-reflection-item" key={record.id}>
              {editingRecordId === record.id ? (
                <div className="argument-reflection-edit">
                  <input value={editingDraft.title} onChange={(event) => onEditDraftChange({ ...editingDraft, title: event.target.value })} autoFocus />
                  <input type="datetime-local" value={editingDraft.occurred_at} onChange={(event) => onEditDraftChange({ ...editingDraft, occurred_at: event.target.value })} />
                  <textarea value={editingDraft.content} onChange={(event) => onEditDraftChange({ ...editingDraft, content: event.target.value })} placeholder="事件内容，必填" />
                </div>
              ) : (
                <div className="argument-reflection-content">
                  <div className="argument-reflection-heading"><strong>{record.title}</strong><time>{formatArgumentDateTime(record.occurred_at)}</time></div>
                  <p>{record.content}</p>
                </div>
              )}
              <div className="argument-reflection-actions">
                {editingRecordId === record.id ? <><button onClick={() => onSaveEdit(record.id)}>保存</button><button onClick={onCancelEdit} title="取消编辑"><X size={16} /></button></> : <><button onClick={() => onStartEdit(record)} title="编辑记录"><Pencil size={16} /></button><button className="danger" onClick={() => onArchive(record.id)} title="归档记录"><Archive size={16} /></button></>}
              </div>
            </article>
          )) : <div className="argument-reflection-empty">{query.trim() ? "没有匹配的时间线记录" : "还没有时间线记录"}</div>}
        </div>
      </section>
    </>
  );
}

type DivorcePlanDraft = {
  title: string;
  occurred_at: string;
  content: string;
};

export function InspirationPanel({
  records,
  draft,
  query,
  editingRecordId,
  editingDraft,
  saveStatus,
  onDraftChange,
  onAdd,
  onQueryChange,
  onTogglePinned,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onArchive,
}: {
  records: InspirationRecord[];
  draft: { title: string; body: string };
  query: string;
  editingRecordId: string | null;
  editingDraft: { title: string; body: string };
  saveStatus: SaveStatus;
  onDraftChange: (draft: { title: string; body: string }) => void;
  onAdd: (event: FormEvent) => void;
  onQueryChange: (query: string) => void;
  onTogglePinned: (recordId: string) => void;
  onStartEdit: (record: InspirationRecord) => void;
  onEditDraftChange: (draft: { title: string; body: string }) => void;
  onSaveEdit: (recordId: string) => void;
  onCancelEdit: () => void;
  onArchive: (recordId: string) => void;
}) {
  return (
    <>
      <header className="topbar inspiration-topbar">
        <div>
          <div className="eyebrow">
            <Lightbulb size={16} />
            灵感记录
          </div>
          <h1>所有灵感</h1>
        </div>
      </header>

      <section className="inspiration-summary">
        <div>
          <span>当前展示</span>
          <strong>{records.length} 条</strong>
        </div>
        <div className={`storage-status ${saveStatus.state}`} role="status">
          {saveStatus.message}
        </div>
      </section>

      <section className="inspiration-panel" aria-label="灵感记录">
        <form className="inspiration-composer" onSubmit={onAdd}>
          <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder="灵感标题" />
          <textarea value={draft.body} onChange={(event) => onDraftChange({ ...draft, body: event.target.value })} placeholder="正文，可不填" />
          <button className="primary-button" type="submit">
            <Plus size={18} />
            添加
          </button>
        </form>

        <div className="inspiration-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索标题或正文" />
          </div>
        </div>

        <div className="inspiration-list">
          {records.length ? (
            records.map((record) => (
              <article className={`inspiration-item ${record.pinned ? "pinned" : ""}`} key={record.id}>
                {editingRecordId === record.id ? (
                  <div className="inspiration-edit">
                    <input
                      value={editingDraft.title}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, title: event.target.value })}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) onSaveEdit(record.id);
                        if (event.key === "Escape") onCancelEdit();
                      }}
                      autoFocus
                    />
                    <textarea
                      value={editingDraft.body}
                      onChange={(event) => onEditDraftChange({ ...editingDraft, body: event.target.value })}
                      placeholder="正文，可不填"
                    />
                  </div>
                ) : (
                  <div className="inspiration-content">
                    <div className="inspiration-title-line">
                      {record.pinned && <Pin size={15} />}
                      <strong title={record.title}>{record.title}</strong>
                    </div>
                    {record.body && <p>{record.body}</p>}
                    <small>{formatRecordStamp(record.created_at)}</small>
                  </div>
                )}
                <div className="inspiration-actions">
                  {editingRecordId === record.id ? (
                    <>
                      <button onClick={() => onSaveEdit(record.id)}>保存</button>
                      <button onClick={onCancelEdit} title="取消编辑">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onTogglePinned(record.id)} title={record.pinned ? "取消置顶" : "置顶灵感"}>
                        {record.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                      </button>
                      <button onClick={() => onStartEdit(record)} title="编辑灵感">
                        <Pencil size={16} />
                      </button>
                      <button className="danger" onClick={() => onArchive(record.id)} title="归档灵感">
                        <Archive size={16} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="inspiration-empty">{query.trim() ? "没有匹配的灵感" : "还没有灵感记录"}</div>
          )}
        </div>
      </section>
    </>
  );
}

function formatRecordStamp(stamp: string): string {
  const parsed = new Date(stamp);
  if (Number.isNaN(parsed.getTime())) return stamp;
  const date = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  const time = `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
  return `${date} ${time}`;
}

function normalizeExternalHref(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export type HabitDraft = {
  name: string;
  note: string;
};

export function HabitPanel({
  currentDate,
  selectedDay,
  todayDay,
  canEditSelectedDate,
  habits,
  draft,
  editingHabitId,
  editingDraft,
  saveStatus,
  onSetDate,
  onDraftChange,
  onAdd,
  onToggle,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onArchive,
}: {
  currentDate: Date;
  selectedDay: string;
  todayDay: string;
  canEditSelectedDate: boolean;
  habits: HabitView[];
  draft: HabitDraft;
  editingHabitId: string | null;
  editingDraft: HabitDraft;
  saveStatus: SaveStatus;
  onSetDate: (date: Date) => void;
  onDraftChange: (draft: HabitDraft) => void;
  onAdd: (event: FormEvent) => void;
  onToggle: (habitId: string) => void;
  onStartEdit: (habit: Habit) => void;
  onEditDraftChange: (draft: HabitDraft) => void;
  onSaveEdit: (habitId: string) => void;
  onCancelEdit: () => void;
  onArchive: (habitId: string) => void;
}) {
  const doneCount = habits.filter((habit) => habit.checked).length;
  const dateState = canEditSelectedDate ? (selectedDay === todayDay ? "今天" : "可补卡") : "未来只读";
  const addButtonText = selectedDay === todayDay ? "添加" : "添加/补卡";
  const totalLabel = selectedDay === todayDay ? "截至今日累计完成" : "截至所选日期累计完成";

  return (
    <>
      <header className="topbar habit-topbar">
        <div>
          <div className="eyebrow">
            <Flame size={16} />
            习惯打卡
          </div>
          <h1>{formatDisplayDate(currentDate)}</h1>
          <span className="date-subtitle">{dayLabel(currentDate)} · {dateState}</span>
        </div>
        <div className="date-actions">
          <button className="text-button" onClick={() => onSetDate(addDays(currentDate, -1))}>
            前一天
          </button>
          <button className="text-button" onClick={() => onSetDate(new Date())}>
            今天
          </button>
          <button className="text-button" onClick={() => onSetDate(addDays(currentDate, 1))}>
            后一天
          </button>
          <input
            className="date-picker"
            type="date"
            value={selectedDay}
            onChange={(event) => {
              if (event.target.value) onSetDate(fromDateKey(event.target.value));
            }}
          />
        </div>
      </header>

      <section className="habit-summary">
        <div>
          <span>完成进度</span>
          <strong>
            {doneCount}/{habits.length}
          </strong>
        </div>
        <div className={`storage-status ${saveStatus.state}`} role="status">
          {saveStatus.message}
        </div>
      </section>

      <section className="habit-panel" aria-label="习惯打卡">
        <form className="habit-composer" onSubmit={onAdd}>
          <input
            value={draft.name}
            onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
            placeholder="习惯名称，例如：7:30 起床"
            disabled={!canEditSelectedDate}
          />
          <input
            value={draft.note}
            onChange={(event) => onDraftChange({ ...draft, note: event.target.value })}
            placeholder="备注，可不填"
            disabled={!canEditSelectedDate}
          />
          <button className="primary-button" type="submit" disabled={!canEditSelectedDate}>
            <Plus size={18} />
            {addButtonText}
          </button>
        </form>

        <div className="habit-list">
          {habits.length ? (
            habits.map((habit) => (
              <article className={`habit-item ${habit.checked ? "done" : ""}`} key={habit.id}>
                <button className="check-button" onClick={() => onToggle(habit.id)} title="切换打卡状态" disabled={!canEditSelectedDate}>
                  {habit.checked && <Check size={16} />}
                </button>
                <div className="habit-content">
                  {editingHabitId === habit.id ? (
                    <>
                      <input
                        value={editingDraft.name}
                        onChange={(event) => onEditDraftChange({ ...editingDraft, name: event.target.value })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) onSaveEdit(habit.id);
                          if (event.key === "Escape") onCancelEdit();
                        }}
                        autoFocus
                      />
                      <input
                        value={editingDraft.note}
                        onChange={(event) => onEditDraftChange({ ...editingDraft, note: event.target.value })}
                        placeholder="备注，可不填"
                      />
                    </>
                  ) : (
                    <>
                      <strong title={habit.name}>{habit.name}</strong>
                      {habit.note && <p>{habit.note}</p>}
                      <span>{formatHabitTotalText(habit, totalLabel)}</span>
                    </>
                  )}
                </div>
                <div className="habit-actions">
                  {editingHabitId === habit.id ? (
                    <>
                      <button onClick={() => onSaveEdit(habit.id)} disabled={!canEditSelectedDate}>
                        保存
                      </button>
                      <button onClick={onCancelEdit} title="取消编辑">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onStartEdit(habit)} title="编辑习惯" disabled={!canEditSelectedDate}>
                        <Pencil size={16} />
                      </button>
                      <button className="danger" onClick={() => onArchive(habit.id)} title="归档习惯" disabled={!canEditSelectedDate}>
                        <Archive size={16} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="habit-empty">还没有每日习惯</div>
          )}
        </div>
      </section>
    </>
  );
}

function formatHabitTotalText(habit: HabitView, totalLabel: string): string {
  return `${totalLabel} ${habit.totalCompletions} 天`;
}

export function DashboardPanel({
  today,
  saveStatus,
  doneCount,
  totalCount,
  progress,
  inProgressCount,
  totalDeliveryCount,
  pendingDeliveryCount,
  openMonthlyCount,
  habitDoneCount,
  habitTotalCount,
  tasks,
  tags,
  onToggleTask,
  onStartTask,
  onOpenDaily,
  onOpenHabits,
}: {
  today: Date;
  saveStatus: SaveStatus;
  doneCount: number;
  totalCount: number;
  progress: number;
  inProgressCount: number;
  totalDeliveryCount: number;
  pendingDeliveryCount: number;
  openMonthlyCount: number;
  habitDoneCount: number;
  habitTotalCount: number;
  tasks: TodoTask[];
  tags: TodoTag[];
  onToggleTask: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onOpenDaily: () => void;
  onOpenHabits: () => void;
}) {
  return (
    <>
      <header className="topbar dashboard-topbar">
        <div>
          <div className="eyebrow">
            <LayoutDashboard size={16} />
            日常总控台
          </div>
          <h1>{formatDisplayDate(today)}</h1>
        </div>
        <button className="text-button" onClick={onOpenDaily}>
          <CalendarDays size={16} />
          去每日待办
        </button>
      </header>

      <section className="dashboard-overview" aria-label="今日概览">
        <DashboardStat label="今日任务" value={`${doneCount}/${totalCount}`} detail={`${progress}% 已完成`} />
        <DashboardStat label="进行中" value={String(inProgressCount)} detail="正在推进" />
        <DashboardStat label="快递记录" value={String(totalDeliveryCount)} detail={`${pendingDeliveryCount} 条未取`} />
        <DashboardStat label="月待办" value={String(openMonthlyCount)} detail="当月未完成" />
      </section>

      <div className={`storage-status ${saveStatus.state}`} role="status">
        {saveStatus.message}
      </div>

      <section className="dashboard-grid">
        <section className="dashboard-panel habit-summary-panel" aria-label="习惯打卡概览">
          <div className="dashboard-section-header">
            <div>
              <div className="eyebrow">
                <Flame size={16} />
                习惯打卡
              </div>
              <strong>
                {habitDoneCount}/{habitTotalCount} 今日完成
              </strong>
            </div>
            <button className="text-button" onClick={onOpenHabits}>
              进入
            </button>
          </div>
          <div className="habit-summary-metric">
            <strong>{habitTotalCount ? Math.round((habitDoneCount / habitTotalCount) * 100) : 0}%</strong>
            <span>今日进度</span>
          </div>
        </section>

        <section className="dashboard-panel focus-panel" aria-label="今日重点任务">
          <div className="dashboard-section-header">
            <div>
              <div className="eyebrow">
                <Check size={16} />
                今日重点
              </div>
              <strong>{tasks.length ? `${tasks.length} 件待推进` : "今天没有未完成任务"}</strong>
            </div>
            <button className="text-button" onClick={onOpenDaily}>
              完整管理
            </button>
          </div>

          <div className="dashboard-task-list">
            {tasks.length ? (
              tasks.map((task) => {
                const tag = tags.find((item) => item.id === task.tag) ?? tags[0] ?? TAGS[0];
                return (
                  <article className="dashboard-task-item" key={task.id}>
                    <button className="check-button" onClick={() => onToggleTask(task.id)} title="切换完成状态">
                      {task.status === STATUS_DONE && <Check size={16} />}
                    </button>
                    <div className="dashboard-task-content">
                      <strong title={task.text}>{task.text}</strong>
                      <div className="task-meta">
                        <span className={`tag-chip ${tag.tone}`}>{tag.name}</span>
                        {task.status === STATUS_IN_PROGRESS && <span className="status-chip">进行中</span>}
                      </div>
                    </div>
                    <button className="icon-button compact" onClick={() => onStartTask(task.id)} title="标记为进行中">
                      <Play size={15} />
                    </button>
                  </article>
                );
              })
            ) : (
              <div className="dashboard-empty">今天的重点任务都清掉了</div>
            )}
          </div>
        </section>
      </section>
    </>
  );
}

function DashboardStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="dashboard-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function DailyCategoryPanel({
  filters,
  tags,
  tagCounts,
  onTagChange,
}: {
  filters: Filters;
  tags: TodoTag[];
  tagCounts: Map<TagFilter, number>;
  onTagChange: (tag: TagFilter) => void;
}) {
  return (
    <aside className="daily-category-panel" aria-label="每日任务分类">
      <div className="daily-category-header">
        <span>任务分类</span>
        <strong>{tagCounts.get(-1) ?? 0}</strong>
      </div>
      <nav className="daily-category-list" aria-label="每日任务标签筛选">
        <TagButton active={filters.tag === -1} name="全部" count={tagCounts.get(-1) ?? 0} onClick={() => onTagChange(-1)} />
        {tags.map((tag) => (
          <TagButton
            key={tag.id}
            active={filters.tag === tag.id}
            name={tag.name}
            count={tagCounts.get(tag.id) ?? 0}
            tone={tag.tone}
            onClick={() => onTagChange(tag.id)}
          />
        ))}
      </nav>
    </aside>
  );
}

export function WorkspaceHeader({
  currentDate,
  theme,
  onSetDate,
  onToggleTheme,
  onShowHistory,
}: {
  currentDate: Date;
  theme: "light" | "dark";
  onSetDate: (date: Date) => void;
  onToggleTheme: () => void;
  onShowHistory: () => void;
}) {
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">
          <CalendarDays size={16} />
          {dayLabel(currentDate)}
        </div>
        <h1>{formatDisplayDate(currentDate)}</h1>
      </div>
      <div className="date-actions">
        <button className="icon-button" onClick={() => onSetDate(addDays(currentDate, -1))} title="前一天">
          <ChevronLeft size={18} />
        </button>
        <button className="text-button" onClick={() => onSetDate(new Date())}>
          今天
        </button>
        <button className="text-button" onClick={onShowHistory}>
          <History size={16} />
          历史查询
        </button>
        <button className="icon-button" onClick={() => onSetDate(addDays(currentDate, 1))} title="后一天">
          <ChevronRight size={18} />
        </button>
        <button className="icon-button" onClick={onToggleTheme} title="切换主题">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}

export function SummaryBand({
  doneCount,
  total,
  progress,
  saveStatus,
}: {
  doneCount: number;
  total: number;
  progress: number;
  saveStatus: SaveStatus;
}) {
  return (
    <>
      <section className="summary-band">
        <div className="progress-copy">
          <span>完成进度</span>
          <strong>
            {doneCount}/{total}
          </strong>
        </div>
        <div className="progress-track">
          <div style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-percent">{progress}%</span>
      </section>

      <div className={`storage-status ${saveStatus.state}`} role="status">
        {saveStatus.message}
      </div>
    </>
  );
}

export function WeeklyPanel({
  weekRange,
  tasks,
  draft,
  editingTaskId,
  editingText,
  onDraftChange,
  onAdd,
  onToggle,
  onStartEdit,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  weekRange: string;
  tasks: WeeklyTask[];
  draft: string;
  editingTaskId: string | null;
  editingText: string;
  onDraftChange: (text: string) => void;
  onAdd: (event: FormEvent) => void;
  onToggle: (taskId: string) => void;
  onStartEdit: (task: WeeklyTask) => void;
  onEditTextChange: (text: string) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onDelete: (taskId: string) => void;
}) {
  const doneCount = tasks.filter((task) => task.done).length;
  return (
    <section className="weekly-panel" aria-label="本周待办事项">
      <div className="weekly-header">
        <div>
          <div className="eyebrow">
            <CalendarDays size={16} />
            本周待办
          </div>
          <strong>{weekRange}</strong>
        </div>
        <span>
          {doneCount}/{tasks.length} 已完成
        </span>
      </div>

      <form className="weekly-composer" onSubmit={onAdd}>
        <input value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="添加本周要推进的事" />
        <button className="primary-button" type="submit">
          <Plus size={18} />
          添加
        </button>
      </form>

      <div className="weekly-list">
        {tasks.length ? (
          tasks.map((task) => (
            <article className={`weekly-item ${task.done ? "done" : ""}`} key={task.id}>
              <button className="check-button" onClick={() => onToggle(task.id)} title="切换完成状态">
                {task.done && <Check size={16} />}
              </button>
              {editingTaskId === task.id ? (
                <input
                  className="weekly-edit-input"
                  value={editingText}
                  onChange={(event) => onEditTextChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onSaveEdit(task.id);
                    if (event.key === "Escape") onCancelEdit();
                  }}
                  autoFocus
                />
              ) : (
                <strong title={task.text}>{task.text}</strong>
              )}
              <div className="weekly-actions">
                {editingTaskId === task.id ? (
                  <>
                    <button onClick={() => onSaveEdit(task.id)}>保存</button>
                    <button onClick={onCancelEdit} title="取消编辑">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => onStartEdit(task)} title="编辑本周待办">
                      <Pencil size={16} />
                    </button>
                    <button className="danger" onClick={() => onDelete(task.id)} title="删除本周待办">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="weekly-empty">本周还没有待办事项</div>
        )}
      </div>
    </section>
  );
}

export function AwesomePanel({
  records,
  draft,
  editingRecordId,
  editingText,
  onDraftChange,
  onAdd,
  onStartEdit,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  records: AwesomeRecord[];
  draft: string;
  editingRecordId: string | null;
  editingText: string;
  onDraftChange: (text: string) => void;
  onAdd: (event: FormEvent) => void;
  onStartEdit: (record: AwesomeRecord) => void;
  onEditTextChange: (text: string) => void;
  onSaveEdit: (recordId: string) => void;
  onCancelEdit: () => void;
  onDelete: (recordId: string) => void;
}) {
  return (
    <section className="awesome-panel" aria-label="真棒每日记录">
      <div className="awesome-header">
        <div>
          <div className="eyebrow">
            <Sparkles size={16} />
            真棒
          </div>
          <strong>记录今天值得纪念的事</strong>
        </div>
        <span>{records.length} 条记录</span>
      </div>

      <form className="awesome-composer" onSubmit={onAdd}>
        <input value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="写下一件今天做得很棒的事" />
        <button className="primary-button" type="submit">
          <Plus size={18} />
          添加
        </button>
      </form>

      <div className="awesome-list">
        {records.length ? (
          records.map((record) => (
            <article className="awesome-item" key={record.id}>
              <Sparkles size={16} />
              {editingRecordId === record.id ? (
                <input
                  className="awesome-edit-input"
                  value={editingText}
                  onChange={(event) => onEditTextChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onSaveEdit(record.id);
                    if (event.key === "Escape") onCancelEdit();
                  }}
                  autoFocus
                />
              ) : (
                <strong title={record.text}>{record.text}</strong>
              )}
              <div className="awesome-actions">
                {editingRecordId === record.id ? (
                  <>
                    <button onClick={() => onSaveEdit(record.id)}>保存</button>
                    <button onClick={onCancelEdit} title="取消编辑">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => onStartEdit(record)} title="编辑真棒记录">
                      <Pencil size={16} />
                    </button>
                    <button className="danger" onClick={() => onDelete(record.id)} title="删除真棒记录">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="awesome-empty">今天还没有真棒记录</div>
        )}
      </div>
    </section>
  );
}

export function MonthlyPanel({
  currentDate,
  monthValue,
  tasks,
  draft,
  editingTaskId,
  editingDraft,
  saveStatus,
  onSetMonth,
  onShowHistory,
  onDraftChange,
  onAdd,
  onToggle,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  currentDate: Date;
  monthValue: string;
  tasks: MonthlyTask[];
  draft: { text: string; description: string };
  editingTaskId: string | null;
  editingDraft: { text: string; description: string };
  saveStatus: SaveStatus;
  onSetMonth: (date: Date) => void;
  onShowHistory: () => void;
  onDraftChange: (draft: { text: string; description: string }) => void;
  onAdd: (event: FormEvent) => void;
  onToggle: (taskId: string) => void;
  onStartEdit: (task: MonthlyTask) => void;
  onEditDraftChange: (draft: { text: string; description: string }) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onDelete: (taskId: string) => void;
}) {
  const doneCount = tasks.filter((task) => task.done).length;
  return (
    <>
      <header className="topbar monthly-topbar">
        <div>
          <div className="eyebrow">
            <CalendarDays size={16} />
            每月待办
          </div>
          <h1>{formatMonthTitle(currentDate)}</h1>
        </div>
        <div className="date-actions">
          <button className="text-button" onClick={() => onSetMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
            上一月
          </button>
          <button className="text-button" onClick={() => onSetMonth(new Date())}>
            本月
          </button>
          <button className="text-button" onClick={onShowHistory}>
            <History size={16} />
            历史查询
          </button>
          <button className="text-button" onClick={() => onSetMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
            下一月
          </button>
          <input className="month-picker" type="month" value={monthValue} onChange={(event) => onSetMonth(fromMonthKey(event.target.value))} />
        </div>
      </header>

      <section className="monthly-summary">
        <div>
          <span>完成进度</span>
          <strong>
            {doneCount}/{tasks.length}
          </strong>
        </div>
        <div className={`storage-status ${saveStatus.state}`} role="status">
          {saveStatus.message}
        </div>
      </section>

      <section className="monthly-panel" aria-label="每月待办事项">
        <form className="monthly-composer" onSubmit={onAdd}>
          <input value={draft.text} onChange={(event) => onDraftChange({ ...draft, text: event.target.value })} placeholder="添加这个月要完成的事" />
          <textarea value={draft.description} onChange={(event) => onDraftChange({ ...draft, description: event.target.value })} placeholder="补充说明，可不填" />
          <button className="primary-button" type="submit">
            <Plus size={18} />
            添加
          </button>
        </form>

        <div className="monthly-list">
          {tasks.length ? (
            tasks.map((task) => (
              <article className={`monthly-item ${task.done ? "done" : ""}`} key={task.id}>
                <div className="monthly-item-main">
                  <button className="check-button" onClick={() => onToggle(task.id)} title="切换完成状态">
                    {task.done && <Check size={16} />}
                  </button>
                  <div>
                    {editingTaskId === task.id ? (
                      <>
                        <input
                          value={editingDraft.text}
                          onChange={(event) => onEditDraftChange({ ...editingDraft, text: event.target.value })}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) onSaveEdit(task.id);
                            if (event.key === "Escape") onCancelEdit();
                          }}
                          autoFocus
                        />
                        <textarea
                          value={editingDraft.description}
                          onChange={(event) => onEditDraftChange({ ...editingDraft, description: event.target.value })}
                          placeholder="补充说明，可不填"
                        />
                      </>
                    ) : (
                      <>
                        <strong title={task.text}>{task.text}</strong>
                        {task.description && <p>{task.description}</p>}
                      </>
                    )}
                  </div>
                </div>
                <div className="monthly-actions">
                  {editingTaskId === task.id ? (
                    <>
                      <button onClick={() => onSaveEdit(task.id)}>保存</button>
                      <button onClick={onCancelEdit} title="取消编辑">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onStartEdit(task)} title="编辑每月待办">
                        <Pencil size={16} />
                      </button>
                      <button className="danger" onClick={() => onDelete(task.id)} title="删除每月待办">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="monthly-empty">这个月还没有待办事项</div>
          )}
        </div>
      </section>
    </>
  );
}

export function DeliveryPanel({
  tasks,
  visibleTasks,
  filter,
  query,
  draft,
  editingTaskId,
  editingDraft,
  platforms,
  saveStatus,
  onFilterChange,
  onQueryChange,
  onDraftChange,
  onAdd,
  onStatusChange,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  tasks: DeliveryRecord[];
  visibleTasks: DeliveryRecord[];
  filter: "all" | DeliveryStatus;
  query: string;
  draft: { sequence: string; name: string; platform: string; note: string; purchased_at: string };
  editingTaskId: string | null;
  editingDraft: { sequence: string; name: string; platform: string; note: string; purchased_at: string };
  platforms: string[];
  saveStatus: SaveStatus;
  onFilterChange: (filter: "all" | DeliveryStatus) => void;
  onQueryChange: (query: string) => void;
  onDraftChange: (draft: { sequence: string; name: string; platform: string; note: string; purchased_at: string }) => void;
  onAdd: (event: FormEvent) => void;
  onStatusChange: (taskId: string, status: DeliveryStatus) => void;
  onStartEdit: (task: DeliveryRecord) => void;
  onEditDraftChange: (draft: { sequence: string; name: string; platform: string; note: string; purchased_at: string }) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onDelete: (taskId: string) => void;
}) {
  const pendingCount = tasks.filter((task) => task.status === "pending").length;
  const pickedCount = tasks.filter((task) => task.status === "picked").length;
  return (
    <>
      <header className="topbar delivery-topbar">
        <div>
          <div className="eyebrow">
            <Truck size={16} />
            日常计划
          </div>
          <h1>快递管理</h1>
        </div>
      </header>

      <section className="delivery-summary">
        <div>
          <span>全部快递</span>
          <strong>{tasks.length} 条</strong>
          <small>{pendingCount} 条未取 · {pickedCount} 条已取</small>
        </div>
        <div className={`storage-status ${saveStatus.state}`} role="status">
          {saveStatus.message}
        </div>
      </section>

      <section className="delivery-panel" aria-label="快递管理">
        <form className="delivery-composer" onSubmit={onAdd}>
          <input
            type="number"
            min="1"
            step="1"
            required
            value={draft.sequence}
            onChange={(event) => onDraftChange({ ...draft, sequence: event.target.value })}
            placeholder="序号，必填"
            aria-label="快递序号"
          />
          <input value={draft.name} onChange={(event) => onDraftChange({ ...draft, name: event.target.value })} placeholder="快递名称，例如：书籍" />
          <PlatformSelect value={draft.platform} platforms={platforms} onChange={(platform) => onDraftChange({ ...draft, platform })} />
          <input type="date" value={draft.purchased_at} onChange={(event) => onDraftChange({ ...draft, purchased_at: event.target.value })} aria-label="购买时间" />
          <input value={draft.note} onChange={(event) => onDraftChange({ ...draft, note: event.target.value })} placeholder="备注，可不填" />
          <button className="primary-button" type="submit">
            <Plus size={18} />
            添加
          </button>
        </form>

        <div className="delivery-toolbar">
          <div className="search-box delivery-search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索快递名称" aria-label="搜索快递名称" />
          </div>
          <Segmented
            value={filter}
            options={[
              ["all", "全部"],
              ["pending", "未取"],
              ["picked", "已取"],
              ["returned", "退货"],
            ]}
            onChange={(value) => onFilterChange(value as "all" | DeliveryStatus)}
          />
        </div>

        <div className="delivery-list">
          {visibleTasks.length ? (
            visibleTasks.map((task) => (
              <article className={`delivery-item ${task.status}`} key={task.id}>
                <div className="delivery-item-main">
                  <select
                    className={`delivery-status-select ${task.status}`}
                    value={task.status}
                    onChange={(event) => onStatusChange(task.id, event.target.value as DeliveryStatus)}
                    aria-label={`快递“${task.name}”状态`}
                  >
                    <option value="pending">未取</option>
                    <option value="picked">已取</option>
                    <option value="returned">退货</option>
                  </select>
                  <div>
                    {editingTaskId === task.id ? (
                      <>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editingDraft.sequence}
                          onChange={(event) => onEditDraftChange({ ...editingDraft, sequence: event.target.value })}
                          placeholder="序号，可暂不填"
                          aria-label="编辑快递序号"
                        />
                        <input
                          value={editingDraft.name}
                          onChange={(event) => onEditDraftChange({ ...editingDraft, name: event.target.value })}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") onSaveEdit(task.id);
                            if (event.key === "Escape") onCancelEdit();
                          }}
                          autoFocus
                        />
                        <PlatformSelect value={editingDraft.platform} platforms={platforms} onChange={(platform) => onEditDraftChange({ ...editingDraft, platform })} />
                        <input
                          value={editingDraft.note}
                          onChange={(event) => onEditDraftChange({ ...editingDraft, note: event.target.value })}
                          placeholder="备注，可不填"
                        />
                        <input
                          type="date"
                          value={editingDraft.purchased_at}
                          onChange={(event) => onEditDraftChange({ ...editingDraft, purchased_at: event.target.value })}
                          aria-label="购买时间"
                        />
                      </>
                    ) : (
                      <>
                        <div className="delivery-title-row">
                          <span className={`delivery-sequence-chip ${task.sequence === null ? "unassigned" : ""}`}>
                            {task.sequence === null ? "未编号" : `#${task.sequence}`}
                          </span>
                          <strong title={task.name}>{task.name}</strong>
                        </div>
                        <div className="delivery-meta">
                          <span className="platform-chip">{task.platform}</span>
                        </div>
                        <small className="delivery-purchase-time">{task.purchased_at ? `购买时间：${task.purchased_at}` : "购买时间未填写"}</small>
                        {task.note && <p>{task.note}</p>}
                      </>
                    )}
                  </div>
                </div>
                <div className="delivery-actions">
                  {editingTaskId === task.id ? (
                    <>
                      <button onClick={() => onSaveEdit(task.id)}>保存</button>
                      <button onClick={onCancelEdit} title="取消编辑">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onStartEdit(task)} title="编辑快递">
                        <Pencil size={16} />
                      </button>
                      <button className="danger" onClick={() => onDelete(task.id)} title="删除快递">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="delivery-empty">{tasks.length ? "没有匹配的快递记录" : "还没有快递记录"}</div>
          )}
        </div>
      </section>
    </>
  );
}

function PlatformSelect({ value, platforms, onChange }: { value: string; platforms: string[]; onChange: (platform: string) => void }) {
  const options = value && !platforms.includes(value) ? [value, ...platforms] : platforms;
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} aria-label="购买平台">
      <option value="" disabled>选择平台</option>
      {options.map((platform) => (
        <option key={platform} value={platform}>{platform === value && !platforms.includes(platform) ? `${platform}（已移除）` : platform}</option>
      ))}
    </select>
  );
}

export function TaskComposer({
  draft,
  tags,
  onDraftChange,
  onSubmit,
}: {
  draft: TaskDraft;
  tags: TodoTag[];
  onDraftChange: (draft: TaskDraft) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <form className="composer" onSubmit={onSubmit}>
      <input value={draft.text} onChange={(event) => onDraftChange({ ...draft, text: event.target.value })} placeholder="添加今天要做的事" />
      <select value={draft.tag} onChange={(event) => onDraftChange({ ...draft, tag: Number(event.target.value) as TagId })}>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>
      <select value={draft.status} onChange={(event) => onDraftChange({ ...draft, status: Number(event.target.value) as TaskStatus })}>
        {STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
      <button className="primary-button" type="submit">
        <Plus size={18} />
        添加
      </button>
    </form>
  );
}

export function TaskToolbar({
  filters,
  canUndo,
  canRedo,
  onCarryOver,
  onClearDone,
  onUndo,
  onRedo,
  onFiltersChange,
}: {
  filters: Filters;
  canUndo: boolean;
  canRedo: boolean;
  onCarryOver: () => void;
  onClearDone: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFiltersChange: (filters: Filters) => void;
}) {
  return (
    <section className="toolbar">
      <div className="action-group">
        <button onClick={onCarryOver}>
          <RotateCcw size={16} />
          继承昨日
        </button>
        <button onClick={onClearDone}>
          <Trash2 size={16} />
          清除已完成
        </button>
        <button onClick={onUndo} disabled={!canUndo} title="撤销 Ctrl+Z">
          <Undo2 size={16} />
          撤销
        </button>
        <button onClick={onRedo} disabled={!canRedo} title="重做 Ctrl+Y / Ctrl+Shift+Z">
          <Redo2 size={16} />
          重做
        </button>
      </div>
      <div className="filter-row">
        <Segmented
          value={filters.status}
          options={[
            ["all", "全部"],
            ["1", "未完成"],
            ["2", "进行中"],
            ["0", "已完成"],
          ]}
          onChange={(status) => onFiltersChange({ ...filters, status: status as StatusFilter })}
        />
        <div className="search-box">
          <Search size={16} />
          <input value={filters.query} onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })} placeholder="搜索任务或描述" />
        </div>
        <Segmented
          value={filters.priority}
          options={[
            ["all", "全部"],
            ["high", "高"],
            ["medium", "中"],
            ["low", "低"],
          ]}
          onChange={(priority) => onFiltersChange({ ...filters, priority: priority as Filters["priority"] })}
        />
      </div>
    </section>
  );
}
