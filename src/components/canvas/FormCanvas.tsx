/**
 * Form Canvas — Live form preview style like Survey123 web designer
 * Centered on screen with generous padding throughout
 */

import React from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useSurveyStore } from '../../store/surveyStore';
import { SortableQuestionRow } from './SortableQuestionRow';
import { Plus } from '../../utils/icons';

export function FormCanvas() {
  const { form, selectedRowId, selectRow } = useSurveyStore();
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' });

  const items = form.survey.map((row) => row.id);
  const depths = calculateDepths(form.survey);

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
          {/* Green header bar */}
          <div className="bg-[#007a62]" style={{ padding: '32px 48px' }}>
            <h1 className="text-[22px] font-bold text-white leading-tight">
              {form.settings.form_title || 'Untitled survey'}
            </h1>
            <p className="text-[14px] text-white/60" style={{ marginTop: 8 }}>
              Description content for the survey
            </p>
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
            <p className="text-[11px] text-gray-400">Powered by ArcGIS Survey123</p>
          </div>
        </div>
      </div>
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
