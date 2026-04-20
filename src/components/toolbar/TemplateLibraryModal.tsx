/**
 * Template Library Modal — Browse and load pre-built survey form templates
 */

import React, { useState, useMemo } from 'react';
import { FORM_TEMPLATES, TEMPLATE_CATEGORIES } from '../../data/formTemplates';
import type { FormTemplate } from '../../data/formTemplates';
import { X, Search } from '../../utils/icons';

// Category icons (inline SVGs for each category)
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'All': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  'Environmental & EPA': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8c2 0 4 1 4 4s-2 4-4 4H7c-3 0-5-2-5-4s2-4 5-4" /><path d="M12 2v6" /><path d="M8 4l4-2 4 2" />
    </svg>
  ),
  'Water & Wastewater': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v6l-3 3c-2 2-3 4-3 6a6 6 0 0 0 12 0c0-2-1-4-3-6l-3-3z" />
    </svg>
  ),
  'Construction & Infrastructure': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="8" rx="1" /><path d="M17 14v7" /><path d="M7 14v7" /><path d="M17 3v3" /><path d="M7 3v3" />
    </svg>
  ),
  'Emergency Management': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  'Natural Resources & Wildlife': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14c2-3 4-7 1-11-3 4-8 4-11 1-1 3 1 7 1 7s-3 2-3 6c0 3 3 4 5 4h4c2 0 5-1 5-4 0-4-3-6-3-6z" />
    </svg>
  ),
  'Health & Safety': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  'General / Multi-Purpose': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  ),
  'Energy & Utilities': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  'Public Works & Code Enforcement': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /><path d="M9 9h1" /><path d="M9 13h1" /><path d="M9 17h1" />
    </svg>
  ),
  'Real Estate & Planning': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
};

const COMPLEXITY_COLORS = {
  simple: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Simple' },
  moderate: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Moderate' },
  complex: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Complex' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (template: FormTemplate) => void;
}

export function TemplateLibraryModal({ open, onClose, onSelect }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    let results = FORM_TEMPLATES;
    if (selectedCategory !== 'All') {
      results = results.filter(t => t.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All': FORM_TEMPLATES.length };
    for (const t of FORM_TEMPLATES) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, []);

  if (!open) return null;

  const handleLoad = () => {
    if (!selectedTemplate) return;
    onSelect(selectedTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl flex flex-col"
        style={{ width: '90vw', maxWidth: 960, height: '80vh', maxHeight: 680 }}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200"
          style={{ padding: '16px 20px' }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <div className="bg-[#007a62] rounded-lg flex items-center justify-center"
              style={{ width: 32, height: 32 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Form Template Library</h2>
              <p className="text-[11px] text-gray-400">{FORM_TEMPLATES.length} templates across {TEMPLATE_CATEGORIES.length} categories</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-fast"
            style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left sidebar — Categories */}
          <div className="border-r border-gray-200 flex-shrink-0 overflow-y-auto bg-gray-50"
            style={{ width: 220, padding: '12px 8px' }}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider"
              style={{ padding: '4px 10px', marginBottom: 4 }}>Categories</p>
            {['All', ...TEMPLATE_CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSelectedTemplate(null); }}
                className={`w-full flex items-center rounded-lg text-left transition-fast ${
                  selectedCategory === cat
                    ? 'bg-[#007a62] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ padding: '7px 10px', gap: 8, fontSize: 12, fontWeight: 500, marginBottom: 2 }}
              >
                <span className={selectedCategory === cat ? 'text-white/80' : 'text-gray-400'}>
                  {CATEGORY_ICONS[cat] || CATEGORY_ICONS['All']}
                </span>
                <span className="flex-1 truncate">{cat}</span>
                <span className={`text-[10px] font-medium ${
                  selectedCategory === cat ? 'text-white/70' : 'text-gray-400'
                }`}>{categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>

          {/* Right content — Search + Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Search */}
            <div style={{ padding: '12px 16px' }}>
              <div className="relative">
                <Search size={14} className="absolute text-gray-400" style={{ left: 10, top: 9 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search templates by name, description, or tag..."
                  className="w-full border border-gray-200 rounded-lg text-[13px] text-gray-700
                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007a62]/30 focus:border-[#007a62]"
                  style={{ padding: '7px 12px 7px 32px' }}
                />
              </div>
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '0 16px 16px' }}>
              {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Search size={32} className="mb-3 text-gray-300" />
                  <p className="text-[13px]">No templates match your search</p>
                </div>
              ) : (
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                  {filteredTemplates.map(t => {
                    const cx = COMPLEXITY_COLORS[t.complexity];
                    const isSelected = selectedTemplate?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t)}
                        onDoubleClick={() => { setSelectedTemplate(t); handleLoad(); }}
                        className={`text-left rounded-lg border-2 transition-fast hover:shadow-md ${
                          isSelected
                            ? 'border-[#007a62] bg-[#f0fdf9] shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        style={{ padding: '14px 16px' }}
                      >
                        <div className="flex items-start justify-between" style={{ gap: 8, marginBottom: 6 }}>
                          <h3 className="text-[13px] font-semibold text-gray-900 leading-tight">{t.name}</h3>
                          <span className={`text-[10px] font-medium rounded-full border whitespace-nowrap ${cx.bg} ${cx.text} ${cx.border}`}
                            style={{ padding: '2px 8px' }}>{cx.label}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed" style={{ marginBottom: 8 }}>{t.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">{t.questionCount} questions</span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {t.tags.slice(0, 3).map(tag => (
                              <span key={tag}
                                className="text-[9px] text-gray-400 bg-gray-100 rounded"
                                style={{ padding: '1px 5px' }}>{tag}</span>
                            ))}
                            {t.tags.length > 3 && (
                              <span className="text-[9px] text-gray-400">+{t.tags.length - 3}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 flex items-center justify-between"
          style={{ padding: '12px 20px' }}>
          <div className="text-[12px] text-gray-400">
            {selectedTemplate ? (
              <span>Selected: <strong className="text-gray-700">{selectedTemplate.name}</strong> — {selectedTemplate.questionCount} questions, {selectedTemplate.complexity}</span>
            ) : (
              <span>Select a template to preview, or double-click to load</span>
            )}
          </div>
          <div className="flex items-center" style={{ gap: 8 }}>
            <button onClick={onClose}
              className="text-[13px] font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-fast"
              style={{ padding: '7px 16px' }}>
              Cancel
            </button>
            <button
              onClick={handleLoad}
              disabled={!selectedTemplate}
              className="text-[13px] font-semibold text-white bg-[#007a62] rounded-lg transition-fast
                hover:bg-[#006652] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ padding: '7px 20px' }}
            >
              Load Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
