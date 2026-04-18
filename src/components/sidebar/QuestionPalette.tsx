/**
 * Question Palette — Card-based grid layout like Survey123 web designer
 * Includes appearance variant cards and platform filter (Field App / Web App)
 */

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { questionCategories } from '../../data/questionTypes';
import { DragItem, QuestionCategory, PlatformSupport } from '../../types/survey';
import { getIcon, X, ChevronDown, ChevronRight } from '../../utils/icons';

// ============================================================
// Platform filter type
// ============================================================

type PlatformFilter = 'all' | 'field' | 'web';

// ============================================================
// Draggable Question Card
// ============================================================

function DraggableCard({ item }: { item: DragItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.id}`,
    data: { type: item.type, fromPalette: true, defaultAppearance: item.defaultAppearance },
  });

  const Icon = getIcon(item.icon);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ padding: '10px 12px', gap: 10 }}
      className={`
        flex items-center rounded-lg cursor-grab select-none
        border border-gray-200 bg-white hover:border-[#00856a] hover:bg-[#f0faf7]
        transition-fast group
        ${isDragging ? 'opacity-40 scale-95' : ''}
      `}
      title={item.description || item.label}
    >
      <Icon
        size={18}
        className="text-[#00856a] shrink-0 group-hover:scale-110 transition-fast"
      />
      <span className="text-[13px] text-gray-700 font-medium leading-snug">{item.label}</span>
    </div>
  );
}

// ============================================================
// Category Group
// ============================================================

function CategoryGroup({
  category,
  platformFilter,
  isCollapsed,
  onToggle,
}: {
  category: QuestionCategory;
  platformFilter: PlatformFilter;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  // Filter items based on platform
  const filteredItems = category.items.filter((item) => {
    if (platformFilter === 'all') return true;
    const itemPlatform = item.platform || 'both';
    return itemPlatform === 'both' || itemPlatform === platformFilter;
  });

  if (filteredItems.length === 0) return null;

  const CollapseIcon = isCollapsed ? ChevronRight : ChevronDown;

  return (
    <div style={{ marginBottom: isCollapsed ? 12 : 20 }}>
      <button
        onClick={onToggle}
        className="flex items-center w-full text-left hover:text-gray-700 transition-fast"
        style={{ padding: '0 4px', marginBottom: isCollapsed ? 0 : 8, gap: 4 }}
      >
        <CollapseIcon size={12} className="text-gray-400 shrink-0" />
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          {category.label}
        </h3>
        {isCollapsed && (
          <span className="text-[10px] text-gray-400 font-normal normal-case ml-1">
            ({filteredItems.length})
          </span>
        )}
      </button>
      {!isCollapsed && (
        <div className="grid grid-cols-2" style={{ gap: 6 }}>
          {filteredItems.map((item) => (
            <DraggableCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Platform Toggle
// ============================================================

function PlatformToggle({
  value,
  onChange,
}: {
  value: PlatformFilter;
  onChange: (v: PlatformFilter) => void;
}) {
  const options: { value: PlatformFilter; label: string; icon: React.ReactNode }[] = [
    {
      value: 'all',
      label: 'All',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      value: 'field',
      label: 'Field App',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      ),
    },
    {
      value: 'web',
      label: 'Web App',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-gray-100 rounded-lg flex" style={{ padding: 2, gap: 2 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex items-center justify-center rounded-md transition-fast ${
            value === opt.value
              ? 'bg-white text-[#007a62] shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          style={{ padding: '5px 6px', gap: 4, fontSize: 11, fontWeight: 600 }}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Main Palette
// ============================================================

export function QuestionPalette() {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // First filter by search, then by platform (platform filtering is done in CategoryGroup)
  const searchFilteredCategories = searchTerm
    ? questionCategories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : questionCategories;

  // Count how many items are visible with current platform filter
  const visibleCount = searchFilteredCategories.reduce((acc, cat) => {
    return acc + cat.items.filter((item) => {
      if (platformFilter === 'all') return true;
      const p = item.platform || 'both';
      return p === 'both' || p === platformFilter;
    }).length;
  }, 0);

  const totalCount = searchFilteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="bg-[#fafafa] border-r border-gray-200 flex flex-col h-full"
      style={{ width: 300 }}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white"
        style={{ padding: '16px 16px 12px 16px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <h2 className="text-[15px] font-bold text-gray-900">Add</h2>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-gray-400 hover:text-gray-600 rounded transition-fast"
              style={{ padding: 4 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Platform Toggle */}
        <PlatformToggle value={platformFilter} onChange={setPlatformFilter} />

        {/* Info line */}
        {platformFilter !== 'all' && (
          <p className="text-center" style={{ fontSize: 10, marginTop: 6, lineHeight: 1.3 }}>
            <span className={platformFilter === 'web' ? 'text-blue-500' : 'text-amber-600'}>
              {platformFilter === 'web' ? 'Web app' : 'Field app'} questions
            </span>
            <span className="text-gray-400">
              {' '}— {visibleCount} of {totalCount} types
            </span>
          </p>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder="Search question types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px 12px', marginTop: 10 }}
          className="w-full text-[13px] bg-gray-50 border border-gray-200 rounded-lg
            text-gray-700 placeholder-gray-400 transition-fast"
        />
      </div>

      {/* Scrollable question list */}
      <div className="flex-1 overflow-y-auto"
        style={{ padding: '16px 12px 24px 12px' }}>
        {searchFilteredCategories.map((category) => (
          <CategoryGroup
            key={category.id}
            category={category}
            platformFilter={platformFilter}
            isCollapsed={!searchTerm && collapsedCategories.has(category.id)}
            onToggle={() => toggleCategory(category.id)}
          />
        ))}
        {visibleCount === 0 && (
          <p className="text-sm text-gray-400 text-center" style={{ padding: '32px 0' }}>
            No matching types
          </p>
        )}
      </div>
    </div>
  );
}
