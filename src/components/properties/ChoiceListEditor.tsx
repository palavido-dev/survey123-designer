/**
 * Choice List Editor
 *
 * Manages choices for select_one, select_multiple, and rank questions.
 * Supports add, remove, reorder, and edit operations.
 */

import React from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSurveyStore } from '../../store/surveyStore';
import { ChoiceItem } from '../../types/survey';
import { GripVertical, Trash2, Plus } from '../../utils/icons';

interface Props {
  listName: string;
}

// ============================================================
// Sortable Choice Row
// ============================================================

function SortableChoice({
  choice,
  listName,
}: {
  choice: ChoiceItem;
  listName: string;
}) {
  const { updateChoice, removeChoice } = useSurveyStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: choice.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 mb-1 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0"
      >
        <GripVertical size={14} />
      </div>

      <input
        type="text"
        value={choice.name}
        onChange={(e) => updateChoice(listName, choice.id, { name: e.target.value })}
        className="w-24 px-1.5 py-1 text-xs font-mono border border-gray-200 rounded
          focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="value"
      />

      <input
        type="text"
        value={choice.label}
        onChange={(e) => updateChoice(listName, choice.id, { label: e.target.value })}
        className="flex-1 px-1.5 py-1 text-xs border border-gray-200 rounded
          focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Label"
      />

      <button
        onClick={() => removeChoice(listName, choice.id)}
        className="p-1 text-gray-300 hover:text-red-500 shrink-0"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ============================================================
// Main Choice List Editor
// ============================================================

export function ChoiceListEditor({ listName }: Props) {
  const { form, addChoice } = useSurveyStore();

  const list = form.choiceLists.find((cl) => cl.list_name === listName);

  if (!list) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Choice list "{listName}" not found.
      </div>
    );
  }

  const choiceIds = list.choices.map((c) => c.id);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Choices</h3>
          <p className="text-xs text-gray-400">List: {listName}</p>
        </div>
        <button
          onClick={() => addChoice(listName)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium
            text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Column Headers */}
      <div className="flex items-center gap-1 mb-1 px-5">
        <span className="w-24 text-[10px] font-medium text-gray-400 uppercase">Value</span>
        <span className="flex-1 text-[10px] font-medium text-gray-400 uppercase">Label</span>
      </div>

      {/* Choice Rows */}
      <SortableContext items={choiceIds} strategy={verticalListSortingStrategy}>
        {list.choices.map((choice) => (
          <SortableChoice key={choice.id} choice={choice} listName={listName} />
        ))}
      </SortableContext>

      {list.choices.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">
          No choices yet. Click "Add" to create one.
        </p>
      )}
    </div>
  );
}
