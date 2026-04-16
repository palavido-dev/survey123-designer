/**
 * Form Canvas — Live form preview style like Survey123 web designer
 * Centered on screen with generous padding throughout
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useSurveyStore } from '../../store/surveyStore';
import { SortableQuestionRow } from './SortableQuestionRow';
import { ExpressionBuilder } from '../properties/ExpressionBuilder';
import { Plus } from '../../utils/icons';
import { SurveyRow } from '../../types/survey';

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
  const { form, selectedRowId, selectRow, collapsedGroups, expressionEditor, updateRow, updateSettings, closeExpressionEditor } = useSurveyStore();
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' });

  const items = form.survey.map((row) => row.id);
  const depths = calculateDepths(form.survey);
  const hiddenSet = calculateHiddenRows(form.survey, collapsedGroups);

  return (
    <div
      className="flex-1 overflow-y-auto canvas-bg flex justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) selectRow(null);
      }}
    >
      <div style={{ width: '100%', maxWidth: 720, padding: '32px 24px' }}>
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
                  {form.survey.map((row, index) => {
                    if (hiddenSet.has(row.id)) return null;
                    return (
                      <SortableQuestionRow
                        key={row.id}
                        row={row}
                        index={index}
                        depth={depths[index] || 0}
                        isSelected={row.id === selectedRowId}
                        onSelect={() => selectRow(row.id)}
                      />
                    );
                  })}
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
    </div>
  );
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
