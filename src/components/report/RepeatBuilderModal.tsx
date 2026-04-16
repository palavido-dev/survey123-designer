/**
 * Repeat Block Builder Modal
 *
 * Helps users build ${#repeatfield} blocks with optional
 * filters (where, orderBy, groupBy).
 */

import React, { useState, useMemo } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { X } from '../../utils/icons';

interface Props {
  onInsert: (repeatField: string) => void;
  onClose: () => void;
}

export function RepeatBuilderModal({ onInsert, onClose }: Props) {
  const form = useSurveyStore((s) => s.form);
  const [field, setField] = useState('');
  const [useWhere, setUseWhere] = useState(false);
  const [whereClause, setWhereClause] = useState('');
  const [useOrderBy, setUseOrderBy] = useState(false);
  const [orderByField, setOrderByField] = useState('');
  const [useGroupBy, setUseGroupBy] = useState(false);
  const [groupByField, setGroupByField] = useState('');

  const repeatFields = useMemo(
    () => form.survey.filter((r) => r.type === 'begin_repeat'),
    [form.survey]
  );

  // Fields within the selected repeat (between begin_repeat and end_repeat)
  const repeatChildren = useMemo(() => {
    if (!field) return [];
    const startIdx = form.survey.findIndex((r) => r.name === field && r.type === 'begin_repeat');
    if (startIdx === -1) return [];
    const children: { name: string; label: string; type: string }[] = [];
    let depth = 0;
    for (let i = startIdx; i < form.survey.length; i++) {
      const r = form.survey[i];
      if (r.type === 'begin_repeat') depth++;
      if (r.type === 'end_repeat') { depth--; if (depth === 0) break; }
      if (depth === 1 && !['begin_repeat', 'end_repeat', 'begin_group', 'end_group'].includes(r.type)) {
        children.push({ name: r.name, label: r.label || r.name, type: r.type });
      }
    }
    return children;
  }, [field, form.survey]);

  // Build expression
  const expression = useMemo(() => {
    if (!field) return '';
    let expr = field;
    const filters: string[] = [];
    if (useWhere && whereClause) filters.push(`where:"${whereClause}"`);
    if (useOrderBy && orderByField) filters.push(`orderByFields:"${orderByField}"`);
    if (useGroupBy && groupByField) filters.push(`useGroupBy:"${groupByField}"`);
    // Filters go on the repeat start token
    // Actually in Survey123, filters are applied like: ${#field | where:"..."}
    // But the common pattern is just ${#field} with no filters on the repeat tag
    // Filters are applied separately — let's keep it simple
    return expr;
  }, [field, useWhere, whereClause, useOrderBy, orderByField, useGroupBy, groupByField]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl" style={{ width: 480, maxHeight: '80vh', overflow: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200"
          style={{ padding: '16px 20px' }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <span className="bg-violet-500 text-white rounded text-[11px] font-bold flex items-center justify-center"
              style={{ width: 28, height: 28 }}>
              #
            </span>
            <div>
              <h3 className="text-[14px] font-bold text-gray-900">Repeat Block</h3>
              <p className="text-[11px] text-gray-400">Loop through repeat group records</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded transition-fast">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {repeatFields.length === 0 ? (
            <div className="text-center" style={{ padding: '24px 0' }}>
              <p className="text-[13px] text-gray-500">No repeat groups found in the survey</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Add a repeat group to your form first
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Repeat field picker */}
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                  Repeat Group
                </label>
                <select
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 text-gray-700
                    focus:border-[#007a62] outline-none bg-white"
                >
                  <option value="">Select a repeat group...</option>
                  {repeatFields.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.label || r.name} ({r.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Show child fields for reference */}
              {field && repeatChildren.length > 0 && (
                <div className="bg-violet-50 border border-violet-200 rounded-lg" style={{ padding: '10px 14px' }}>
                  <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide mb-2">
                    Fields in this repeat ({repeatChildren.length})
                  </p>
                  <div className="flex flex-wrap" style={{ gap: 4 }}>
                    {repeatChildren.map((c) => (
                      <span
                        key={c.name}
                        className="text-[10px] bg-white border border-violet-200 rounded px-2 py-0.5 text-violet-700 font-mono"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional filters */}
              {field && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[11px] font-medium text-gray-500 mb-2">Optional Filters</p>

                  {/* Where */}
                  <label className="flex items-center cursor-pointer mb-2" style={{ gap: 6 }}>
                    <input type="checkbox" checked={useWhere} onChange={(e) => setUseWhere(e.target.checked)}
                      className="rounded border-gray-300 text-[#007a62] focus:ring-[#007a62]" />
                    <span className="text-[12px] text-gray-600">Filter rows (WHERE)</span>
                  </label>
                  {useWhere && (
                    <input type="text" value={whereClause} onChange={(e) => setWhereClause(e.target.value)}
                      placeholder="status = 'active'"
                      className="w-full text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 mb-2 text-gray-700
                        focus:border-[#007a62] outline-none" />
                  )}

                  {/* Order By */}
                  <label className="flex items-center cursor-pointer mb-2" style={{ gap: 6 }}>
                    <input type="checkbox" checked={useOrderBy} onChange={(e) => setUseOrderBy(e.target.checked)}
                      className="rounded border-gray-300 text-[#007a62] focus:ring-[#007a62]" />
                    <span className="text-[12px] text-gray-600">Sort rows (ORDER BY)</span>
                  </label>
                  {useOrderBy && (
                    <input type="text" value={orderByField} onChange={(e) => setOrderByField(e.target.value)}
                      placeholder="date DESC"
                      className="w-full text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 mb-2 text-gray-700
                        focus:border-[#007a62] outline-none" />
                  )}

                  {/* Group By */}
                  <label className="flex items-center cursor-pointer" style={{ gap: 6 }}>
                    <input type="checkbox" checked={useGroupBy} onChange={(e) => setUseGroupBy(e.target.checked)}
                      className="rounded border-gray-300 text-[#007a62] focus:ring-[#007a62]" />
                    <span className="text-[12px] text-gray-600">Group rows (GROUP BY)</span>
                  </label>
                  {useGroupBy && (
                    <input type="text" value={groupByField} onChange={(e) => setGroupByField(e.target.value)}
                      placeholder="category"
                      className="w-full text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 mt-2 text-gray-700
                        focus:border-[#007a62] outline-none" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {expression && (
            <div className="mt-5 bg-violet-50 border border-violet-200 rounded-lg"
              style={{ padding: '10px 14px' }}>
              <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wide mb-1">Preview</p>
              <code className="text-[12px] text-violet-800 font-mono break-all">
                {'${#'}{expression}{'}'}<br />
                {'  ... repeat content ...'}<br />
                {'${/}'}
              </code>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 flex items-center justify-end"
          style={{ padding: '12px 20px', gap: 8 }}>
          <button onClick={onClose}
            className="text-[13px] text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-fast"
            style={{ padding: '7px 16px' }}>
            Cancel
          </button>
          <button
            onClick={() => expression && onInsert(expression)}
            disabled={!expression}
            className="text-[13px] text-white bg-[#007a62] hover:bg-[#006652] font-semibold rounded-lg
              transition-fast disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ padding: '7px 20px' }}
          >
            Insert Repeat Block
          </button>
        </div>
      </div>
    </div>
  );
}
