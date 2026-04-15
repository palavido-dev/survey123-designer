/**
 * Form Canvas (Center)
 *
 * The main drag-and-drop area where survey questions are arranged.
 * Supports reordering and dropping new questions from the palette.
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

  return (
    <div
      className="flex-1 bg-gray-50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) selectRow(null);
      }}
    >
      <div className="max-w-3xl mx-auto py-6 px-4">
        {/* Form Header */}
        <div className="bg-white rounded-t-lg border border-gray-200 border-b-4 border-b-blue-600 p-6 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {form.settings.form_title || 'Untitled Survey'}
          </h1>
          {form.settings.form_id && (
            <p className="text-sm text-gray-500 mt-1">ID: {form.settings.form_id}</p>
          )}
        </div>

        {/* Sortable Question List */}
        <div
          ref={setNodeRef}
          className={`
            min-h-[200px] transition-colors rounded-b-lg
            ${isOver ? 'bg-blue-50' : ''}
          `}
        >
          {items.length === 0 ? (
            <div className={`
              flex flex-col items-center justify-center py-20
              border-2 border-dashed rounded-lg
              ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'}
            `}>
              <FileText size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-1">Drag questions here</p>
              <p className="text-gray-400 text-sm">
                Drop question types from the sidebar to build your survey
              </p>
            </div>
          ) : (
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {form.survey.map((row, index) => (
                <SortableQuestionRow
                  key={row.id}
                  row={row}
                  index={index}
                  isSelected={row.id === selectedRowId}
                  onSelect={() => selectRow(row.id)}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  );
}
