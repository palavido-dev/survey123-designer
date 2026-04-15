/**
 * Choice List Editor — Clean Survey123 style with sortable choices
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

function SortableChoice({
  choice,
  listName,
  index,
}: {
  choice: ChoiceItem;
  listName: string;
  index: number;
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
      style={style}
      className={`flex items-center gap-1.5 mb-1.5 group ${isDragging ? 'opacity-40' : ''}`}
    >
      <span className="text-[10px] text-gray-300 w-4 text-right font-mono shrink-0">
        {index + 1}
      </span>
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-200 hover:text-gray-400 shrink-0 transition-fast"
      >
        <GripVertical size={12} />
      </div>

      <input
        type="text"
        value={choice.name}
        onChange={(e) => updateChoice(listName, choice.id, { name: e.target.value })}
        className="w-20 px-2 py-1.5 text-[11px] font-mono border border-gray-200 rounded-lg bg-white
          focus:border-[#00856a] transition-fast"
        placeholder="value"
      />

      <input
        type="text"
        value={choice.label}
        onChange={(e) => updateChoice(listName, choice.id, { label: e.target.value })}
        className="flex-1 px-2 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-white
          focus:border-[#00856a] transition-fast"
        placeholder="Display label"
      />

      <button
        onClick={() => removeChoice(listName, choice.id)}
        className="p-1 text-gray-200 hover:text-red-400 shrink-0 opacity-0 group-hover:opacity-100 transition-fast"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

export function ChoiceListEditor({ listName }: Props) {
  const { form, addChoice } = useSurveyStore();
  const list = form.choiceLists.find((cl) => cl.list_name === listName);

  if (!list) {
    return (
      <div className="p-4 text-sm text-gray-400">
        Choice list "{listName}" not found.
      </div>
    );
  }

  const choiceIds = list.choices.map((c) => c.id);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[13px] font-semibold text-gray-800">Choices</h3>
          <p className="text-[11px] text-gray-400 font-mono mt-0.5">{listName}</p>
        </div>
        <button
          onClick={() => addChoice(listName)}
          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium
            text-[#007a62] bg-[#f0faf7] rounded-lg hover:bg-[#e0f5ef]
            transition-fast active:scale-[0.97]"
        >
          <Plus size={13} />
          Add
        </button>
      </div>

      {/* Column Headers */}
      <div className="flex items-center gap-1.5 mb-2 pl-[52px]">
        <span className="w-20 text-[10px] font-medium text-gray-400">Value</span>
        <span className="flex-1 text-[10px] font-medium text-gray-400">Label</span>
      </div>

      {/* Choice Rows */}
      <SortableContext items={choiceIds} strategy={verticalListSortingStrategy}>
        {list.choices.map((choice, index) => (
          <SortableChoice key={choice.id} choice={choice} listName={listName} index={index} />
        ))}
      </SortableContext>

      {list.choices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-[12px] text-gray-400">No choices yet</p>
          <p className="text-[11px] text-gray-300 mt-1">Click "Add" to create one</p>
        </div>
      )}
    </div>
  );
}
