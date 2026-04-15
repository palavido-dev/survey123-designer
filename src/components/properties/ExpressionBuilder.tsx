/**
 * Expression Builder — Visual expression editor for XLSForm logic
 *
 * Helps users build expressions for "relevant", "constraint", "calculation",
 * and other expression fields without knowing XLSForm syntax.
 *
 * Features:
 *   - Click to insert field references from the survey
 *   - Operator palette (=, !=, >, <, and, or, etc.)
 *   - Common function snippets (selected, count-selected, concat, etc.)
 *   - Live expression preview with syntax highlighting
 *   - Raw edit mode for power users
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { SurveyRow } from '../../types/survey';
import { X, ChevronDown } from '../../utils/icons';

interface Props {
  value: string;
  onChange: (val: string) => void;
  /** The current row being edited — excluded from field list */
  currentRowId: string;
  /** Label shown above the builder */
  label: string;
  /** Placeholder when empty */
  placeholder?: string;
  /** Type of expression: 'relevant' shows condition helpers, 'calculation' shows math/concat */
  mode?: 'relevant' | 'calculation' | 'constraint' | 'general';
}

// ============================================================
// Operator and Function definitions
// ============================================================

interface OperatorItem {
  label: string;
  insert: string;
  description: string;
}

const COMPARISON_OPS: OperatorItem[] = [
  { label: '=', insert: ' = ', description: 'Equals' },
  { label: '!=', insert: ' != ', description: 'Not equals' },
  { label: '>', insert: ' > ', description: 'Greater than' },
  { label: '<', insert: ' < ', description: 'Less than' },
  { label: '>=', insert: ' >= ', description: 'Greater or equal' },
  { label: '<=', insert: ' <= ', description: 'Less or equal' },
];

const LOGICAL_OPS: OperatorItem[] = [
  { label: 'and', insert: ' and ', description: 'Both conditions true' },
  { label: 'or', insert: ' or ', description: 'Either condition true' },
  { label: 'not()', insert: 'not()', description: 'Negate a condition' },
];

const COMMON_VALUES: OperatorItem[] = [
  { label: "'yes'", insert: "'yes'", description: 'Text value yes' },
  { label: "'no'", insert: "'no'", description: 'Text value no' },
  { label: "''", insert: "''", description: 'Empty text' },
  { label: '0', insert: '0', description: 'Zero' },
  { label: '1', insert: '1', description: 'One' },
  { label: 'null', insert: "'' ", description: 'Check for empty/null' },
];

interface FunctionTemplate {
  label: string;
  template: string;
  description: string;
  category: 'selection' | 'text' | 'math' | 'date' | 'logic';
}

const FUNCTIONS: FunctionTemplate[] = [
  // Selection functions
  { label: 'selected', template: "selected(${field}, 'value')", description: 'Check if value is selected in multi-select', category: 'selection' },
  { label: 'count-selected', template: 'count-selected(${field})', description: 'Count how many options are selected', category: 'selection' },
  { label: 'selected-at', template: 'selected-at(${field}, 0)', description: 'Get the nth selected value', category: 'selection' },
  // Text functions
  { label: 'concat', template: "concat(${field}, ' ', ${field})", description: 'Join text values together', category: 'text' },
  { label: 'string-length', template: 'string-length(${field})', description: 'Length of text value', category: 'text' },
  { label: 'substr', template: 'substr(${field}, 0, 5)', description: 'Extract part of text', category: 'text' },
  { label: 'contains', template: "contains(${field}, 'text')", description: 'Check if text contains a substring', category: 'text' },
  { label: 'regex', template: "regex(${field}, '[0-9]+')", description: 'Test text against a pattern', category: 'text' },
  // Math functions
  { label: 'sum', template: 'sum(${field})', description: 'Sum of repeat values', category: 'math' },
  { label: 'count', template: 'count(${field})', description: 'Count of repeat instances', category: 'math' },
  { label: 'min', template: 'min(${field})', description: 'Minimum value', category: 'math' },
  { label: 'max', template: 'max(${field})', description: 'Maximum value', category: 'math' },
  { label: 'round', template: 'round(${field}, 2)', description: 'Round to decimal places', category: 'math' },
  { label: 'int', template: 'int(${field})', description: 'Convert to integer', category: 'math' },
  // Date functions
  { label: 'today', template: 'today()', description: "Today's date", category: 'date' },
  { label: 'now', template: 'now()', description: 'Current date and time', category: 'date' },
  { label: 'format-date', template: "format-date(${field}, '%Y-%m-%d')", description: 'Format a date value', category: 'date' },
  // Logic helpers
  { label: 'if', template: "if(condition, 'yes_value', 'no_value')", description: 'Conditional value', category: 'logic' },
  { label: 'coalesce', template: 'coalesce(${field}, ${field})', description: 'First non-empty value', category: 'logic' },
  { label: 'once', template: 'once(${field})', description: 'Calculate only on first entry', category: 'logic' },
  { label: 'pulldata', template: "pulldata('filename', 'return_col', 'lookup_col', ${field})", description: 'Look up value from CSV', category: 'logic' },
];

// ============================================================
// Expression Builder Component
// ============================================================

export function ExpressionBuilder({ value, onChange, currentRowId, label, placeholder, mode = 'general' }: Props) {
  const { form } = useSurveyStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'fields' | 'operators' | 'functions'>('fields');
  const [fieldSearch, setFieldSearch] = useState('');
  const [funcCategory, setFuncCategory] = useState<string>('all');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const builderRef = useRef<HTMLDivElement>(null);

  // Get all available fields (excluding the current row and structural end markers)
  const availableFields = form.survey.filter(
    (r) =>
      r.id !== currentRowId &&
      !['end_group', 'end_repeat'].includes(r.type) &&
      r.name
  );

  const filteredFields = fieldSearch
    ? availableFields.filter(
        (r) =>
          r.name.toLowerCase().includes(fieldSearch.toLowerCase()) ||
          r.label.toLowerCase().includes(fieldSearch.toLowerCase())
      )
    : availableFields;

  // Filter functions based on mode
  const relevantFunctions = FUNCTIONS.filter((f) => {
    if (funcCategory !== 'all') return f.category === funcCategory;
    if (mode === 'relevant') return ['selection', 'logic', 'text'].includes(f.category);
    if (mode === 'calculation') return true;
    if (mode === 'constraint') return ['math', 'text', 'logic'].includes(f.category);
    return true;
  });

  const funcCategories = [
    { value: 'all', label: 'All' },
    { value: 'selection', label: 'Selection' },
    { value: 'text', label: 'Text' },
    { value: 'math', label: 'Math' },
    { value: 'date', label: 'Date' },
    { value: 'logic', label: 'Logic' },
  ];

  // Insert text at cursor position in the textarea
  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    onChange(newValue);

    // Set cursor position after insertion
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + text.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const insertFieldRef = (fieldName: string) => {
    insertAtCursor('${' + fieldName + '}');
  };

  const insertFunction = (template: string) => {
    insertAtCursor(template);
  };

  // Close builder when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (builderRef.current && !builderRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Quick-build templates for common patterns
  const quickTemplates = mode === 'relevant' ? [
    { label: 'Show when equals...', template: "${field} = 'value'" },
    { label: 'Show when not empty', template: "${field} != ''" },
    { label: 'Show when yes', template: "${field} = 'yes'" },
    { label: 'Show when selected...', template: "selected(${field}, 'value')" },
    { label: 'Show when greater than...', template: '${field} > 0' },
  ] : mode === 'calculation' ? [
    { label: 'Add two fields', template: '${field} + ${field}' },
    { label: 'Concatenate text', template: "concat(${field}, ' ', ${field})" },
    { label: 'Conditional value', template: "if(${field} = 'yes', 'Result A', 'Result B')" },
    { label: 'Count selected', template: 'count-selected(${field})' },
    { label: "Today's date", template: 'today()' },
  ] : mode === 'constraint' ? [
    { label: 'Must be positive', template: '. > 0' },
    { label: 'Range (0-100)', template: '. > 0 and . <= 100' },
    { label: 'Not empty', template: ". != ''" },
    { label: 'Min length', template: 'string-length(.) >= 3' },
    { label: 'Regex pattern', template: "regex(., '[A-Z][0-9]{3}')" },
  ] : [];

  // Get type badge color for field list
  const getTypeColor = (type: string) => {
    if (type.startsWith('select_')) return 'bg-blue-50 text-blue-600 border-blue-200';
    if (['integer', 'decimal', 'range'].includes(type)) return 'bg-amber-50 text-amber-600 border-amber-200';
    if (['text', 'email', 'password'].includes(type)) return 'bg-gray-50 text-gray-600 border-gray-200';
    if (['date', 'time', 'datetime'].includes(type)) return 'bg-green-50 text-green-600 border-green-200';
    if (['begin_group', 'begin_repeat'].includes(type)) return 'bg-purple-50 text-purple-600 border-purple-200';
    if (['calculate', 'hidden'].includes(type)) return 'bg-slate-50 text-slate-600 border-slate-200';
    return 'bg-gray-50 text-gray-500 border-gray-200';
  };

  return (
    <div ref={builderRef} style={{ marginBottom: 14 }}>
      {/* Label row with builder toggle */}
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <label className="block text-gray-500" style={{ fontSize: 12, fontWeight: 500 }}>
          {label}
        </label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center rounded transition-fast ${
            isOpen
              ? 'text-[#007a62] bg-[#f0faf7]'
              : 'text-gray-400 hover:text-[#007a62] hover:bg-[#f0faf7]'
          }`}
          style={{ padding: '2px 8px', gap: 4, fontSize: 11, fontWeight: 600 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18M3 12h18M9 6l-3 3 3 3M15 12l3 3-3 3" />
          </svg>
          {isOpen ? 'Close Builder' : 'Expression Builder'}
        </button>
      </div>

      {/* Expression textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={value.length > 60 ? 3 : 2}
        style={{ padding: '8px 12px', fontSize: 12, lineHeight: 1.6 }}
        className="w-full font-mono border border-gray-200 rounded-lg bg-white
          focus:border-[#00856a] transition-fast placeholder-gray-300 resize-y"
      />

      {/* Expression tokens preview */}
      {value && !isOpen && (
        <div className="flex flex-wrap items-center" style={{ gap: 4, marginTop: 6 }}>
          {tokenizeExpression(value).map((token, i) => (
            <span
              key={i}
              className={`inline-block rounded ${
                token.type === 'field'
                  ? 'bg-[#f0faf7] text-[#007a62] border border-[#007a62]/20'
                  : token.type === 'operator'
                  ? 'bg-orange-50 text-orange-600'
                  : token.type === 'function'
                  ? 'bg-blue-50 text-blue-600'
                  : token.type === 'string'
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-gray-600'
              }`}
              style={{ padding: '1px 5px', fontSize: 11, fontFamily: 'monospace' }}
            >
              {token.text}
            </span>
          ))}
        </div>
      )}

      {/* Builder Panel */}
      {isOpen && (
        <div className="border border-[#00856a]/30 rounded-lg bg-white shadow-sm overflow-hidden"
          style={{ marginTop: 8 }}>

          {/* Quick Templates */}
          {quickTemplates.length > 0 && (
            <div className="bg-[#fafafa] border-b border-gray-100"
              style={{ padding: '10px 12px' }}>
              <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quick Start
              </p>
              <div className="flex flex-wrap" style={{ gap: 4 }}>
                {quickTemplates.map((qt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onChange(qt.template);
                      textareaRef.current?.focus();
                    }}
                    className="text-gray-500 bg-white border border-gray-200 rounded-md hover:border-[#007a62] hover:text-[#007a62] hover:bg-[#f0faf7] transition-fast"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                  >
                    {qt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab Bar */}
          <div className="flex border-b border-gray-100 bg-[#fafafa]"
            style={{ padding: '0 4px' }}>
            {(['fields', 'operators', 'functions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`transition-fast relative ${
                  activeTab === tab
                    ? 'text-[#007a62] bg-white border-b-2 border-[#007a62]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}
              >
                {tab === 'fields' ? `Fields (${availableFields.length})` : tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>

            {/* Fields Tab */}
            {activeTab === 'fields' && (
              <div style={{ padding: 8 }}>
                {/* Search */}
                <input
                  type="text"
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  placeholder="Search fields..."
                  style={{ padding: '6px 10px', fontSize: 12, marginBottom: 6 }}
                  className="w-full border border-gray-200 rounded-md bg-gray-50 focus:border-[#00856a] transition-fast placeholder-gray-300"
                />

                {filteredFields.length === 0 ? (
                  <p className="text-gray-400 text-center" style={{ padding: '16px 0', fontSize: 12 }}>
                    {fieldSearch ? 'No matching fields' : 'No fields in the form yet'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredFields.map((field) => (
                      <button
                        key={field.id}
                        onClick={() => insertFieldRef(field.name)}
                        className="flex items-center text-left rounded-md hover:bg-[#f0faf7] transition-fast group"
                        style={{ padding: '6px 8px', gap: 8 }}
                      >
                        <span
                          className={`inline-block rounded border ${getTypeColor(field.type)} shrink-0`}
                          style={{ padding: '1px 6px', fontSize: 10, fontWeight: 600 }}
                        >
                          {field.type.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-gray-700 truncate" style={{ fontSize: 12 }}>
                          {field.name}
                        </span>
                        {field.label && field.label !== field.name && (
                          <span className="text-gray-400 truncate" style={{ fontSize: 11 }}>
                            {field.label}
                          </span>
                        )}
                        <span className="ml-auto text-[#007a62] opacity-0 group-hover:opacity-100 transition-fast shrink-0"
                          style={{ fontSize: 10, fontWeight: 600 }}>
                          + Insert
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Operators Tab */}
            {activeTab === 'operators' && (
              <div style={{ padding: 12 }}>
                {/* Comparison */}
                <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Comparison
                </p>
                <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 12 }}>
                  {COMPARISON_OPS.map((op) => (
                    <button
                      key={op.label}
                      onClick={() => insertAtCursor(op.insert)}
                      className="font-mono bg-white border border-gray-200 rounded-md hover:border-[#007a62] hover:bg-[#f0faf7] transition-fast text-gray-700 hover:text-[#007a62]"
                      style={{ padding: '5px 12px', fontSize: 13, fontWeight: 600, minWidth: 36, textAlign: 'center' }}
                      title={op.description}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>

                {/* Logical */}
                <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Logical
                </p>
                <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 12 }}>
                  {LOGICAL_OPS.map((op) => (
                    <button
                      key={op.label}
                      onClick={() => insertAtCursor(op.insert)}
                      className="font-mono bg-white border border-gray-200 rounded-md hover:border-[#007a62] hover:bg-[#f0faf7] transition-fast text-gray-700 hover:text-[#007a62]"
                      style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600 }}
                      title={op.description}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>

                {/* Math */}
                <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Arithmetic
                </p>
                <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 12 }}>
                  {[
                    { label: '+', insert: ' + ', description: 'Add' },
                    { label: '-', insert: ' - ', description: 'Subtract' },
                    { label: '*', insert: ' * ', description: 'Multiply' },
                    { label: 'div', insert: ' div ', description: 'Divide' },
                    { label: 'mod', insert: ' mod ', description: 'Remainder' },
                    { label: '( )', insert: '()', description: 'Parentheses' },
                  ].map((op) => (
                    <button
                      key={op.label}
                      onClick={() => insertAtCursor(op.insert)}
                      className="font-mono bg-white border border-gray-200 rounded-md hover:border-[#007a62] hover:bg-[#f0faf7] transition-fast text-gray-700 hover:text-[#007a62]"
                      style={{ padding: '5px 12px', fontSize: 13, fontWeight: 600, minWidth: 36, textAlign: 'center' }}
                      title={op.description}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>

                {/* Common Values */}
                <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Common Values
                </p>
                <div className="flex flex-wrap" style={{ gap: 4 }}>
                  {COMMON_VALUES.map((v) => (
                    <button
                      key={v.label}
                      onClick={() => insertAtCursor(v.insert)}
                      className="font-mono bg-white border border-gray-200 rounded-md hover:border-[#007a62] hover:bg-[#f0faf7] transition-fast text-gray-700 hover:text-[#007a62]"
                      style={{ padding: '5px 10px', fontSize: 12, fontWeight: 500 }}
                      title={v.description}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>

                {/* Self-reference hint */}
                <div className="bg-blue-50 border border-blue-100 rounded-md" style={{ padding: '8px 10px', marginTop: 12 }}>
                  <p className="text-blue-600" style={{ fontSize: 11, lineHeight: 1.4 }}>
                    <strong>Tip:</strong> Use <code className="bg-blue-100 rounded px-1">.</code> (a dot) to reference the current field's own value. This is common in constraint expressions like <code className="bg-blue-100 rounded px-1">. &gt; 0</code>
                  </p>
                </div>
              </div>
            )}

            {/* Functions Tab */}
            {activeTab === 'functions' && (
              <div style={{ padding: 8 }}>
                {/* Category filter pills */}
                <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 8, padding: '0 4px' }}>
                  {funcCategories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setFuncCategory(cat.value)}
                      className={`rounded-full transition-fast ${
                        funcCategory === cat.value
                          ? 'bg-[#007a62] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      style={{ padding: '3px 10px', fontSize: 11, fontWeight: 500 }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {relevantFunctions.map((fn) => (
                    <button
                      key={fn.label}
                      onClick={() => insertFunction(fn.template)}
                      className="flex flex-col text-left rounded-md hover:bg-[#f0faf7] transition-fast group"
                      style={{ padding: '8px 10px' }}
                    >
                      <div className="flex items-center" style={{ gap: 6 }}>
                        <span className="font-mono text-[#007a62]" style={{ fontSize: 12, fontWeight: 600 }}>
                          {fn.label}()
                        </span>
                        <span className="ml-auto text-[#007a62] opacity-0 group-hover:opacity-100 transition-fast shrink-0"
                          style={{ fontSize: 10, fontWeight: 600 }}>
                          + Insert
                        </span>
                      </div>
                      <span className="text-gray-400" style={{ fontSize: 11, marginTop: 2 }}>
                        {fn.description}
                      </span>
                      <code className="text-gray-500 bg-gray-50 rounded border border-gray-100 mt-1 block"
                        style={{ padding: '3px 6px', fontSize: 10, lineHeight: 1.4, fontFamily: 'monospace' }}>
                        {fn.template}
                      </code>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Expression Tokenizer — for syntax-highlighted preview
// ============================================================

interface ExpressionToken {
  type: 'field' | 'operator' | 'function' | 'string' | 'number' | 'text';
  text: string;
}

function tokenizeExpression(expr: string): ExpressionToken[] {
  const tokens: ExpressionToken[] = [];
  const regex = /(\$\{[^}]+\})|(!=|>=|<=|[=><])|\b(and|or|not|div|mod)\b|([a-z_-]+)\s*(?=\()|('(?:[^'\\]|\\.)*')|(\d+(?:\.\d+)?)|([().,])|(\S+)/gi;

  let match;
  while ((match = regex.exec(expr)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'field', text: match[1] });
    } else if (match[2]) {
      tokens.push({ type: 'operator', text: match[2] });
    } else if (match[3]) {
      tokens.push({ type: 'operator', text: match[3] });
    } else if (match[4]) {
      tokens.push({ type: 'function', text: match[4] });
    } else if (match[5]) {
      tokens.push({ type: 'string', text: match[5] });
    } else if (match[6]) {
      tokens.push({ type: 'number', text: match[6] });
    } else {
      tokens.push({ type: 'text', text: match[0] });
    }
  }

  return tokens;
}
