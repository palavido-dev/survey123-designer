/**
 * Validation Panel — Slide-down panel showing all form validation issues
 * with clickable rows that navigate to the problem question.
 */

import React from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { FormValidationIssue } from '../../utils/validation';
import { X, AlertCircle } from '../../utils/icons';

const CATEGORY_LABELS: Record<string, string> = {
  'duplicate-name': 'Duplicate Names',
  'missing-label': 'Missing Labels',
  'orphaned-list': 'Orphaned Lists',
  'unused-list': 'Unused Choice Lists',
  'broken-ref': 'Broken References',
  'unmatched-group': 'Unmatched Groups',
  'field-name': 'Field Name Issues',
  'expression': 'Expression Issues',
  'missing-list': 'Missing Choice Lists',
  'missing-file': 'Missing CSV Files',
  'empty-list': 'Empty Choice Lists',
};

const CATEGORY_ORDER = [
  'duplicate-name', 'unmatched-group', 'missing-list', 'empty-list',
  'missing-file', 'field-name', 'expression', 'missing-label',
  'unused-list',
];

export function ValidationPanel() {
  const validationResult = useSurveyStore((s) => s.validationResult);
  const showValidationPanel = useSurveyStore((s) => s.showValidationPanel);
  const setShowValidationPanel = useSurveyStore((s) => s.setShowValidationPanel);
  const selectRow = useSurveyStore((s) => s.selectRow);
  const setPanelView = useSurveyStore((s) => s.setPanelView);

  if (!showValidationPanel || !validationResult) return null;

  const { issues, errorCount, warningCount } = validationResult;

  // Group issues by category
  const grouped = new Map<string, FormValidationIssue[]>();
  for (const issue of issues) {
    const list = grouped.get(issue.category) || [];
    list.push(issue);
    grouped.set(issue.category, list);
  }

  const handleClickIssue = (issue: FormValidationIssue) => {
    if (issue.rowId) {
      selectRow(issue.rowId);
      setPanelView('properties');
      // Scroll the row into view
      const el = document.querySelector(`[data-row-id="${issue.rowId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const isClean = errorCount === 0 && warningCount === 0;

  return (
    <div className="bg-white border-b border-gray-200 shadow-md z-30" style={{ maxHeight: 320, overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-800">Validation Results</span>
          {isClean ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              No issues found
            </span>
          ) : (
            <div className="flex items-center gap-2">
              {errorCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  {errorCount} error{errorCount !== 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  {warningCount} warning{warningCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowValidationPanel(false)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Issue List */}
      <div className="overflow-y-auto" style={{ maxHeight: 270 }}>
        {isClean ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <svg className="w-10 h-10 mb-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-600">Form looks good!</p>
            <p className="text-xs text-gray-400 mt-1">No validation issues detected</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((cat) => {
              const catIssues = grouped.get(cat)!;
              const catLabel = CATEGORY_LABELS[cat] || cat;
              const hasErrors = catIssues.some((i) => i.level === 'error');

              return (
                <div key={cat} className="py-1.5">
                  <div className="px-4 py-1">
                    <span className={`text-[11px] font-semibold uppercase tracking-wide ${
                      hasErrors ? 'text-red-500' : 'text-amber-500'
                    }`}>
                      {catLabel} ({catIssues.length})
                    </span>
                  </div>
                  {catIssues.map((issue, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleClickIssue(issue)}
                      className={`w-full text-left px-4 py-1.5 text-xs flex items-start gap-2 transition-colors ${
                        issue.rowId ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <span className={`mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${
                        issue.level === 'error' ? 'bg-red-500' : 'bg-amber-400'
                      }`} />
                      <span className="text-gray-600 leading-relaxed">{issue.message}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
