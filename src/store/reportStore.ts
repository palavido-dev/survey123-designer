/**
 * Report Template Store (Zustand)
 *
 * Manages state for the Report Template Builder, separate from
 * the main survey form store to keep concerns cleanly divided.
 */

import { create } from 'zustand';
import { AppMode } from '../types/report';

// ============================================================
// Store Interface
// ============================================================

interface ReportStore {
  // === App Mode ===
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // === Report Editor State ===
  reportHtml: string;
  setReportHtml: (html: string) => void;

  /** Track the source filename if imported from .docx */
  importedFileName: string | null;
  setImportedFileName: (name: string | null) => void;

  // === Selection State ===
  /** Currently selected token expression in the editor (for properties panel) */
  selectedToken: { expression: string; tokenType: string; pos: number } | null;
  setSelectedToken: (token: { expression: string; tokenType: string; pos: number } | null) => void;

  // === Properties Panel View ===
  reportPanelView: 'insert' | 'token' | 'filters' | 'syntax';
  setReportPanelView: (view: 'insert' | 'token' | 'filters' | 'syntax') => void;

  // === Import/Export State ===
  isImporting: boolean;
  isExporting: boolean;
  setImporting: (v: boolean) => void;
  setExporting: (v: boolean) => void;

  // === Reset ===
  resetReport: () => void;
}

// ============================================================
// Store Implementation
// ============================================================

export const useReportStore = create<ReportStore>((set) => ({
  mode: 'form',
  setMode: (mode) => set({ mode }),

  reportHtml: '',
  setReportHtml: (html) => set({ reportHtml: html }),

  importedFileName: null,
  setImportedFileName: (name) => set({ importedFileName: name }),

  selectedToken: null,
  setSelectedToken: (token) => set({
    selectedToken: token,
    reportPanelView: token ? 'token' : 'insert',
  }),

  reportPanelView: 'insert',
  setReportPanelView: (view) => set({ reportPanelView: view }),

  isImporting: false,
  isExporting: false,
  setImporting: (v) => set({ isImporting: v }),
  setExporting: (v) => set({ isExporting: v }),

  resetReport: () => set({
    reportHtml: '',
    importedFileName: null,
    selectedToken: null,
    reportPanelView: 'insert',
  }),
}));
