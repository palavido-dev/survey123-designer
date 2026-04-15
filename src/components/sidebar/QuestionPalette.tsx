/**
 * Question Palette — Card-based grid layout like Survey123 web designer
 * Includes appearance variant cards for easy drag-and-drop
 */

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { questionCategories } from '../../data/questionTypes';
import { DragItem, QuestionCategory } from '../../types/survey';
import { getIcon, X } from '../../utils/icons';

// ============================================================
// Draggable Question Card
// ============================================================

function DraggableCard({ item }: { item: DragItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.id}`,
    data: { type: item.type, fromPalette: true, defaultAppearance: item.defaultAppearance },
  });

  const Icon = getIcon(item.icon);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ padding: '10px 12px', gap: 10 }}
      className={`
        flex items-center rounded-lg cursor-grab select-none
        border border-gray-200 bg-white hover:border-[#00856a] hover:bg-[#f0faf7]
        transition-fast group
        ${isDragging ? 'opacity-40 scale-95' : ''}
      `}
    >
      <Icon
        size={18}
        className="text-[#00856a] shrink-0 group-hover:scale-110 transition-fast"
      />
      <span className="text-[13px] text-gray-700 font-medium leading-snug">{item.label}</span>
    </div>
  );
}

// ============================================================
// Category Group
// ============================================================

function CategoryGroup({ category }: { category: QuestionCategory }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ padding: '0 4px', marginBottom: 8 }}
        className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        {category.label}
      </h3>
      <div className="grid grid-cols-2" style={{ gap: 6 }}>
        {category.items.map((item) => (
          <DraggableCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main Palette
// ============================================================

export function QuestionPalette() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = searchTerm
    ? questionCategories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : questionCategories;

  return (
    <div className="bg-[#fafafa] border-r border-gray-200 flex flex-col h-full"
      style={{ width: 300 }}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white"
        style={{ padding: '16px 16px 12px 16px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h2 className="text-[15px] font-bold text-gray-900">Add</h2>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-gray-400 hover:text-gray-600 rounded transition-fast"
              style={{ padding: 4 }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder="Search question types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px 12px' }}
          className="w-full text-[13px] bg-gray-50 border border-gray-200 rounded-lg
            text-gray-700 placeholder-gray-400 transition-fast"
        />
      </div>

      {/* Scrollable question list */}
      <div className="flex-1 overflow-y-auto"
        style={{ padding: '16px 12px 24px 12px' }}>
        {filteredCategories.map((category) => (
          <CategoryGroup key={category.id} category={category} />
        ))}
        {filteredCategories.length === 0 && (
          <p className="text-sm text-gray-400 text-center" style={{ padding: '32px 0' }}>
            No matching types
          </p>
        )}
      </div>
    </div>
  );
}
