import React, { useState, useMemo } from 'react';
import {
  Mic,
  Share2,
  Calendar,
  Tag,
  Play,
  Pause,
  Filter,
  CheckCircle2,
  Circle,
  Search,
  Sparkles,
  X,
  CalendarDays,
  Trash2,
  Plus,
  Settings,
} from 'lucide-react';
import { RecordingItem, DateFilterMode, ReadFilterType } from '../types';
import { formatDuration, formatTimestamp } from '../utils/audioEngine';

interface DashboardProps {
  recordings: RecordingItem[];
  allTags: string[];
  onToggleRead: (id: string, isRead: boolean) => void;
  onSelectRecording: (item: RecordingItem) => void;
  onOpenWidget: () => void;
  onOpenBulkShare: () => void;
  onOpenCodeModal: () => void;
  onToggleViewMode: () => void;
  onDeleteTag: (tag: string) => void;
  onAddNewTag: (tag: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  recordings,
  allTags,
  onToggleRead,
  onSelectRecording,
  onOpenWidget,
  onOpenBulkShare,
  onOpenCodeModal,
  onToggleViewMode,
  onDeleteTag,
  onAddNewTag,
}) => {
  // 4 Primary Filters:
  // 1. Date / Time Filter: Select between ALL, specific DATE, specific MONTH, or specific YEAR
  const [dateFilterMode, setDateFilterMode] = useState<'ALL' | 'DATE' | 'MONTH' | 'YEAR'>('ALL');
  
  // Default date as YYYY-MM-DD in local time
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // 2 & 3. Read / Unread Filter Mode ('ALL' | 'READ' | 'UNREAD')
  const [readFilter, setReadFilter] = useState<ReadFilterType>('ALL');

  // 4. Tag Filter (null = all tags, or specific string)
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Search keyword query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Playing audio state inline
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [inlineAudio] = useState<HTMLAudioElement>(new Audio());

  // Tag Management States on Dashboard
  const [isManageTagsModalOpen, setIsManageTagsModalOpen] = useState<boolean>(false);
  const [tagToDeleteConfirm, setTagToDeleteConfirm] = useState<string | null>(null);
  const [newDashboardTagInput, setNewDashboardTagInput] = useState<string>('');

  const executeDeleteTag = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    }
    onDeleteTag(tag);
    setTagToDeleteConfirm(null);
  };

  const handleCreateNewTag = () => {
    const trimmed = newDashboardTagInput.trim();
    if (trimmed) {
      onAddNewTag(trimmed);
      setNewDashboardTagInput('');
    }
  };

  const handleToggleInlinePlay = (e: React.MouseEvent, item: RecordingItem) => {
    e.stopPropagation();
    if (currentlyPlayingId === item.id) {
      inlineAudio.pause();
      setCurrentlyPlayingId(null);
    } else {
      inlineAudio.src = item.audioUrl;
      inlineAudio.play().then(() => {
        setCurrentlyPlayingId(item.id);
      }).catch(() => {
        setCurrentlyPlayingId(item.id);
      });
      inlineAudio.onended = () => {
        setCurrentlyPlayingId(null);
      };
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Dynamic available years based on recordings plus current year
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    recordings.forEach((r) => {
      years.add(new Date(r.createdAt).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [recordings]);

  // Filter application logic
  const filteredRecordings = useMemo(() => {
    return recordings.filter((item) => {
      const itemDate = new Date(item.createdAt);

      // 1. Date / Month / Year Filter Logic
      if (dateFilterMode === 'DATE' && selectedDate) {
        const y = itemDate.getFullYear();
        const m = String(itemDate.getMonth() + 1).padStart(2, '0');
        const d = String(itemDate.getDate()).padStart(2, '0');
        const itemDateStr = `${y}-${m}-${d}`;
        if (itemDateStr !== selectedDate) return false;
      } else if (dateFilterMode === 'MONTH') {
        if (itemDate.getFullYear() !== selectedYear || itemDate.getMonth() !== selectedMonth) {
          return false;
        }
      } else if (dateFilterMode === 'YEAR') {
        if (itemDate.getFullYear() !== selectedYear) {
          return false;
        }
      }

      // 2 & 3. Read & Unread Filters
      if (readFilter === 'READ' && !item.isRead) return false;
      if (readFilter === 'UNREAD' && item.isRead) return false;

      // 4. Tag Filter
      if (selectedTag && !item.tags.includes(selectedTag)) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesNote = item.note.toLowerCase().includes(q);
        const matchesTag = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesNote && !matchesTag) return false;
      }

      return true;
    });
  }, [recordings, dateFilterMode, selectedDate, selectedMonth, selectedYear, readFilter, selectedTag, searchQuery]);

  const readCount = recordings.filter((r) => r.isRead).length;
  const unreadCount = recordings.length - readCount;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header Card */}
      <div className="paper-sheet paper-card rounded-2xl border-2 border-[#111111] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#111111] bg-[#111111] text-white">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#111111]">
                  PaperVoice Dashboard
                </h1>
                <p className="font-mono text-xs text-[#555555]">
                  White-paper audio journal · MP3 format · Android 17 lockscreen integration
                </p>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Android 17 Widget Simulator Mode Switcher */}
            <button
              type="button"
              onClick={onToggleViewMode}
              className="flex items-center gap-1.5 rounded-xl border border-[#111111] bg-white px-3.5 py-2 text-xs font-bold text-[#111111] transition-all hover:bg-[#F3EFE6] active:scale-95"
              title="Switch to Android 17 Phone & Lockscreen Simulator"
            >
              <Sparkles className="h-4 w-4" />
              <span>Android Phone & Lockscreen View</span>
            </button>

            {/* Bulk Quick Share Button */}
            <button
              type="button"
              onClick={onOpenBulkShare}
              className="flex items-center gap-1.5 rounded-xl border border-[#111111] bg-white px-3.5 py-2 text-xs font-bold text-[#111111] transition-all hover:bg-[#F3EFE6] active:scale-95"
              title="Bulk Quick Share All Recordings"
            >
              <Share2 className="h-4 w-4" />
              <span>Bulk Quick Share ({recordings.length})</span>
            </button>

            {/* 1x1 Widget Popup Trigger */}
            <button
              type="button"
              onClick={onOpenWidget}
              className="flex items-center gap-2 rounded-xl bg-[#111111] px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-[#252525] active:scale-95"
              title="Launch 1x1 Widget Recording Popup"
            >
              <Mic className="h-4 w-4" />
              <span>New Recording (1x1 Widget)</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555555]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voice notes by title, notes, or tags..."
            className="w-full rounded-xl border border-[#111111] bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-[#111111] placeholder:text-[#888888] focus:border-[#111111] focus:outline-none"
          />
        </div>

        {/* ========================================================
            THE 4 FILTERS SECTION (As specifically requested):
            1. Date / Time (Date, Month, Year)
            2. Read Filter
            3. Unread Filter
            4. Tag Filter
            ======================================================== */}
        <div className="mt-5 border-t border-[#E5E0D8] pt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {/* FILTER 1: Date / Month / Year Filter */}
            <div className="flex flex-col gap-2 rounded-xl border border-[#111111] bg-[#F7F5EE] p-3 lg:col-span-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#111111]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>1. Date / Month / Year Filter</span>
                </label>
                {dateFilterMode !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('ALL')}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#111111] underline hover:text-[#555555]"
                  >
                    <span>Reset Date</span>
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Mode Selector Tabs: [All Dates] [Select Date] [Select Month] [Select Year] */}
              <div className="flex rounded-lg border border-[#111111] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setDateFilterMode('ALL')}
                  className={`flex-1 rounded-md py-1.5 text-center text-[11px] font-bold transition-colors ${
                    dateFilterMode === 'ALL'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#111111] hover:bg-[#F3EFE6]'
                  }`}
                >
                  All Dates
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterMode('DATE')}
                  className={`flex-1 rounded-md py-1.5 text-center text-[11px] font-bold transition-colors ${
                    dateFilterMode === 'DATE'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#111111] hover:bg-[#F3EFE6]'
                  }`}
                >
                  Date
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterMode('MONTH')}
                  className={`flex-1 rounded-md py-1.5 text-center text-[11px] font-bold transition-colors ${
                    dateFilterMode === 'MONTH'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#111111] hover:bg-[#F3EFE6]'
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilterMode('YEAR')}
                  className={`flex-1 rounded-md py-1.5 text-center text-[11px] font-bold transition-colors ${
                    dateFilterMode === 'YEAR'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#111111] hover:bg-[#F3EFE6]'
                  }`}
                >
                  Year
                </button>
              </div>

              {/* Active Selection Input Controls */}
              {dateFilterMode === 'DATE' && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-[#111111] bg-white px-2.5 py-1">
                    <CalendarDays className="h-4 w-4 text-[#111111] shrink-0" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-[#111111] focus:outline-none"
                    />
                  </div>
                  {/* Quick Shortcuts */}
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const y = now.getFullYear();
                      const m = String(now.getMonth() + 1).padStart(2, '0');
                      const d = String(now.getDate()).padStart(2, '0');
                      setSelectedDate(`${y}-${m}-${d}`);
                    }}
                    className="rounded-lg border border-[#111111] bg-white px-2.5 py-1 text-[11px] font-bold text-[#111111] hover:bg-[#F3EFE6]"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const yest = new Date(Date.now() - 86400000);
                      const y = yest.getFullYear();
                      const m = String(yest.getMonth() + 1).padStart(2, '0');
                      const d = String(yest.getDate()).padStart(2, '0');
                      setSelectedDate(`${y}-${m}-${d}`);
                    }}
                    className="rounded-lg border border-[#111111] bg-white px-2.5 py-1 text-[11px] font-bold text-[#111111] hover:bg-[#F3EFE6]"
                  >
                    Yesterday
                  </button>
                </div>
              )}

              {dateFilterMode === 'MONTH' && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="flex-1 rounded-lg border border-[#111111] bg-white px-2.5 py-1 text-xs font-bold text-[#111111] focus:outline-none"
                  >
                    {monthNames.map((m, idx) => (
                      <option key={m} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-24 rounded-lg border border-[#111111] bg-white px-2.5 py-1 text-xs font-bold text-[#111111] focus:outline-none"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setSelectedMonth(now.getMonth());
                      setSelectedYear(now.getFullYear());
                    }}
                    className="rounded-lg border border-[#111111] bg-white px-2.5 py-1 text-[11px] font-bold text-[#111111] hover:bg-[#F3EFE6]"
                  >
                    This Month
                  </button>
                </div>
              )}

              {dateFilterMode === 'YEAR' && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="flex-1 rounded-lg border border-[#111111] bg-white px-2.5 py-1 text-xs font-bold text-[#111111] focus:outline-none"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        Year {yr}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setSelectedYear(new Date().getFullYear())}
                    className="rounded-lg border border-[#111111] bg-white px-2.5 py-1 text-[11px] font-bold text-[#111111] hover:bg-[#F3EFE6]"
                  >
                    This Year
                  </button>
                </div>
              )}

              {dateFilterMode === 'ALL' && (
                <div className="flex items-center gap-2 text-[11px] text-[#555555]">
                  <span>Showing recordings across all dates.</span>
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('DATE')}
                    className="font-bold text-[#111111] underline hover:text-[#555555]"
                  >
                    Pick a date
                  </button>
                </div>
              )}
            </div>

            {/* FILTER 2 & 3: Read & Unread Filters */}
            <div className="flex flex-col gap-2 rounded-xl border border-[#111111] bg-[#F7F5EE] p-3">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#111111]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>2 & 3. Read / Unread Status</span>
              </label>
              <div className="flex rounded-lg border border-[#111111] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setReadFilter('ALL')}
                  className={`flex-1 rounded-md py-1.5 text-center text-xs font-bold transition-colors ${
                    readFilter === 'ALL'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#111111] hover:bg-[#F3EFE6]'
                  }`}
                >
                  All ({recordings.length})
                </button>
                {/* 2. Read filter */}
                <button
                  type="button"
                  onClick={() => setReadFilter('READ')}
                  className={`flex-1 rounded-md py-1.5 text-center text-xs font-bold transition-colors ${
                    readFilter === 'READ'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#111111] hover:bg-[#F3EFE6]'
                  }`}
                >
                  Read ({readCount})
                </button>
                {/* 3. Unread filter */}
                <button
                  type="button"
                  onClick={() => setReadFilter('UNREAD')}
                  className={`flex-1 rounded-md py-1.5 text-center text-xs font-bold transition-colors ${
                    readFilter === 'UNREAD'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#111111] hover:bg-[#F3EFE6]'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
              <span className="text-[10px] text-[#555555]">
                {readFilter === 'READ'
                  ? 'Showing checked recordings only'
                  : readFilter === 'UNREAD'
                  ? 'Showing unchecked recordings only'
                  : 'Showing both read & unread'}
              </span>
            </div>

            {/* FILTER 4: Tag Filter & Tag Management */}
            <div className="flex flex-col gap-2 rounded-xl border border-[#111111] bg-[#F7F5EE] p-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#111111]">
                  <Tag className="h-3.5 w-3.5" />
                  <span>4. Tag Filter</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsManageTagsModalOpen(true)}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#111111] underline hover:text-[#555555]"
                    title="Open Tag Manager to add or delete tags"
                  >
                    <Settings className="h-3 w-3" />
                    <span>Manage</span>
                  </button>
                  {selectedTag && (
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className="flex items-center gap-0.5 text-[10px] font-bold text-[#111111] underline hover:text-[#555555]"
                    >
                      <span>Clear</span>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tag Dropdown & Delete Selected Button */}
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedTag || ''}
                  onChange={(e) => setSelectedTag(e.target.value || null)}
                  className="w-full flex-1 rounded-lg border border-[#111111] bg-white px-3 py-1.5 text-xs font-semibold text-[#111111] focus:border-[#111111] focus:outline-none"
                >
                  <option value="">All Tags ({allTags.length})</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      #{tag}
                    </option>
                  ))}
                </select>

                {selectedTag && (
                  <button
                    type="button"
                    onClick={() => setTagToDeleteConfirm(selectedTag)}
                    className="flex items-center gap-1 rounded-lg border border-red-700 bg-red-50 px-2 py-1.5 text-[10px] font-bold text-red-700 hover:bg-red-700 hover:text-white transition-colors shrink-0"
                    title={`Delete tag #${selectedTag} completely`}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              {/* Quick Tag Chips with direct Delete [Trash] Buttons */}
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-1">
                {allTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <div
                      key={tag}
                      className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition-all ${
                        isSelected
                          ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                          : 'border-[#111111] bg-white text-[#111111] hover:bg-[#F3EFE6]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedTag(isSelected ? null : tag)}
                        className="cursor-pointer"
                        title={`Filter by #${tag}`}
                      >
                        #{tag}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTagToDeleteConfirm(tag);
                        }}
                        className={`ml-0.5 rounded p-0.5 transition-colors ${
                          isSelected
                            ? 'text-white hover:bg-red-700 hover:text-white'
                            : 'text-[#555555] hover:bg-red-100 hover:text-red-700'
                        }`}
                        title={`Delete tag #${tag}`}
                        aria-label={`Delete tag #${tag}`}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <span className="text-[10px] text-[#555555]">
                {selectedTag ? `Filtered by #${selectedTag} · Tap trash to delete` : 'Tap tag to filter · Tap trash icon to delete'}
              </span>
            </div>
          </div>

          {/* Active Filter Indicators Bar */}
          {(dateFilterMode !== 'ALL' || readFilter !== 'ALL' || selectedTag !== null || searchQuery.trim() !== '') && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#E5E0D8] pt-2.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#555555]">
                Active Filters:
              </span>

              {/* Date Filter Badge */}
              {dateFilterMode === 'DATE' && (
                <div className="flex items-center gap-1 rounded-md border border-[#111111] bg-white px-2 py-0.5 text-xs font-bold text-[#111111]">
                  <span>Date: {selectedDate}</span>
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('ALL')}
                    className="hover:text-red-700"
                    title="Remove date filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {dateFilterMode === 'MONTH' && (
                <div className="flex items-center gap-1 rounded-md border border-[#111111] bg-white px-2 py-0.5 text-xs font-bold text-[#111111]">
                  <span>Month: {monthNames[selectedMonth]} {selectedYear}</span>
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('ALL')}
                    className="hover:text-red-700"
                    title="Remove month filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {dateFilterMode === 'YEAR' && (
                <div className="flex items-center gap-1 rounded-md border border-[#111111] bg-white px-2 py-0.5 text-xs font-bold text-[#111111]">
                  <span>Year: {selectedYear}</span>
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('ALL')}
                    className="hover:text-red-700"
                    title="Remove year filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Read Filter Badge */}
              {readFilter !== 'ALL' && (
                <div className="flex items-center gap-1 rounded-md border border-[#111111] bg-white px-2 py-0.5 text-xs font-bold text-[#111111]">
                  <span>Status: {readFilter === 'READ' ? 'Read' : 'Unread'}</span>
                  <button
                    type="button"
                    onClick={() => setReadFilter('ALL')}
                    className="hover:text-red-700"
                    title="Show all read/unread"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Tag Badge */}
              {selectedTag && (
                <div className="flex items-center gap-1 rounded-md border border-[#111111] bg-white px-2 py-0.5 text-xs font-bold text-[#111111]">
                  <span>Tag: #{selectedTag}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className="hover:text-red-700"
                    title="Remove tag filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Search query badge */}
              {searchQuery.trim() && (
                <div className="flex items-center gap-1 rounded-md border border-[#111111] bg-white px-2 py-0.5 text-xs font-bold text-[#111111]">
                  <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-red-700"
                    title="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Clear All Button */}
              <button
                type="button"
                onClick={() => {
                  setDateFilterMode('ALL');
                  setReadFilter('ALL');
                  setSelectedTag(null);
                  setSearchQuery('');
                }}
                className="rounded-md border border-[#111111] bg-[#111111] px-2 py-0.5 text-xs font-bold text-white hover:bg-[#252525]"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recordings List */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
            Recordings ({filteredRecordings.length})
          </span>
          <span className="font-mono text-[11px] text-[#555555]">
            Check box to mark as Read · Uncheck for Unread
          </span>
        </div>

        {filteredRecordings.length === 0 ? (
          <div className="paper-sheet paper-card flex flex-col items-center justify-center rounded-2xl border-2 border-[#111111] p-12 text-center">
            <Mic className="h-10 w-10 text-[#555555]" />
            <h3 className="mt-3 text-base font-bold text-[#111111]">No recordings match your filter</h3>
            <p className="mt-1 max-w-sm text-xs text-[#555555]">
              Try adjusting your Time, Read/Unread, or Tag filters, or tap below to record a new voice memo with the 1x1 widget!
            </p>
            <button
              type="button"
              onClick={onOpenWidget}
              className="mt-4 rounded-xl bg-[#111111] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#252525]"
            >
              Start Recording Now
            </button>
          </div>
        ) : (
          filteredRecordings.map((rec) => {
            const isPlayingThis = currentlyPlayingId === rec.id;

            return (
              <div
                key={rec.id}
                onClick={() => onSelectRecording(rec)}
                className="paper-sheet paper-card group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-[#111111] p-4 transition-all hover:border-2 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Left section: Checkbox + Title + Date + Note */}
                <div className="flex items-start gap-3.5 sm:items-center">
                  {/* 
                    Each recording has a check box:
                    - If checked -> goes to Read filter
                    - If unchecked -> goes to Unread filter
                  */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleRead(rec.id, !rec.isRead);
                    }}
                    className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border-2 border-[#111111] bg-white transition-all hover:bg-[#F3EFE6] sm:mt-0"
                    title={rec.isRead ? 'Mark as Unread' : 'Mark as Read'}
                    aria-label={rec.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  >
                    {rec.isRead ? (
                      <CheckCircle2 className="h-4 w-4 text-[#111111]" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-transparent" />
                    )}
                  </button>

                  {/* Inline Play/Pause Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleInlinePlay(e, rec)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#111111] bg-white text-[#111111] shadow-sm transition-all hover:bg-[#F3EFE6] active:scale-95"
                    title={isPlayingThis ? 'Pause Audio' : 'Play Audio'}
                  >
                    {isPlayingThis ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="ml-0.5 h-4 w-4" />
                    )}
                  </button>

                  {/* Recording info */}
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={`text-sm font-bold text-[#111111] group-hover:underline ${
                          rec.isRead ? 'opacity-85' : 'font-extrabold'
                        }`}
                      >
                        {rec.title}
                      </h4>

                      {/* Read / Unread Indicator text */}
                      <span
                        className={`font-mono text-[10px] font-bold ${
                          rec.isRead ? 'text-[#888888]' : 'text-[#111111] bg-[#F7F5EE] px-1.5 py-0.5 rounded border border-[#111111]'
                        }`}
                      >
                        {rec.isRead ? 'Read' : 'Unread'}
                      </span>
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#555555]">
                      <span className="font-mono text-[11px]">{formatTimestamp(rec.createdAt)}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px] font-semibold text-[#111111]">
                        {formatDuration(rec.duration)}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-[11px]">MP3</span>
                    </div>

                    {rec.note && (
                      <p className="mt-1 line-clamp-1 text-xs text-[#555555]">
                        {rec.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right section: Tags & Audio Waveform Snippet */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E0D8] pt-2 sm:border-t-0 sm:pt-0 sm:justify-end">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {rec.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(tag);
                        }}
                        className="rounded-md border border-[#111111] bg-[#F7F5EE] px-2 py-0.5 font-mono text-[10px] font-bold text-[#111111] hover:bg-[#EAE5DC]"
                        title={`Filter by tag #${tag}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Waveform mini visualizer */}
                  <div className="hidden h-6 w-16 items-center justify-end gap-[2px] md:flex">
                    {(rec.waveform || [0.3, 0.6, 0.8, 0.4, 0.2, 0.7, 0.5, 0.3]).slice(0, 10).map((v, i) => (
                      <span
                        key={i}
                        className={`w-[2px] rounded-full ${
                          isPlayingThis ? 'bg-[#111111] animate-pulse' : 'bg-[#111111]'
                        }`}
                        style={{ height: `${Math.max(4, v * 22)}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info & Android 17 Project Code Modal Button */}
      <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#E5E0D8] pt-6 sm:flex-row">
        <span className="font-mono text-xs text-[#555555]">
          PaperVoice · Android 17 Translucent Lockscreen Widget Architecture
        </span>

        <button
          type="button"
          onClick={onOpenCodeModal}
          className="flex items-center gap-1.5 rounded-lg border border-[#111111] bg-white px-3 py-1.5 text-xs font-bold text-[#111111] hover:bg-[#F3EFE6]"
        >
          <span>View Android 17 Kotlin & XML Code</span>
        </button>
      </div>

      {/* ========================================================
          MANAGE & DELETE TAGS MODAL
          ======================================================== */}
      {isManageTagsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">
          <div className="paper-sheet paper-card relative w-full max-w-md rounded-2xl border-2 border-[#111111] p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#111111]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-[#111111]">
                  Manage & Delete Tags
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManageTagsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#111111] bg-white text-[#111111] hover:bg-[#F3EFE6]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Add Tag Input */}
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={newDashboardTagInput}
                onChange={(e) => setNewDashboardTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNewTag();
                }}
                placeholder="Create new tag..."
                className="flex-1 rounded-xl border border-[#111111] bg-white px-3 py-2 text-xs font-semibold text-[#111111] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateNewTag}
                className="flex items-center gap-1 rounded-xl bg-[#111111] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#252525]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Tag</span>
              </button>
            </div>

            {/* Tags List with Delete Actions */}
            <div className="mt-4 flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {allTags.length === 0 ? (
                <p className="text-center text-xs text-[#555555] py-6">No tags available.</p>
              ) : (
                allTags.map((tag) => {
                  const count = recordings.filter((r) => r.tags.includes(tag)).length;
                  return (
                    <div
                      key={tag}
                      className="flex items-center justify-between rounded-xl border border-[#111111] bg-white p-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#111111]">#{tag}</span>
                        <span className="font-mono text-[10px] text-[#555555]">
                          ({count} recording{count !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTagToDeleteConfirm(tag)}
                        className="flex items-center gap-1 rounded-lg border border-red-700 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-700 hover:text-white transition-colors"
                        title={`Delete tag #${tag}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Tag</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5 border-t border-[#E5E0D8] pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageTagsModalOpen(false)}
                className="rounded-xl bg-[#111111] px-4 py-2 text-xs font-bold text-white hover:bg-[#252525]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE TAG CONFIRMATION DIALOG
          ======================================================== */}
      {tagToDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
          <div className="paper-sheet paper-card relative w-full max-w-sm rounded-2xl border-2 border-red-700 bg-white p-5 shadow-2xl">
            <div className="flex items-center gap-2 text-red-700">
              <Trash2 className="h-5 w-5" />
              <h4 className="font-bold text-sm">Delete Tag &ldquo;#{tagToDeleteConfirm}&rdquo;?</h4>
            </div>
            <p className="mt-2 text-xs text-[#555555] leading-relaxed">
              Are you sure you want to delete this tag? It will be permanently removed from all voice recordings that currently use it.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTagToDeleteConfirm(null)}
                className="rounded-lg border border-[#111111] bg-white px-3 py-1.5 text-xs font-bold text-[#111111] hover:bg-[#F3EFE6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDeleteTag(tagToDeleteConfirm)}
                className="rounded-lg bg-red-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-800"
              >
                Yes, Delete Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
