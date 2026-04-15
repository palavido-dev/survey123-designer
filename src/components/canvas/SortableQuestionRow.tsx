/**
 * Sortable Question Row — Polished card design with depth, color coding, and nesting
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
  depth: number;
  isSelected: boolean;
  onSelect: () => void;
}

// Type icon mapping
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

// Friendly labels
const typeLabels: Record<string, string> = {
  text: 'Text', email: 'Email', password: 'Password',
  integer: 'Integer', decimal: 'Decimal', range: 'Range',
  select_one: 'Select One', select_multiple: 'Select Multiple', rank: 'Rank',
  select_one_from_file: 'Select (File)', select_multiple_from_file: 'Multi-Select (File)',
  geopoint: 'Geopoint', geotrace: 'Geotrace', geoshape: 'Geoshape',
  date: 'Date', time: 'Time', datetime: 'Date & Time',
  image: 'Image', audio: 'Audio', file: 'File', barcode: 'Barcode',
  note: 'Note', begin_group: 'Group Start', end_group: 'Group End',
  begin_repeat: 'Repeat Start', end_repeat: 'Repeat End',
  calculate: 'Calculate', hidden: 'Hidden',
  start: 'Start', end: 'End', username: 'Username', deviceid: 'Device ID',
};

// Color coding by category
function getTypeColor(type: string): { bg: string; text: string; icon: string } {
  if (['text', 'email', 'password'].includes(type))
    return { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' };
  if (['integer', 'decimal', 'range'].includes(type))
    return { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'text-violet-500' };
  if (['select_one', 'select_multiple', 'rank', 'select_one_from_file', 'select_multiple_from_file'].includes(type))
    return { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' };
  if (['geopoint', 'geotrace', 'geoshape'].includes(type))
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' };
  if (['date', 'time', 'datetime'].includes(type))
    return { bg: 'bg-sky-50', text: 'text-sky-700', icon: 'text-sky-500' };
  if (['image', 'audio', 'file', 'barcode'].includes(type))
    return { bg: 'bg-pink-50', text: 'text-pink-700', icon: 'text-pink-500' };
  if (['begin_group', 'end_group'].includes(type))
    return { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' };
  if (['begin_repeat', 'end_repeat'].includes(type))
    return { bg: 'bg-teal-50', text: 'text-teal-600', icon: 'text-teal-500' };
  if (['calculate', 'hidden'].includes(type))
    return { bg: 'bg-gray-50', text: 'text-gray-500', icon: 'text-gray-400' };
  if (['note'].includes(type))
    return { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-500' };
  return { bg: 'bg-gray-50', text: 'text-gray-500', icon: 'text-gray-400' };
}

export function SortableQuestionRow({ row, index, depth, isSelected, onSelect }: Props) {
  const { removeRow, duplicateRow } = useSurveyStore();

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${depth * 28}px`,
  };

  const Icon = getIcon(typeIconMap[row.type] || 'Info');
  const isStructural = ['end_group', 'end_repeat'].includes(row.type);
  const isGroupStart = row.type === 'begin_group';
  const isRepeatStart = row.type === 'begin_repeat';
  const isMetadata = ['start', 'end', 'username', 'deviceid'].includes(row.type);
  const colors = getTypeColor(row.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative bg-white rounded-xl transition-all duration-150 card-hover
        ${isDragging ? 'opacity-40 shadow-2xl z-50 scale-[1.02]' : ''}
        ${isSelected ? 'glow-selected ring-2 ring-emerald-400/50' : 'shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_3px_12px_rgba(0,0,0,0.08)]'}
        ${isStructural ? 'bg-gray-50/80 border border-dashed border-gray-200' : 'border border-gray-200/60'}
        ${isGroupStart ? 'border-l-[3px] border-l-purple-400' : ''}
        ${isRepeatStart ? 'border-l-[3px] border-l-teal-400' : ''}
      `}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      <div className="flex items-center gap-2.5 p-3.5">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-200 hover:text-gray-400 transition-smooth"
        >
          <GripVertical size={16} />
        </div>

        {/* Type Icon Badge */}
        <div className={`
          flex items-center justify-center w-9 h-9 rounded-xl shrink-0
          ${isStructural ? 'bg-gray-100' : colors.bg}
          transition-smooth
        `}>
          <Icon size={17} className={isStructural ? 'text-gray-400' : colors.icon} />
        </div>

        {/* Question Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
              {typeLabels[row.type] || row.type}
            </span>
            {row.required === 'yes' && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" title="Required" />
            )}
            {row.relevant && (
              <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-medium">
                conditional
              </span>
            )}
            {row.calculation && (
              <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-medium">
                calculated
              </span>
            )}
          </div>
          {row.label ? (
            <p className="text-[13px] text-gray-800 font-medium truncate leading-snug">{row.label}</p>
          ) : !isMetadata ? (
            <p className="text-[13px] text-gray-300 italic font-mono">{row.name || 'unnamed'}</p>
          ) : (
            <p className="text-[11px] text-gray-400 font-mono">{row.name}</p>
          )}
          {row.hint && (
            <p className="text-[11px] text-gray-400 truncate mt-0.5">{row.hint}</p>
          )}
        </div>

        {/* Question Preview */}
        {!isStructural && !isMetadata && (
          <div className="hidden lg:block w-44 shrink-0">
            <QuestionPreview row={row} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-smooth">
          {!isStructural && (
            <button
              onClick={(e) => { e.stopPropagation(); duplicateRow(row.id); }}
              className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-smooth"
              title="Duplicate"
            >
              <Copy size={14} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-smooth"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
