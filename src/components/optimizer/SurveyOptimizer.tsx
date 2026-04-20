/**
 * Survey Optimizer Panel
 *
 * Displays optimization suggestions grouped by category.
 * Allows users to navigate to affected questions or apply fixes.
 */

import React, { useState, useMemo } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { analyzeSurvey, OptimizationResult } from '../../utils/surveyOptimizer';
import { X, AlertCircle, Lightbulb, TrendingUp, Zap } from '../../utils/icons';

const CATEGORY_LABELS: Record<string, string> = {
  'structural-simplification': 'Structural Simplification',
  'ux-improvement': 'UX Improvements',
  'performance': 'Performance',
  'expression-optimization': 'Expression Optimization',
};

const CATEGORY_COLORS: Record<string, { icon: string; bgColor: string; textColor: string }> = {
  'structural-simplification': { icon: 'TrendingUp', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  'ux-improvement': { icon: 'Lightbulb', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  'performance': { icon: 'Zap', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  'expression-optimization': { icon: 'AlertCircle', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
};

const SEVERITY_COLORS: Record<string, string> = {
  'recommendation': 'bg-green-100 text-green-700',
  'improvement': 'bg-blue-100 text-blue-700',
  'suggestion': 'bg-gray-100 text-gray-700',
};

export function SurveyOptimizer() {
  const form = useSurveyStore((s) => s.form);
  const selectRow = useSurveyStore((s) => s.selectRow);
  const setPanelView = useSurveyStore((s) => s.setPanelView);
  const open = useSurveyStore((s) => s.showOptimizer);
  const onClose = useSurveyStore((s) => s.setShowOptimizer);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const results = useMemo(() => analyzeSurvey(form), [form]);

  const groupedByCategory = useMemo(() => {
    const grouped = new Map<string, OptimizationResult[]>();
    for (const result of results) {
      const list = grouped.get(result.category) || [];
      list.push(result);
      grouped.set(result.category, list);
    }
    return grouped;
  }, [results]);

  const toggleExpanded = (ruleId: string) => {
    const newSet = new Set(expandedRules);
    if (newSet.has(ruleId)) {
      newSet.delete(ruleId);
    } else {
      newSet.add(ruleId);
    }
    setExpandedRules(newSet);
  };

  const handleGoToQuestion = (rowId: string) => {
    selectRow(rowId);
    setPanelView('properties');
    setTimeout(() => {
      const el = document.querySelector(`[data-row-id="${rowId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const getCategoryIcon = (category: string) => {
    const iconName = CATEGORY_COLORS[category]?.icon || 'AlertCircle';
    return iconName;
  };

  if (!open) return null;

  const isClean = results.length === 0;
  const totalSuggestions = results.reduce((sum, r) => sum + r.matches.length, 0);

  return (
    <div className="bg-white border-b border-gray-200 shadow-md z-30" style={{ maxHeight: 400, overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#00856a]/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00856a]/10 flex items-center justify-center">
            <Lightbulb size={16} className="text-[#00856a]" />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-800">Survey Optimizer</span>
            <p className="text-xs text-gray-500">Form analysis and improvement suggestions</p>
          </div>
        </div>
        <button
          onClick={() => onClose(false)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ maxHeight: 330 }}>
        {isClean ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <svg className="w-12 h-12 mb-3 text-[#00856a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-[#00856a]">Excellent form structure!</p>
            <p className="text-xs text-gray-400 mt-1">No optimization suggestions at this time</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Summary stats */}
            <div className="px-4 py-3 bg-gray-50 flex items-center gap-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  {results.length} suggestion{results.length !== 1 ? 's' : ''}
                </span>
              </div>
              {totalSuggestions > 0 && (
                <span className="text-xs text-gray-500">{totalSuggestions} issue{totalSuggestions !== 1 ? 's' : ''} across your form</span>
              )}
            </div>

            {/* Results by category */}
            {Array.from(groupedByCategory.entries()).map(([category, categoryResults]) => {
              const catLabel = CATEGORY_LABELS[category] || category;
              const colors = CATEGORY_COLORS[category];

              return (
                <div key={category} className={colors.bgColor}>
                  {/* Category header */}
                  <div className={`px-4 py-2 ${colors.textColor}`}>
                    <span className="text-[11px] font-semibold uppercase tracking-wide">{catLabel} ({categoryResults.length})</span>
                  </div>

                  {/* Results in this category */}
                  {categoryResults.map((result) => {
                    const isExpanded = expandedRules.has(result.ruleId);

                    return (
                      <div key={result.ruleId} className="border-b border-gray-100 last:border-0">
                        {/* Collapsible header */}
                        <button
                          onClick={() => toggleExpanded(result.ruleId)}
                          className="w-full px-4 py-3 text-left hover:bg-white/50 transition-colors flex items-start gap-3"
                        >
                          {/* Severity badge */}
                          <div className="flex-shrink-0 mt-0.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${SEVERITY_COLORS[result.severity]}`}>
                              {result.severity === 'recommendation' ? 'Recommended' : result.severity === 'improvement' ? 'Improve' : 'Tip'}
                            </span>
                          </div>

                          {/* Title and description */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-800">{result.title}</div>
                            <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{result.description}</div>
                          </div>

                          {/* Expand indicator */}
                          <div className="text-gray-400 flex-shrink-0 mt-0.5">
                            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                        </button>

                        {/* Expanded matches */}
                        {isExpanded && (
                          <div className="px-4 pb-3 space-y-2 bg-white/30">
                            {result.matches.map((match, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                                <p className="text-xs text-gray-700 leading-relaxed mb-2">{match.suggestedFix}</p>

                                {/* Action buttons */}
                                <div className="flex items-center gap-2">
                                  {match.rowIds.length > 0 && (
                                    <button
                                      onClick={() => handleGoToQuestion(match.rowIds[0])}
                                      className="text-xs px-3 py-1.5 rounded-md border border-[#00856a] text-[#00856a] hover:bg-[#00856a]/5 transition-colors font-medium"
                                    >
                                      {match.rowIds.length === 1 ? 'Go to question' : `Go to first (${match.rowIds.length} affected)`}
                                    </button>
                                  )}
                                  {match.actionText && !match.rowIds.length && (
                                    <span className="text-xs text-gray-500 italic">{match.actionText}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
