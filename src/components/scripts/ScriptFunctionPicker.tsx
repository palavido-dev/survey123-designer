/**
 * Script Function Picker — Insert pulldata("@javascript") expressions
 *
 * Shows a dropdown of all parsed JS functions from the form's script files.
 * For each function, allows mapping parameters to form fields and generates
 * the complete pulldata expression.
 */

import React, { useState, useMemo } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { ParsedFunction, SurveyRow } from '../../types/survey';
import { parseJavaScriptFunctions, generatePulldataExpression } from '../../utils/scriptParser';
import { X } from '../../utils/icons';

interface Props {
  /** Called with the generated expression when user confirms */
  onInsert: (expression: string) => void;
  onClose: () => void;
  /** Current row ID to exclude from field picker */
  currentRowId?: string;
}

export function ScriptFunctionPicker({ onInsert, onClose, currentRowId }: Props) {
  const { form } = useSurveyStore();
  const scriptFiles = form.scriptFiles || [];

  const [selectedFunc, setSelectedFunc] = useState<ParsedFunction | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  // Parse all functions
  const allFunctions = useMemo(() => {
    const funcs: ParsedFunction[] = [];
    for (const file of scriptFiles) {
      funcs.push(...parseJavaScriptFunctions(file.content, file.fileName));
    }
    return funcs;
  }, [scriptFiles]);

  // Get all form fields for the parameter field picker
  const formFields = useMemo(() =>
    form.survey.filter((r) =>
      !['end_group', 'end_repeat', 'begin_group', 'begin_repeat'].includes(r.type) &&
      r.id !== currentRowId &&
      r.name
    ),
    [form.survey, currentRowId]
  );

  const handleSelectFunc = (func: ParsedFunction) => {
    setSelectedFunc(func);
    // Initialize param values
    const defaults: Record<string, string> = {};
    for (const p of func.params) {
      defaults[p] = '';
    }
    setParamValues(defaults);
  };

  const handleParamChange = (param: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [param]: value }));
  };

  const handleInsert = () => {
    if (!selectedFunc) return;
    const expression = generatePulldataExpression(selectedFunc, paramValues);
    onInsert(expression);
    onClose();
  };

  if (allFunctions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold text-gray-700">Insert JS Function</span>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={14} />
          </button>
        </div>
        <p className="text-[11px] text-gray-500 text-center py-4">
          No JavaScript functions found. Open the Script Editor to create functions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f0db4f" strokeWidth="2">
            <path d="m10 13-2 2 2 2" /><path d="m14 17 2-2-2-2" />
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <span className="text-[12px] font-semibold text-gray-700">
            {selectedFunc ? 'Map Parameters' : 'Select Function'}
          </span>
        </div>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
          <X size={14} />
        </button>
      </div>

      {!selectedFunc ? (
        /* Function List */
        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
          {allFunctions.map((func, idx) => (
            <button
              key={`${func.fileName}-${func.name}-${idx}`}
              onClick={() => handleSelectFunc(func)}
              className="w-full text-left px-3 py-2 hover:bg-[#f0faf7] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-purple-500 font-mono text-[11px]">ƒ</span>
                <span className="text-[12px] font-mono font-medium text-gray-800">{func.name}</span>
                <span className="text-[10px] text-gray-400 font-mono">({func.params.join(', ')})</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5 ml-4">
                {func.fileName}
                {func.description && ` — ${func.description}`}
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Parameter Mapping */
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-3">
            <button onClick={() => setSelectedFunc(null)}
              className="text-[11px] text-gray-500 hover:text-gray-700">← Back</button>
            <span className="text-[10px] text-gray-400">|</span>
            <span className="text-[12px] font-mono text-gray-700">
              <span className="text-purple-500">ƒ</span> {selectedFunc.name}
            </span>
          </div>

          {selectedFunc.params.length === 0 ? (
            <p className="text-[11px] text-gray-500 mb-3">This function takes no parameters.</p>
          ) : (
            <div className="space-y-2 mb-3">
              {selectedFunc.params.map((param) => (
                <div key={param}>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                    {param}
                  </label>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <select
                      value={paramValues[param] || ''}
                      onChange={(e) => handleParamChange(param, e.target.value)}
                      className="flex-1 text-[12px] border border-gray-200 rounded px-2 py-1.5 focus:border-[#007a62] outline-none bg-white"
                    >
                      <option value="">— Select field or type value —</option>
                      <optgroup label="Form Fields">
                        {formFields.map((field) => (
                          <option key={field.id} value={`\${${field.name}}`}>
                            ${'{'}${field.name}{'}'} — {field.label || field.type}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Static Values">
                        <option value="__custom__">Custom value...</option>
                      </optgroup>
                    </select>
                  </div>
                  {paramValues[param] === '__custom__' && (
                    <input
                      type="text"
                      placeholder="Enter value (will be quoted)"
                      onChange={(e) => handleParamChange(param, `"${e.target.value}"`)}
                      className="w-full mt-1 text-[12px] border border-gray-200 rounded px-2 py-1 focus:border-[#007a62] outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          <div className="bg-gray-50 rounded px-2.5 py-1.5 mb-3">
            <p className="text-[9px] text-gray-400 font-semibold uppercase mb-0.5">Generated Expression</p>
            <code className="text-[11px] text-[#007a62] font-mono break-all">
              {generatePulldataExpression(selectedFunc, paramValues)}
            </code>
          </div>

          <button
            onClick={handleInsert}
            className="w-full py-1.5 text-[12px] font-semibold text-white bg-[#007a62] rounded-lg hover:bg-[#006652] transition-colors"
          >
            Insert Expression
          </button>
        </div>
      )}
    </div>
  );
}
