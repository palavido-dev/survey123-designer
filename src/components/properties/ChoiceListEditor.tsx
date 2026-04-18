/**
 * Choice List Editor — Matches left-pane font sizes and padding
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
      style={{ ...style, marginBottom: 6, gap: 6 }}
      className={`flex items-center group ${isDragging ? 'opacity-40' : ''}`}
    >
      <span className="text-gray-300 font-mono shrink-0 text-right"
        style={{ fontSize: 10, width: 16 }}>
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
        style={{ width: 80, padding: '6px 8px', fontSize: 12 }}
        className="font-mono border border-gray-200 rounded-lg bg-white
          focus:border-[#00856a] transition-fast shrink-0"
        placeholder="value"
      />

      <input
        type="text"
        value={choice.label}
        onChange={(e) => updateChoice(listName, choice.id, { label: e.target.value })}
        style={{ padding: '6px 8px', fontSize: 13 }}
        className="flex-1 border border-gray-200 rounded-lg bg-white
          focus:border-[#00856a] transition-fast"
        placeholder="Display label"
      />

      <button
        onClick={() => removeChoice(listName, choice.id)}
        className="text-gray-200 hover:text-red-400 shrink-0 opacity-0 group-hover:opacity-100 transition-fast"
        style={{ padding: 4 }}
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
      <div style={{ padding: 16 }} className="text-sm text-gray-400">
        Choice list "{listName}" not found.
      </div>
    );
  }

  const choiceIds = list.choices.map((c) => c.id);

  return (
    <div style={{ padding: '16px 20px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <div>
          <h3 className="text-gray-800" style={{ fontSize: 14, fontWeight: 600 }}>Choices</h3>
          <p className="text-gray-400 font-mono" style={{ fontSize: 11, marginTop: 2 }}>{listName}</p>
        </div>
        <button
          onClick={() => addChoice(listName)}
          className="flex items-center text-[#007a62] bg-[#f0faf7] rounded-lg hover:bg-[#e0f5ef]
            transition-fast active:scale-[0.97]"
          style={{ padding: '6px 12px', gap: 4, fontSize: 13, fontWeight: 500 }}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Column Headers */}
      <div className="flex items-center" style={{ gap: 6, marginBottom: 8, paddingLeft: 52 }}>
        <span className="text-gray-400" style={{ width: 80, fontSize: 11, fontWeight: 500 }}>Value</span>
        <span className="flex-1 text-gray-400" style={{ fontSize: 11, fontWeight: 500 }}>Label</span>
      </div>

      {/* Choice Rows */}
      <SortableContext items={choiceIds} strategy={verticalListSortingStrategy}>
        {list.choices.map((choice, index) => (
          <SortableChoice key={choice.id} choice={choice} listName={listName} index={index} />
        ))}
      </SortableContext>

      {list.choices.length === 0 && (
        <div className="text-center" style={{ padding: '32px 0' }}>
          <p className="text-gray-400" style={{ fontSize: 13 }}>No choices yet</p>
          <p className="text-gray-300" style={{ fontSize: 12, marginTop: 4 }}>Click "Add" to create one</p>
        </div>
      )}
    </div>
  );
}
