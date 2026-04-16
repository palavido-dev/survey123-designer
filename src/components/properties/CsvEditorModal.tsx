/**
 * CSV Editor Modal — Full spreadsheet-style editor for CSV media files
 *
 * Features:
 *   - Editable cells with tab/enter navigation
 *   - Add/remove rows and columns
 *   - Rename columns inline
 *   - Live preview of changes before saving
 *   - Regenerates rawContent + sampleData on save
 *   - Upload replacement CSV
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { X } from '../../utils/icons';

// ============================================================
// CSV serialization helpers
// ============================================================

/** Escape a value for CSV output (quote if needed) */
function csvEscapeValue(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}

/** Build CSV text from columns + rows */
function buildCsvText(columns: string[], rows: Record<string, string>[]): string {
  const lines: string[] = [];
  lines.push(columns.map(csvEscapeValue).join(','));
  for (const row of rows) {
    lines.push(columns.map((col) => csvEscapeValue(row[col] || '')).join(','));
  }
  return lines.join('\n');
}

/** Parse CSV text into columns + rows */
function parseCsvText(text: string): { columns: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { columns: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]);
  const columns = splitLine(lines[0], delimiter);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    columns.forEach((col, j) => { row[col] = values[j] || ''; });
    rows.push(row);
  }
  return { columns, rows };
}

function detectDelimiter(line: string): string {
  const commas = (line.match(/,/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  const semis = (line.match(/;/g) || []).length;
  return tabs > commas && tabs > semis ? '\t' : semis > commas ? ';' : ',';
}

function splitLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ============================================================
// Component
// ============================================================

interface Props {
  fileName: string;
  onClose: () => void;
}

export function CsvEditorModal({ fileName, onClose }: Props) {
  const { form, updateMediaFile } = useSurveyStore();
  const mediaFile = form.mediaFiles.find((f) => f.fileName === fileName);

  // Working copy of columns and rows
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [dirty, setDirty] = useState(false);
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [headerValue, setHeaderValue] = useState('');
  const headerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active cell for keyboard nav
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Initialize from media file
  useEffect(() => {
    if (!mediaFile) return;
    if (mediaFile.rawContent) {
      const parsed = parseCsvText(mediaFile.rawContent);
      setColumns(parsed.columns);
      setRows(parsed.rows);
    } else {
      // Fall back to sampleData
      setColumns([...mediaFile.columns]);
      setRows(mediaFile.sampleData.map((r) => ({ ...r })));
    }
  }, [/* only on mount */]);

  // Focus header input when editing
  useEffect(() => {
    if (editingHeader !== null) {
      headerInputRef.current?.focus();
      headerInputRef.current?.select();
    }
  }, [editingHeader]);

  const markDirty = () => { if (!dirty) setDirty(true); };

  // ---- Cell editing ----
  const updateCell = (rowIndex: number, colName: string, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [colName]: value };
      return next;
    });
    markDirty();
  };

  // ---- Column operations ----
  const renameColumn = (oldIndex: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === columns[oldIndex]) {
      setEditingHeader(null);
      return;
    }
    // Check for duplicate
    if (columns.some((c, i) => i !== oldIndex && c === trimmed)) {
      alert(`Column "${trimmed}" already exists.`);
      return;
    }
    const oldName = columns[oldIndex];
    setColumns((prev) => prev.map((c, i) => (i === oldIndex ? trimmed : c)));
    setRows((prev) =>
      prev.map((row) => {
        const newRow: Record<string, string> = {};
        for (const key of Object.keys(row)) {
          newRow[key === oldName ? trimmed : key] = row[key];
        }
        return newRow;
      })
    );
    setEditingHeader(null);
    markDirty();
  };

  const addColumn = () => {
    let name = 'new_column';
    let n = 1;
    while (columns.includes(name)) { name = `new_column_${n++}`; }
    setColumns((prev) => [...prev, name]);
    setRows((prev) => prev.map((r) => ({ ...r, [name]: '' })));
    markDirty();
  };

  const removeColumn = (index: number) => {
    const colName = columns[index];
    if (!window.confirm(`Delete column "${colName}"?`)) return;
    setColumns((prev) => prev.filter((_, i) => i !== index));
    setRows((prev) =>
      prev.map((row) => {
        const newRow = { ...row };
        delete newRow[colName];
        return newRow;
      })
    );
    markDirty();
  };

  // ---- Row operations ----
  const addRow = () => {
    const newRow: Record<string, string> = {};
    columns.forEach((c) => { newRow[c] = ''; });
    setRows((prev) => [...prev, newRow]);
    markDirty();
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  // ---- Save ----
  const handleSave = () => {
    const rawContent = buildCsvText(columns, rows);
    updateMediaFile(fileName, {
      columns,
      sampleData: rows.slice(0, 200),
      totalRows: rows.length,
      rawContent,
    });
    setDirty(false);
  };

  // ---- Replace file upload ----
  const handleReplaceCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCsvText(text);
      if (parsed.columns.length === 0) {
        alert('Could not parse columns from this file.');
        return;
      }
      setColumns(parsed.columns);
      setRows(parsed.rows);
      markDirty();
    } catch (err) {
      alert('Error reading file: ' + (err as Error).message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---- Keyboard nav for cells ----
  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const nextCol = e.shiftKey ? colIdx - 1 : colIdx + 1;
        if (nextCol >= 0 && nextCol < columns.length) {
          setActiveCell({ row: rowIdx, col: nextCol });
        } else if (!e.shiftKey && nextCol >= columns.length && rowIdx + 1 < rows.length) {
          setActiveCell({ row: rowIdx + 1, col: 0 });
        }
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (rowIdx + 1 < rows.length) {
          setActiveCell({ row: rowIdx + 1, col: colIdx });
        }
      }
    },
    [columns.length, rows.length]
  );

  // Focus active cell
  useEffect(() => {
    if (!activeCell || !tableRef.current) return;
    const input = tableRef.current.querySelector(
      `input[data-row="${activeCell.row}"][data-col="${activeCell.col}"]`
    ) as HTMLInputElement | null;
    input?.focus();
    input?.select();
  }, [activeCell]);

  if (!mediaFile) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <p className="text-gray-500">CSV file "{fileName}" not found.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !dirty) onClose(); }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl flex flex-col"
        style={{ width: '92vw', maxWidth: 1100, height: '85vh', maxHeight: 750 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">{fileName}</h2>
              <p className="text-xs text-gray-400">
                {columns.length} columns, {rows.length} rows
                {dirty && <span className="ml-2 text-amber-500 font-medium">• Unsaved changes</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-fast"
            >
              Replace CSV
            </button>
            <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" onChange={handleReplaceCsv} className="hidden" />
            {dirty && (
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 text-xs font-medium text-white bg-[#007a62] rounded-lg hover:bg-[#00654f] transition-fast"
              >
                Save Changes
              </button>
            )}
            <button
              onClick={() => {
                if (dirty && !window.confirm('You have unsaved changes. Discard them?')) return;
                onClose();
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-fast"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#007a62] bg-emerald-50 rounded-md hover:bg-emerald-100 transition-fast"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Row
          </button>
          <button
            type="button"
            onClick={addColumn}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-fast"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Column
          </button>
          <div className="flex-1" />
          <span className="text-[10px] text-gray-400">
            Tab to navigate cells • Double-click headers to rename
          </span>
        </div>

        {/* Table */}
        <div ref={tableRef} className="flex-1 overflow-auto px-6 py-4">
          <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th
                  className="sticky top-0 z-10 bg-gray-50 border border-gray-200 text-center text-[10px] text-gray-400 font-medium"
                  style={{ width: 40, padding: '6px 4px' }}
                >
                  #
                </th>
                {columns.map((col, ci) => (
                  <th
                    key={ci}
                    className="sticky top-0 z-10 bg-gray-50 border border-gray-200 text-left font-semibold text-gray-700"
                    style={{ padding: 0, minWidth: 100 }}
                  >
                    {editingHeader === ci ? (
                      <input
                        ref={headerInputRef}
                        value={headerValue}
                        onChange={(e) => setHeaderValue(e.target.value)}
                        onBlur={() => renameColumn(ci, headerValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameColumn(ci, headerValue);
                          if (e.key === 'Escape') setEditingHeader(null);
                        }}
                        className="w-full bg-white border-2 border-[#007a62] font-mono text-xs px-2.5 py-2 outline-none"
                      />
                    ) : (
                      <div
                        className="flex items-center justify-between px-2.5 py-2 cursor-pointer hover:bg-gray-100 group"
                        onDoubleClick={() => { setEditingHeader(ci); setHeaderValue(col); }}
                      >
                        <span className="font-mono text-xs">{col}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeColumn(ci); }}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-fast p-0.5"
                          title="Delete column"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </th>
                ))}
                <th
                  className="sticky top-0 z-10 bg-gray-50 border border-gray-200"
                  style={{ width: 36, padding: '6px 4px' }}
                />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={`group/row ${ri % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}`}>
                  <td
                    className="border border-gray-200 bg-gray-50 text-center text-[10px] text-gray-400 font-mono"
                    style={{ padding: '4px 6px' }}
                  >
                    {ri + 1}
                  </td>
                  {columns.map((col, ci) => (
                    <td key={ci} className="border border-gray-200 p-0">
                      <input
                        type="text"
                        data-row={ri}
                        data-col={ci}
                        value={row[col] || ''}
                        onChange={(e) => updateCell(ri, col, e.target.value)}
                        onFocus={() => setActiveCell({ row: ri, col: ci })}
                        onKeyDown={(e) => handleCellKeyDown(e, ri, ci)}
                        className="w-full bg-transparent text-xs text-gray-700 outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-300 font-mono"
                        style={{ padding: '6px 10px', border: 'none' }}
                      />
                    </td>
                  ))}
                  <td className="border border-gray-200 bg-gray-50 text-center" style={{ padding: '2px 4px' }}>
                    <button
                      type="button"
                      onClick={() => removeRow(ri)}
                      className="opacity-0 group-hover/row:opacity-100 text-gray-300 hover:text-red-400 transition-fast p-0.5"
                      title="Delete row"
                    >
                      <X size={10} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No data rows. Click "Add Row" to start adding values.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 bg-gray-50/50">
          <p className="text-[11px] text-gray-400">
            Changes are saved to the form in memory. Export to XLSX to include the updated CSV in the media folder.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (dirty && !window.confirm('You have unsaved changes. Discard them?')) return;
                onClose();
              }}
              className="px-4 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-fast"
            >
              {dirty ? 'Discard & Close' : 'Close'}
            </button>
            {dirty && (
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 text-xs font-medium text-white bg-[#007a62] rounded-lg hover:bg-[#00654f] transition-fast"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
