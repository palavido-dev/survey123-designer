/**
 * CSV File Picker — Smart per-question file selector for select_from_file types
 *
 * Features:
 * - Dropdown showing already-uploaded CSVs in the form
 * - Upload new CSV button that parses and stores column data
 * - Duplicate detection with reuse prompt
 * - Shows column preview for selected file
 * - Referenced-by badges showing which questions use each file
 */

import React, { useRef, useState } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { MediaFile } from '../../types/survey';
import { v4 as uuid } from 'uuid';
import { ChevronDown, X } from '../../utils/icons';

// ============================================================
// CSV Parser (simple, handles common cases)
// ============================================================

function parseCsv(text: string): { columns: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { columns: [], rows: [] };

  // Detect delimiter (comma, tab, or semicolon)
  const firstLine = lines[0];
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  const delimiter = tabs > commas && tabs > semis ? '\t' : semis > commas ? ';' : ',';

  // Simple split (doesn't handle quoted fields with delimiters inside, but covers most cases)
  const splitLine = (line: string): string[] => {
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
  };

  const columns = splitLine(lines[0]);
  const rows: Record<string, string>[] = [];

  // Parse up to 200 rows for sample data
  for (let i = 1; i < Math.min(lines.length, 201); i++) {
    const values = splitLine(lines[i]);
    const row: Record<string, string> = {};
    columns.forEach((col, j) => {
      row[col] = values[j] || '';
    });
    rows.push(row);
  }

  return { columns, rows };
}

// ============================================================
// Main Component
// ============================================================

interface CsvFilePickerProps {
  /** Current filename value */
  value: string;
  /** Called when file selection changes */
  onChange: (fileName: string) => void;
  /** The question row ID (for tracking references) */
  questionId: string;
}

export function CsvFilePicker({ value, onChange, questionId }: CsvFilePickerProps) {
  const { form, addMediaFile, linkMediaFileToQuestion, unlinkMediaFileFromQuestion } = useSurveyStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mediaFiles = form.mediaFiles || [];
  const currentFile = mediaFiles.find((f) => f.fileName === value);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showDropdown]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;

    // Check for duplicate
    const existing = mediaFiles.find((f) => f.fileName === fileName);
    if (existing) {
      const useExisting = window.confirm(
        `"${fileName}" is already uploaded and used by ${existing.referencedBy.length} question(s).\n\nUse the existing file?`
      );
      if (useExisting) {
        // Link to existing file
        if (value && value !== fileName) {
          unlinkMediaFileFromQuestion(value, questionId);
        }
        linkMediaFileToQuestion(fileName, questionId);
        onChange(fileName);
        setShowDropdown(false);
        return;
      }
      // Otherwise re-upload (replace data)
    }

    try {
      const text = await file.text();
      const { columns, rows } = parseCsv(text);

      if (columns.length === 0) {
        alert('Could not parse any columns from this CSV file. Please check the format.');
        return;
      }

      const mediaFile: MediaFile = {
        id: existing?.id || uuid(),
        fileName,
        columns,
        sampleData: rows,
        totalRows: rows.length,
        referencedBy: [...new Set([...(existing?.referencedBy || []), questionId])],
        rawContent: text,
      };

      // Unlink from old file if changing
      if (value && value !== fileName) {
        unlinkMediaFileFromQuestion(value, questionId);
      }

      addMediaFile(mediaFile);
      onChange(fileName);
      setShowDropdown(false);
    } catch (err) {
      alert('Error reading CSV file: ' + (err as Error).message);
    }

    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectExisting = (fileName: string) => {
    if (value && value !== fileName) {
      unlinkMediaFileFromQuestion(value, questionId);
    }
    linkMediaFileToQuestion(fileName, questionId);
    onChange(fileName);
    setShowDropdown(false);
  };

  // Count how many questions reference each file
  const getRefCount = (f: MediaFile) => f.referencedBy.filter((id) => id !== questionId).length;

  return (
    <div style={{ marginBottom: 14 }}>
      <label className="block text-gray-500" style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
        Source File
      </label>

      {/* Picker button */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between border border-gray-200 rounded-lg bg-white
            hover:border-[#00856a] focus:border-[#00856a] transition-fast text-left"
          style={{ padding: '8px 12px', fontSize: 13 }}
        >
          <span className={value ? 'text-gray-800 font-mono text-[12px]' : 'text-gray-400'}>
            {value || 'Select or upload a CSV file...'}
          </span>
          <ChevronDown size={13} />
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div
            className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
            style={{ maxHeight: 300 }}
          >
            {/* Existing files */}
            {mediaFiles.length > 0 && (
              <div className="border-b border-gray-100">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                  Uploaded Files
                </div>
                {mediaFiles.map((f) => {
                  const isSelected = f.fileName === value;
                  const otherRefs = getRefCount(f);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => selectExisting(f.fileName)}
                      className={`w-full text-left px-3 py-2 hover:bg-[#f0faf7] transition-fast flex items-center justify-between ${
                        isSelected ? 'bg-[#f0faf7]' : ''
                      }`}
                    >
                      <div>
                        <span className="font-mono text-[12px] text-gray-700">{f.fileName}</span>
                        <span className="text-[10px] text-gray-400 ml-2">
                          {f.columns.length} cols, {f.totalRows} rows
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {otherRefs > 0 && (
                          <span className="text-[9px] bg-blue-50 text-blue-500 rounded-full px-1.5 py-0.5">
                            +{otherRefs} other{otherRefs > 1 ? 's' : ''}
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] text-[#007a62] font-semibold">✓</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Upload new */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-left px-3 py-2.5 text-[12px] text-[#007a62] font-medium hover:bg-[#f0faf7] transition-fast flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload new CSV file
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Column preview for selected file */}
      {currentFile && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-[11px] text-gray-400 hover:text-[#007a62] transition-fast flex items-center gap-1"
          >
            <div className={`transition-transform duration-150 ${showPreview ? 'rotate-0' : '-rotate-90'}`}>
              <ChevronDown size={10} />
            </div>
            {currentFile.columns.length} columns, {currentFile.totalRows} rows
          </button>

          {showPreview && (
            <div className="mt-1.5 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              {/* Column list */}
              <div className="px-3 py-2">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                  Columns
                </div>
                <div className="flex flex-wrap gap-1">
                  {currentFile.columns.map((col) => (
                    <span
                      key={col}
                      className="inline-block bg-white border border-gray-200 rounded text-[11px] font-mono text-gray-600 px-1.5 py-0.5"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample data preview */}
              {currentFile.sampleData.length > 0 && (
                <div className="border-t border-gray-200 px-3 py-2">
                  <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                    Sample Data (first 5 rows)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="text-[10px] text-gray-500" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {currentFile.columns.map((col) => (
                            <th
                              key={col}
                              className="font-mono font-semibold text-gray-600 text-left border-b border-gray-200"
                              style={{ padding: '2px 8px 2px 0' }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentFile.sampleData.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            {currentFile.columns.map((col) => (
                              <td
                                key={col}
                                className="text-gray-500 truncate"
                                style={{ padding: '1px 8px 1px 0', maxWidth: 120 }}
                              >
                                {row[col] || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
