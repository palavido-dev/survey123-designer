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
import type { LayoutContext } from './FormCanvas';
import { X, Copy, ChevronDown, ChevronRight, Eye, Calculator, AlertCircle } from '../../utils/icons';
import { validateRow, validateFieldName, sanitizeFieldName, type RowValidationResult } from '../../utils/validation';
import { RichTextEditor, sanitizeHtml, containsHtml } from '../properties/RichTextEditor';
import { CascadingSelectWizard } from '../properties/CascadingSelectWizard';

interface Props {
  row: SurveyRow;
  index: number;
  depth: number;
  isSelected: boolean;
  onSelect: () => void;
  layoutContext?: LayoutContext;
}

/** Format XLSForm type names into human-readable labels */
function formatTypeName(type: string): string {
  const map: Record<string, string> = {
    text: 'Text',
    integer: 'Integer',
    decimal: 'Decimal',
    select_one: 'Select One',
    select_multiple: 'Select Multiple',
    select_one_from_file: 'Select One (CSV)',
    select_multiple_from_file: 'Select Multiple (CSV)',
    date: 'Date',
    time: 'Time',
    datetime: 'Date & Time',
    geopoint: 'Geopoint',
    geotrace: 'Geotrace',
    geoshape: 'Geoshape',
    image: 'Image',
    audio: 'Audio',
    file: 'File',
    barcode: 'Barcode',
    note: 'Note',
    calculate: 'Calculate',
    hidden: 'Hidden',
    range: 'Range',
    rank: 'Rank',
    email: 'Email',
    password: 'Password',
    begin_group: 'Group',
    begin_repeat: 'Repeat',
  };
  return map[type] || type;
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
          // Stop ALL keyboard events from reaching dnd-kit's KeyboardSensor
          // (which intercepts Space/Enter to initiate drag)
          e.stopPropagation();
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
// Variable Reference Helpers — parse and render ${field} tokens
// ============================================================

/** Check if a string contains ${...} variable references */
function containsVariableRef(text: string): boolean {
  return /\$\{[^}]+\}/.test(text || '');
}

/** Split label text into segments of plain text and variable references */
function parseVariableRefs(text: string): Array<{ type: 'text' | 'variable'; value: string }> {
  const parts: Array<{ type: 'text' | 'variable'; value: string }> = [];
  const regex = /\$\{([^}]+)\}/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'variable', value: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return parts;
}

/** Renders label text with ${field} references as teal pill badges */
function LabelWithVariables({ text, className }: { text: string; className?: string }) {
  const parts = parseVariableRefs(text);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.type === 'variable' ? (
          <span
            key={i}
            className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full
              bg-[#e6f5f0] text-[#007a62] text-[12px] font-mono font-medium
              border border-[#b2e0d4] mx-0.5 align-baseline"
            title={`Field reference: \${${part.value}}`}
          >
            <svg className="w-2.5 h-2.5 opacity-50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 8l-4 4 4 4M17 8l4 4-4 4" />
            </svg>
            {part.value}
          </span>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </span>
  );
}

// ============================================================
// Inline Edit with Variable Picker
// ============================================================

function InlineEditWithVariables({
  value,
  onChange,
  placeholder,
  className,
  currentRowId,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  currentRowId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const form = useSurveyStore((s) => s.form);

  // All fields except the current row and structural types
  const fields = React.useMemo(() =>
    form.survey.filter((r) =>
      r.id !== currentRowId &&
      !['end_group', 'end_repeat', 'begin_group', 'begin_repeat'].includes(r.type)
    ),
    [form.survey, currentRowId]
  );

  const filteredFields = React.useMemo(() => {
    if (!pickerSearch) return fields;
    const q = pickerSearch.toLowerCase();
    return fields.filter((f) =>
      f.name.toLowerCase().includes(q) || (f.label || '').toLowerCase().includes(q)
    );
  }, [fields, pickerSearch]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
        setPickerSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const commit = () => {
    setEditing(false);
    setShowPicker(false);
    setPickerSearch('');
    const trimmed = draft.trim();
    if (trimmed !== value) onChange(trimmed);
  };

  const insertVariable = (fieldName: string) => {
    const input = inputRef.current;
    const token = `\${${fieldName}}`;
    if (input) {
      const start = input.selectionStart ?? draft.length;
      const end = input.selectionEnd ?? draft.length;
      const newVal = draft.slice(0, start) + token + draft.slice(end);
      setDraft(newVal);
      // Restore cursor after the inserted token
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const pos = start + token.length;
          inputRef.current.setSelectionRange(pos, pos);
          inputRef.current.focus();
        }
      });
    } else {
      setDraft(draft + token);
    }
    setShowPicker(false);
    setPickerSearch('');
  };

  const stopDrag = {
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  };

  if (editing) {
    return (
      <div className="relative" {...stopDrag}>
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => {
              // Don't commit if clicking into the picker
              if (pickerRef.current?.contains(e.relatedTarget as Node)) return;
              commit();
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setDraft(value); setEditing(false); setShowPicker(false); }
            }}
            placeholder={placeholder}
            className={`flex-1 bg-white border border-[#00856a] rounded px-1.5 py-0.5 outline-none text-gray-800 ${className || ''}`}
            style={{ fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit' }}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); setPickerSearch(''); }}
            className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded
              bg-[#007a62] text-white hover:bg-[#006652] transition-colors"
            title="Insert field variable"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 8l-4 4 4 4M17 8l4 4-4 4" />
            </svg>
          </button>
        </div>

        {/* Field picker dropdown */}
        {showPicker && (
          <div
            ref={pickerRef}
            className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Search fields..."
                className="w-full px-2 py-1.5 text-[12px] border border-gray-200 rounded outline-none focus:border-[#007a62]"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredFields.length === 0 ? (
                <div className="px-3 py-4 text-[12px] text-gray-400 text-center">No matching fields</div>
              ) : (
                filteredFields.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => insertVariable(f.name)}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f0faf7] flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-[12px] text-gray-700 font-medium truncate">{f.label || f.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{f.name}</div>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                      {formatTypeName(f.type)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Not editing: show label with variable pills
  const hasVars = containsVariableRef(value);
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
      {value ? (
        hasVars ? <LabelWithVariables text={value} /> : value
      ) : (
        <span className="text-gray-400 italic">{placeholder || 'Untitled'}</span>
      )}
    </span>
  );
}

// ============================================================
// Inline Editable Field Name — with rename propagation
// ============================================================

function InlineFieldNameEdit({
  row,
}: {
  row: SurveyRow;
}) {
  const { form, renameField } = useSurveyStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row.name);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) { setDraft(row.name); setError(null); }
  }, [row.name, editing]);

  // Live validation as user types
  useEffect(() => {
    if (!editing) return;
    if (draft === row.name) { setError(null); return; }
    if (!draft.trim()) { setError('Name cannot be empty'); return; }

    // Check for duplicates
    const isDuplicate = form.survey.some(
      (r) => r.id !== row.id && r.name === draft.trim()
    );
    if (isDuplicate) { setError(`"${draft}" already exists`); return; }

    // Run field name validation
    const issues = validateFieldName(draft.trim());
    const firstError = issues.find((i) => i.level === 'error');
    if (firstError) { setError(firstError.message); return; }

    setError(null);
  }, [draft, editing, form.survey, row.id, row.name]);

  const commit = () => {
    const trimmed = draft.trim();
    setEditing(false);

    if (!trimmed || trimmed === row.name || error) {
      setDraft(row.name);
      return;
    }

    const result = renameField(row.name, trimmed);
    // The result includes which rows were updated (for potential toast notification later)
    if (result.updatedRows.length > 1) {
      // More than just the renamed field itself — references were updated
      const refCount = result.updatedRows.length - 1;
      console.log(`Renamed "${row.name}" → "${trimmed}" and updated ${refCount} reference${refCount > 1 ? 's' : ''}`);
    }
  };

  const stopDrag = {
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  };

  if (editing) {
    return (
      <span className="relative inline-flex items-center" {...stopDrag}>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\s/g, '_'))}
          onBlur={commit}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(row.name); setEditing(false); }
          }}
          className={`font-mono bg-white border rounded px-1.5 py-0.5 outline-none text-[10px] ${
            error
              ? 'border-red-400 text-red-700 ring-1 ring-red-200'
              : 'border-[#00856a] text-gray-700 ring-1 ring-[#00856a]/20'
          }`}
          style={{ minWidth: 60, maxWidth: 200 }}
          spellCheck={false}
        />
        {error && (
          <span className="absolute left-0 top-full mt-1 z-50 bg-red-50 border border-red-200 rounded px-2 py-1 text-[9px] text-red-600 whitespace-nowrap shadow-lg">
            {error}
          </span>
        )}
      </span>
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
      className="font-mono not-italic cursor-text hover:bg-[#e6f5f0] hover:outline hover:outline-1 hover:outline-[#00856a]/30 rounded px-0.5 -mx-0.5 transition-colors"
      title="Double-click to rename field (updates all references)"
    >
      {row.name}
    </span>
  );
}

// ============================================================
// HTML Label — renders sanitized HTML content (read-only on canvas)
// ============================================================

function HtmlLabel({ html }: { html: string }) {
  const safe = React.useMemo(() => {
    let s = sanitizeHtml(html);
    // Replace ${fieldname} tokens with styled pill spans
    s = s.replace(/\$\{([^}]+)\}/g, '<span class="variable-pill" title="Field reference: ${$1}" style="display:inline-flex;align-items:center;gap:2px;padding:0 6px;border-radius:9999px;background:#e6f5f0;color:#007a62;font-size:12px;font-family:monospace;font-weight:500;border:1px solid #b2e0d4;margin:0 2px">$1</span>');
    return s;
  }, [html]);
  return (
    <span
      className="html-label-preview"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

// ============================================================
// Note Label — renders HTML with inline rich text editing
// ============================================================

function NoteLabel({ row }: { row: SurveyRow }) {
  const { updateRow } = useSurveyStore();
  const [editing, setEditing] = useState(false);
  const hasHtml = containsHtml(row.label);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Block dnd-kit events while editing
  const stopDrag = {
    onPointerDown: (e: React.PointerEvent) => { if (editing) e.stopPropagation(); },
    onMouseDown: (e: React.MouseEvent) => { if (editing) e.stopPropagation(); },
  };

  if (editing) {
    return (
      <div
        {...stopDrag}
        ref={wrapperRef}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <RichTextEditor
          value={row.label || ''}
          onChange={(html) => updateRow(row.id, { label: html })}
          compact
          autoFocus
          onBlur={() => setEditing(false)}
        />
      </div>
    );
  }

  // Display mode — render HTML or plain text
  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setEditing(true);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="cursor-text hover:bg-[#e6f5f0] hover:outline hover:outline-1 hover:outline-[#00856a]/30 rounded px-1 -mx-1 transition-colors"
      title="Double-click to edit with rich text"
      style={{ minHeight: 24 }}
    >
      {hasHtml ? (
        <HtmlLabel html={row.label} />
      ) : containsVariableRef(row.label) ? (
        <div className="text-[14px] text-gray-700 leading-relaxed">
          <LabelWithVariables text={row.label} />
        </div>
      ) : (
        <div className="text-[14px] text-gray-500 italic">
          {row.label || 'Information note — double-click to edit'}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

/** Small validation indicator dot shown on rows with issues */
function ValidationDot({ rowId }: { rowId: string }) {
  const validationResult = useSurveyStore((s) => s.validationResult);
  if (!validationResult) return null;
  const rowIssue = validationResult.rowIssues.get(rowId);
  if (!rowIssue) return null;
  const hasErrors = rowIssue.errors > 0;
  return (
    <span
      title={`${rowIssue.errors} error${rowIssue.errors !== 1 ? 's' : ''}, ${rowIssue.warnings} warning${rowIssue.warnings !== 1 ? 's' : ''}`}
      className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white z-10 ${
        hasErrors ? 'bg-red-500' : 'bg-amber-400'
      }`}
    />
  );
}

export function SortableQuestionRow({ row, index, depth, isSelected, onSelect, layoutContext }: Props) {
  const { form, removeRow, duplicateRow, updateRow, collapsedGroups, toggleGroupCollapse } = useSurveyStore();
  const layout = layoutContext || { type: 'normal' as const };

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: row.id });

  // In grid layout, children don't need marginLeft (the wrapper handles it)
  // and they need gridColumn span based on their w-appearance
  const isInsideLayout = layout.type === 'grid' || layout.type === 'table-list' || layout.type === 'field-list';
  const isBeginOrEnd = ['begin_group', 'begin_repeat', 'end_group', 'end_repeat'].includes(row.type);
  const useLayoutMargin = isInsideLayout && !isBeginOrEnd;

  const gridSpan = (() => {
    if (layout.type !== 'grid') return undefined;
    const app = row.appearance || '';
    const wMatch = app.match(/\bw([1-4])\b/);
    return wMatch ? parseInt(wMatch[1]) : layout.defaultSpan; // inherit group's default
  })();

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: useLayoutMargin ? 0 : `${depth * 24}px`,
    ...(layout.type === 'grid' && !isBeginOrEnd ? { gridColumn: `span ${gridSpan}` } : {}),
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
      <div ref={setNodeRef} style={style} data-question-id={row.id} data-row-id={row.id}
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
      <div ref={setNodeRef} style={style} data-question-id={row.id} data-row-id={row.id}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={`flex items-center gap-3 py-4 px-10 rounded-lg text-[12px] cursor-pointer transition-fast
          ${isSelected ? 'bg-[#f0faf7] selected-glow' : 'bg-gray-50 hover:bg-gray-100'}`}>
        <span className="text-gray-400 font-mono text-[11px]">{row.type}</span>
        <span className="text-gray-500"><InlineFieldNameEdit row={row} /></span>
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
      <div ref={setNodeRef} style={style} data-question-id={row.id} data-row-id={row.id}
        {...attributes} {...listeners}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={`rounded-lg cursor-grab active:cursor-grabbing transition-fast
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
            <span
              className={`text-[11px] font-bold uppercase tracking-wide
              ${isBeginGroup ? 'text-purple-500' : 'text-teal-600'}`}>
              {isBeginGroup ? 'Group' : 'Repeat'}
            </span>
            {/* Layout type badge */}
            {layout.type === 'grid' && (
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 border border-blue-200">
                Grid
              </span>
            )}
            {layout.type === 'table-list' && (
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                Table
              </span>
            )}
            {layout.type === 'field-list' && (
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 border border-indigo-200">
                Page {layout.pageNumber}
              </span>
            )}
            <span className="text-[14px] text-gray-700 font-medium">
              {containsHtml(row.label) ? (
                <HtmlLabel html={row.label} />
              ) : (
                <InlineEditWithVariables
                  value={row.label || ''}
                  onChange={(v) => updateRow(row.id, { label: v })}
                  placeholder={row.name}
                  currentRowId={row.id}
                />
              )}
            </span>
            <span className="text-[10px] text-gray-400 italic font-normal ml-1" style={{ opacity: 0.6 }}>
              <InlineFieldNameEdit row={row} />
            </span>
            {isCollapsed && (
              <span className="text-[11px] text-gray-400 ml-1">
                ({childCount} {childCount === 1 ? 'question' : 'questions'})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); duplicateRow(row.id); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 text-gray-300 hover:text-gray-500 transition-fast">
              <Copy size={13} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1.5 text-gray-300 hover:text-red-500 transition-fast">
              <X size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Table-list row: render select_one questions as a table row with radio circles
  if (layout.type === 'table-list' && row.type === 'select_one') {
    const choices = layout.choices;
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, padding: 0 }}
        data-question-id={row.id} data-row-id={row.id}
        {...attributes}
        {...listeners}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={`cursor-pointer transition-fast border-b border-gray-100
          ${isDragging ? 'opacity-40 z-50' : ''}
          ${isSelected ? 'bg-[#f0faf7]' : 'hover:bg-gray-50'}`}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `minmax(180px, 1fr) ${choices.map(() => 'minmax(60px, 100px)').join(' ')}`,
            gap: 0,
            padding: '10px 12px',
            alignItems: 'center',
          }}
        >
          {/* Question label */}
          <div className="flex items-center gap-2 pr-4">
            <span className="text-[13px] text-gray-700 font-medium">
              {row.label || row.name}
              {row.required === 'yes' && <span className="text-red-500 ml-0.5">*</span>}
            </span>
          </div>
          {/* Radio circles for each choice */}
          {choices.map((c) => (
            <div key={c.name} className="flex justify-center">
              <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 bg-white" />
            </div>
          ))}
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
      data-question-id={row.id} data-row-id={row.id}
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
      {/* Validation indicator dot */}
      <ValidationDot rowId={row.id} />

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

      {/* Question type + field name indicator (inline editable) */}
      <div className="mb-1.5 pr-16 flex items-center gap-1.5 text-[10px] text-gray-400 italic font-normal" style={{ letterSpacing: '0.01em' }}>
        <span>{formatTypeName(row.type)}</span>
        <span className="text-gray-300">·</span>
        <InlineFieldNameEdit row={row} />
      </div>

      {/* Question label + hint (inline editable) */}
      <div className="mb-3 pr-16">
        {row.type === 'note' ? (
          <NoteLabel row={row} />
        ) : (
          <label className="text-[14px] text-gray-800 font-medium leading-relaxed">
            {containsHtml(row.label) ? (
              <HtmlLabel html={row.label} />
            ) : (
              <InlineEditWithVariables
                value={row.label || ''}
                onChange={(v) => updateRow(row.id, { label: v })}
                placeholder="Untitled question"
                currentRowId={row.id}
              />
            )}
            {row.required === 'yes' && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
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
// Cascading Detail Popover — shows existing cascading configuration
// ============================================================

function CascadingDetailPopover({
  row,
  isParent,
  isChild,
  childRows,
  onClose,
  onReconfigure,
  onRemove,
  onGoToQuestion,
}: {
  row: SurveyRow;
  isParent: boolean;
  isChild: boolean;
  childRows: SurveyRow[];
  onClose: () => void;
  onReconfigure: () => void;
  onRemove: () => void;
  onGoToQuestion: (id: string) => void;
}) {
  const { form } = useSurveyStore();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click (with mount guard to prevent closing on the same click that opened it)
  useEffect(() => {
    let mounted = false;
    const timer = setTimeout(() => { mounted = true; }, 50);
    const handler = (e: MouseEvent) => {
      if (mounted && popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  // Parse the choice_filter expression to extract parent field name and filter column
  const parseChoiceFilter = (expr: string): { filterColumn: string; parentField: string } | null => {
    // Match patterns like: "region = ${parent_field}"
    const match = expr.match(/^(\w+)\s*=\s*\$\{(\w+)\}$/);
    if (match) return { filterColumn: match[1], parentField: match[2] };
    return null;
  };

  // Find parent question (for child rows)
  const childFilterParsed = isChild && row.choice_filter ? parseChoiceFilter(row.choice_filter) : null;
  const parentQuestion = childFilterParsed
    ? form.survey.find((r) => r.name === childFilterParsed.parentField)
    : null;

  // Get choice list and show sample of filter column values
  const choiceList = row.listName
    ? form.choiceLists.find((cl) => cl.list_name === row.listName)
    : null;

  // For parent: show which child lists reference it and how
  const childDetails = childRows.map((cr) => {
    const parsed = cr.choice_filter ? parseChoiceFilter(cr.choice_filter) : null;
    const cList = cr.listName
      ? form.choiceLists.find((cl) => cl.list_name === cr.listName)
      : null;
    return { row: cr, parsed, choiceCount: cList?.choices.length || 0 };
  });

  // For child: show sample of filter column mappings
  const filterMappingSamples = (() => {
    if (!isChild || !childFilterParsed || !choiceList) return [];
    const col = childFilterParsed.filterColumn;
    return choiceList.choices.slice(0, 6).map((c) => ({
      name: c.name,
      label: c.label,
      filterValue: c[col] || '',
    }));
  })();

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-xl"
      style={{ width: 320, padding: 0 }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100"
        style={{ padding: '10px 14px' }}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" />
          </svg>
          <span className="text-[13px] font-semibold text-gray-800">Cascading Select</span>
        </div>
        <button onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {/* Role badge */}
        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
          {isParent && (
            <span className="text-[10px] font-bold text-violet-600 bg-violet-100 rounded-full"
              style={{ padding: '2px 8px' }}>
              PARENT
            </span>
          )}
          {isChild && (
            <span className="text-[10px] font-bold text-violet-600 bg-violet-100 rounded-full"
              style={{ padding: '2px 8px' }}>
              CHILD
            </span>
          )}
        </div>

        {/* Child view: show parent + filter expression + mappings */}
        {isChild && (
          <div>
            {/* Expression */}
            <div style={{ marginBottom: 10 }}>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                style={{ marginBottom: 3 }}>Choice Filter</div>
              <code className="block text-[11px] font-mono text-violet-700 bg-violet-50 rounded border border-violet-200"
                style={{ padding: '6px 10px' }}>
                {row.choice_filter}
              </code>
            </div>

            {/* Parent question */}
            {parentQuestion && (
              <div style={{ marginBottom: 10 }}>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                  style={{ marginBottom: 3 }}>Filtered By</div>
                <button
                  onClick={() => onGoToQuestion(parentQuestion.id)}
                  className="w-full text-left bg-gray-50 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-colors"
                  style={{ padding: '8px 10px' }}
                >
                  <div className="text-[12px] font-medium text-gray-800">{parentQuestion.label || parentQuestion.name}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{parentQuestion.name} · {parentQuestion.listName}</div>
                </button>
              </div>
            )}

            {/* Filter column mapping preview */}
            {childFilterParsed && filterMappingSamples.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                  style={{ marginBottom: 3 }}>
                  Filter Column: <span className="text-violet-600 font-mono">{childFilterParsed.filterColumn}</span>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200"
                    style={{ padding: '3px 8px' }}>
                    <span className="text-[9px] font-semibold text-gray-400">Value</span>
                    <span className="text-[9px] font-semibold text-gray-400">Label</span>
                    <span className="text-[9px] font-semibold text-violet-400">{childFilterParsed.filterColumn}</span>
                  </div>
                  {filterMappingSamples.map((s) => (
                    <div key={s.name} className="grid grid-cols-3 border-b border-gray-50"
                      style={{ padding: '3px 8px' }}>
                      <span className="text-[10px] text-gray-600 font-mono truncate">{s.name}</span>
                      <span className="text-[10px] text-gray-600 truncate">{s.label}</span>
                      <span className="text-[10px] text-violet-600 font-mono truncate">{s.filterValue || '—'}</span>
                    </div>
                  ))}
                  {choiceList && choiceList.choices.length > 6 && (
                    <div className="text-[9px] text-gray-400 text-center" style={{ padding: '3px 0' }}>
                      +{choiceList.choices.length - 6} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Parent view: show which questions filter by this */}
        {isParent && (
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
              style={{ marginBottom: 4 }}>
              {childDetails.length} question{childDetails.length !== 1 ? 's' : ''} filtered by this
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {childDetails.map((cd) => (
                <button
                  key={cd.row.id}
                  onClick={() => onGoToQuestion(cd.row.id)}
                  className="w-full text-left bg-gray-50 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 transition-colors"
                  style={{ padding: '8px 10px' }}
                >
                  <div className="text-[12px] font-medium text-gray-800">{cd.row.label || cd.row.name}</div>
                  <div className="text-[10px] text-gray-400">
                    <span className="font-mono">{cd.row.name}</span>
                    {cd.parsed && (
                      <span className="text-violet-500 ml-1">
                        · filter: {cd.parsed.filterColumn}
                      </span>
                    )}
                    <span className="ml-1">· {cd.choiceCount} choices</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-100"
        style={{ padding: '8px 14px' }}>
        {isChild ? (
          <button
            onClick={onRemove}
            className="text-[11px] font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            Remove Filter
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={onReconfigure}
          className="text-[11px] font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors"
          style={{ padding: '4px 12px' }}
        >
          Reconfigure
        </button>
      </div>
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
  const { form, updateRow, openExpressionEditor, openCsvEditor, pushUndo, selectRow } = useSurveyStore();
  const [showCascadingWizard, setShowCascadingWizard] = useState<{ parentId?: string } | null>(null);
  const [showCascadingDetail, setShowCascadingDetail] = useState(false);
  const cascadingBadgeRef = useRef<HTMLSpanElement>(null);

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

        {/* CSV File badge — for select_*_from_file questions */}
        {['select_one_from_file', 'select_multiple_from_file'].includes(row.type) && (() => {
          const csvFile = row.fileName
            ? (form.mediaFiles || []).find((f) => f.fileName === row.fileName)
            : null;
          const hasCsv = !!csvFile;
          return (
            <span
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (hasCsv) {
                  openCsvEditor(row.id, row.fileName!);
                }
              }}
              className={`inline-flex items-center gap-1 border rounded-full cursor-pointer select-none transition-fast ${
                hasCsv
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                  : 'bg-transparent text-gray-300 border-gray-200/60 hover:bg-gray-50 hover:text-gray-400 hover:border-gray-300'
              }`}
              style={{ padding: '2px 8px', fontSize: 10, fontWeight: 500 }}
              title={hasCsv
                ? `${csvFile!.fileName} — ${csvFile!.columns.length} cols, ${csvFile!.totalRows} rows — Click to edit`
                : 'No CSV file attached. Upload one in the properties panel.'
              }
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {hasCsv ? csvFile!.fileName : 'CSV File'}
              {!hasCsv && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </span>
          );
        })()}

        {/* Cascading badge — for select_one / select_multiple questions */}
        {['select_one', 'select_multiple'].includes(row.type) && (() => {
          // Check if this question is a cascading PARENT
          const childRows = form.survey.filter(
            (r) => r.id !== row.id && r.choice_filter && r.choice_filter.includes(`\${${row.name}}`)
          );
          const isParent = childRows.length > 0;
          const isChild = !!row.choice_filter;
          const isCascading = isParent || isChild;

          return (
            <span className="relative" ref={cascadingBadgeRef}>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (isCascading) {
                    // Show detail popover for existing relationships
                    setShowCascadingDetail(!showCascadingDetail);
                  } else {
                    // No relationship — go straight to wizard
                    setShowCascadingWizard({ parentId: row.id });
                  }
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-1 border rounded-full cursor-pointer select-none transition-fast ${
                  isCascading
                    ? 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100 hover:border-violet-300'
                    : 'bg-transparent text-gray-300 border-gray-200/60 hover:bg-gray-50 hover:text-gray-400 hover:border-gray-300'
                }`}
                style={{ padding: '2px 8px', fontSize: 10, fontWeight: 500 }}
                title={isCascading ? 'Click to view cascading configuration' : 'Set up cascading select'}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" />
                </svg>
                {isParent ? 'Parent' : isChild ? 'Filtered' : 'Cascading'}
                {!isCascading && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </span>

              {/* Cascading Detail Popover */}
              {showCascadingDetail && isCascading && (
                <CascadingDetailPopover
                  row={row}
                  isParent={isParent}
                  isChild={isChild}
                  childRows={childRows}
                  onClose={() => setShowCascadingDetail(false)}
                  onReconfigure={() => {
                    setShowCascadingDetail(false);
                    setShowCascadingWizard({
                      parentId: isParent ? row.id : undefined,
                    });
                  }}
                  onRemove={() => {
                    setShowCascadingDetail(false);
                    pushUndo();
                    if (isChild) {
                      updateRow(row.id, { choice_filter: '' });
                    }
                  }}
                  onGoToQuestion={(id) => {
                    setShowCascadingDetail(false);
                    selectRow(id);
                    const el = document.querySelector(`[data-row-id="${id}"]`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                />
              )}
            </span>
          );
        })()}
      </div>

      {/* Cascading Select Wizard Modal (opened from badge) */}
      {showCascadingWizard && (
        <CascadingSelectWizard
          onClose={() => setShowCascadingWizard(null)}
          initialParentId={showCascadingWizard.parentId}
        />
      )}

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
      // Note label is rendered above with full HTML support via NoteLabel
      // No input widget needed — notes are display-only
      return null;

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
