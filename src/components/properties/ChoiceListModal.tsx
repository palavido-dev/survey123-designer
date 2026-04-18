/**
 * Choice List Modal — Full-width pop-out editor for choice lists
 *
 * Provides enough room to see full labels, extra columns,
 * and manage large choice lists without truncation.
 */

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSurveyStore } from '../../store/surveyStore';
import { ChoiceItem } from '../../types/survey';
import { X, Plus, Trash2, Search, GripVertical } from '../../utils/icons';

interface Props {
  listName: string;
  onClose: () => void;
}

function SortableModalChoice({
  choice,
  index,
  listName,
  extraColumns,
  searchQuery,
}: {
  choice: ChoiceItem;
  index: number;
  listName: string;
  extraColumns: string[];
  searchQuery: string;
}) {
  const { updateChoice, removeChoice } = useSurveyStore();
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: choice.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, padding: '4px 20px', gap: 8 }}
      className={`flex items-center group hover:bg-gray-50 transition-colors border-b border-gray-100 ${
        isDragging ? 'opacity-40 bg-gray-50' : ''
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-200 hover:text-gray-400 shrink-0 transition-colors"
      >
        <GripVertical size={13} />
      </div>

      <span className="text-[10px] text-gray-300 font-mono shrink-0 text-right"
        style={{ width: 28 }}>
        {searchQuery ? '·' : index + 1}
      </span>

      <input
        type="text"
        value={choice.name}
        onChange={(e) => updateChoice(listName, choice.id, { name: e.target.value })}
        className="shrink-0 font-mono border border-transparent hover:border-gray-200
          focus:border-[#007a62] rounded bg-transparent focus:bg-white transition-colors outline-none"
        style={{ width: 160, padding: '5px 8px', fontSize: 12 }}
        placeholder="value"
      />

      <input
        type="text"
        value={choice.label}
        onChange={(e) => updateChoice(listName, choice.id, { label: e.target.value })}
        className="flex-1 border border-transparent hover:border-gray-200
          focus:border-[#007a62] rounded bg-transparent focus:bg-white transition-colors outline-none"
        style={{ padding: '5px 8px', fontSize: 13 }}
        placeholder="Display label"
      />

      {extraColumns.map((col) => (
        <input
          key={col}
          type="text"
          value={choice[col] || ''}
          onChange={(e) => updateChoice(listName, choice.id, { [col]: e.target.value })}
          className="shrink-0 font-mono border border-transparent hover:border-gray-200
            focus:border-violet-400 rounded bg-transparent focus:bg-white transition-colors outline-none"
          style={{ width: 120, padding: '5px 8px', fontSize: 11 }}
          placeholder={col}
        />
      ))}

      <button
        onClick={() => removeChoice(listName, choice.id)}
        className="shrink-0 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        style={{ padding: 4 }}
        title="Remove choice"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export function ChoiceListModal({ listName, onClose }: Props) {
  const { form, addChoice, removeChoice, updateChoice, removeChoiceList, moveChoice, pushUndo } = useSurveyStore();
  const list = form.choiceLists.find((cl) => cl.list_name === listName);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !list) return;
    const oldIndex = list.choices.findIndex((c) => c.id === active.id);
    const newIndex = list.choices.findIndex((c) => c.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      moveChoice(listName, oldIndex, newIndex);
    }
  };

  // Which questions use this list
  const referencingQuestions = useMemo(() =>
    form.survey.filter((r) => r.listName === listName),
    [form.survey, listName]
  );

  // Detect extra columns beyond name/label (e.g. filter columns from cascading)
  const extraColumns = useMemo(() => {
    if (!list) return [];
    const standardKeys = new Set(['id', 'list_name', 'name', 'label', 'media::image', 'media::audio']);
    const extras = new Set<string>();
    for (const c of list.choices) {
      for (const key of Object.keys(c)) {
        if (!standardKeys.has(key) && c[key] !== undefined) {
          extras.add(key);
        }
      }
    }
    return Array.from(extras);
  }, [list]);

  // Filtered choices
  const filteredChoices = useMemo(() => {
    if (!list) return [];
    if (!searchQuery) return list.choices;
    const q = searchQuery.toLowerCase();
    return list.choices.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        extraColumns.some((col) => (c[col] || '').toLowerCase().includes(q))
    );
  }, [list, searchQuery, extraColumns]);

  if (!list) return null;

  const handleBulkAdd = () => {
    const lines = bulkText.split('\n').filter((l) => l.trim());
    if (lines.length === 0) return;
    pushUndo();
    for (const line of lines) {
      // Support "value,label" or "value\tlabel" or just "label" (auto-generate value)
      const parts = line.includes('\t') ? line.split('\t') : line.includes(',') ? line.split(',') : [line];
      if (parts.length >= 2) {
        addChoice(listName, { name: parts[0].trim(), label: parts[1].trim() });
      } else {
        const label = parts[0].trim();
        const name = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        addChoice(listName, { name, label });
      }
    }
    setBulkText('');
    setShowBulkAdd(false);
  };

  const handleDeleteList = () => {
    const refs = referencingQuestions.length;
    if (refs > 0) {
      if (!confirm(`"${listName}" is used by ${refs} question(s). Delete anyway?`)) return;
    } else {
      if (!confirm(`Delete choice list "${listName}"?`)) return;
    }
    pushUndo();
    removeChoiceList(listName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      style={{ padding: 24 }}
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 'min(800px, 92vw)', height: 'min(600px, 85vh)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-gray-200"
          style={{ padding: '12px 20px' }}>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900 font-mono">{listName}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {list.choices.length} choice{list.choices.length !== 1 ? 's' : ''}
                {extraColumns.length > 0 && ` · ${extraColumns.length} extra column${extraColumns.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Usage indicator */}
            {referencingQuestions.length > 0 && (
              <div className="relative group">
                <span className="text-[10px] font-medium text-[#007a62] bg-[#e8f5f1] rounded-full cursor-help"
                  style={{ padding: '2px 8px' }}>
                  Used by {referencingQuestions.length} question{referencingQuestions.length !== 1 ? 's' : ''}
                </span>
                {/* Tooltip showing which questions */}
                <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block
                  bg-gray-800 text-white rounded-lg shadow-lg"
                  style={{ padding: '8px 12px', minWidth: 200, maxWidth: 300 }}>
                  <div className="text-[10px] font-semibold text-gray-300 mb-1">Referenced by:</div>
                  {referencingQuestions.map((r) => (
                    <div key={r.id} className="text-[11px] py-0.5 truncate">
                      {r.label || r.name}
                      <span className="text-gray-400 ml-1">({r.type})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteList}
              className="flex items-center gap-1 text-[11px] font-medium text-red-500
                hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              style={{ padding: '4px 8px' }}
              title="Delete this choice list"
            >
              <Trash2 size={12} />
              Delete List
            </button>
            <button onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="shrink-0 flex items-center justify-between border-b border-gray-100 bg-[#fafafa]"
          style={{ padding: '8px 20px' }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => addChoice(listName)}
              className="flex items-center gap-1 text-[11px] font-medium text-[#007a62]
                bg-[#e8f5f1] hover:bg-[#d0ebe3] rounded-md transition-colors"
              style={{ padding: '4px 10px' }}
            >
              <Plus size={12} />
              Add Choice
            </button>
            <button
              onClick={() => setShowBulkAdd(!showBulkAdd)}
              className={`text-[11px] font-medium rounded-md transition-colors ${
                showBulkAdd
                  ? 'text-[#007a62] bg-[#d0ebe3]'
                  : 'text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
              style={{ padding: '4px 10px' }}
            >
              Bulk Add
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search choices..."
              className="text-[11px] border border-gray-200 rounded-md bg-white
                focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62] outline-none"
              style={{ padding: '4px 8px 4px 26px', width: 180 }}
            />
          </div>
        </div>

        {/* Bulk Add Panel */}
        {showBulkAdd && (
          <div className="shrink-0 border-b border-gray-200 bg-gray-50"
            style={{ padding: '12px 20px' }}>
            <p className="text-[11px] text-gray-500 mb-2">
              Paste choices, one per line. Use <code className="bg-white px-1 rounded text-[10px]">value,label</code> or
              just <code className="bg-white px-1 rounded text-[10px]">label</code> (value auto-generated).
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"option_a,Option A\noption_b,Option B\nOption C"}
              className="w-full text-[12px] font-mono border border-gray-300 rounded-lg bg-white
                focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62] outline-none resize-none"
              style={{ padding: '8px 10px', height: 80 }}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleBulkAdd}
                disabled={!bulkText.trim()}
                className="text-[11px] font-medium text-white bg-[#007a62] rounded-md
                  hover:bg-[#006652] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                style={{ padding: '4px 12px' }}
              >
                Add {bulkText.split('\n').filter((l) => l.trim()).length} Choices
              </button>
              <button
                onClick={() => { setShowBulkAdd(false); setBulkText(''); }}
                className="text-[11px] text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table Header */}
        <div className="shrink-0 bg-[#fafafa] border-b border-gray-200"
          style={{ padding: '6px 20px' }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ width: 13 }} />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0"
              style={{ width: 28 }}>#</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0"
              style={{ width: 160 }}>Value</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex-1">
              Label</span>
            {extraColumns.map((col) => (
              <span key={col}
                className="text-[10px] font-semibold text-violet-400 uppercase tracking-wide shrink-0 truncate"
                style={{ width: 120 }}
                title={col}>
                {col}
              </span>
            ))}
            <span style={{ width: 28 }} />
          </div>
        </div>

        {/* Choice Rows */}
        <div className="flex-1 overflow-y-auto">
          {filteredChoices.length === 0 ? (
            <div className="text-center text-gray-400" style={{ padding: '40px 0' }}>
              {searchQuery ? (
                <p className="text-[13px]">No choices match "{searchQuery}"</p>
              ) : (
                <>
                  <p className="text-[13px] font-medium">No choices yet</p>
                  <p className="text-[11px] text-gray-300 mt-1">Click "Add Choice" or "Bulk Add" to get started</p>
                </>
              )}
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={filteredChoices.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredChoices.map((choice, index) => (
                  <SortableModalChoice
                    key={choice.id}
                    choice={choice}
                    index={index}
                    listName={listName}
                    extraColumns={extraColumns}
                    searchQuery={searchQuery}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-gray-200 bg-[#fafafa]"
          style={{ padding: '8px 20px' }}>
          <span className="text-[10px] text-gray-400">
            {searchQuery
              ? `${filteredChoices.length} of ${list.choices.length} shown`
              : `${list.choices.length} choice${list.choices.length !== 1 ? 's' : ''}`
            }
          </span>
          <span className="text-[10px] text-gray-300">
            pulldata / choice_filter compatible
          </span>
        </div>
      </div>
    </div>
  );
}
