/**
 * Sortable Question Row — Live form preview showing actual input widgets
 * Renders appearance-specific previews (spinner, likert, signature, etc.)
 * Supports inline editing of labels (double-click) and choice options.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SurveyRow, ChoiceItem } from '../../types/survey';
import { useSurveyStore } from '../../store/surveyStore';
import { X, Copy, ChevronDown, ChevronRight, Eye, Calculator, AlertCircle } from '../../utils/icons';
import { validateRow, sanitizeFieldName, type RowValidationResult } from '../../utils/validation';

interface Props {
  row: SurveyRow;
  index: number;
  depth: number;
  isSelected: boolean;
  onSelect: () => void;
}

// ============================================================
// Inline Editable Text — swaps to input on double-click
// ============================================================

function InlineEdit({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
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

  // Sync draft when value changes externally
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onChange(trimmed);
    }
  };

  // Block all pointer/mouse events from reaching dnd-kit's sortable listeners
  const stopDrag = {
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        {...stopDrag}
        placeholder={placeholder}
        className={inputClassName || `w-full bg-white border border-[#00856a] rounded px-1.5 py-0.5 outline-none text-gray-800 ${className || ''}`}
        style={{ fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit' }}
      />
    );
  }

  return (
    <span
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setEditing(true);
      }}
      {...stopDrag}
      className={`cursor-text hover:bg-[#e6f5f0] hover:outline hover:outline-1 hover:outline-[#00856a]/30 rounded px-0.5 -mx-0.5 transition-colors ${className || ''}`}
      title="Double-click to edit"
    >
      {value || <span className="text-gray-400 italic">{placeholder || 'Untitled'}</span>}
    </span>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SortableQuestionRow({ row, index, depth, isSelected, onSelect }: Props) {
  const { form, removeRow, duplicateRow, updateRow, collapsedGroups, toggleGroupCollapse } = useSurveyStore();

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${depth * 24}px`,
  };

  const isEndStructural = ['end_group', 'end_repeat'].includes(row.type);
  const isBeginGroup = row.type === 'begin_group';
  const isBeginRepeat = row.type === 'begin_repeat';
  const isMetadata = ['start', 'end', 'username', 'deviceid'].includes(row.type);
  const isHidden = ['calculate', 'hidden'].includes(row.type);

  // End structural markers
  if (isEndStructural) {
    const isEndGroup = row.type === 'end_group';
    return (
      <div ref={setNodeRef} style={style}
        className={`rounded-lg ${isEndGroup
          ? 'bg-[#f7f3ff] border border-purple-200'
          : 'bg-[#f0faf7] border border-teal-200'}`}>
        <div className="flex items-center px-10 py-3">
          <span className={`text-[11px] font-bold uppercase tracking-wide
            ${isEndGroup ? 'text-purple-400' : 'text-teal-400'}`}>
            {isEndGroup ? 'End Group' : 'End Repeat'}
          </span>
        </div>
      </div>
    );
  }

  // Metadata & hidden fields are compact
  if (isMetadata || isHidden) {
    return (
      <div ref={setNodeRef} style={style}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={`flex items-center gap-3 py-4 px-10 rounded-lg text-[12px] cursor-pointer transition-fast
          ${isSelected ? 'bg-[#f0faf7] selected-glow' : 'bg-gray-50 hover:bg-gray-100'}`}>
        <span className="text-gray-400 font-mono text-[11px]">{row.type}</span>
        <span className="text-gray-500">{row.name}</span>
        {row.calculation && (
          <span className="text-[10px] text-gray-400 font-mono truncate flex-1">= {row.calculation}</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
          className="p-1.5 text-gray-300 hover:text-red-500 transition-fast">
          <X size={13} />
        </button>
      </div>
    );
  }

  // Group/Repeat start headers
  if (isBeginGroup || isBeginRepeat) {
    const isCollapsed = collapsedGroups.has(row.id);
    const CollapseIcon = isCollapsed ? ChevronRight : ChevronDown;
    const childCount = (() => {
      // Count items inside this group (for collapsed summary)
      const { form } = useSurveyStore.getState();
      const startIdx = form.survey.findIndex((r) => r.id === row.id);
      if (startIdx === -1) return 0;
      const endType = isBeginGroup ? 'end_group' : 'end_repeat';
      let depth = 0;
      let count = 0;
      for (let i = startIdx; i < form.survey.length; i++) {
        const r = form.survey[i];
        if (r.type === row.type) depth++;
        if (r.type === endType) depth--;
        if (depth === 0) break;
        if (i > startIdx && !['begin_group', 'begin_repeat', 'end_group', 'end_repeat'].includes(r.type)) count++;
      }
      return count;
    })();

    return (
      <div ref={setNodeRef} style={style}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={`rounded-lg cursor-pointer transition-fast
          ${isSelected ? 'selected-glow' : ''}
          ${isBeginGroup
            ? 'bg-[#f7f3ff] border border-purple-200'
            : 'bg-[#f0faf7] border border-teal-200'}`}>
        <div className="flex items-center justify-between" style={{ padding: '16px 28px' }}>
          <div className="flex items-center gap-2">
            {/* Collapse/expand toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleGroupCollapse(row.id); }}
              onPointerDown={(e) => e.stopPropagation()}
              className={`p-0.5 rounded transition-fast ${isBeginGroup
                ? 'text-purple-400 hover:text-purple-600 hover:bg-purple-100'
                : 'text-teal-400 hover:text-teal-600 hover:bg-teal-100'}`}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <CollapseIcon size={14} />
            </button>
            {/* Drag handle */}
            <span {...attributes} {...listeners}
              className={`text-[11px] font-bold uppercase tracking-wide cursor-grab active:cursor-grabbing
              ${isBeginGroup ? 'text-purple-500' : 'text-teal-600'}`}>
              {isBeginGroup ? 'Group' : 'Repeat'}
            </span>
            <span className="text-[14px] text-gray-700 font-medium">
              <InlineEdit
                value={row.label || ''}
                onChange={(v) => updateRow(row.id, { label: v })}
                placeholder={row.name}
              />
            </span>
            {isCollapsed && (
              <span className="text-[11px] text-gray-400 ml-1">
                ({childCount} {childCount === 1 ? 'question' : 'questions'})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); duplicateRow(row.id); }}
              className="p-1.5 text-gray-300 hover:text-gray-500 transition-fast">
              <Copy size={13} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
              className="p-1.5 text-gray-300 hover:text-red-500 transition-fast">
              <X size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compute validation state for border styling
  const allFieldNames = React.useMemo(
    () => new Set(form.survey.map((r: SurveyRow) => r.name)),
    [form.survey]
  );
  const rowValidation = React.useMemo(
    () => validateRow(row, allFieldNames),
    [row, allFieldNames]
  );

  // Standard question — live form preview
  return (
    <div
      ref={setNodeRef}
      style={{ ...style, padding: '10px 14px' }}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`
        relative rounded-lg cursor-pointer transition-fast
        ${isDragging ? 'opacity-40 shadow-card-hover z-50' : ''}
        ${isSelected
          ? 'bg-[#f0faf7] selected-glow'
          : rowValidation.hasErrors
            ? 'bg-red-50/30 border border-red-200 hover:border-red-300'
            : rowValidation.hasWarnings
              ? 'bg-yellow-50/20 border border-yellow-200 hover:border-yellow-300'
              : 'bg-transparent hover:bg-gray-50 border border-transparent hover:border-gray-200'}
      `}
    >
      {/* Action buttons (top right) */}
      <div className={`absolute top-5 right-7 flex items-center gap-0.5
        ${isSelected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 transition-fast`}>
        <button onClick={(e) => { e.stopPropagation(); duplicateRow(row.id); }}
          className="p-1.5 text-gray-400 hover:text-[#00856a] hover:bg-white rounded transition-fast">
          <Copy size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded transition-fast">
          <X size={14} />
        </button>
      </div>

      {/* Question label + hint (inline editable) */}
      <div className="mb-3 pr-16">
        <label className="text-[14px] text-gray-800 font-medium leading-relaxed">
          <InlineEdit
            value={row.label || ''}
            onChange={(v) => updateRow(row.id, { label: v })}
            placeholder="Untitled question"
          />
          {row.required === 'yes' && <span className="text-red-500 ml-1">*</span>}
        </label>
        {row.hint && (
          <p className="text-[12px] text-gray-400 mt-1">{row.hint}</p>
        )}
      </div>

      {/* Live input preview */}
      <QuestionWidget row={row} />

      {/* Logic indicators */}
      <LogicBadges row={row} />
    </div>
  );
}

// ============================================================
// Shared input class
// ============================================================

// ============================================================
// Logic Indicator Badges — subtle pills showing conditions/calculations
// ============================================================

function LogicBadges({ row }: { row: SurveyRow }) {
  const { form, updateRow, openExpressionEditor } = useSurveyStore();

  // Build set of all field names for expression validation
  const allFieldNames = React.useMemo(
    () => new Set(form.survey.map((r) => r.name)),
    [form.survey]
  );

  // Run full validation
  const validation = React.useMemo(
    () => validateRow(row, allFieldNames),
    [row, allFieldNames]
  );

  const hasIssues = validation.hasErrors || validation.hasWarnings;

  // All three badge definitions — always present, styled based on whether expression exists
  type BadgeMode = 'relevant' | 'calculation' | 'constraint';
  interface BadgeDef {
    icon: React.ReactNode;
    label: string;
    mode: BadgeMode;
    hasValue: boolean;
    activeColor: string;
    activeHover: string;
    tooltip: string;
  }

  const allBadges: BadgeDef[] = [
    {
      icon: <Eye size={10} />,
      label: 'Visibility',
      mode: 'relevant',
      hasValue: !!row.relevant,
      activeColor: 'bg-blue-50 text-blue-500 border-blue-200',
      activeHover: 'hover:bg-blue-100 hover:border-blue-300',
      tooltip: row.relevant || 'Add visibility condition',
    },
    {
      icon: <Calculator size={10} />,
      label: 'Calculated',
      mode: 'calculation',
      hasValue: !!row.calculation,
      activeColor: 'bg-amber-50 text-amber-600 border-amber-200',
      activeHover: 'hover:bg-amber-100 hover:border-amber-300',
      tooltip: row.calculation || 'Add calculation',
    },
    {
      icon: <AlertCircle size={10} />,
      label: 'Constraint',
      mode: 'constraint',
      hasValue: !!row.constraint,
      activeColor: 'bg-orange-50 text-orange-500 border-orange-200',
      activeHover: 'hover:bg-orange-100 hover:border-orange-300',
      tooltip: row.constraint || 'Add validation constraint',
    },
  ];

  // IMPORTANT: All hooks must be called before any conditional returns (React rules of hooks)
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const handlers: Array<{ el: HTMLSpanElement; handler: (e: MouseEvent) => void }> = [];
    allBadges.forEach((b, i) => {
      const el = badgeRefs.current[i];
      if (!el) return;
      const handler = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        openExpressionEditor(row.id, b.mode);
      };
      el.addEventListener('click', handler, true);
      handlers.push({ el, handler });
    });
    return () => {
      handlers.forEach(({ el, handler }) => el.removeEventListener('click', handler, true));
    };
  }, [row.id, row.relevant, row.calculation, row.constraint, openExpressionEditor]);

  return (
    <div style={{ marginTop: 8 }}>
      {/* Logic badges — always visible, muted when empty */}
      <div className="flex flex-wrap items-center gap-1.5"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {allBadges.map((b, i) => (
          <span
            key={b.mode}
            ref={(el) => { badgeRefs.current[i] = el; }}
            className={`inline-flex items-center gap-1 border rounded-full cursor-pointer select-none transition-fast ${
              b.hasValue
                ? `${b.activeColor} ${b.activeHover}`
                : 'bg-transparent text-gray-300 border-gray-200/60 hover:bg-gray-50 hover:text-gray-400 hover:border-gray-300'
            }`}
            style={{ padding: '2px 8px', fontSize: 10, fontWeight: 500 }}
            title={b.hasValue ? `${b.tooltip} — Click to edit` : b.tooltip}
          >
            {b.icon}
            {b.label}
            {!b.hasValue && (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </span>
        ))}
      </div>

      {/* Validation error/warning indicators */}
      {hasIssues && (
        <div className="flex flex-wrap items-center gap-1.5" style={{ marginTop: 6 }}>
          {/* Field name issues */}
          {validation.fieldNameIssues.map((issue, i) => (
            <span
              key={`fn-${i}`}
              className={`inline-flex items-center gap-1 border rounded-full cursor-default ${
                issue.level === 'error'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}
              style={{ padding: '2px 8px', fontSize: 10, fontWeight: 500 }}
              title={issue.autoFix ? `${issue.message}. Click to fix → "${issue.autoFix}"` : issue.message}
            >
              {issue.level === 'error' ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
              {issue.message}
              {issue.autoFix && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateRow(row.id, { name: sanitizeFieldName(row.name) });
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="ml-0.5 underline hover:no-underline"
                  style={{ fontSize: 10 }}
                >
                  Fix
                </button>
              )}
            </span>
          ))}

          {/* Expression issues */}
          {validation.expressionIssues.map((ei) =>
            ei.issues.map((issue, i) => (
              <span
                key={`${ei.field}-${i}`}
                className={`inline-flex items-center gap-1 border rounded-full ${
                  issue.level === 'error'
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}
                style={{ padding: '2px 8px', fontSize: 10, fontWeight: 500 }}
                title={`${ei.field}: ${issue.message}`}
              >
                {issue.level === 'error' ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
                {ei.field}: {issue.message}
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Shared input class
// ============================================================

const INPUT_CLS = "w-full px-4 py-2.5 text-[13px] border border-gray-300 rounded-lg bg-white text-gray-400 cursor-pointer";

// ============================================================
// Live Input Widgets — Render actual form controls
// Appearance-aware: shows spinners, likert scales, dropdowns, etc.
// ============================================================

function QuestionWidget({ row }: { row: SurveyRow }) {
  const appearance = row.appearance || '';

  switch (row.type) {
    case 'text':
      if (appearance.includes('multiline')) {
        return (
          <textarea
            disabled
            placeholder="Enter text..."
            className={`${INPUT_CLS} resize-none h-24`}
          />
        );
      }
      return <input type="text" disabled placeholder="Enter text..." className={INPUT_CLS} />;

    case 'email':
      return <input type="text" disabled placeholder="name@example.com" className={INPUT_CLS} />;

    case 'password':
      return <input type="text" disabled placeholder="••••••••" className={INPUT_CLS} />;

    case 'integer':
    case 'decimal': {
      const placeholder = row.type === 'integer' ? '0' : '0.00';

      if (appearance.includes('spinner')) {
        return (
          <div className="flex items-center gap-0">
            <button disabled className="px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-l-lg text-gray-500 text-[16px] font-bold">
              −
            </button>
            <input type="text" disabled placeholder={placeholder}
              className="flex-1 px-4 py-2.5 text-[13px] text-center border-t border-b border-gray-300 bg-white text-gray-400 cursor-pointer" />
            <button disabled className="px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-r-lg text-gray-500 text-[16px] font-bold">
              +
            </button>
          </div>
        );
      }

      if (appearance.includes('calculator')) {
        return (
          <div className="flex items-center gap-2">
            <input type="text" disabled placeholder={placeholder}
              className={`flex-1 ${INPUT_CLS}`} />
            <button disabled className="px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-[18px] text-gray-500">
              🔢
            </button>
          </div>
        );
      }

      if (appearance.includes('distress')) {
        return (
          <div className="flex items-center gap-1 py-1">
            {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
              <div key={n} className={`flex-1 text-center py-2 rounded text-[11px] font-medium border
                ${n <= 3 ? 'bg-green-50 border-green-200 text-green-600'
                  : n <= 6 ? 'bg-yellow-50 border-yellow-200 text-yellow-600'
                  : 'bg-red-50 border-red-200 text-red-600'}`}>
                {n}
              </div>
            ))}
          </div>
        );
      }

      return <input type="text" disabled placeholder={placeholder} className={INPUT_CLS} />;
    }

    case 'range':
      return (
        <div className="flex items-center gap-3 py-2">
          <span className="text-[12px] text-gray-400 font-medium">0</span>
          <div className="flex-1 relative h-2 bg-gray-200 rounded-full">
            <div className="absolute left-0 top-0 h-2 w-1/3 bg-[#00856a] rounded-full" />
            <div className="absolute left-1/3 top-1/2 -translate-y-1/2 -translate-x-1/2
              w-5 h-5 bg-[#00856a] rounded-full border-2 border-white shadow" />
          </div>
          <span className="text-[12px] text-gray-400 font-medium">10</span>
        </div>
      );

    case 'select_one':
      return <SelectPreview row={row} multi={false} />;

    case 'select_multiple':
      return <SelectPreview row={row} multi={true} />;

    case 'rank':
      return <SelectPreview row={row} multi={false} />;

    case 'date':
      if (appearance.includes('year')) {
        return <input type="text" disabled placeholder="yyyy" className={INPUT_CLS} />;
      }
      if (appearance.includes('month-year')) {
        return <input type="text" disabled placeholder="mm/yyyy" className={INPUT_CLS} />;
      }
      return <input type="text" disabled placeholder="mm/dd/yyyy" className={INPUT_CLS} />;

    case 'time':
      return <input type="text" disabled placeholder="--:-- --" className={INPUT_CLS} />;

    case 'datetime':
      return <input type="text" disabled placeholder="mm/dd/yyyy  --:-- --" className={INPUT_CLS} />;

    case 'geopoint':
      return (
        <div className="w-full h-36 bg-[#e8efe8] rounded-lg border border-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[24px] mb-1">📍</div>
            <span className="text-[12px] text-gray-500">Tap to capture location</span>
          </div>
        </div>
      );

    case 'geotrace':
    case 'geoshape':
      return (
        <div className="w-full h-36 bg-[#e8efe8] rounded-lg border border-gray-200 flex items-center justify-center">
          <span className="text-[12px] text-gray-500">
            {row.type === 'geotrace' ? 'Draw a line on the map' : 'Draw a shape on the map'}
          </span>
        </div>
      );

    case 'image':
      if (appearance.includes('signature')) {
        return (
          <div className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1">
            <span className="text-[20px]">✍️</span>
            <span className="text-[12px] text-gray-400">Tap to sign</span>
          </div>
        );
      }
      if (appearance.includes('draw')) {
        return (
          <div className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1">
            <span className="text-[20px]">🖊️</span>
            <span className="text-[12px] text-gray-400">Tap to draw</span>
          </div>
        );
      }
      if (appearance.includes('annotate')) {
        return (
          <div className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1">
            <span className="text-[20px]">🖼️</span>
            <span className="text-[12px] text-gray-400">Take photo and annotate</span>
          </div>
        );
      }
      return (
        <div className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1">
          <div className="text-[28px]">📷</div>
          <span className="text-[12px] text-gray-400">Take photo or choose image</span>
        </div>
      );

    case 'audio':
      return (
        <div className="w-full py-5 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
          </div>
          <span className="text-[12px] text-gray-400">Tap to record audio</span>
        </div>
      );

    case 'file':
      return (
        <div className="w-full py-5 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <span className="text-[12px] text-gray-400">Choose a file to upload</span>
        </div>
      );

    case 'barcode':
      return (
        <div className="flex gap-2">
          <input type="text" disabled placeholder="Scan result..."
            className={`flex-1 ${INPUT_CLS}`} />
          <button disabled className="px-5 py-2.5 bg-gray-100 border border-gray-300 rounded-lg
            text-[12px] text-gray-500 font-medium">
            Scan
          </button>
        </div>
      );

    case 'note':
      return (
        <div className="text-[13px] text-gray-500 italic py-1">
          {row.label || 'Information note'}
        </div>
      );

    default:
      return null;
  }
}

// ============================================================
// Inline Editable Choice Label
// ============================================================

function InlineChoiceEdit({
  choice,
  listName,
}: {
  choice: ChoiceItem;
  listName: string;
}) {
  const { updateChoice } = useSurveyStore();

  return (
    <InlineEdit
      value={choice.label}
      onChange={(v) => updateChoice(listName, choice.id, { label: v })}
      placeholder="Option label"
      className="text-[13px]"
    />
  );
}

// ============================================================
// Select question preview with inline-editable choice options
// Appearance-aware: minimal=dropdown, likert=scale, autocomplete=search
// ============================================================

function SelectPreview({ row, multi }: { row: SurveyRow; multi: boolean }) {
  const { form, addChoice, removeChoice } = useSurveyStore();
  const appearance = row.appearance || '';
  const list = row.listName
    ? form.choiceLists.find((cl) => cl.list_name === row.listName)
    : null;

  const choices = list?.choices || [];
  const hasRealList = !!list;

  // Fallback display choices when no list exists
  const displayChoices = choices.length > 0
    ? choices
    : [
        { id: '_1', list_name: '', name: 'option_1', label: 'Option 1' },
        { id: '_2', list_name: '', name: 'option_2', label: 'Option 2' },
        { id: '_3', list_name: '', name: 'option_3', label: 'Option 3' },
      ];

  const handleAddOption = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (row.listName) {
      addChoice(row.listName);
    }
  };

  // Minimal / autocomplete = dropdown (no inline editing for dropdown)
  if (appearance.includes('minimal') || appearance.includes('autocomplete')) {
    return (
      <div className="relative">
        <select disabled
          className={`${INPUT_CLS} appearance-none pr-10`}>
          <option>{appearance.includes('autocomplete') ? 'Type to search...' : 'Select an option...'}</option>
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        {hasRealList && (
          <button
            onClick={handleAddOption}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="mt-1.5 text-[11px] text-[#00856a] hover:text-[#006b54] font-medium transition-fast"
          >
            + Add option
          </button>
        )}
      </div>
    );
  }

  // Likert appearance — horizontal scale
  if (appearance.includes('likert')) {
    return (
      <div>
        <div className="flex gap-1.5">
          {displayChoices.map((c, i) => (
            <div key={c.id || i} className="flex-1 text-center">
              <div className="w-full py-2.5 border border-gray-300 rounded-lg text-[11px] text-gray-500 bg-white hover:bg-gray-50">
                {hasRealList ? (
                  <InlineChoiceEdit choice={c} listName={row.listName!} />
                ) : (
                  c.label
                )}
              </div>
            </div>
          ))}
        </div>
        {hasRealList && (
          <button
            onClick={handleAddOption}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="mt-2 text-[11px] text-[#00856a] hover:text-[#006b54] font-medium transition-fast"
          >
            + Add option
          </button>
        )}
      </div>
    );
  }

  // Horizontal / compact appearance
  if (appearance.includes('horizontal') || appearance.includes('compact')) {
    return (
      <div>
        <div className="flex flex-wrap gap-2">
          {displayChoices.slice(0, 8).map((c, i) => (
            <div key={c.id || i} className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg bg-white group/choice">
              {multi ? (
                <div className="w-4 h-4 rounded border-2 border-gray-300 bg-white shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white shrink-0" />
              )}
              <span className="text-[12px] text-gray-600">
                {hasRealList ? (
                  <InlineChoiceEdit choice={c} listName={row.listName!} />
                ) : (
                  c.label
                )}
              </span>
              {hasRealList && displayChoices.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeChoice(row.listName!, c.id); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="opacity-0 group-hover/choice:opacity-100 text-gray-300 hover:text-red-400 transition-fast shrink-0 -mr-1"
                  title="Remove option"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
          {displayChoices.length > 8 && (
            <span className="text-[11px] text-gray-400 self-center">+{displayChoices.length - 8} more</span>
          )}
        </div>
        {hasRealList && (
          <button
            onClick={handleAddOption}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="mt-2 text-[11px] text-[#00856a] hover:text-[#006b54] font-medium transition-fast"
          >
            + Add option
          </button>
        )}
      </div>
    );
  }

  // Default: radio/checkbox list (vertical) with inline editing
  return (
    <div className="space-y-2.5">
      {displayChoices.slice(0, 8).map((c, i) => (
        <div key={c.id || i} className="flex items-center gap-3 group/choice">
          {multi ? (
            <div className="w-[18px] h-[18px] rounded border-2 border-gray-300 bg-white shrink-0" />
          ) : (
            <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 bg-white shrink-0" />
          )}
          <span className="text-[13px] text-gray-600 flex-1">
            {hasRealList ? (
              <InlineChoiceEdit choice={c} listName={row.listName!} />
            ) : (
              c.label
            )}
          </span>
          {hasRealList && displayChoices.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); removeChoice(row.listName!, c.id); }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="opacity-0 group-hover/choice:opacity-100 text-gray-300 hover:text-red-400 transition-fast shrink-0"
              title="Remove option"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
      {displayChoices.length > 8 && (
        <p className="text-[11px] text-gray-400 pl-8">+{displayChoices.length - 8} more options</p>
      )}
      {hasRealList && (
        <button
          onClick={handleAddOption}
          onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center gap-3 text-[12px] text-[#00856a] hover:text-[#006b54] font-medium transition-fast pl-0.5"
        >
          <div className="w-[18px] h-[18px] rounded-full border-2 border-dashed border-[#00856a]/40 shrink-0 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          Add option
        </button>
      )}
    </div>
  );
}
