/**
 * Question Palette (Left Sidebar)
 *
 * Displays all available question types organized by category.
 * Items are draggable and can be dropped onto the form canvas.
 */

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { questionCategories } from '../../data/questionTypes';
import { DragItem, QuestionCategory } from '../../types/survey';
import { getIcon, ChevronDown, ChevronRight, Search } from '../../utils/icons';

// ============================================================
// Draggable Question Item
// ============================================================

function DraggableItem({ item }: { item: DragItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.id}`,
    data: { type: item.type, fromPalette: true },
  });

  const Icon = getIcon(item.icon);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md cursor-grab
        text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700
        transition-colors select-none
        ${isDragging ? 'opacity-50 bg-blue-100' : ''}
      `}
    >
      <Icon size={16} className="shrink-0 text-gray-400" />
      <span>{item.label}</span>
    </div>
  );
}

// ============================================================
// Category Accordion
// ============================================================

function CategorySection({ category }: { category: QuestionCategory }) {
  const [expanded, setExpanded] = useState(true);
  const Icon = getIcon(category.icon);

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold
          text-gray-500 uppercase tracking-wide hover:bg-gray-100 rounded-md transition-colors"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Icon size={14} />
        <span>{category.label}</span>
      </button>
      {expanded && (
        <div className="ml-2">
          {category.items.map((item) => (
            <DraggableItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Palette Component
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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Question Types</h2>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filteredCategories.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
