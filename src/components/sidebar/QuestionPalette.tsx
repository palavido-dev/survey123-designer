/**
 * Question Palette (Left Sidebar) — Dark themed, polished design
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
        flex items-center gap-2.5 px-3 py-[7px] rounded-lg cursor-grab
        text-[13px] text-slate-400 hover:text-white hover:bg-white/[0.08]
        transition-smooth select-none group
        ${isDragging ? 'opacity-40 scale-95' : ''}
      `}
    >
      <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center
        group-hover:bg-emerald-500/20 transition-smooth shrink-0">
        <Icon size={14} className="text-slate-500 group-hover:text-emerald-400 transition-smooth" />
      </div>
      <span className="font-medium">{item.label}</span>
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
    <div className="mb-0.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-[11px] font-bold
          text-slate-500 uppercase tracking-[0.08em] hover:text-slate-300 rounded-lg transition-smooth"
      >
        <div className="flex items-center gap-1.5 flex-1">
          <Icon size={12} className="text-slate-600" />
          <span>{category.label}</span>
        </div>
        {expanded ? (
          <ChevronDown size={12} className="text-slate-600" />
        ) : (
          <ChevronRight size={12} className="text-slate-600" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-out
          ${expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="ml-1 mb-1">
          {category.items.map((item) => (
            <DraggableItem key={item.id} item={item} />
          ))}
        </div>
      </div>
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
    <div className="w-[260px] bg-[#1a1f2e] flex flex-col h-full shadow-[2px_0_12px_rgba(0,0,0,0.15)]">
      {/* Header */}
      <div className="p-4 pb-3">
        <h2 className="text-[13px] font-bold text-white tracking-tight mb-3">Question Types</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-white/[0.06] border border-white/[0.08]
              rounded-lg text-slate-300 placeholder-slate-600
              focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.08]
              transition-smooth"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Scrollable Categories */}
      <div className="flex-1 overflow-y-auto p-3 dark-scrollbar">
        {filteredCategories.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
        {filteredCategories.length === 0 && (
          <p className="text-sm text-slate-600 text-center py-8">No matching types</p>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <p className="text-[11px] text-slate-600 text-center">
          Drag items onto the canvas to add
        </p>
      </div>
    </div>
  );
}
