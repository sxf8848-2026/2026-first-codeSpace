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
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { STATUSES, TAGS } from "../constants";
import { addDays, dayLabel, formatDisplayDate, formatMonthTitle, fromDateKey, fromMonthKey } from "../date";
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
  WeeklyDelivery,
  WeeklyTask,
  WorkExperienceRecord,
  DailyReadingRecord,
  ArgumentReflectionRecord,
  DivorcePlanRecord,
  BookRecord,
  KindnessRecord,
  StudyGrowthRecord,
  StudyGrowthType,
  SkincareCategory,
  SkincareProductRecord,
  RewardRuleRecord,
  RewardClaimRecord,
} from "../types";
import { BookStatusFilter } from "../services/books";
import { SKINCARE_CATEGORY_OPTIONS, SkincareCategoryFilter, skincareCategoryLabel } from "../services/skincareProducts";
import { RewardRuleStatusFilter } from "../services/rewards";
import { Segmented, TagButton } from "./Controls";

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
  content: string;
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
          <input value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} placeholder={`${typeLabel}标题，必填`} required />
          <input value={draft.source} onChange={(event) => onDraftChange({ ...draft, source: event.target.value })} placeholder="来源，可不填" />
          <textarea value={draft.content} onChange={(event) => onDraftChange({ ...draft, content: event.target.value })} placeholder={`记录${typeLabel}的具体内容，必填`} required />
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
                  <input value={editingDraft.title} onChange={(event) => onEditDraftChange({ ...editingDraft, title: event.target.value })} placeholder="标题，必填" autoFocus required />
                  <input value={editingDraft.source} onChange={(event) => onEditDraftChange({ ...editingDraft, source: event.target.value })} placeholder="来源，可不填" />
                  <textarea value={editingDraft.content} onChange={(event) => onEditDraftChange({ ...editingDraft, content: event.target.value })} placeholder="正文，必填" required />
                </div>
              ) : (
                <div className="study-growth-content">
                  <div className="study-growth-heading"><strong>{record.title}</strong><time>{record.updated_at === record.created_at ? `添加于 ${formatRecordStamp(record.created_at)}` : `更新于 ${formatRecordStamp(record.updated_at)}`}</time></div>
                  <p>{record.content}</p>
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

type RewardRuleDraft = { name: string; amount: string; description: string };

export function RewardPanel({
  rules,
  claims,
  claimMonths,
  claimedRuleIds,
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
  onClaim,
  onClaimQueryChange,
  onClaimMonthFilterChange,
  onDeleteClaim,
}: {
  rules: RewardRuleRecord[];
  claims: RewardClaimRecord[];
  claimMonths: string[];
  claimedRuleIds: Set<string>;
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
  onClaim: (ruleId: string) => void;
  onClaimQueryChange: (query: string) => void;
  onClaimMonthFilterChange: (month: string) => void;
  onDeleteClaim: (claimId: string) => void;
}) {
  return (
    <>
      <header className="topbar personal-topbar"><div><div className="eyebrow"><Gift size={16} />个人管理</div><h1>个人奖励</h1></div></header>
      <section className="reward-summary">
        <div><span>本月奖励</span><strong>{formatRewardAmount(monthRewardCents)}</strong></div>
        <div><span>历史累计</span><strong>{formatRewardAmount(totalRewardCents)}</strong></div>
        <div className={`storage-status ${saveStatus.state}`} role="status">{saveStatus.message}</div>
      </section>
      <section className="personal-panel reward-rules" aria-label="奖励规则">
        <h2>奖励规则</h2>
        <form className="reward-composer" onSubmit={onAddRule}>
          <input value={ruleDraft.name} onChange={(event) => onRuleDraftChange({ ...ruleDraft, name: event.target.value })} placeholder="规则名称，必填" required />
          <input type="number" min="0.01" step="0.01" value={ruleDraft.amount} onChange={(event) => onRuleDraftChange({ ...ruleDraft, amount: event.target.value })} placeholder="奖励金额（元），必填" required />
          <textarea value={ruleDraft.description} onChange={(event) => onRuleDraftChange({ ...ruleDraft, description: event.target.value })} placeholder="达成说明，可不填" />
          <button className="primary-button" type="submit"><Plus size={18} />添加规则</button>
        </form>
        <div className="personal-toolbar reward-toolbar">
          <div className="search-box"><Search size={16} /><input value={ruleQuery} onChange={(event) => onRuleQueryChange(event.target.value)} placeholder="搜索规则名称或说明" /></div>
          <Segmented value={ruleStatusFilter} options={[["active", "启用"], ["all", "全部"], ["inactive", "已停用"]]} onChange={(value) => onRuleStatusFilterChange(value as RewardRuleStatusFilter)} />
        </div>
        <div className="reward-rule-list">
          {rules.length ? rules.map((rule) => {
            const claimedToday = claimedRuleIds.has(rule.id);
            return (
              <article className={`reward-rule-item ${rule.active ? "" : "inactive"}`} key={rule.id}>
                {editingRuleId === rule.id ? (
                  <div className="reward-edit">
                    <input value={editingDraft.name} onChange={(event) => onEditDraftChange({ ...editingDraft, name: event.target.value })} placeholder="规则名称，必填" required autoFocus />
                    <input type="number" min="0.01" step="0.01" value={editingDraft.amount} onChange={(event) => onEditDraftChange({ ...editingDraft, amount: event.target.value })} placeholder="奖励金额（元）" required />
                    <textarea value={editingDraft.description} onChange={(event) => onEditDraftChange({ ...editingDraft, description: event.target.value })} placeholder="达成说明，可不填" />
                  </div>
                ) : (
                  <div className="personal-content"><div className="personal-heading"><strong>{rule.name}</strong><span>{formatRewardAmount(rule.amount_cents)}</span></div>{rule.description ? <p>{rule.description}</p> : null}<small>{rule.active ? "启用中" : "已停用"}</small></div>
                )}
                <div className="reward-actions">
                  {editingRuleId === rule.id ? <><button type="button" onClick={() => onSaveRule(rule.id)}>保存</button><button type="button" onClick={onCancelEdit} title="取消编辑"><X size={16} /></button></> : <><button type="button" onClick={() => onClaim(rule.id)} disabled={!rule.active || claimedToday}><CircleDollarSign size={16} />{claimedToday ? "今日已领取" : "获得奖励"}</button><button type="button" onClick={() => onStartEditRule(rule)} title="编辑规则"><Pencil size={16} /></button><button type="button" onClick={() => onToggleRule(rule.id)}>{rule.active ? "停用" : "重新启用"}</button></>}
                </div>
              </article>
            );
          }) : <div className="personal-empty">还没有匹配的奖励规则</div>}
        </div>
      </section>
      <section className="personal-panel reward-history" aria-label="领取记录">
        <h2>领取记录</h2>
        <div className="personal-toolbar">
          <div className="search-box"><Search size={16} /><input value={claimQuery} onChange={(event) => onClaimQueryChange(event.target.value)} placeholder="搜索规则名称" /></div>
          <select value={claimMonthFilter} onChange={(event) => onClaimMonthFilterChange(event.target.value)} aria-label="按月份筛选领取记录"><option value="all">全部月份</option>{claimMonths.map((month) => <option key={month} value={month}>{month}</option>)}</select>
        </div>
        <div className="reward-claim-list">
          {claims.length ? claims.map((claim) => <article className="reward-claim-item" key={claim.id}><div><strong>{claim.rule_name}</strong><time>{formatArgumentDateTime(claim.claimed_at)}</time></div><span>{formatRewardAmount(claim.amount_cents)}</span><button type="button" onClick={() => onDeleteClaim(claim.id)} title="删除领取记录"><Trash2 size={16} /></button></article>) : <div className="personal-empty">还没有匹配的领取记录</div>}
        </div>
      </section>
    </>
  );
}

function formatRewardAmount(cents: number): string {
  return `${(cents / 100).toFixed(2)} 元`;
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
        <DashboardStat label="未取快递" value={String(pendingDeliveryCount)} detail="本周待处理" />
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

export function WeeklyDeliveryPanel({
  weekRange,
  tasks,
  visibleTasks,
  filter,
  draft,
  editingTaskId,
  editingDraft,
  platforms,
  saveStatus,
  onFilterChange,
  onDraftChange,
  onAdd,
  onShowHistory,
  onCarryOver,
  onToggle,
  onStartEdit,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  weekRange: string;
  tasks: WeeklyDelivery[];
  visibleTasks: WeeklyDelivery[];
  filter: "all" | "pending" | "picked";
  draft: { name: string; platform: string; note: string; purchased_at: string };
  editingTaskId: string | null;
  editingDraft: { name: string; platform: string; note: string; purchased_at: string };
  platforms: string[];
  saveStatus: SaveStatus;
  onFilterChange: (filter: "all" | "pending" | "picked") => void;
  onDraftChange: (draft: { name: string; platform: string; note: string; purchased_at: string }) => void;
  onAdd: (event: FormEvent) => void;
  onShowHistory: () => void;
  onCarryOver: () => void;
  onToggle: (taskId: string) => void;
  onStartEdit: (task: WeeklyDelivery) => void;
  onEditDraftChange: (draft: { name: string; platform: string; note: string; purchased_at: string }) => void;
  onSaveEdit: (taskId: string) => void;
  onCancelEdit: () => void;
  onDelete: (taskId: string) => void;
}) {
  const pendingCount = tasks.filter((task) => !task.picked).length;
  const pickedCount = tasks.length - pendingCount;
  return (
    <>
      <header className="topbar delivery-topbar">
        <div>
          <div className="eyebrow">
            <Truck size={16} />
            每周快递
          </div>
          <h1>{weekRange}</h1>
        </div>
        <button className="text-button" onClick={onShowHistory}>
          <History size={16} />
          历史查询
        </button>
      </header>

      <section className="delivery-summary">
        <div>
          <span>本周快递</span>
          <strong>
            {pendingCount}/{tasks.length} 未取
          </strong>
          <small>{pickedCount} 个已取</small>
        </div>
        <div className={`storage-status ${saveStatus.state}`} role="status">
          {saveStatus.message}
        </div>
      </section>

      <section className="delivery-panel" aria-label="每周快递">
        <form className="delivery-composer" onSubmit={onAdd}>
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
          <button onClick={onCarryOver} title="从最近有未取快递的历史周继承">
            <RotateCcw size={16} />
            继承未取快递
          </button>
          <Segmented
            value={filter}
            options={[
              ["all", "全部"],
              ["pending", "未取"],
              ["picked", "已取"],
            ]}
            onChange={(value) => onFilterChange(value as "all" | "pending" | "picked")}
          />
        </div>

        <div className="delivery-list">
          {visibleTasks.length ? (
            visibleTasks.map((task) => (
              <article className={`delivery-item ${task.picked ? "picked" : ""}`} key={task.id}>
                <div className="delivery-item-main">
                  <button className="check-button" onClick={() => onToggle(task.id)} title="切换取件状态">
                    {task.picked && <Check size={16} />}
                  </button>
                  <div>
                    {editingTaskId === task.id ? (
                      <>
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
                        <strong title={task.name}>{task.name}</strong>
                        <div className="delivery-meta">
                          <span className="platform-chip">{task.platform}</span>
                          <span className={task.picked ? "picked-chip" : "pending-chip"}>{task.picked ? "已取" : "未取"}</span>
                        </div>
                        {task.purchased_at && <small className="delivery-purchase-time">购买时间：{task.purchased_at}</small>}
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
            <div className="delivery-empty">{tasks.length ? "没有匹配的快递记录" : "本周还没有快递记录"}</div>
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
