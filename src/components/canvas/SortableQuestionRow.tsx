/**
 * Sortable Question Row — Live form preview showing actual input widgets
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SurveyRow } from '../../types/survey';
import { useSurveyStore } from '../../store/surveyStore';
import { X, Copy } from '../../utils/icons';

interface Props {
  row: SurveyRow;
  index: number;
  depth: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function SortableQuestionRow({ row, index, depth, isSelected, onSelect }: Props) {
  const { removeRow, duplicateRow } = useSurveyStore();

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${depth * 20}px`,
  };

  const isEndStructural = ['end_group', 'end_repeat'].includes(row.type);
  const isBeginGroup = row.type === 'begin_group';
  const isBeginRepeat = row.type === 'begin_repeat';
  const isMetadata = ['start', 'end', 'username', 'deviceid'].includes(row.type);
  const isHidden = ['calculate', 'hidden'].includes(row.type);

  // End structural markers are minimal
  if (isEndStructural) {
    return (
      <div ref={setNodeRef} style={style}
        className="flex items-center gap-2 py-1 px-3 text-[11px] text-gray-400 border-b border-dashed border-gray-200">
        <span className="font-mono">{row.type === 'end_group' ? '} end group' : '} end repeat'}</span>
      </div>
    );
  }

  // Metadata & hidden fields are compact
  if (isMetadata || isHidden) {
    return (
      <div ref={setNodeRef} style={style}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={`flex items-center gap-3 py-2 px-3 rounded-lg text-[12px] cursor-pointer transition-fast
          ${isSelected ? 'bg-[#f0faf7] selected-glow' : 'bg-gray-50 hover:bg-gray-100'}`}>
        <span className="text-gray-400 font-mono text-[11px]">{row.type}</span>
        <span className="text-gray-500">{row.name}</span>
        {row.calculation && (
          <span className="text-[10px] text-gray-400 font-mono truncate flex-1">= {row.calculation}</span>
        )}
        <button onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
          className="p-1 text-gray-300 hover:text-red-500 transition-fast">
          <X size={13} />
        </button>
      </div>
    );
  }

  // Group/Repeat start headers
  if (isBeginGroup || isBeginRepeat) {
    return (
      <div ref={setNodeRef} style={style}
        {...attributes} {...listeners}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={`rounded-lg cursor-pointer transition-fast
          ${isSelected ? 'selected-glow' : ''}
          ${isBeginGroup
            ? 'bg-[#f7f3ff] border border-purple-200'
            : 'bg-[#f0faf7] border border-teal-200'}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-bold uppercase tracking-wide
              ${isBeginGroup ? 'text-purple-500' : 'text-teal-600'}`}>
              {isBeginGroup ? 'Group' : 'Repeat'}
            </span>
            <span className="text-[14px] text-gray-700 font-medium">{row.label || row.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); duplicateRow(row.id); }}
              className="p-1 text-gray-300 hover:text-gray-500 transition-fast">
              <Copy size={13} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
              className="p-1 text-gray-300 hover:text-red-500 transition-fast">
              <X size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard question — live form preview
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`
        relative rounded-lg p-4 cursor-pointer transition-fast
        ${isDragging ? 'opacity-40 shadow-card-hover z-50' : ''}
        ${isSelected
          ? 'bg-[#f0faf7] selected-glow'
          : 'bg-transparent hover:bg-gray-50 border border-transparent hover:border-gray-200'}
      `}
    >
      {/* Action buttons (top right) */}
      <div className={`absolute top-2 right-2 flex items-center gap-0.5
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

      {/* Question number + label */}
      <div className="mb-2">
        <label className="text-[14px] text-gray-800 font-medium leading-relaxed">
          {row.label || <span className="text-gray-400 italic">Untitled question</span>}
          {row.required === 'yes' && <span className="text-red-500 ml-1">*</span>}
        </label>
        {row.hint && (
          <p className="text-[12px] text-gray-400 mt-0.5">{row.hint}</p>
        )}
      </div>

      {/* Live input preview */}
      <QuestionWidget row={row} />
    </div>
  );
}

// ============================================================
// Live Input Widgets — Render actual form controls
// ============================================================

function QuestionWidget({ row }: { row: SurveyRow }) {
  switch (row.type) {
    case 'text':
      if (row.appearance?.includes('multiline')) {
        return (
          <textarea
            disabled
            placeholder="Enter text..."
            className="w-full px-3 py-2 text-[13px] border border-gray-300 rounded-lg bg-white
              text-gray-400 resize-none h-20 cursor-pointer"
          />
        );
      }
      return (
        <input type="text" disabled placeholder="Enter text..."
          className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-lg bg-white
            text-gray-400 cursor-pointer" />
      );

    case 'email':
      return (
        <input type="text" disabled placeholder="name@example.com"
          className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-lg bg-white
            text-gray-400 cursor-pointer" />
      );

    case 'password':
      return (
        <input type="text" disabled placeholder="••••••••"
          className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-lg bg-white
            text-gray-400 cursor-pointer" />
      );

    case 'integer':
    case 'decimal':
      return (
        <input type="text" disabled placeholder={row.type === 'integer' ? '0' : '0.00'}
          className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-lg bg-white
            text-gray-400 cursor-pointer" />
      );

    case 'range':
      return (
        <div className="flex items-center gap-3 py-1">
          <span className="text-[12px] text-gray-400">0</span>
          <div className="flex-1 relative h-2 bg-gray-200 rounded-full">
            <div className="absolute left-0 top-0 h-2 w-1/3 bg-[#00856a] rounded-full" />
            <div className="absolute left-1/3 top-1/2 -translate-y-1/2 -translate-x-1/2
              w-4 h-4 bg-[#00856a] rounded-full border-2 border-white shadow" />
          </div>
          <span className="text-[12px] text-gray-400">10</span>
        </div>
      );

    case 'select_one':
      return <SelectPreview row={row} multi={false} />;

    case 'select_multiple':
      return <SelectPreview row={row} multi={true} />;

    case 'rank':
      return <SelectPreview row={row} multi={false} />;

    case 'date':
      return (
        <input type="text" disabled placeholder="mm/dd/yyyy"
          className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-lg bg-white
            text-gray-400 cursor-pointer" />
      );

    case 'time':
      return (
        <input type="text" disabled placeholder="--:-- --"
          className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-lg bg-white
            text-gray-400 cursor-pointer" />
      );

    case 'datetime':
      return (
        <input type="text" disabled placeholder="mm/dd/yyyy  --:-- --"
          className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-lg bg-white
            text-gray-400 cursor-pointer" />
      );

    case 'geopoint':
      return (
        <div className="w-full h-32 bg-[#e8efe8] rounded-lg border border-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[24px] mb-1">📍</div>
            <span className="text-[12px] text-gray-500">Tap to capture location</span>
          </div>
        </div>
      );

    case 'geotrace':
    case 'geoshape':
      return (
        <div className="w-full h-32 bg-[#e8efe8] rounded-lg border border-gray-200 flex items-center justify-center">
          <span className="text-[12px] text-gray-500">
            {row.type === 'geotrace' ? 'Draw a line on the map' : 'Draw a shape on the map'}
          </span>
        </div>
      );

    case 'image':
      if (row.appearance?.includes('signature')) {
        return (
          <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <span className="text-[13px] text-gray-400">Tap to sign</span>
          </div>
        );
      }
      return (
        <div className="w-full py-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1">
          <div className="text-[28px]">📷</div>
          <span className="text-[12px] text-gray-400">Take photo or choose image</span>
        </div>
      );

    case 'audio':
      return (
        <div className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-red-500" />
          </div>
          <span className="text-[12px] text-gray-400">Tap to record audio</span>
        </div>
      );

    case 'file':
      return (
        <div className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <span className="text-[12px] text-gray-400">Choose a file to upload</span>
        </div>
      );

    case 'barcode':
      return (
        <div className="flex gap-2">
          <input type="text" disabled placeholder="Scan result..."
            className="flex-1 px-3 py-2.5 text-[13px] border border-gray-300 rounded-lg bg-white
              text-gray-400 cursor-pointer" />
          <button disabled className="px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg
            text-[12px] text-gray-500 font-medium">
            Scan
          </button>
        </div>
      );

    case 'note':
      return (
        <div className="text-[13px] text-gray-500 italic">
          {row.label || 'Information note'}
        </div>
      );

    default:
      return null;
  }
}

// Select question preview with actual radio/check options
function SelectPreview({ row, multi }: { row: SurveyRow; multi: boolean }) {
  const { form } = useSurveyStore();
  const list = row.listName
    ? form.choiceLists.find((cl) => cl.list_name === row.listName)
    : null;

  const choices = list?.choices || [
    { name: 'option_1', label: 'Option 1' },
    { name: 'option_2', label: 'Option 2' },
    { name: 'option_3', label: 'Option 3' },
  ];

  // Minimal appearance = dropdown
  if (row.appearance?.includes('minimal') || row.appearance?.includes('autocomplete')) {
    return (
      <select disabled
        className="w-full px-3 py-2.5 text-[13px] border border-gray-300 rounded-lg bg-white
          text-gray-400 cursor-pointer appearance-none">
        <option>Select an option...</option>
      </select>
    );
  }

  // Likert appearance
  if (row.appearance?.includes('likert')) {
    return (
      <div className="flex gap-1">
        {choices.map((c, i) => (
          <div key={i} className="flex-1 text-center">
            <div className="w-full py-2 border border-gray-300 rounded text-[11px] text-gray-500 bg-white">
              {c.label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: radio/checkbox list
  return (
    <div className="space-y-2">
      {choices.slice(0, 6).map((c, i) => (
        <label key={i} className="flex items-center gap-3 cursor-pointer">
          {multi ? (
            <div className="w-[18px] h-[18px] rounded border-2 border-gray-300 bg-white shrink-0" />
          ) : (
            <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300 bg-white shrink-0" />
          )}
          <span className="text-[13px] text-gray-600">{c.label}</span>
        </label>
      ))}
      {choices.length > 6 && (
        <p className="text-[11px] text-gray-400 pl-8">+{choices.length - 6} more options</p>
      )}
    </div>
  );
}
