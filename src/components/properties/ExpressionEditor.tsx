/**
 * ExpressionEditor — IDE-like expression input with real-time validation,
 * syntax highlighting, autocomplete, and hover tooltips.
 *
 * Replaces the plain textarea in ExpressionBuilder with a rich editing
 * experience. Uses a transparent textarea overlaid on a syntax-highlighted
 * rendering layer, similar to CodeMirror's approach but lightweight.
 *
 * Features:
 *   - Real-time AST-based validation with inline error indicators
 *   - Syntax-highlighted tokens (fields, functions, operators, strings, numbers)
 *   - Autocomplete dropdown triggered by typing or Ctrl+Space
 *   - Hover tooltips for functions (signature, description, example)
 *     and field references (type, label)
 *   - Squiggly underlines on error/warning positions
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  tokenize,
  validateExpressionAST,
  getCompletions,
  getHoverInfo,
  FUNCTION_REGISTRY,
  type Token,
  type ExpressionDiagnostic,
  type CompletionItem,
  type HoverInfo,
} from '../../utils/expressionParser';
import type { SurveyRow } from '../../types/survey';

// ============================================================
// Props
// ============================================================

interface ExpressionEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  fields: SurveyRow[];
  /** Ref forwarded so ExpressionBuilder can call insertAtCursor */
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  /** Compact single-line mode vs multi-line */
  rows?: number;
  /** If true, show the token preview below */
  showTokenPreview?: boolean;
}

// ============================================================
// Field info map builder
// ============================================================

function buildFieldMap(fields: SurveyRow[]): Map<string, { type: string; label: string }> {
  const map = new Map<string, { type: string; label: string }>();
  for (const f of fields) {
    if (f.name) {
      map.set(f.name, { type: f.type, label: f.label || f.name });
    }
  }
  return map;
}

// ============================================================
// Token color classes
// ============================================================

function getTokenClass(token: Token, fieldNames: Set<string>): string {
  switch (token.type) {
    case 'field_ref': {
      const name = token.value.slice(2, -1);
      if (name && name !== '.' && !fieldNames.has(name)) {
        return 'expression-token-field-error';
      }
      return 'expression-token-field';
    }
    case 'function_name': return 'expression-token-function';
    case 'keyword': return 'expression-token-keyword';
    case 'operator': return 'expression-token-operator';
    case 'string': return 'expression-token-string';
    case 'number': return 'expression-token-number';
    case 'error': return 'expression-token-error';
    default: return 'expression-token-default';
  }
}

// ============================================================
// Component
// ============================================================

export function ExpressionEditor({
  value,
  onChange,
  placeholder,
  fields,
  textareaRef: externalRef,
  rows = 2,
  showTokenPreview = true,
}: ExpressionEditorProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRefToUse = externalRef || internalRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [cursorPos, setCursorPos] = useState(0);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Build field maps
  const fieldMap = useMemo(() => buildFieldMap(fields), [fields]);
  const fieldNames = useMemo(() => new Set(fields.map(f => f.name).filter(Boolean)), [fields]);

  // Parse and validate
  const diagnostics = useMemo(() => {
    if (!value || !value.trim()) return [];
    return validateExpressionAST(value, fieldNames);
  }, [value, fieldNames]);

  // Tokenize for syntax highlighting
  const tokens = useMemo(() => {
    if (!value) return [];
    return tokenize(value);
  }, [value]);

  // Get completions
  const completions = useMemo(() => {
    if (!showAutocomplete || !isFocused) return [];
    return getCompletions(value || '', cursorPos, fieldMap);
  }, [value, cursorPos, fieldMap, showAutocomplete, isFocused]);

  // Clamp autocomplete index
  useEffect(() => {
    if (autocompleteIndex >= completions.length) {
      setAutocompleteIndex(Math.max(0, completions.length - 1));
    }
  }, [completions.length, autocompleteIndex]);

  // Close autocomplete on outside click
  useEffect(() => {
    if (!showAutocomplete) return;
    const handler = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAutocomplete]);

  // Handle text change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursor = e.target.selectionStart ?? 0;
    onChange(newValue);
    setCursorPos(newCursor);

    // Auto-trigger autocomplete when typing
    const charBefore = newValue[newCursor - 1];
    const twoCharsBefore = newValue.slice(Math.max(0, newCursor - 2), newCursor);
    if (twoCharsBefore === '${' || /[a-zA-Z_]/.test(charBefore || '')) {
      setShowAutocomplete(true);
      setAutocompleteIndex(0);
    } else if (charBefore === '(' || charBefore === ')' || charBefore === ' ') {
      setShowAutocomplete(false);
    }
  }, [onChange]);

  // Handle key events for autocomplete navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Space: trigger autocomplete
    if (e.key === ' ' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setCursorPos(e.currentTarget.selectionStart ?? 0);
      setShowAutocomplete(true);
      setAutocompleteIndex(0);
      return;
    }

    if (!showAutocomplete || completions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutocompleteIndex(i => Math.min(i + 1, completions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutocompleteIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      applyCompletion(completions[autocompleteIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowAutocomplete(false);
    }
  }, [showAutocomplete, completions, autocompleteIndex]);

  // Apply a completion
  const applyCompletion = useCallback((item: CompletionItem) => {
    const textarea = textareaRefToUse.current;
    if (!textarea) return;

    const currentValue = value || '';
    const cursor = cursorPos;

    // Find the start of what the user was typing
    let insertStart = cursor;
    if (item.kind === 'field' && item.label.startsWith('${')) {
      // For field references, find the ${ before cursor
      const before = currentValue.slice(0, cursor);
      const fieldStart = before.lastIndexOf('${');
      if (fieldStart >= 0) {
        insertStart = fieldStart;
      }
    } else {
      // For functions/keywords, find start of the partial word
      const before = currentValue.slice(0, cursor);
      const wordMatch = before.match(/([a-zA-Z_][a-zA-Z0-9_:-]*)$/);
      if (wordMatch) {
        insertStart = cursor - wordMatch[1].length;
      }
    }

    let insertText = '';
    if (item.kind === 'field' && item.label.startsWith('${')) {
      insertText = item.label;
    } else {
      insertText = item.label + (item.kind === 'function' ? '(' : '');
    }

    const newValue = currentValue.slice(0, insertStart) + insertText + currentValue.slice(cursor);
    const newCursor = insertStart + insertText.length;

    onChange(newValue);
    setShowAutocomplete(false);

    requestAnimationFrame(() => {
      if (textarea.isConnected) {
        textarea.focus();
        textarea.setSelectionRange(newCursor, newCursor);
        setCursorPos(newCursor);
      }
    });
  }, [value, cursorPos, onChange, textareaRefToUse]);

  // Handle cursor position tracking
  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPos(e.currentTarget.selectionStart ?? 0);
  }, []);

  // Handle hover for tooltips
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!value) return;

    // Approximate character position from mouse position
    // This is rough but workable for single-line or short expressions
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const textarea = textareaRefToUse.current;
    if (!textarea) return;

    // Use a more reliable method: find which token the mouse is over
    // by checking the highlight spans
    const target = e.target as HTMLElement;
    const tokenIndex = target.getAttribute('data-token-index');
    if (tokenIndex !== null) {
      const idx = parseInt(tokenIndex);
      const nonWsTokens = tokens.filter(t => t.type !== 'whitespace');
      const tok = nonWsTokens[idx];
      if (tok) {
        const info = getHoverInfo(value, tok.start, fieldMap);
        if (info) {
          setHoverInfo(info);
          setHoverPos({ x: e.clientX, y: e.clientY });
          return;
        }
      }
    }

    setHoverInfo(null);
    setHoverPos(null);
  }, [value, tokens, fieldMap, textareaRefToUse]);

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
    setHoverPos(null);
  }, []);

  // Count errors and warnings
  const errorCount = diagnostics.filter(d => d.level === 'error').length;
  const warningCount = diagnostics.filter(d => d.level === 'warning').length;

  // Build the syntax-highlighted overlay
  const highlightedTokens = useMemo(() => {
    if (!value) return null;
    const nonWsTokens = tokens.filter(t => t.type !== 'whitespace');
    return nonWsTokens;
  }, [tokens, value]);

  return (
    <div ref={containerRef} className="expression-editor-container" style={{ position: 'relative' }}>
      {/* Textarea (the actual editable area) */}
      <textarea
        ref={textareaRefToUse as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onFocus={() => setIsFocused(true)}
        onBlur={() => { setIsFocused(false); setTimeout(() => setShowAutocomplete(false), 150); }}
        placeholder={placeholder}
        rows={value && value.length > 60 ? Math.max(rows, 3) : rows}
        spellCheck={false}
        style={{ padding: '8px 12px', fontSize: 12, lineHeight: 1.6 }}
        className={`w-full font-mono border rounded-lg bg-white transition-fast placeholder-gray-300 resize-y ${
          errorCount > 0
            ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-200'
            : warningCount > 0
            ? 'border-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-200'
            : 'border-gray-200 focus:border-[#00856a] focus:ring-1 focus:ring-[#00856a]/20'
        }`}
      />

      {/* Syntax-highlighted token preview */}
      {value && showTokenPreview && !isFocused && (
        <div
          className="flex flex-wrap items-center"
          style={{ gap: 3, marginTop: 6 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {highlightedTokens?.map((token, i) => {
            const tokenClass = getTokenClass(token, fieldNames);
            // Check if this token has a diagnostic
            const hasDiag = diagnostics.some(d =>
              (d.start <= token.start && d.end > token.start) ||
              (d.start >= token.start && d.start < token.end)
            );
            const diagLevel = hasDiag
              ? diagnostics.find(d =>
                  (d.start <= token.start && d.end > token.start) ||
                  (d.start >= token.start && d.start < token.end)
                )?.level
              : null;

            return (
              <span
                key={i}
                data-token-index={i}
                className={`inline-block rounded cursor-default ${tokenClass} ${
                  diagLevel === 'error' ? 'expression-token-squiggly-error' :
                  diagLevel === 'warning' ? 'expression-token-squiggly-warning' : ''
                }`}
                style={{
                  padding: '1px 5px',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  textDecorationSkipInk: 'none',
                }}
              >
                {token.value}
              </span>
            );
          })}
        </div>
      )}

      {/* Validation diagnostics */}
      {value && diagnostics.length > 0 && !isFocused && (
        <div style={{ marginTop: 8 }}>
          {diagnostics.slice(0, 5).map((diag, i) => (
            <div key={i} className="flex items-start" style={{ gap: 6, marginBottom: 3 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={diag.level === 'error' ? '#dc2626' : '#d97706'}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ marginTop: 1, flexShrink: 0 }}>
                {diag.level === 'error' ? (
                  <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
                ) : (
                  <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>
                )}
              </svg>
              <span style={{ fontSize: 11, color: diag.level === 'error' ? '#dc2626' : '#d97706', fontWeight: 500 }}>
                {diag.message}
              </span>
            </div>
          ))}
          {diagnostics.length > 5 && (
            <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 18 }}>
              +{diagnostics.length - 5} more issue{diagnostics.length - 5 !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Valid indicator */}
      {value && diagnostics.length === 0 && !isFocused && (
        <div className="flex items-center" style={{ marginTop: 8, gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>Expression looks valid</span>
        </div>
      )}

      {/* Autocomplete dropdown */}
      {showAutocomplete && completions.length > 0 && isFocused && (
        <div
          ref={autocompleteRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          style={{
            left: 0,
            right: 0,
            top: '100%',
            marginTop: 4,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {completions.slice(0, 20).map((item, i) => (
            <button
              key={item.label + i}
              onMouseDown={(e) => {
                e.preventDefault();
                applyCompletion(item);
              }}
              className={`w-full flex items-center text-left transition-fast ${
                i === autocompleteIndex
                  ? 'bg-[#f0faf7] text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={{ padding: '6px 10px', gap: 8, fontSize: 12 }}
            >
              {/* Kind icon */}
              <span className={`inline-flex items-center justify-center rounded shrink-0 ${
                item.kind === 'function' ? 'bg-blue-50 text-blue-600' :
                item.kind === 'field' ? 'bg-[#f0faf7] text-[#007a62]' :
                item.kind === 'operator' ? 'bg-orange-50 text-orange-600' :
                item.kind === 'keyword' ? 'bg-purple-50 text-purple-600' :
                'bg-gray-50 text-gray-500'
              }`} style={{ width: 20, height: 20, fontSize: 9, fontWeight: 700 }}>
                {item.kind === 'function' ? 'fn' :
                 item.kind === 'field' ? '$' :
                 item.kind === 'operator' ? 'op' :
                 item.kind === 'keyword' ? 'kw' : '?'}
              </span>

              {/* Label */}
              <span className="font-mono truncate" style={{ fontSize: 12, fontWeight: 500 }}>
                {item.label}
              </span>

              {/* Detail */}
              {item.detail && (
                <span className="text-gray-400 truncate ml-auto" style={{ fontSize: 10 }}>
                  {item.detail}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Hover tooltip */}
      {hoverInfo && hoverPos && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] bg-gray-900 text-white rounded-lg shadow-xl"
          style={{
            left: hoverPos.x + 8,
            top: hoverPos.y - 8,
            transform: 'translateY(-100%)',
            maxWidth: 360,
            padding: '10px 14px',
            pointerEvents: 'none',
          }}
        >
          {/* Signature / title */}
          <div className="font-mono" style={{ fontSize: 12, fontWeight: 600, marginBottom: hoverInfo.description ? 4 : 0 }}>
            {hoverInfo.signature || hoverInfo.content}
          </div>

          {/* Description */}
          {hoverInfo.description && (
            <div style={{ fontSize: 11, color: '#d1d5db', lineHeight: 1.4 }}>
              {hoverInfo.description}
            </div>
          )}

          {/* Category badge */}
          {hoverInfo.category && (
            <span className="inline-block rounded mt-1"
              style={{ fontSize: 9, padding: '1px 6px', background: 'rgba(255,255,255,0.15)', color: '#9ca3af' }}>
              {hoverInfo.category}
            </span>
          )}

          {/* Example */}
          {hoverInfo.example && (
            <div className="font-mono mt-1" style={{ fontSize: 10, color: '#93c5fd' }}>
              {hoverInfo.example}
            </div>
          )}

          {/* Field info */}
          {hoverInfo.fieldType && (
            <div className="flex items-center mt-1" style={{ gap: 6 }}>
              <span className="inline-block rounded"
                style={{ fontSize: 9, padding: '1px 6px', background: 'rgba(0,122,98,0.3)', color: '#6ee7b7' }}>
                {hoverInfo.fieldType}
              </span>
              {hoverInfo.fieldLabel && (
                <span style={{ fontSize: 10, color: '#d1d5db' }}>{hoverInfo.fieldLabel}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
