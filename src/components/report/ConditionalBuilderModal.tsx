/**
 * Conditional Block Builder Modal
 *
 * Helps users build ${if ...} expressions with a guided UI,
 * picking fields, operators, and values from the survey.
 */

import React, { useState, useMemo } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { X } from '../../utils/icons';

interface Props {
  onInsert: (condition: string) => void;
  onClose: () => void;
}

export function ConditionalBuilderModal({ onInsert, onClose }: Props) {
  const form = useSurveyStore((s) => s.form);
  const [field, setField] = useState('');
  const [operator, setOperator] = useState('selected');
  const [value, setValue] = useState('');
  const [rawMode, setRawMode] = useState(false);
  const [rawExpression, setRawExpression] = useState('');

  const selectFields = useMemo(
    () =>
      form.survey.filter((r) =>
        ['select_one', 'select_multiple'].includes(r.type)
      ),
    [form.survey]
  );

  const allFields = useMemo(
    () =>
      form.survey.filter(
        (r) => !['begin_group', 'end_group', 'begin_repeat', 'end_repeat'].includes(r.type)
      ),
    [form.survey]
  );

  // Get choices for selected field
  const choices = useMemo(() => {
    if (!field) return [];
    const row = form.survey.find((r) => r.name === field);
    if (!row || !row.listName) return [];
    const list = form.choiceLists.find((cl) => cl.list_name === row.listName);
    return list ? list.choices : [];
  }, [field, form.survey, form.choiceLists]);

  const selectedRow = form.survey.find((r) => r.name === field);
  const isSelect = selectedRow && ['select_one', 'select_multiple'].includes(selectedRow.type);

  // Build the expression
  const expression = useMemo(() => {
    if (rawMode) return rawExpression;
    if (!field) return '';

    if (isSelect && operator === 'selected') {
      return `${field} | selected:"${value}"`;
    }
    if (operator === '=') return `${field} = '${value}'`;
    if (operator === '!=') return `${field} != '${value}'`;
    if (operator === 'empty') return `${field} = ''`;
    if (operator === 'not_empty') return `${field} != ''`;
    return `${field} ${operator} ${value}`;
  }, [field, operator, value, rawMode, rawExpression, isSelect]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl" style={{ width: 480, maxHeight: '80vh', overflow: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200"
          style={{ padding: '16px 20px' }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <span className="bg-amber-500 text-white rounded text-[11px] font-bold flex items-center justify-center"
              style={{ width: 28, height: 28 }}>
              if
            </span>
            <div>
              <h3 className="text-[14px] font-bold text-gray-900">Conditional Block</h3>
              <p className="text-[11px] text-gray-400">Show/hide content based on a condition</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded transition-fast">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {/* Mode toggle */}
          <div className="flex items-center mb-4" style={{ gap: 8 }}>
            <button
              onClick={() => setRawMode(false)}
              className={`text-[12px] font-medium rounded-md transition-fast ${
                !rawMode ? 'bg-[#007a62] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={{ padding: '5px 12px' }}
            >
              Guided
            </button>
            <button
              onClick={() => setRawMode(true)}
              className={`text-[12px] font-medium rounded-md transition-fast ${
                rawMode ? 'bg-[#007a62] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={{ padding: '5px 12px' }}
            >
              Raw Expression
            </button>
          </div>

          {rawMode ? (
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-2">
                Condition Expression
              </label>
              <input
                type="text"
                value={rawExpression}
                onChange={(e) => setRawExpression(e.target.value)}
                placeholder='e.g., status | selected:"active"'
                className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 text-gray-700
                  focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62]/20 outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-2">
                Enter any valid Survey123 conditional expression
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Field picker */}
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Field</label>
                <select
                  value={field}
                  onChange={(e) => { setField(e.target.value); setValue(''); }}
                  className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 text-gray-700
                    focus:border-[#007a62] outline-none bg-white"
                >
                  <option value="">Select a field...</option>
                  {allFields.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.label || r.name} ({r.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator */}
              {field && (
                <div>
                  <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Condition</label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 text-gray-700
                      focus:border-[#007a62] outline-none bg-white"
                  >
                    {isSelect && <option value="selected">has value selected</option>}
                    <option value="=">equals</option>
                    <option value="!=">does not equal</option>
                    <option value="empty">is empty</option>
                    <option value="not_empty">is not empty</option>
                    <option value=">">greater than</option>
                    <option value="<">less than</option>
                  </select>
                </div>
              )}

              {/* Value */}
              {field && !['empty', 'not_empty'].includes(operator) && (
                <div>
                  <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Value</label>
                  {isSelect && operator === 'selected' && choices.length > 0 ? (
                    <select
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 text-gray-700
                        focus:border-[#007a62] outline-none bg-white"
                    >
                      <option value="">Select a choice value...</option>
                      {choices.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.label} ({c.name})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Enter value..."
                      className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 text-gray-700
                        focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62]/20 outline-none"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {expression && (
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg"
              style={{ padding: '10px 14px' }}>
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">Preview</p>
              <code className="text-[12px] text-amber-800 font-mono break-all">
                {'${if '}
                {expression}
                {'}'} ... content ... {'${/}'}
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
            Insert Conditional
          </button>
        </div>
      </div>
    </div>
  );
}
