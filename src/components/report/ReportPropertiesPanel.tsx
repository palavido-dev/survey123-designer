/**
 * Report Properties Panel (Right Side)
 *
 * Context-sensitive panel that shows:
 * - When no token selected: Quick reference, syntax help, import/export
 * - When a token is selected: Expression details, pipe filter picker
 */

import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useReportStore } from '../../store/reportStore';
import { useSurveyStore } from '../../store/surveyStore';
import { PIPE_FILTERS, getFieldCategory } from '../../types/report';
import { importDocxToHtml, exportHtmlToDocx } from '../../utils/reportDocx';
import {
  Download, Upload, AlertCircle, HelpCircle,
} from '../../utils/icons';

// ============================================================
// Syntax Reference
// ============================================================

const SYNTAX_EXAMPLES = [
  { label: 'Field value', syntax: '${fieldname}', desc: 'Insert a field value' },
  { label: 'With filter', syntax: '${field | filter}', desc: 'Apply a pipe filter' },
  { label: 'Conditional', syntax: '${if field | selected:"val"}...${/}', desc: 'Show/hide content' },
  { label: 'Repeat', syntax: '${#repeatname}...${/}', desc: 'Loop through records' },
  { label: 'Image', syntax: '${$image | size:460:0}', desc: 'Embed an image' },
  { label: 'File', syntax: '${$file | size:460:0}', desc: 'Embed a file' },
  { label: 'Date', syntax: '${date | format:"MM/DD/YYYY"}', desc: 'Format a date' },
  { label: 'Report date', syntax: '${$date}', desc: 'Current report date' },
  { label: 'Multiline', syntax: '${field | appearance:"multiline"}', desc: 'Preserve line breaks' },
];

// ============================================================
// Token Details View
// ============================================================

function TokenDetailsView() {
  const { selectedToken, setSelectedToken } = useReportStore();
  const form = useSurveyStore((s) => s.form);

  if (!selectedToken) return null;

  const { expression, tokenType } = selectedToken;

  // Parse field name from expression
  const fieldName = expression.split('|')[0].trim().replace(/^[#]/, '');
  const existingFilters = expression.includes('|')
    ? expression.substring(expression.indexOf('|') + 1).trim()
    : '';

  // Find the field in the survey
  const fieldRow = form.survey.find((r) => r.name === fieldName);
  const fieldCategory = fieldRow ? getFieldCategory(fieldRow.type) : 'text';

  // Get applicable filters
  const applicableFilters = PIPE_FILTERS.filter(
    (f) => f.appliesTo.includes(fieldCategory) || f.appliesTo.includes('all')
  );

  const insertFilter = (filterName: string, args: string) => {
    const newExpr = existingFilters
      ? `${fieldName} | ${existingFilters} | ${filterName}:${args}`
      : `${fieldName} | ${filterName}:${args}`;

    // Update the token in the editor
    const editor = (window as any).__reportEditor;
    if (editor && selectedToken.pos !== undefined) {
      const { pos } = selectedToken;
      editor
        .chain()
        .focus()
        .setNodeSelection(pos)
        .command(({ tr, dispatch }: any) => {
          if (dispatch) {
            const node = tr.doc.nodeAt(pos);
            if (node) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                expression: newExpr,
              });
            }
          }
          return true;
        })
        .run();
      setSelectedToken({ ...selectedToken, expression: newExpr });
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Token info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg" style={{ padding: '12px', marginBottom: 16 }}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${
            tokenType === 'conditional_start' ? 'text-amber-600' :
            tokenType === 'repeat_start' ? 'text-violet-600' :
            tokenType === 'keyword' ? 'text-purple-600' :
            'text-[#007a62]'
          }`}>
            {tokenType === 'conditional_start' ? 'Conditional' :
             tokenType === 'conditional_end' || tokenType === 'repeat_end' ? 'End Block' :
             tokenType === 'repeat_start' ? 'Repeat' :
             tokenType === 'keyword' ? 'Keyword' :
             'Field'}
          </span>
        </div>
        <code className="text-[12px] text-gray-700 font-mono break-all block">
          {'${'}
          {expression}
          {'}'}
        </code>
        {fieldRow && (
          <p className="text-[11px] text-gray-400 mt-2">
            {fieldRow.label || fieldRow.name} — {fieldRow.type}
          </p>
        )}
      </div>

      {/* Filter picker (only for field tokens) */}
      {(tokenType === 'field' || tokenType === 'field_filtered') && applicableFilters.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Add Pipe Filter
          </h4>
          <div className="space-y-2">
            {applicableFilters.map((filter) => (
              <FilterButton
                key={filter.name}
                filter={filter}
                onApply={(args) => insertFilter(filter.name, args)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Filter Button with args
// ============================================================

function FilterButton({
  filter,
  onApply,
}: {
  filter: typeof PIPE_FILTERS[0];
  onApply: (args: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [argValues, setArgValues] = useState<Record<string, string>>({});

  const buildArgs = () => {
    if (!filter.args || filter.args.length === 0) return '';
    return filter.args
      .map((a) => argValues[a.name] || a.placeholder || '')
      .filter(Boolean)
      .join(':');
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-fast"
        style={{ padding: '8px 12px' }}
      >
        <div>
          <span className="text-[12px] font-medium text-gray-700">{filter.label}</span>
          <span className="text-[10px] text-gray-400 ml-2 font-mono">| {filter.name}</span>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50" style={{ padding: '10px 12px' }}>
          <p className="text-[10px] text-gray-500 mb-2">{filter.description}</p>
          {filter.args?.map((arg) => (
            <div key={arg.name} style={{ marginBottom: 8 }}>
              <label className="text-[10px] text-gray-500 font-medium block mb-1">{arg.label}</label>
              {arg.type === 'select' && arg.options ? (
                <select
                  value={argValues[arg.name] || ''}
                  onChange={(e) => setArgValues({ ...argValues, [arg.name]: e.target.value })}
                  className="w-full text-[12px] border border-gray-200 rounded px-2 py-1 bg-white"
                >
                  <option value="">Choose...</option>
                  {arg.options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={arg.type === 'number' ? 'number' : 'text'}
                  value={argValues[arg.name] || ''}
                  onChange={(e) => setArgValues({ ...argValues, [arg.name]: e.target.value })}
                  placeholder={arg.placeholder}
                  className="w-full text-[12px] border border-gray-200 rounded px-2 py-1"
                />
              )}
            </div>
          ))}
          <button
            onClick={() => { onApply(buildArgs()); setExpanded(false); }}
            className="text-[11px] text-white bg-[#007a62] hover:bg-[#006652] rounded px-3 py-1 font-medium transition-fast"
          >
            Apply Filter
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Default View (no token selected)
// ============================================================

function DefaultView() {
  const { setReportHtml, setImportedFileName, setImporting, setExporting, reportHtml } = useReportStore();
  const form = useSurveyStore((s) => s.form);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStats, setImportStats] = useState<any>(null);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await importDocxToHtml(file);
      setReportHtml(result.html);
      setImportedFileName(file.name);
      setImportStats(result.stats);

      // Load into editor
      const editor = (window as any).__reportEditor;
      if (editor) {
        editor.commands.setContent(result.html);
      }
    } catch (err) {
      console.error('Import error:', err);
      alert(`Failed to import: ${(err as Error).message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [setReportHtml, setImportedFileName, setImporting]);

  const handleExport = useCallback(async () => {
    const editor = (window as any).__reportEditor;
    if (!editor) return;

    setExporting(true);
    try {
      const html = editor.getHTML();
      const fileName = `${form.settings.form_title || 'report'}_template.docx`
        .replace(/\s+/g, '_')
        .toLowerCase();
      await exportHtmlToDocx(html, fileName);
    } catch (err) {
      console.error('Export error:', err);
      alert(`Failed to export: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  }, [form.settings.form_title, setExporting]);

  return (
    <div style={{ padding: '16px' }}>
      {/* Import/Export */}
      <div style={{ marginBottom: 20 }}>
        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Template Actions
        </h4>
        <div className="space-y-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center rounded-lg border border-gray-200 bg-white
              hover:border-[#00856a] hover:bg-[#f0faf7] transition-fast"
            style={{ padding: '10px 12px', gap: 10 }}
          >
            <Upload size={16} className="text-gray-400 shrink-0" />
            <div className="text-left">
              <span className="text-[12px] font-medium text-gray-700 block">Import .docx</span>
              <span className="text-[10px] text-gray-400">Load an existing Word template</span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleImport}
            className="hidden"
          />

          <button
            onClick={handleExport}
            disabled={!reportHtml}
            className="w-full flex items-center rounded-lg border border-gray-200 bg-white
              hover:border-[#00856a] hover:bg-[#f0faf7] transition-fast
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
            style={{ padding: '10px 12px', gap: 10 }}
          >
            <Download size={16} className="text-gray-400 shrink-0" />
            <div className="text-left">
              <span className="text-[12px] font-medium text-gray-700 block">Export .docx</span>
              <span className="text-[10px] text-gray-400">Download as Word document</span>
            </div>
          </button>
        </div>
      </div>

      {/* Import stats */}
      {importStats && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg mb-5" style={{ padding: '10px 14px' }}>
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-2">
            Import Summary
          </p>
          <div className="grid grid-cols-2" style={{ gap: 4 }}>
            <span className="text-[11px] text-gray-600">{importStats.templateVars} fields</span>
            <span className="text-[11px] text-gray-600">{importStats.conditionals} conditionals</span>
            <span className="text-[11px] text-gray-600">{importStats.repeats} repeats</span>
            <span className="text-[11px] text-gray-600">{importStats.tables} tables</span>
          </div>
        </div>
      )}

      {/* Syntax Reference */}
      <div>
        <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
          <HelpCircle size={12} className="inline mr-1" />
          Syntax Reference
        </h4>
        <div className="space-y-1.5">
          {SYNTAX_EXAMPLES.map((ex) => (
            <div
              key={ex.label}
              className="bg-gray-50 border border-gray-100 rounded-md"
              style={{ padding: '6px 10px' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-medium">{ex.label}</span>
              </div>
              <code className="text-[10px] text-[#007a62] font-mono block mt-0.5 break-all">
                {ex.syntax}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg" style={{ padding: '10px 14px' }}>
        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1.5">
          <AlertCircle size={10} className="inline mr-1" />
          Tips
        </p>
        <ul className="text-[10px] text-blue-700 space-y-1">
          <li>Click fields in the left panel to insert them</li>
          <li>Click a token in the editor to see filter options</li>
          <li>Use tables for structured layouts</li>
          <li>Export to .docx, then refine formatting in Word</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================
// Main Panel
// ============================================================

export function ReportPropertiesPanel() {
  const { selectedToken, reportPanelView, setReportPanelView } = useReportStore();

  return (
    <div className="bg-white border-l border-gray-200 flex flex-col h-full" style={{ width: 320 }}>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-[#fafafa] shrink-0" style={{ padding: '0 6px' }}>
        <button
          onClick={() => setReportPanelView('insert')}
          className={`flex items-center transition-fast whitespace-nowrap
            ${reportPanelView === 'insert' || reportPanelView === 'token'
              ? 'text-[#007a62] bg-white border-b-2 border-[#007a62]'
              : 'text-gray-400 hover:text-gray-600'
            }`}
          style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600 }}
        >
          {selectedToken ? 'Token' : 'Template'}
        </button>
        <button
          onClick={() => setReportPanelView('syntax')}
          className={`flex items-center transition-fast whitespace-nowrap
            ${reportPanelView === 'syntax'
              ? 'text-[#007a62] bg-white border-b-2 border-[#007a62]'
              : 'text-gray-400 hover:text-gray-600'
            }`}
          style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600 }}
        >
          <HelpCircle size={13} className="mr-1" />
          Help
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedToken ? <TokenDetailsView /> : <DefaultView />}
      </div>
    </div>
  );
}
