/**
 * Form Canvas (Center) — Clean design with subtle background pattern
 */

import React from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useSurveyStore } from '../../store/surveyStore';
import { SortableQuestionRow } from './SortableQuestionRow';
import { FileText } from '../../utils/icons';

export function FormCanvas() {
  const { form, selectedRowId, selectRow } = useSurveyStore();
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' });

  const items = form.survey.map((row) => row.id);

  // Calculate nesting depth for each row
  const depths = calculateDepths(form.survey);

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #f1f5f9 0%, #e8eef4 100%)',
        backgroundImage: `radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) selectRow(null);
      }}
    >
      <div className="max-w-[720px] mx-auto py-8 px-4">
        {/* Form Header Card */}
        <div className="gradient-header rounded-2xl p-6 mb-4 shadow-[0_4px_20px_rgba(5,150,105,0.25)]">
          <h1 className="text-xl font-bold text-white tracking-tight">
            {form.settings.form_title || 'Untitled Survey'}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            {form.settings.form_id && (
              <span className="text-xs text-emerald-200/70 bg-white/10 px-2.5 py-0.5 rounded-full font-mono">
                {form.settings.form_id}
              </span>
            )}
            {form.settings.version && (
              <span className="text-xs text-emerald-200/70 bg-white/10 px-2.5 py-0.5 rounded-full">
                v{form.settings.version}
              </span>
            )}
            <span className="text-xs text-emerald-200/50">
              {form.survey.filter(r => !['end_group', 'end_repeat'].includes(r.type)).length} items
            </span>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          ref={setNodeRef}
          className={`min-h-[200px] transition-all duration-200 rounded-2xl
            ${isOver ? 'bg-emerald-50/50 ring-2 ring-emerald-300/30 ring-dashed' : ''}`}
        >
          {items.length === 0 ? (
            <div className={`
              flex flex-col items-center justify-center py-24
              border-2 border-dashed rounded-2xl transition-all duration-200
              ${isOver
                ? 'border-emerald-400 bg-emerald-50/60'
                : 'border-gray-300/60 bg-white/40 backdrop-blur-sm'}
            `}>
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                <FileText size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-500 text-lg font-semibold mb-1">Drop questions here</p>
              <p className="text-gray-400 text-sm max-w-xs text-center">
                Drag question types from the sidebar to start building your survey form
              </p>
            </div>
          ) : (
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {form.survey.map((row, index) => (
                  <SortableQuestionRow
                    key={row.id}
                    row={row}
                    index={index}
                    depth={depths[index] || 0}
                    isSelected={row.id === selectedRowId}
                    onSelect={() => selectRow(row.id)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  );
}

// Calculate nesting depth for visual indentation
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
