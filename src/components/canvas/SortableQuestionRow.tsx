/**
 * Sortable Question Row
 *
 * Individual question card on the canvas. Shows a preview of the
 * question type with drag handle, and supports selection for editing.
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SurveyRow } from '../../types/survey';
import { useSurveyStore } from '../../store/surveyStore';
import { getIcon, GripVertical, Trash2, Copy } from '../../utils/icons';
import { QuestionPreview } from './QuestionPreview';

interface Props {
  row: SurveyRow;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

// Map question types to their sidebar icon names
const typeIconMap: Record<string, string> = {
  text: 'Type', email: 'Mail', password: 'Lock',
  integer: 'Hash', decimal: 'Percent', range: 'SlidersHorizontal',
  select_one: 'CircleDot', select_multiple: 'CheckSquare', rank: 'ArrowUpDown',
  select_one_from_file: 'FileSpreadsheet', select_multiple_from_file: 'FileSpreadsheet',
  geopoint: 'MapPin', geotrace: 'Route', geoshape: 'Pentagon',
  date: 'Calendar', time: 'Clock', datetime: 'CalendarClock',
  image: 'Camera', audio: 'Mic', file: 'Paperclip', barcode: 'ScanLine',
  note: 'StickyNote', begin_group: 'FolderOpen', end_group: 'FolderOpen',
  begin_repeat: 'Repeat', end_repeat: 'Repeat',
  calculate: 'Calculator', hidden: 'EyeOff',
  start: 'Play', end: 'Square', username: 'User', deviceid: 'Smartphone',
};

const typeLabels: Record<string, string> = {
  text: 'Text', email: 'Email', password: 'Password',
  integer: 'Integer', decimal: 'Decimal', range: 'Range',
  select_one: 'Select One', select_multiple: 'Select Multiple', rank: 'Rank',
  select_one_from_file: 'Select One (File)', select_multiple_from_file: 'Select Multiple (File)',
  geopoint: 'Geopoint', geotrace: 'Geotrace', geoshape: 'Geoshape',
  date: 'Date', time: 'Time', datetime: 'Date & Time',
  image: 'Image', audio: 'Audio', file: 'File', barcode: 'Barcode',
  note: 'Note', begin_group: 'Begin Group', end_group: 'End Group',
  begin_repeat: 'Begin Repeat', end_repeat: 'End Repeat',
  calculate: 'Calculate', hidden: 'Hidden',
  start: 'Start', end: 'End', username: 'Username', deviceid: 'Device ID',
};

export function SortableQuestionRow({ row, index, isSelected, onSelect }: Props) {
  const { removeRow, duplicateRow } = useSurveyStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = getIcon(typeIconMap[row.type] || 'Info');
  const isStructural = ['end_group', 'end_repeat'].includes(row.type);
  const isGroupStart = ['begin_group', 'begin_repeat'].includes(row.type);
  const isMetadata = ['start', 'end', 'username', 'deviceid'].includes(row.type);

  // Indentation for group contents
  const depth = getDepth(index);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        marginLeft: `${depth * 24}px`,
      }}
      className={`
        group relative bg-white border rounded-md mb-1 transition-all
        ${isDragging ? 'opacity-50 shadow-lg z-50' : ''}
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
        ${isStructural ? 'bg-gray-50 border-dashed' : ''}
        ${isGroupStart ? 'border-l-4 border-l-purple-400' : ''}
      `}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div className="flex items-center gap-2 p-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500"
        >
          <GripVertical size={16} />
        </div>

        {/* Type Icon */}
        <div className={`
          flex items-center justify-center w-8 h-8 rounded-md shrink-0
          ${isStructural ? 'bg-gray-100' : 'bg-blue-50'}
        `}>
          <Icon size={16} className={isStructural ? 'text-gray-400' : 'text-blue-600'} />
        </div>

        {/* Question Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400 uppercase">
              {typeLabels[row.type] || row.type}
            </span>
            {row.required === 'yes' && (
              <span className="text-red-500 text-xs font-bold">*</span>
            )}
          </div>
          {row.label && (
            <p className="text-sm text-gray-800 truncate">{row.label}</p>
          )}
          {!row.label && !isMetadata && (
            <p className="text-sm text-gray-400 italic">
              {row.name || 'Unnamed'}
            </p>
          )}
          {isMetadata && (
            <p className="text-xs text-gray-400">{row.name}</p>
          )}
        </div>

        {/* Question Preview (visual hint of the input type) */}
        {!isStructural && !isMetadata && (
          <div className="hidden lg:block w-48 shrink-0">
            <QuestionPreview row={row} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isStructural && (
            <button
              onClick={(e) => { e.stopPropagation(); duplicateRow(row.id); }}
              className="p-1 text-gray-400 hover:text-blue-600 rounded"
              title="Duplicate"
            >
              <Copy size={14} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Hint preview */}
      {row.hint && (
        <div className="px-3 pb-2 -mt-1">
          <p className="text-xs text-gray-400 italic truncate">{row.hint}</p>
        </div>
      )}
    </div>
  );
}

// Helper: Calculate nesting depth for a row based on group/repeat structure
function getDepth(_index: number): number {
  // This will be calculated from the store in a more complete implementation
  // For now, we rely on CSS margin for visual nesting
  return 0;
}
