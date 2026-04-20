/**
 * Media Panel — Central view of all CSV/media file references in the form
 *
 * Shows:
 *   - All uploaded CSV files with column counts, row counts, and which questions reference them
 *   - All detected file references from select_*_from_file questions and pulldata() calls
 *   - Status indicators: uploaded (green), missing (red/yellow)
 *   - Click to open CSV editor modal, or upload if missing
 *   - Upload new file button at the bottom
 */

import React, { useRef, useState } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { MediaFile, SurveyForm } from '../../types/survey';
import { v4 as uuid } from 'uuid';
import { PaletteManager } from '../palette/PaletteManager';

// ============================================================
// CSV parser (same as CsvFilePicker — shared logic)
// ============================================================

function parseCsv(text: string): { columns: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { columns: [], rows: [] };
  const firstLine = lines[0];
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  const delimiter = tabs > commas && tabs > semis ? '\t' : semis > commas ? ';' : ',';

  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"'; i++;
        } else { inQuotes = !inQuotes; }
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim()); current = '';
      } else { current += ch; }
    }
    result.push(current.trim());
    return result;
  };

  const columns = splitLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < Math.min(lines.length, 201); i++) {
    const values = splitLine(lines[i]);
    const row: Record<string, string> = {};
    columns.forEach((col, j) => { row[col] = values[j] || ''; });
    rows.push(row);
  }
  return { columns, rows };
}

// ============================================================
// Detect all file references across the form
// ============================================================

interface FileReference {
  fileName: string;
  /** Question IDs that reference this file */
  referencedByQuestions: { id: string; name: string; label: string; type: string }[];
  /** How the file is referenced */
  referenceType: 'select_from_file' | 'pulldata' | 'both';
  /** Whether we have an uploaded copy */
  isUploaded: boolean;
  /** The media file data if uploaded */
  mediaFile?: MediaFile;
}

function detectFileReferences(form: SurveyForm): FileReference[] {
  const refMap = new Map<string, FileReference>();

  const getOrCreate = (fileName: string): FileReference => {
    if (!refMap.has(fileName)) {
      refMap.set(fileName, {
        fileName,
        referencedByQuestions: [],
        referenceType: 'select_from_file',
        isUploaded: false,
      });
    }
    return refMap.get(fileName)!;
  };

  // 1) select_*_from_file questions
  for (const row of form.survey) {
    if (['select_one_from_file', 'select_multiple_from_file'].includes(row.type) && row.fileName) {
      const ref = getOrCreate(row.fileName);
      ref.referencedByQuestions.push({
        id: row.id, name: row.name, label: row.label || row.name, type: row.type,
      });
      if (ref.referenceType === 'pulldata') ref.referenceType = 'both';
    }
  }

  // 2) pulldata() references in expressions
  const pulldataRegex = /pulldata\s*\(\s*['"]([^'"]+)['"]/g;
  for (const row of form.survey) {
    const expressions = [row.calculation, row.relevant, row.constraint, row.default].filter(Boolean);
    for (const expr of expressions) {
      let match;
      pulldataRegex.lastIndex = 0;
      while ((match = pulldataRegex.exec(expr!)) !== null) {
        const csvName = match[1];
        const fileName = csvName.endsWith('.csv') ? csvName : csvName + '.csv';
        const ref = getOrCreate(fileName);
        // Only add the question if not already listed
        if (!ref.referencedByQuestions.some((q) => q.id === row.id)) {
          ref.referencedByQuestions.push({
            id: row.id, name: row.name, label: row.label || row.name, type: row.type,
          });
        }
        if (ref.referenceType === 'select_from_file') ref.referenceType = 'pulldata';
        else if (ref.referenceType !== 'both') ref.referenceType = 'both';
      }
    }
  }

  // 3) Mark uploaded files
  const mediaFiles = form.mediaFiles || [];
  for (const mf of mediaFiles) {
    const ref = getOrCreate(mf.fileName);
    ref.isUploaded = true;
    ref.mediaFile = mf;
  }

  // Also include any uploaded files that aren't referenced yet
  for (const mf of mediaFiles) {
    if (!refMap.has(mf.fileName)) {
      refMap.set(mf.fileName, {
        fileName: mf.fileName,
        referencedByQuestions: [],
        referenceType: 'select_from_file',
        isUploaded: true,
        mediaFile: mf,
      });
    }
  }

  return Array.from(refMap.values()).sort((a, b) => a.fileName.localeCompare(b.fileName));
}

// ============================================================
// Icons
// ============================================================

function FileIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function UploadIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CheckCircleIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ============================================================
// Main Component
// ============================================================

export function MediaPanel() {
  const { form, openCsvEditor, addMediaFile, selectRow, setPanelView } = useSurveyStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const fileReferences = React.useMemo(() => detectFileReferences(form), [form]);

  const uploadedCount = fileReferences.filter((r) => r.isUploaded).length;
  const missingCount = fileReferences.filter((r) => !r.isUploaded).length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { columns, rows } = parseCsv(text);

      if (columns.length === 0) {
        alert('Could not parse any columns from this CSV file.');
        return;
      }

      // Use the target filename if we're uploading for a specific missing reference
      const fileName = uploadTarget || file.name;

      const mediaFile: MediaFile = {
        id: uuid(),
        fileName,
        columns,
        sampleData: rows,
        totalRows: rows.length,
        referencedBy: [],
        rawContent: text,
      };

      addMediaFile(mediaFile);
      setUploadTarget(null);
    } catch (err) {
      alert('Error reading CSV file: ' + (err as Error).message);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const navigateToQuestion = (questionId: string) => {
    selectRow(questionId);
    setPanelView('properties');
  };

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      {/* Header summary */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <FileIcon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Media Files</h3>
          <p className="text-[10px] text-gray-400">
            {fileReferences.length === 0
              ? 'No file references found'
              : `${uploadedCount} uploaded${missingCount > 0 ? `, ${missingCount} missing` : ''}`}
          </p>
        </div>
      </div>

      {/* File reference list */}
      {fileReferences.length === 0 ? (
        <div className="text-center py-8">
          <div className="rounded-full bg-gray-50 w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <FileIcon size={20} />
          </div>
          <p className="text-xs text-gray-400 mb-1">No media files yet</p>
          <p className="text-[11px] text-gray-300">
            Add a select_from_file question or use pulldata() to reference CSV files
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {fileReferences.map((ref) => (
            <div
              key={ref.fileName}
              className={`border rounded-lg overflow-hidden transition-fast ${
                ref.isUploaded
                  ? 'border-gray-200 hover:border-emerald-300'
                  : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              {/* File header */}
              <div
                className={`flex items-center gap-2 px-4 py-3 ${
                  ref.isUploaded ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
                onClick={() => {
                  if (ref.isUploaded) {
                    openCsvEditor('', ref.fileName);
                  }
                }}
              >
                {/* Status icon */}
                <div className={`flex-shrink-0 ${ref.isUploaded ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {ref.isUploaded ? <CheckCircleIcon /> : <AlertIcon />}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-gray-700 truncate font-medium">
                      {ref.fileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {ref.isUploaded && ref.mediaFile && (
                      <span className="text-[10px] text-gray-400">
                        {ref.mediaFile.columns.length} cols, {ref.mediaFile.totalRows} rows
                      </span>
                    )}
                    {!ref.isUploaded && (
                      <span className="text-[10px] text-amber-600 font-medium">
                        Not uploaded
                      </span>
                    )}
                    <span className="text-[10px] text-gray-300">
                      {ref.referenceType === 'select_from_file' && 'select'}
                      {ref.referenceType === 'pulldata' && 'pulldata'}
                      {ref.referenceType === 'both' && 'select + pulldata'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  {ref.isUploaded ? (
                    <span className="text-[10px] text-gray-300 whitespace-nowrap">
                      Click to edit
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadTarget(ref.fileName);
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[#007a62] bg-emerald-50 rounded hover:bg-emerald-100 transition-fast"
                    >
                      <UploadIcon size={10} />
                      Upload
                    </button>
                  )}
                </div>
              </div>

              {/* Referenced by */}
              {ref.referencedByQuestions.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2 bg-gray-50/50">
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
                    Used by
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ref.referencedByQuestions.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToQuestion(q.id);
                        }}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-gray-500 bg-white border border-gray-200 rounded hover:border-[#007a62] hover:text-[#007a62] transition-fast"
                        title={`${q.name} (${q.type})`}
                      >
                        {q.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Column preview for uploaded files */}
              {ref.isUploaded && ref.mediaFile && ref.mediaFile.columns.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {ref.mediaFile.columns.slice(0, 8).map((col) => (
                      <span
                        key={col}
                        className="inline-block bg-gray-50 border border-gray-200 rounded text-[10px] font-mono text-gray-500 px-1.5 py-0.5"
                      >
                        {col}
                      </span>
                    ))}
                    {ref.mediaFile.columns.length > 8 && (
                      <span className="text-[9px] text-gray-300">
                        +{ref.mediaFile.columns.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload new file button */}
      <button
        type="button"
        onClick={() => { setUploadTarget(null); fileInputRef.current?.click(); }}
        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium text-[#007a62] border border-dashed border-emerald-300 rounded-lg hover:bg-emerald-50 transition-fast"
      >
        <UploadIcon size={14} />
        Upload CSV File
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Drawing Palettes section */}
      <div className="mt-6 pt-5 border-t border-gray-200">
        <PaletteManager />
      </div>
    </div>
  );
}
