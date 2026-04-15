/**
 * Top Toolbar
 *
 * Contains form actions: New, Open, Export, Undo, Redo
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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">Survey123 Designer</span>
        </div>
      </div>

      {/* Center: Form actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={resetForm}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
            text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="New Form"
        >
          <Plus size={14} />
          New
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
            text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Open existing XLS form"
        >
          <Upload size={14} />
          Open
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
            text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          title="Export as XLSX"
        >
          <Download size={14} />
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
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors
            disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors
            disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo2 size={16} />
        </button>
      </div>
    </div>
  );
}
