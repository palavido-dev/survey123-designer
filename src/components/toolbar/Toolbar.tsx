/**
 * Top Toolbar — Clean, minimal design matching Survey123 web designer
 * Includes Form/Report mode toggle
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { useReportStore } from '../../store/reportStore';
import { exportToXlsx, exportToZip, importFromXlsx } from '../../utils/xlsxExport';
import { importDocxToHtml, exportHtmlToDocx } from '../../utils/reportDocx';
import {
  Download, Upload, Undo2, Redo2, FileText, Plus, AlertCircle, BookOpen, ChevronDown, Lightbulb,
} from '../../utils/icons';
import { analyzeSurvey } from '../../utils/surveyOptimizer';
import type { AppMode } from '../../types/report';
import { ValidationPanel } from './ValidationPanel';

import { TemplateLibraryModal } from './TemplateLibraryModal';
import type { FormTemplate } from '../../data/formTemplates';

export function Toolbar() {
  const {
    form,
    undoStack,
    redoStack,
    undo,
    redo,
    resetForm,
    loadForm,
    runValidation,
    validationResult,
    showValidationPanel,
  } = useSurveyStore();

  const {
    mode,
    setMode,
    reportHtml,
    setReportHtml,
    setImportedFileName,
    setImporting,
    setExporting,
    resetReport,
  } = useReportStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const showOptimizer = useSurveyStore((s) => s.showOptimizer);
  const setShowOptimizer = useSurveyStore((s) => s.setShowOptimizer);
  const newMenuRef = useRef<HTMLDivElement>(null);

  // Compute optimizer suggestions
  const optimizationResults = useMemo(() => analyzeSurvey(form), [form]);
  const suggestionCount = optimizationResults.reduce((sum, r) => sum + r.matches.length, 0);

  // Close "New" dropdown on outside click
  useEffect(() => {
    if (!showNewMenu) return;
    const handler = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNewMenu]);

  const handleLoadTemplate = (template: FormTemplate) => {
    const newForm = template.createForm();
    loadForm(newForm);
  };

  // ---- Form mode handlers ----
  const handleExport = async () => {
    await exportToXlsx(form);
  };

  const handleExportZip = async () => {
    await exportToZip(form);
  };

  const hasMediaFiles = (form.mediaFiles || []).some((f) => f.rawContent);
  const hasScriptFiles = (form.scriptFiles || []).some((f) => f.content);
  const showZipExport = hasMediaFiles || hasScriptFiles;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const importedForm = await importFromXlsx(file);
      loadForm(importedForm);
    } catch (err) {
      console.error('Import error:', err);
      alert(`Failed to import: ${(err as Error).message}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---- Report mode handlers ----
  const handleReportImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await importDocxToHtml(file);
      setReportHtml(result.html);
      setImportedFileName(file.name);
      const editor = (window as any).__reportEditor;
      if (editor) editor.commands.setContent(result.html);
    } catch (err) {
      console.error('Report import error:', err);
      alert(`Failed to import: ${(err as Error).message}`);
    } finally {
      setImporting(false);
      if (reportFileInputRef.current) reportFileInputRef.current.value = '';
    }
  };

  const handleReportExport = async () => {
    const editor = (window as any).__reportEditor;
    if (!editor) return;
    setExporting(true);
    try {
      const html = editor.getHTML();
      const fileName = `${form.settings.form_title || 'report'}_template.docx`
        .replace(/\s+/g, '_').toLowerCase();
      await exportHtmlToDocx(html, fileName);
    } catch (err) {
      console.error('Report export error:', err);
      alert(`Failed to export: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  };

  const hasForm = form.survey.length > 0;

  return (
    <div className="bg-white border-b border-gray-200 flex items-center justify-between"
      style={{ height: 56, padding: '0 20px' }}>
      {/* Left: Logo & Title + Mode Toggle */}
      <div className="flex items-center" style={{ gap: 16 }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div className={`rounded-lg flex items-center justify-center transition-fast ${
            mode === 'report' ? 'bg-[#5b21b6]' : 'bg-[#007a62]'
          }`} style={{ width: 36, height: 36 }}>
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <span className="text-[14px] font-bold text-gray-900">Survey123 Designer</span>
            <p className="text-[10px] text-gray-400" style={{ marginTop: -2 }}>
              {mode === 'form' ? 'XLSForm Builder' : 'Report Template Builder'}
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="bg-gray-100 rounded-lg flex" style={{ padding: 2, gap: 2 }}>
          <ModeButton
            active={mode === 'form'}
            onClick={() => setMode('form')}
            label="Form"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            }
          />
          <ModeButton
            active={mode === 'report'}
            onClick={() => {
              if (!hasForm) {
                alert('Load a survey form first — the report template builder uses your form fields.');
                return;
              }
              setMode('report');
            }}
            label="Report"
            disabled={false}
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Center: Context-sensitive actions */}
      <div className="flex items-center" style={{ gap: 4 }}>
        {mode === 'form' ? (
          <>
            <div className="relative" ref={newMenuRef}>
              <button
                onClick={() => setShowNewMenu(!showNewMenu)}
                className="flex items-center text-[13px] font-medium
                  text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-fast"
                style={{ padding: '6px 12px', gap: 4 }}
                title="New Form"
              >
                <Plus size={15} className="text-gray-400" />
                New
                <ChevronDown size={12} className="text-gray-400" />
              </button>
              {showNewMenu && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                  style={{ minWidth: 200, padding: 4 }}>
                  <button
                    onClick={() => { resetForm(); setShowNewMenu(false); }}
                    className="w-full flex items-center text-left rounded-md text-[13px] text-gray-700
                      hover:bg-gray-100 transition-fast"
                    style={{ padding: '8px 12px', gap: 10 }}
                  >
                    <Plus size={15} className="text-gray-400" />
                    <div>
                      <div className="font-medium">Blank Form</div>
                      <div className="text-[11px] text-gray-400">Start from scratch</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setShowTemplateLibrary(true); setShowNewMenu(false); }}
                    className="w-full flex items-center text-left rounded-md text-[13px] text-gray-700
                      hover:bg-gray-100 transition-fast"
                    style={{ padding: '8px 12px', gap: 10 }}
                  >
                    <BookOpen size={15} className="text-gray-400" />
                    <div>
                      <div className="font-medium">From Template...</div>
                      <div className="text-[11px] text-gray-400">Browse 50+ pre-built forms</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-200" style={{ width: 1, height: 20, margin: '0 4px' }} />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center text-[13px] font-medium
                text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-fast"
              style={{ padding: '6px 12px', gap: 6 }}
              title="Open existing XLS form"
            >
              <Upload size={15} className="text-gray-400" />
              Open
            </button>

            <div className="bg-gray-200" style={{ width: 1, height: 20, margin: '0 4px' }} />

            <button
              onClick={runValidation}
              className={`flex items-center text-[13px] font-medium rounded-lg transition-fast relative ${
                validationResult && validationResult.errorCount > 0
                  ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                  : validationResult && validationResult.warningCount > 0
                  ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              style={{ padding: '6px 12px', gap: 6 }}
              title="Validate form"
            >
              <AlertCircle size={15} className={
                validationResult && validationResult.errorCount > 0
                  ? 'text-red-400'
                  : validationResult && validationResult.warningCount > 0
                  ? 'text-amber-400'
                  : 'text-gray-400'
              } />
              Validate
              {validationResult && (validationResult.errorCount + validationResult.warningCount) > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-1 ${
                  validationResult.errorCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'
                }`}>
                  {validationResult.errorCount + validationResult.warningCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowOptimizer(!showOptimizer)}
              className="flex items-center text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-fast relative"
              style={{ padding: '6px 12px', gap: 6 }}
              title="Analyze form structure and get optimization suggestions"
            >
              <Lightbulb size={15} className="text-gray-400" />
              Optimize
              {suggestionCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[10px] font-bold flex items-center justify-center px-1 bg-[#00856a] text-white">
                  {suggestionCount}
                </span>
              )}
            </button>

            <div className="bg-gray-200" style={{ width: 1, height: 20, margin: '0 4px' }} />

            <button
              onClick={handleExport}
              className="flex items-center text-[13px] font-semibold
                text-white bg-[#007a62] rounded-lg transition-fast
                hover:bg-[#006652] active:scale-[0.98]"
              style={{ padding: '6px 16px', gap: 6 }}
              title="Export as XLSX"
            >
              <Download size={15} />
              Export XLSX
            </button>

            {showZipExport && (
              <button
                onClick={handleExportZip}
                className="flex items-center text-[13px] font-medium
                  text-[#007a62] bg-[#e8f5f1] rounded-lg transition-fast
                  hover:bg-[#d0ebe3] active:scale-[0.98]"
                style={{ padding: '6px 14px', gap: 6 }}
                title="Export XLSX + media files as ZIP (for Survey123 Connect)"
              >
                <Download size={15} />
                Export ZIP
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </>
        ) : (
          <>
            <button
              onClick={resetReport}
              className="flex items-center text-[13px] font-medium
                text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-fast"
              style={{ padding: '6px 12px', gap: 6 }}
              title="New Report Template"
            >
              <Plus size={15} className="text-gray-400" />
              New
            </button>

            <div className="bg-gray-200" style={{ width: 1, height: 20, margin: '0 4px' }} />

            <button
              onClick={() => reportFileInputRef.current?.click()}
              className="flex items-center text-[13px] font-medium
                text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-fast"
              style={{ padding: '6px 12px', gap: 6 }}
              title="Import .docx template"
            >
              <Upload size={15} className="text-gray-400" />
              Import .docx
            </button>

            <div className="bg-gray-200" style={{ width: 1, height: 20, margin: '0 4px' }} />

            <button
              onClick={handleReportExport}
              className="flex items-center text-[13px] font-semibold
                text-white bg-[#5b21b6] rounded-lg transition-fast
                hover:bg-[#4c1d95] active:scale-[0.98]"
              style={{ padding: '6px 16px', gap: 6 }}
              title="Export as .docx"
            >
              <Download size={15} />
              Export .docx
            </button>

            <input
              ref={reportFileInputRef}
              type="file"
              accept=".docx"
              onChange={handleReportImport}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* Right: Undo/Redo (form mode only) */}
      <div className="flex items-center" style={{ gap: 2 }}>
        {mode === 'form' ? (
          <>
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-fast
                disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              style={{ padding: 8 }}
              title={`Undo (${undoStack.length})`}
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-fast
                disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              style={{ padding: 8 }}
              title={`Redo (${redoStack.length})`}
            >
              <Redo2 size={16} />
            </button>
          </>
        ) : (
          /* Placeholder to keep layout balanced */
          <div style={{ width: 68 }} />
        )}
      </div>

      {/* Template Library Modal */}
      <TemplateLibraryModal
        open={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onSelect={handleLoadTemplate}
      />

    </div>
  );
}

// ============================================================
// Mode Toggle Button
// ============================================================

function ModeButton({
  active,
  onClick,
  label,
  icon,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center rounded-md transition-fast ${
        active
          ? label === 'Report'
            ? 'bg-white text-[#5b21b6] shadow-sm'
            : 'bg-white text-[#007a62] shadow-sm'
          : 'text-gray-400 hover:text-gray-600'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      style={{ padding: '5px 10px', gap: 5, fontSize: 12, fontWeight: 600 }}
    >
      {icon}
      {label}
    </button>
  );
}
