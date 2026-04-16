/**
 * Report Field Palette (Left Panel)
 *
 * Shows survey fields grouped by type, with drag or click-to-insert
 * into the TipTap report editor. Also includes special keywords,
 * conditional blocks, and repeat blocks.
 */

import React, { useState, useMemo } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { useReportStore } from '../../store/reportStore';
import { getFieldCategory, REPORT_KEYWORDS } from '../../types/report';
import {
  ChevronDown, ChevronRight, Search, X, AlertCircle,
} from '../../utils/icons';

// ============================================================
// Field category config
// ============================================================

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  text: { label: 'Text Fields', color: '#2563eb', icon: 'T' },
  number: { label: 'Number Fields', color: '#d97706', icon: '#' },
  date: { label: 'Date/Time Fields', color: '#7c3aed', icon: '📅' },
  select: { label: 'Selection Fields', color: '#059669', icon: '◉' },
  image: { label: 'Media Fields', color: '#dc2626', icon: '📷' },
  file: { label: 'File Fields', color: '#ea580c', icon: '📎' },
  geo: { label: 'Location Fields', color: '#0891b2', icon: '📍' },
  repeat: { label: 'Repeat Groups', color: '#6d28d9', icon: '↻' },
  other: { label: 'Other Fields', color: '#6b7280', icon: '…' },
};

// ============================================================
// Insertable Field Item
// ============================================================

function FieldItem({
  name,
  label,
  type,
  category,
  onInsert,
}: {
  name: string;
  label: string;
  type: string;
  category: string;
  onInsert: (expression: string, tokenType: string) => void;
}) {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;

  return (
    <button
      onClick={() => onInsert(name, category === 'repeat' ? 'repeat_start' : 'field')}
      className="w-full flex items-center rounded-md border border-gray-200 bg-white
        hover:border-[#00856a] hover:bg-[#f0faf7] transition-fast text-left group"
      style={{ padding: '7px 10px', gap: 8 }}
      title={`${name} (${type})\nClick to insert \${${name}}`}
    >
      <span
        className="shrink-0 rounded text-[10px] font-bold text-white flex items-center justify-center"
        style={{ width: 22, height: 22, backgroundColor: config.color }}
      >
        {config.icon.length <= 2 ? config.icon : config.icon[0]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-gray-700 truncate group-hover:text-[#007a62]">
          {label || name}
        </div>
        <div className="text-[10px] text-gray-400 truncate">{name}</div>
      </div>
      <span className="text-[9px] text-gray-300 bg-gray-50 rounded px-1.5 py-0.5 shrink-0 font-mono">
        {type}
      </span>
    </button>
  );
}

// ============================================================
// Category Group
// ============================================================

function CategoryGroup({
  categoryKey,
  fields,
  isCollapsed,
  onToggle,
  onInsert,
}: {
  categoryKey: string;
  fields: { name: string; label: string; type: string }[];
  isCollapsed: boolean;
  onToggle: () => void;
  onInsert: (expression: string, tokenType: string) => void;
}) {
  const config = CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG.other;
  const CollapseIcon = isCollapsed ? ChevronRight : ChevronDown;

  return (
    <div style={{ marginBottom: isCollapsed ? 8 : 16 }}>
      <button
        onClick={onToggle}
        className="flex items-center w-full text-left hover:text-gray-700 transition-fast"
        style={{ padding: '0 2px', marginBottom: isCollapsed ? 0 : 6, gap: 4 }}
      >
        <CollapseIcon size={12} className="text-gray-400 shrink-0" />
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: config.color }}
        />
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          {config.label}
        </h3>
        <span className="text-[10px] text-gray-400 font-normal normal-case ml-1">
          ({fields.length})
        </span>
      </button>
      {!isCollapsed && (
        <div className="flex flex-col" style={{ gap: 4 }}>
          {fields.map((f) => (
            <FieldItem
              key={f.name}
              name={f.name}
              label={f.label}
              type={f.type}
              category={categoryKey}
              onInsert={onInsert}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main ReportFieldPalette
// ============================================================

export function ReportFieldPalette() {
  const form = useSurveyStore((s) => s.form);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group fields by category
  const groupedFields = useMemo(() => {
    const groups: Record<string, { name: string; label: string; type: string }[]> = {};
    const skipTypes = new Set(['begin_group', 'end_group', 'end_repeat']);

    for (const row of form.survey) {
      if (skipTypes.has(row.type)) continue;
      const cat = getFieldCategory(row.type);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ name: row.name, label: row.label || row.name, type: row.type });
    }

    return groups;
  }, [form.survey]);

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groupedFields;

    const q = searchTerm.toLowerCase();
    const result: Record<string, { name: string; label: string; type: string }[]> = {};

    for (const [cat, fields] of Object.entries(groupedFields)) {
      const filtered = fields.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.label.toLowerCase().includes(q) ||
          f.type.toLowerCase().includes(q)
      );
      if (filtered.length > 0) result[cat] = filtered;
    }

    return result;
  }, [groupedFields, searchTerm]);

  const totalFields = Object.values(filteredGroups).reduce((acc, fields) => acc + fields.length, 0);
  const hasForm = form.survey.length > 0;

  // Insert handler — dispatches a custom event that ReportCanvas listens for
  const handleInsert = (expression: string, tokenType: string) => {
    window.dispatchEvent(
      new CustomEvent('report-insert-token', {
        detail: { expression, tokenType },
      })
    );
  };

  return (
    <div
      className="bg-[#fafafa] border-r border-gray-200 flex flex-col h-full"
      style={{ width: 300 }}
    >
      {/* Header */}
      <div className="border-b border-gray-200 bg-white" style={{ padding: '16px 16px 12px 16px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <h2 className="text-[15px] font-bold text-gray-900">Fields</h2>
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

        <p className="text-[11px] text-gray-400" style={{ marginBottom: 8 }}>
          Click a field to insert into your report template
        </p>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px 8px 34px' }}
            className="w-full text-[13px] bg-gray-50 border border-gray-200 rounded-lg
              text-gray-700 placeholder-gray-400 transition-fast"
          />
        </div>
      </div>

      {/* Scrollable field list */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '12px 12px 24px 12px' }}>
        {!hasForm ? (
          <div className="flex flex-col items-center justify-center text-center"
            style={{ padding: '48px 16px' }}>
            <AlertCircle size={28} className="text-gray-300 mb-3" />
            <p className="text-[13px] text-gray-500 font-medium">No form loaded</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Load a survey form first to see available fields for your report template
            </p>
          </div>
        ) : totalFields === 0 ? (
          <p className="text-sm text-gray-400 text-center" style={{ padding: '32px 0' }}>
            No matching fields
          </p>
        ) : (
          <>
            {/* Field categories */}
            {Object.entries(CATEGORY_CONFIG).map(([key]) => {
              const fields = filteredGroups[key];
              if (!fields || fields.length === 0) return null;
              return (
                <CategoryGroup
                  key={key}
                  categoryKey={key}
                  fields={fields}
                  isCollapsed={!searchTerm && collapsedCategories.has(key)}
                  onToggle={() => toggleCategory(key)}
                  onInsert={handleInsert}
                />
              );
            })}

            {/* Divider */}
            <div className="border-t border-gray-200 my-4" />

            {/* Special Keywords */}
            <div style={{ marginBottom: 16 }}>
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide"
                style={{ padding: '0 2px', marginBottom: 8 }}>
                Special Keywords
              </h3>
              <div className="flex flex-col" style={{ gap: 4 }}>
                {REPORT_KEYWORDS.map((kw) => (
                  <button
                    key={kw.name}
                    onClick={() => handleInsert(kw.name, 'keyword')}
                    className="w-full flex items-center rounded-md border border-gray-200 bg-white
                      hover:border-purple-300 hover:bg-purple-50 transition-fast text-left"
                    style={{ padding: '7px 10px', gap: 8 }}
                    title={kw.description}
                  >
                    <span className="shrink-0 rounded text-[10px] font-bold text-white flex items-center justify-center bg-purple-500"
                      style={{ width: 22, height: 22 }}>
                      $
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-gray-700 truncate">{kw.label}</div>
                      <div className="text-[10px] text-gray-400 truncate font-mono">{kw.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Blocks */}
            <div className="border-t border-gray-200 my-4" />
            <div>
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide"
                style={{ padding: '0 2px', marginBottom: 8 }}>
                Logic Blocks
              </h3>
              <div className="flex flex-col" style={{ gap: 4 }}>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('report-open-conditional-builder'));
                  }}
                  className="w-full flex items-center rounded-md border border-amber-200 bg-amber-50
                    hover:border-amber-400 hover:bg-amber-100 transition-fast text-left"
                  style={{ padding: '8px 10px', gap: 8 }}
                >
                  <span className="shrink-0 rounded text-[11px] font-bold text-white flex items-center justify-center bg-amber-500"
                    style={{ width: 22, height: 22 }}>
                    if
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-gray-700">Conditional Block</div>
                    <div className="text-[10px] text-gray-400">Show/hide sections based on field values</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('report-open-repeat-builder'));
                  }}
                  className="w-full flex items-center rounded-md border border-violet-200 bg-violet-50
                    hover:border-violet-400 hover:bg-violet-100 transition-fast text-left"
                  style={{ padding: '8px 10px', gap: 8 }}
                >
                  <span className="shrink-0 rounded text-[11px] font-bold text-white flex items-center justify-center bg-violet-500"
                    style={{ width: 22, height: 22 }}>
                    #
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-gray-700">Repeat Block</div>
                    <div className="text-[10px] text-gray-400">Loop through repeat group records</div>
                  </div>
                </button>

                <button
                  onClick={() => handleInsert('/', 'conditional_end')}
                  className="w-full flex items-center rounded-md border border-gray-200 bg-white
                    hover:border-gray-400 hover:bg-gray-50 transition-fast text-left"
                  style={{ padding: '8px 10px', gap: 8 }}
                >
                  <span className="shrink-0 rounded text-[11px] font-bold text-white flex items-center justify-center bg-gray-500"
                    style={{ width: 22, height: 22 }}>
                    /
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-gray-700">End Block</div>
                    <div className="text-[10px] text-gray-400">Close a conditional or repeat block</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
