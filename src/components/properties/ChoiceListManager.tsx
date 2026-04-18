/**
 * Choice List Manager — Overview of all choice lists in the form
 *
 * Shows when no select question is selected, providing a central
 * place to view, edit, delete, and manage all choice lists.
 * Each list can be expanded inline or popped out to a full modal.
 */

import React, { useState } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { ChoiceListEditor } from './ChoiceListEditor';
import { ChoiceListModal } from './ChoiceListModal';
import { Plus, Trash2, ChevronRight } from '../../utils/icons';

export function ChoiceListManager() {
  const { form, addChoiceList, removeChoiceList, pushUndo, selectRow } = useSurveyStore();
  const choiceLists = form.choiceLists || [];
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [modalList, setModalList] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [usagePopover, setUsagePopover] = useState<string | null>(null);

  // Find which questions reference each choice list (with full row info)
  const listUsage = React.useMemo(() => {
    const usage = new Map<string, Array<{ id: string; name: string; label: string; type: string }>>();
    for (const cl of choiceLists) {
      const refs = form.survey
        .filter((r) => r.listName === cl.list_name)
        .map((r) => ({ id: r.id, name: r.name, label: r.label || r.name, type: r.type }));
      usage.set(cl.list_name, refs);
    }
    return usage;
  }, [form.survey, choiceLists]);

  const handleCreateList = () => {
    const name = newListName.trim().replace(/\s+/g, '_').toLowerCase();
    if (!name) return;
    if (choiceLists.some((cl) => cl.list_name === name)) {
      alert(`A choice list named "${name}" already exists.`);
      return;
    }
    pushUndo();
    addChoiceList(name);
    setNewListName('');
    setShowNewForm(false);
    setExpandedList(name);
  };

  const handleDeleteList = (listName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const refs = listUsage.get(listName) || [];
    if (refs.length > 0) {
      if (!confirm(`"${listName}" is used by ${refs.length} question(s). Delete anyway?`)) return;
    } else {
      if (!confirm(`Delete choice list "${listName}"?`)) return;
    }
    pushUndo();
    removeChoiceList(listName);
    if (expandedList === listName) setExpandedList(null);
  };

  const handleGoToQuestion = (questionId: string) => {
    setUsagePopover(null);
    selectRow(questionId);
    // Scroll to the question on the canvas
    const el = document.querySelector(`[data-row-id="${questionId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div style={{ padding: '12px 14px' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div>
          <h3 className="text-[13px] font-semibold text-gray-800">Choice Lists</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {choiceLists.length} list{choiceLists.length !== 1 ? 's' : ''} in this form
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-1 text-[11px] font-medium text-[#007a62] hover:text-[#006652]
            bg-[#e8f5f1] hover:bg-[#d0ebe3] rounded-md transition-colors"
          style={{ padding: '4px 8px' }}
        >
          <Plus size={12} />
          New List
        </button>
      </div>

      {/* New list form */}
      {showNewForm && (
        <div className="bg-gray-50 rounded-lg border border-gray-200"
          style={{ padding: '8px 10px', marginBottom: 10 }}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'))}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              placeholder="list_name"
              className="flex-1 text-[12px] px-2 py-1.5 border border-gray-300 rounded
                focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62] outline-none font-mono"
              autoFocus
            />
            <button
              onClick={handleCreateList}
              disabled={!newListName.trim()}
              className="text-[11px] font-medium text-white bg-[#007a62] rounded px-3 py-1.5
                hover:bg-[#006652] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => { setShowNewForm(false); setNewListName(''); }}
              className="text-[11px] text-gray-400 hover:text-gray-600 px-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Choice list entries */}
      {choiceLists.length === 0 ? (
        <div className="text-center text-gray-300" style={{ padding: '32px 0' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="mx-auto mb-2 text-gray-300">
            <path d="M4 12h16" /><path d="M4 6h16" /><path d="M4 18h16" />
          </svg>
          <p className="text-[12px] text-gray-400">No choice lists yet</p>
          <p className="text-[10px] text-gray-300 mt-1">
            Add a select question or create a list above
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {choiceLists.map((cl) => {
            const isExpanded = expandedList === cl.list_name;
            const refs = listUsage.get(cl.list_name) || [];
            return (
              <div key={cl.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* List header row */}
                <div
                  className={`flex items-center justify-between transition-colors ${
                    isExpanded ? 'bg-[#f0faf7]' : 'bg-white hover:bg-gray-50'
                  }`}
                  style={{ padding: '8px 10px' }}
                >
                  {/* Left: expand toggle + info */}
                  <button
                    onClick={() => setExpandedList(isExpanded ? null : cl.list_name)}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  >
                    <ChevronRight
                      size={13}
                      className={`text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-gray-800 font-mono truncate">
                        {cl.list_name}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        <span>{cl.choices.length} choice{cl.choices.length !== 1 ? 's' : ''}</span>
                        {refs.length > 0 && (
                          <span
                            className="text-[#007a62] cursor-pointer hover:underline relative"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUsagePopover(usagePopover === cl.list_name ? null : cl.list_name);
                            }}
                          >
                            · Used by {refs.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Right: actions */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Pop-out to modal */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setModalList(cl.list_name); }}
                      className="p-1 text-gray-300 hover:text-[#007a62] hover:bg-[#f0faf7] rounded transition-colors"
                      title="Open in full editor"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      </svg>
                    </button>
                    {/* Delete */}
                    <button
                      onClick={(e) => handleDeleteList(cl.list_name, e)}
                      className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete list"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Usage popover */}
                {usagePopover === cl.list_name && refs.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50"
                    style={{ padding: '8px 12px' }}>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                      style={{ marginBottom: 4 }}>
                      Used by
                    </div>
                    {refs.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleGoToQuestion(r.id)}
                        className="w-full text-left flex items-center justify-between rounded
                          hover:bg-white transition-colors"
                        style={{ padding: '4px 8px' }}
                      >
                        <span className="text-[11px] text-gray-700 truncate">{r.label}</span>
                        <span className="text-[9px] text-gray-400 font-mono shrink-0 ml-2">{r.type}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Expanded: show inline choice list editor */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <ChoiceListEditor listName={cl.list_name} />
                    {/* Pop-out hint */}
                    <div className="border-t border-gray-100" style={{ padding: '6px 12px' }}>
                      <button
                        onClick={() => setModalList(cl.list_name)}
                        className="w-full text-[10px] text-gray-400 hover:text-[#007a62] transition-colors text-center"
                      >
                        Open in full editor for more space →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Choice List Modal */}
      {modalList && (
        <ChoiceListModal
          listName={modalList}
          onClose={() => setModalList(null)}
        />
      )}
    </div>
  );
}
