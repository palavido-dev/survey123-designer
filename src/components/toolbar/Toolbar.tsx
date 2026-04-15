/**
 * Top Toolbar — Clean, minimal design matching Survey123 web designer
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
    <div className="bg-white border-b border-gray-200 flex items-center justify-between"
      style={{ height: 56, padding: '0 20px' }}>
      {/* Left: Logo & Title */}
      <div className="flex items-center" style={{ gap: 12 }}>
        <div className="bg-[#007a62] rounded-lg flex items-center justify-center"
          style={{ width: 36, height: 36 }}>
          <FileText size={18} className="text-white" />
        </div>
        <div>
          <span className="text-[14px] font-bold text-gray-900">Survey123 Designer</span>
          <p className="text-[10px] text-gray-400" style={{ marginTop: -2 }}>XLSForm Builder</p>
        </div>
      </div>

      {/* Center: Form actions */}
      <div className="flex items-center" style={{ gap: 4 }}>
        <button
          onClick={resetForm}
          className="flex items-center text-[13px] font-medium
            text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-fast"
          style={{ padding: '6px 12px', gap: 6 }}
          title="New Form"
        >
          <Plus size={15} className="text-gray-400" />
          New
        </button>

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

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {/* Right: Undo/Redo */}
      <div className="flex items-center" style={{ gap: 2 }}>
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
      </div>
    </div>
  );
}
