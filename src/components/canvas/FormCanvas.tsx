/**
 * Form Canvas — Live form preview style like Survey123 web designer
 * Centered on screen with generous padding throughout
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useSurveyStore } from '../../store/surveyStore';
import { SortableQuestionRow } from './SortableQuestionRow';
import { ExpressionBuilder } from '../properties/ExpressionBuilder';
import { CsvEditorModal } from '../properties/CsvEditorModal';
import { Plus } from '../../utils/icons';
import { SurveyRow, ChoiceList } from '../../types/survey';

// ============================================================
// Layout Context — tells child rows what visual layout to use
// ============================================================

export type LayoutContext =
  | { type: 'normal' }
  | { type: 'grid'; columns: 4 }
  | { type: 'table-list'; choices: { name: string; label: string }[] }
  | { type: 'field-list'; pageNumber: number };

/** Determine the layout context for a begin_group row */
function getGroupLayout(row: SurveyRow, pageCounter: number, choiceLists: ChoiceList[], survey: SurveyRow[]): LayoutContext {
  const appearance = row.appearance || '';
  if (appearance.includes('table-list')) {
    // Find the first select_one child to get its choice list
    const startIdx = survey.indexOf(row);
    let choices: { name: string; label: string }[] = [];
    if (startIdx >= 0) {
      let depth = 0;
      for (let i = startIdx; i < survey.length; i++) {
        const r = survey[i];
        if (r.type === 'begin_group' || r.type === 'begin_repeat') depth++;
        if (r.type === 'end_group' || r.type === 'end_repeat') depth--;
        if (depth === 0) break;
        if (depth === 1 && r.type === 'select_one' && r.listName) {
          const list = choiceLists.find(cl => cl.list_name === r.listName);
          if (list) {
            choices = list.choices.map(c => ({ name: c.name, label: c.label }));
          }
          break;
        }
      }
    }
    return { type: 'table-list', choices };
  }
  if (appearance.includes('field-list')) {
    return { type: 'field-list', pageNumber: pageCounter };
  }
  // Check if any direct children have w1-w4 appearances, or the group itself has w appearance
  if (/\bw[1-4]\b/.test(appearance)) {
    return { type: 'grid', columns: 4 };
  }
  // Check children for w appearances
  const startIdx = survey.indexOf(row);
  if (startIdx >= 0) {
    let depth = 0;
    for (let i = startIdx; i < survey.length; i++) {
      const r = survey[i];
      if (r.type === 'begin_group' || r.type === 'begin_repeat') depth++;
      if (r.type === 'end_group' || r.type === 'end_repeat') depth--;
      if (depth === 0) break;
      if (depth === 1 && r.appearance && /\bw[1-4]\b/.test(r.appearance)) {
        return { type: 'grid', columns: 4 };
      }
    }
  }
  return { type: 'normal' };
}

/** Build a map of row ID -> layout context based on parent groups */
function buildLayoutMap(
  survey: SurveyRow[],
  choiceLists: ChoiceList[],
  collapsedGroups: Set<string>
): Map<string, LayoutContext> {
  const layoutMap = new Map<string, LayoutContext>();
  const layoutStack: LayoutContext[] = [];
  const groupIdStack: string[] = [];
  let pageCounter = 0;

  for (const row of survey) {
    if (row.type === 'begin_group') {
      const layout = getGroupLayout(row, ++pageCounter, choiceLists, survey);
      if (layout.type !== 'field-list') pageCounter--; // only count field-list pages
      layoutMap.set(row.id, layout); // The group header itself gets its own layout context
      layoutStack.push(layout);
      groupIdStack.push(row.id);
    } else if (row.type === 'end_group') {
      layoutStack.pop();
      groupIdStack.pop();
      // End markers get the layout of their parent group
      const parentLayout = layoutStack.length > 0 ? layoutStack[layoutStack.length - 1] : { type: 'normal' as const };
      layoutMap.set(row.id, parentLayout);
    } else if (row.type === 'begin_repeat' || row.type === 'end_repeat') {
      // Repeats don't create layout contexts
      if (row.type === 'begin_repeat') {
        layoutStack.push({ type: 'normal' });
        groupIdStack.push(row.id);
      } else {
        layoutStack.pop();
        groupIdStack.pop();
      }
      layoutMap.set(row.id, layoutStack.length > 0 ? layoutStack[layoutStack.length - 1] : { type: 'normal' });
    } else {
      // Regular questions get the layout of their nearest parent group
      const currentLayout = layoutStack.length > 0 ? layoutStack[layoutStack.length - 1] : { type: 'normal' as const };
      layoutMap.set(row.id, currentLayout);
    }
  }
  return layoutMap;
}

const EDITOR_LABELS = {
  relevant: 'Visibility Condition',
  calculation: 'Calculation',
  constraint: 'Constraint',
} as const;

// ============================================================
// Inline Editable Text for Header
// ============================================================

function HeaderInlineEdit({
  value,
  onChange,
  placeholder,
  className,
  style,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) onChange(trimmed);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className={className}
        style={{
          ...style,
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 6,
          outline: 'none',
          width: '100%',
          padding: '4px 8px',
          margin: '-4px -8px',
        }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`${className} cursor-text`}
      style={{
        ...style,
        display: 'block',
        borderRadius: 6,
        padding: '4px 8px',
        margin: '-4px -8px',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      title="Click to edit"
    >
      {value || <span style={{ opacity: 0.4 }}>{placeholder}</span>}
    </span>
  );
}

export function FormCanvas() {
  const { form, selectedRowId, selectRow, collapsedGroups, expressionEditor, csvEditor, updateRow, updateSettings, closeExpressionEditor, closeCsvEditor } = useSurveyStore();
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const items = form.survey.map((row) => row.id);
  const depths = calculateDepths(form.survey);
  const hiddenSet = calculateHiddenRows(form.survey, collapsedGroups);
  const layoutMap = React.useMemo(
    () => buildLayoutMap(form.survey, form.choiceLists, collapsedGroups),
    [form.survey, form.choiceLists, collapsedGroups]
  );

  // ---- Question Search ----
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; label: string; type: string }[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchIndex(0);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = form.survey
      .filter((r) => !['end_group', 'end_repeat'].includes(r.type))
      .filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.label || '').toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q)
      )
      .map((r) => ({ id: r.id, name: r.name, label: r.label || r.name, type: r.type }));
    setSearchResults(matches);
    setSearchIndex(0);
  }, [searchQuery, form.survey]);

  // Scroll to and select the current search result
  const jumpToResult = useCallback((index: number) => {
    const result = searchResults[index];
    if (!result) return;
    selectRow(result.id);
    // Scroll the element into view
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-question-id="${result.id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, [searchResults, selectRow]);

  useEffect(() => {
    if (searchResults.length > 0) {
      jumpToResult(searchIndex);
    }
  }, [searchIndex, searchResults, jumpToResult]);

  // Keyboard shortcut: Ctrl/Cmd+F to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const searchNext = () => {
    if (searchResults.length === 0) return;
    setSearchIndex((prev) => (prev + 1) % searchResults.length);
  };
  const searchPrev = () => {
    if (searchResults.length === 0) return;
    setSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
  };

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto canvas-bg flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) selectRow(null);
      }}
    >
      {/* Sticky search header — stays anchored at top while scrolling */}
      <div className="sticky top-0 z-20 canvas-bg" style={{ borderBottom: searchQuery ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '12px 24px' }}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.shiftKey ? searchPrev() : searchNext(); }
                  if (e.key === 'Escape') { setSearchQuery(''); searchInputRef.current?.blur(); }
                }}
                placeholder="Search questions by name, label, or type..."
                style={{ padding: '8px 12px 8px 34px' }}
                className="w-full text-[13px] bg-white border border-gray-200 rounded-lg
                  text-gray-700 placeholder-gray-400 transition-fast outline-none shadow-sm
                  focus:border-[#00856a] focus:ring-1 focus:ring-[#00856a]/20"
              />
            </div>
            {searchQuery && (
              <>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">
                  {searchResults.length === 0
                    ? 'No matches'
                    : `${searchIndex + 1} of ${searchResults.length}`}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={searchPrev}
                    disabled={searchResults.length === 0}
                    className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded transition-fast"
                    title="Previous (Shift+Enter)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={searchNext}
                    disabled={searchResults.length === 0}
                    className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded transition-fast"
                    title="Next (Enter)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-fast"
                  title="Clear search"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Form content area */}
      <div className="flex justify-center flex-1">
      <div style={{ width: '100%', maxWidth: 720, padding: '20px 24px 32px' }}>

        {/* Survey Card */}
        <div className="bg-white rounded-xl shadow-card" style={{ overflow: 'hidden' }}>
          {/* Green header bar — inline editable */}
          <div className="bg-[#007a62]" style={{ padding: '32px 48px' }}>
            <HeaderInlineEdit
              value={form.settings.form_title || ''}
              onChange={(v) => updateSettings({ form_title: v })}
              placeholder="Untitled survey"
              className="text-[22px] font-bold text-white leading-tight"
            />
            <div style={{ marginTop: 8 }}>
              <HeaderInlineEdit
                value={form.settings.description || ''}
                onChange={(v) => updateSettings({ description: v })}
                placeholder="Add a survey description..."
                className="text-[14px] text-white/60"
              />
            </div>
          </div>

          {/* Form body */}
          <div
            ref={setNodeRef}
            className={`transition-fast ${isOver ? 'bg-[#f0faf7]' : 'bg-white'}`}
            style={{ padding: '32px 40px', minHeight: 300 }}
          >
            {items.length === 0 ? (
              <div className={`
                flex flex-col items-center justify-center
                border-2 border-dashed rounded-lg transition-fast
                ${isOver ? 'border-[#00856a] bg-[#f0faf7]' : 'border-gray-200'}
              `} style={{ padding: '64px 24px' }}>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Plus size={24} className="text-gray-400" />
                </div>
                <p className="text-[15px] text-gray-500 font-medium">Drop questions here</p>
                <p className="text-[13px] text-gray-400 mt-1">
                  Drag from the sidebar to build your form
                </p>
              </div>
            ) : (
              <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {renderLayoutAwareRows(form.survey, hiddenSet, depths, layoutMap, selectedRowId, selectRow)}
                </div>
              </SortableContext>
            )}
          </div>

          {/* Submit button (visual only) */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 flex justify-center" style={{ padding: '24px 48px' }}>
              <div className="bg-[#007a62] text-white rounded-lg text-[14px] font-semibold opacity-60 cursor-default"
                style={{ padding: '10px 32px' }}>
                Submit
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 text-center" style={{ padding: '16px 48px' }}>
            <p className="text-[11px] text-gray-400">XLSForm Designer</p>
          </div>
        </div>
      </div>
      </div>

      {/* Expression Editor Modal — rendered outside sortable context */}
      {expressionEditor && (() => {
        const targetRow = form.survey.find((r) => r.id === expressionEditor.rowId);
        if (!targetRow) return null;
        return (
          <ExpressionBuilder
            value={(targetRow as any)[expressionEditor.mode] || ''}
            onChange={(v) => updateRow(targetRow.id, { [expressionEditor.mode]: v })}
            currentRowId={targetRow.id}
            label={EDITOR_LABELS[expressionEditor.mode]}
            mode={expressionEditor.mode}
            initialExpanded
            onCloseExpanded={closeExpressionEditor}
          />
        );
      })()}

      {/* CSV Editor Modal */}
      {csvEditor && (
        <CsvEditorModal
          fileName={csvEditor.fileName}
          onClose={closeCsvEditor}
        />
      )}
    </div>
  );
}

// ============================================================
// Layout-Aware Row Renderer
// Groups children inside grid/table-list/field-list wrappers
// ============================================================

function renderLayoutAwareRows(
  survey: SurveyRow[],
  hiddenSet: Set<string>,
  depths: number[],
  layoutMap: Map<string, LayoutContext>,
  selectedRowId: string | null,
  selectRow: (id: string | null) => void,
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  // Track which grid groups are open so we can wrap children
  const gridGroupStack: { id: string; layout: LayoutContext; childElements: React.ReactNode[]; depth: number }[] = [];

  for (let index = 0; index < survey.length; index++) {
    const row = survey[index];
    if (hiddenSet.has(row.id)) continue;

    const layout = layoutMap.get(row.id) || { type: 'normal' as const };
    const depth = depths[index] || 0;

    // Detect begin_group with special layouts
    if (row.type === 'begin_group') {
      const groupLayout = layout as LayoutContext;
      if (groupLayout.type === 'grid' || groupLayout.type === 'table-list' || groupLayout.type === 'field-list') {
        // Render the group header itself normally
        const headerEl = (
          <SortableQuestionRow
            key={row.id}
            row={row}
            index={index}
            depth={depth}
            isSelected={row.id === selectedRowId}
            onSelect={() => selectRow(row.id)}
            layoutContext={groupLayout}
          />
        );
        // Push to the current container (either parent grid or top level)
        if (gridGroupStack.length > 0) {
          gridGroupStack[gridGroupStack.length - 1].childElements.push(headerEl);
        } else {
          elements.push(headerEl);
        }
        // Start collecting children
        gridGroupStack.push({ id: row.id, layout: groupLayout, childElements: [], depth });
        continue;
      }
    }

    // Detect end_group that closes a layout group
    if (row.type === 'end_group' && gridGroupStack.length > 0) {
      // Check if this end_group matches the current layout group
      // by looking at depth: the end_group depth equals the begin_group depth
      const currentGroup = gridGroupStack[gridGroupStack.length - 1];
      if (depth === currentGroup.depth) {
        // Close this layout group and render the wrapper
        gridGroupStack.pop();
        const wrappedEl = renderLayoutWrapper(
          currentGroup.id,
          currentGroup.layout,
          currentGroup.childElements,
          currentGroup.depth,
        );
        // Render the end marker
        const endEl = (
          <SortableQuestionRow
            key={row.id}
            row={row}
            index={index}
            depth={depth}
            isSelected={row.id === selectedRowId}
            onSelect={() => selectRow(row.id)}
            layoutContext={currentGroup.layout}
          />
        );

        if (gridGroupStack.length > 0) {
          gridGroupStack[gridGroupStack.length - 1].childElements.push(wrappedEl);
          gridGroupStack[gridGroupStack.length - 1].childElements.push(endEl);
        } else {
          elements.push(wrappedEl);
          elements.push(endEl);
        }
        continue;
      }
    }

    // Regular row: render with layout context
    const el = (
      <SortableQuestionRow
        key={row.id}
        row={row}
        index={index}
        depth={depth}
        isSelected={row.id === selectedRowId}
        onSelect={() => selectRow(row.id)}
        layoutContext={layout}
      />
    );

    if (gridGroupStack.length > 0) {
      gridGroupStack[gridGroupStack.length - 1].childElements.push(el);
    } else {
      elements.push(el);
    }
  }

  return elements;
}

/** Wraps collected children in the appropriate layout container */
function renderLayoutWrapper(
  groupId: string,
  layout: LayoutContext,
  children: React.ReactNode[],
  depth: number,
): React.ReactNode {
  if (layout.type === 'grid') {
    return (
      <div
        key={`grid-${groupId}`}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginLeft: `${(depth + 1) * 24}px`,
          padding: '8px 0',
        }}
      >
        {children}
      </div>
    );
  }

  if (layout.type === 'table-list') {
    const choices = layout.choices;
    return (
      <div
        key={`table-${groupId}`}
        style={{ marginLeft: `${(depth + 1) * 24}px`, padding: '4px 0' }}
      >
        {/* Table header with choice labels */}
        {choices.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `minmax(180px, 1fr) ${choices.map(() => 'minmax(60px, 100px)').join(' ')}`,
              gap: 0,
              borderBottom: '2px solid #e5e7eb',
              padding: '8px 12px',
              marginBottom: 2,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Question
            </div>
            {choices.map((c) => (
              <div key={c.name} style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#6b7280',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}>
                {c.label}
              </div>
            ))}
          </div>
        )}
        {/* Table rows (each child is a select_one row rendered as a table row) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {children}
        </div>
      </div>
    );
  }

  if (layout.type === 'field-list') {
    return (
      <div
        key={`page-${groupId}`}
        style={{
          marginLeft: `${(depth + 1) * 24}px`,
          padding: '4px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {children}
      </div>
    );
  }

  // Normal fallback
  return <React.Fragment key={`wrap-${groupId}`}>{children}</React.Fragment>;
}

function calculateDepths(rows: { type: string }[]): number[] {
  const depths: number[] = [];
  let depth = 0;
  for (const row of rows) {
    if (row.type === 'end_group' || row.type === 'end_repeat') {
      depth = Math.max(0, depth - 1);
    }
    depths.push(depth);
    if (row.type === 'begin_group' || row.type === 'begin_repeat') {
      depth++;
    }
  }
  return depths;
}

/**
 * Compute which row IDs should be hidden when groups are collapsed.
 * The begin row stays visible (it shows the collapse toggle).
 * Everything between begin and its matching end is hidden, including the end marker.
 */
function calculateHiddenRows(rows: SurveyRow[], collapsedGroups: Set<string>): Set<string> {
  const hidden = new Set<string>();
  let hideDepth = 0;
  const groupStack: string[] = [];

  for (const row of rows) {
    const isBegin = row.type === 'begin_group' || row.type === 'begin_repeat';
    const isEnd = row.type === 'end_group' || row.type === 'end_repeat';

    if (isBegin) {
      if (hideDepth > 0) hidden.add(row.id);
      groupStack.push(row.id);
      if (collapsedGroups.has(row.id)) hideDepth++;
    } else if (isEnd) {
      const matchId = groupStack.pop();
      if (matchId && collapsedGroups.has(matchId)) hideDepth = Math.max(0, hideDepth - 1);
      if ((matchId && collapsedGroups.has(matchId)) || hideDepth > 0) hidden.add(row.id);
    } else {
      if (hideDepth > 0) hidden.add(row.id);
    }
  }

  return hidden;
}
