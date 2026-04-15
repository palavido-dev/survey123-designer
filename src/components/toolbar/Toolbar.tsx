/**
 * Top Toolbar — Polished design with gradient background and rich iconography
 */

import React, { useRef } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { exportToXlsx, importFromXlsx } from '../../utils/xlsxExport';
import {
  Download, Upload, Undo2, Redo2, FileText, Plus,
} from '../../utils/icons';

export function Toolbar() {
  const {
    form,
    undoStack,
    redoStack,
    undo,
    redo,
    resetForm,
    loadForm,
  } = useSurveyStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportToXlsx(form);
  };

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

  return (
    <div className="h-14 gradient-toolbar border-b border-gray-200/80 flex items-center justify-between px-5
      shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 gradient-header rounded-xl flex items-center justify-center
          shadow-[0_2px_8px_rgba(5,150,105,0.3)]">
          <FileText size={18} className="text-white" />
        </div>
        <div>
          <span className="text-[15px] font-bold text-gray-900 tracking-tight">Survey123 Designer</span>
          <p className="text-[10px] text-gray-400 -mt-0.5 font-medium">Visual XLSForm Builder</p>
        </div>
      </div>

      {/* Center: Form actions */}
      <div className="flex items-center gap-1 bg-gray-50/80 rounded-xl p-1 border border-gray-200/60">
        <button
          onClick={resetForm}
          className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium
            text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-smooth"
          title="New Form"
        >
          <Plus size={15} className="text-gray-400" />
          New
        </button>

        <div className="w-px h-5 bg-gray-200/80" />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium
            text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-smooth"
          title="Open existing XLS form"
        >
          <Upload size={15} className="text-gray-400" />
          Open
        </button>

        <div className="w-px h-5 bg-gray-200/80" />

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold
            text-white gradient-header rounded-lg transition-smooth
            hover:shadow-[0_2px_8px_rgba(5,150,105,0.35)] active:scale-[0.98]"
          title="Export as XLSX"
        >
          <Download size={15} />
          Export XLSX
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {/* Right: Undo/Redo */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-smooth
            disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title={`Undo (${undoStack.length})`}
        >
          <Undo2 size={17} />
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-smooth
            disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title={`Redo (${redoStack.length})`}
        >
          <Redo2 size={17} />
        </button>
      </div>
    </div>
  );
}
