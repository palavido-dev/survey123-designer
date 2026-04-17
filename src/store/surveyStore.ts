/**
 * Survey Form Store (Zustand)
 *
 * Central state management for the form builder.
 * Manages survey rows, choice lists, settings, and UI state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { v4 as uuid } from 'uuid';
import {
  SurveyForm,
  SurveyRow,
  ChoiceList,
  ChoiceItem,
  FormSettings,
  QuestionType,
  PanelView,
  MediaFile,
} from '../types/survey';
import { createDefaultRow } from '../data/questionTypes';

// ============================================================
// IndexedDB Storage Adapter for Zustand persist
// ============================================================

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await idbGet(name)) ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name);
  },
};

// ============================================================
// Store Interface
// ============================================================

interface SurveyStore {
  // === Form Data ===
  form: SurveyForm;

  // === Auto-save State ===
  lastSavedAt: number | null;        // timestamp of last auto-save
  hasRecoveredForm: boolean;          // true if form was loaded from IndexedDB on startup

  // === UI State ===
  selectedRowId: string | null;
  panelView: PanelView;
  isDragging: boolean;
  collapsedGroups: Set<string>;
  undoStack: SurveyForm[];
  redoStack: SurveyForm[];

  // === Expression Editor Modal ===
  expressionEditor: { rowId: string; mode: 'relevant' | 'calculation' | 'constraint' } | null;

  // === CSV Editor Modal ===
  csvEditor: { rowId: string; fileName: string } | null;

  // === Survey Row Actions ===
  addRow: (type: QuestionType, index?: number, appearance?: string) => void;
  removeRow: (id: string) => void;
  updateRow: (id: string, updates: Partial<SurveyRow>) => void;
  moveRow: (fromIndex: number, toIndex: number) => void;
  duplicateRow: (id: string) => void;
  /** Rename a field and update ALL references across the form (expressions, choice_filter, etc.) */
  renameField: (oldName: string, newName: string) => { updatedRows: string[] };

  // === Choice List Actions ===
  addChoiceList: (listName: string) => void;
  removeChoiceList: (listName: string) => void;
  addChoice: (listName: string, choice?: Partial<ChoiceItem>) => void;
  removeChoice: (listName: string, choiceId: string) => void;
  updateChoice: (listName: string, choiceId: string, updates: Partial<ChoiceItem>) => void;
  moveChoice: (listName: string, fromIndex: number, toIndex: number) => void;

  // === Media File Actions ===
  addMediaFile: (file: MediaFile) => void;
  removeMediaFile: (fileId: string) => void;
  updateMediaFile: (fileName: string, updates: Partial<MediaFile>) => void;
  linkMediaFileToQuestion: (fileName: string, questionId: string) => void;
  unlinkMediaFileFromQuestion: (fileName: string, questionId: string) => void;

  // === Settings Actions ===
  updateSettings: (updates: Partial<FormSettings>) => void;

  // === UI Actions ===
  selectRow: (id: string | null) => void;
  setPanelView: (view: PanelView) => void;
  setDragging: (isDragging: boolean) => void;
  toggleGroupCollapse: (id: string) => void;
  openExpressionEditor: (rowId: string, mode: 'relevant' | 'calculation' | 'constraint') => void;
  closeExpressionEditor: () => void;
  openCsvEditor: (rowId: string, fileName: string) => void;
  closeCsvEditor: () => void;

  // === History ===
  undo: () => void;
  redo: () => void;
  pushUndo: () => void;

  // === Form Actions ===
  loadForm: (form: SurveyForm) => void;
  resetForm: () => void;

  // === Auto-save Actions ===
  dismissRecovery: () => void;
  discardRecoveredForm: () => void;
}

// ============================================================
// Utility: Escape special regex characters in a string
// ============================================================

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
// Default Form
// ============================================================

const defaultSettings: FormSettings = {
  form_title: 'My Survey',
  form_id: 'my_survey',
  version: '1.0',
};

const defaultForm: SurveyForm = {
  settings: defaultSettings,
  survey: [],
  choiceLists: [],
  mediaFiles: [],
};

// ============================================================
// Store Implementation
// ============================================================

export const useSurveyStore = create<SurveyStore>()(
  persist(
  (set, get) => ({
  form: { ...defaultForm },
  lastSavedAt: null,
  hasRecoveredForm: false,
  selectedRowId: null,
  panelView: 'properties',
  isDragging: false,
  collapsedGroups: new Set<string>(),
  expressionEditor: null,
  csvEditor: null,
  undoStack: [],
  redoStack: [],

  // ----------------------------------------------------------
  // Survey Row Actions
  // ----------------------------------------------------------

  addRow: (type, index, appearance) => {
    const state = get();
    state.pushUndo();

    const newRow = createDefaultRow(type, appearance);
    const newSurvey = [...state.form.survey];

    // For groups and repeats, also add the closing element
    if (type === 'begin_group' || type === 'begin_repeat') {
      const endType = type === 'begin_group' ? 'end_group' : 'end_repeat';
      const endRow: SurveyRow = {
        id: uuid(),
        type: endType as QuestionType,
        name: newRow.name,
        label: '',
      };

      if (index !== undefined) {
        newSurvey.splice(index, 0, newRow, endRow);
      } else {
        newSurvey.push(newRow, endRow);
      }
    } else {
      if (index !== undefined) {
        newSurvey.splice(index, 0, newRow);
      } else {
        newSurvey.push(newRow);
      }
    }

    // Auto-create choice list for select types
    if (type === 'select_one' || type === 'select_multiple' || type === 'rank') {
      const listName = newRow.listName!;
      const newList: ChoiceList = {
        id: uuid(),
        list_name: listName,
        choices: [
          { id: uuid(), list_name: listName, name: 'option_1', label: 'Option 1' },
          { id: uuid(), list_name: listName, name: 'option_2', label: 'Option 2' },
          { id: uuid(), list_name: listName, name: 'option_3', label: 'Option 3' },
        ],
      };

      set({
        form: {
          ...state.form,
          survey: newSurvey,
          choiceLists: [...state.form.choiceLists, newList],
        },
        selectedRowId: newRow.id,
        panelView: 'properties',
        redoStack: [],
      });
    } else {
      set({
        form: { ...state.form, survey: newSurvey },
        selectedRowId: newRow.id,
        panelView: 'properties',
        redoStack: [],
      });
    }
  },

  removeRow: (id) => {
    const state = get();
    state.pushUndo();

    const row = state.form.survey.find((r) => r.id === id);
    if (!row) return;

    let idsToRemove = [id];

    // If removing a begin group/repeat, also remove matching end + contents
    if (row.type === 'begin_group' || row.type === 'begin_repeat') {
      const startIdx = state.form.survey.findIndex((r) => r.id === id);
      const endType = row.type === 'begin_group' ? 'end_group' : 'end_repeat';
      let depth = 0;
      for (let i = startIdx; i < state.form.survey.length; i++) {
        const r = state.form.survey[i];
        if (r.type === row.type) depth++;
        if (r.type === endType) depth--;
        idsToRemove.push(r.id);
        if (depth === 0) break;
      }
    }

    // If removing an end group/repeat, also remove matching begin + contents
    if (row.type === 'end_group' || row.type === 'end_repeat') {
      const endIdx = state.form.survey.findIndex((r) => r.id === id);
      const beginType = row.type === 'end_group' ? 'begin_group' : 'begin_repeat';
      let depth = 0;
      for (let i = endIdx; i >= 0; i--) {
        const r = state.form.survey[i];
        if (r.type === row.type) depth++;
        if (r.type === beginType) depth--;
        idsToRemove.push(r.id);
        if (depth === 0) break;
      }
    }

    const removeSet = new Set(idsToRemove);
    const newSurvey = state.form.survey.filter((r) => !removeSet.has(r.id));

    set({
      form: { ...state.form, survey: newSurvey },
      selectedRowId: state.selectedRowId === id ? null : state.selectedRowId,
      redoStack: [],
    });
  },

  updateRow: (id, updates) => {
    const state = get();
    state.pushUndo();

    const newSurvey = state.form.survey.map((row) =>
      row.id === id ? { ...row, ...updates } : row
    );

    set({
      form: { ...state.form, survey: newSurvey },
      redoStack: [],
    });
  },

  moveRow: (fromIndex, toIndex) => {
    const state = get();
    state.pushUndo();

    const newSurvey = [...state.form.survey];
    const [moved] = newSurvey.splice(fromIndex, 1);
    newSurvey.splice(toIndex, 0, moved);

    set({
      form: { ...state.form, survey: newSurvey },
      redoStack: [],
    });
  },

  duplicateRow: (id) => {
    const state = get();
    state.pushUndo();

    const idx = state.form.survey.findIndex((r) => r.id === id);
    if (idx === -1) return;

    const original = state.form.survey[idx];
    const newRow: SurveyRow = {
      ...original,
      id: uuid(),
      name: `${original.name}_copy`,
    };

    const newSurvey = [...state.form.survey];
    newSurvey.splice(idx + 1, 0, newRow);

    set({
      form: { ...state.form, survey: newSurvey },
      selectedRowId: newRow.id,
      redoStack: [],
    });
  },

  renameField: (oldName, newName) => {
    const state = get();
    if (oldName === newName) return { updatedRows: [] };

    state.pushUndo();

    /**
     * Replace references to a field name inside XLSForm expressions.
     * Handles patterns like:
     *   ${oldName}           → ${newName}
     *   ${oldName}           in the middle of expressions
     *   selected(${old},...) → selected(${new},...)
     *   Bare references in choice_filter: name = ${old}
     */
    const replaceInExpression = (expr: string | undefined): string | undefined => {
      if (!expr) return expr;
      // Replace ${oldName} references (with optional whitespace)
      let result = expr.replace(
        new RegExp(`\\$\\{\\s*${escapeRegExp(oldName)}\\s*\\}`, 'g'),
        `\${${newName}}`
      );
      // Replace bare field references as whole words (not inside ${})
      // This catches patterns in choice_filter like: region = ${region}
      // and pulldata expressions
      result = result.replace(
        new RegExp(`\\b${escapeRegExp(oldName)}\\b`, 'g'),
        newName
      );
      return result;
    };

    // Expression fields to check on each row
    const EXPR_FIELDS: (keyof SurveyRow)[] = [
      'relevant', 'calculation', 'constraint', 'choice_filter',
      'required', 'required_message', 'constraint_message',
      'repeat_count', 'default', 'parameters',
      'bind::esri:parameters',
    ];

    // Label/hint fields only get ${...} replacement (no bare word replacement,
    // since labels contain natural language where bare words would false-match)
    const LABEL_FIELDS: (keyof SurveyRow)[] = ['label', 'hint'];

    const replaceInLabel = (text: string | undefined): string | undefined => {
      if (!text) return text;
      return text.replace(
        new RegExp(`\\$\\{\\s*${escapeRegExp(oldName)}\\s*\\}`, 'g'),
        `\${${newName}}`
      );
    };

    const updatedRowIds: string[] = [];

    const newSurvey = state.form.survey.map((row) => {
      let changed = false;
      const updates: Partial<SurveyRow> = {};

      // Update the field's own name
      if (row.name === oldName) {
        updates.name = newName;
        changed = true;
      }

      // Update matching end_group/end_repeat name
      if ((row.type === 'end_group' || row.type === 'end_repeat') && row.name === oldName) {
        updates.name = newName;
        changed = true;
      }

      // Update expression references in all relevant columns
      for (const field of EXPR_FIELDS) {
        const val = row[field as keyof SurveyRow] as string | undefined;
        if (val && typeof val === 'string' && val.includes(oldName)) {
          const newVal = replaceInExpression(val);
          if (newVal !== val) {
            (updates as any)[field] = newVal;
            changed = true;
          }
        }
      }

      // Update ${field} references in labels and hints (only ${...} patterns,
      // not bare words, to avoid mangling natural language text)
      for (const field of LABEL_FIELDS) {
        const val = row[field as keyof SurveyRow] as string | undefined;
        if (val && typeof val === 'string' && val.includes(`\${${oldName}}`)) {
          const newVal = replaceInLabel(val);
          if (newVal !== val) {
            (updates as any)[field] = newVal;
            changed = true;
          }
        }
      }

      if (changed) {
        updatedRowIds.push(row.id);
        return { ...row, ...updates };
      }
      return row;
    });

    set({
      form: { ...state.form, survey: newSurvey },
      redoStack: [],
    });

    return { updatedRows: updatedRowIds };
  },

  // ----------------------------------------------------------
  // Choice List Actions
  // ----------------------------------------------------------

  addChoiceList: (listName) => {
    const state = get();
    state.pushUndo();

    const newList: ChoiceList = {
      id: uuid(),
      list_name: listName,
      choices: [
        { id: uuid(), list_name: listName, name: 'option_1', label: 'Option 1' },
      ],
    };

    set({
      form: {
        ...state.form,
        choiceLists: [...state.form.choiceLists, newList],
      },
      redoStack: [],
    });
  },

  removeChoiceList: (listName) => {
    const state = get();
    state.pushUndo();

    set({
      form: {
        ...state.form,
        choiceLists: state.form.choiceLists.filter((cl) => cl.list_name !== listName),
      },
      redoStack: [],
    });
  },

  addChoice: (listName, choice) => {
    const state = get();
    state.pushUndo();

    const list = state.form.choiceLists.find((cl) => cl.list_name === listName);
    if (!list) return;

    const count = list.choices.length + 1;
    const newChoice: ChoiceItem = {
      id: uuid(),
      list_name: listName,
      name: choice?.name || `option_${count}`,
      label: choice?.label || `Option ${count}`,
      ...choice,
    };

    const newLists = state.form.choiceLists.map((cl) =>
      cl.list_name === listName
        ? { ...cl, choices: [...cl.choices, newChoice] }
        : cl
    );

    set({
      form: { ...state.form, choiceLists: newLists },
      redoStack: [],
    });
  },

  removeChoice: (listName, choiceId) => {
    const state = get();
    state.pushUndo();

    const newLists = state.form.choiceLists.map((cl) =>
      cl.list_name === listName
        ? { ...cl, choices: cl.choices.filter((c) => c.id !== choiceId) }
        : cl
    );

    set({
      form: { ...state.form, choiceLists: newLists },
      redoStack: [],
    });
  },

  updateChoice: (listName, choiceId, updates) => {
    const state = get();
    state.pushUndo();

    const newLists = state.form.choiceLists.map((cl) =>
      cl.list_name === listName
        ? {
            ...cl,
            choices: cl.choices.map((c) =>
              c.id === choiceId ? { ...c, ...updates } : c
            ),
          }
        : cl
    );

    set({
      form: { ...state.form, choiceLists: newLists },
      redoStack: [],
    });
  },

  moveChoice: (listName, fromIndex, toIndex) => {
    const state = get();
    state.pushUndo();

    const newLists = state.form.choiceLists.map((cl) => {
      if (cl.list_name !== listName) return cl;
      const newChoices = [...cl.choices];
      const [moved] = newChoices.splice(fromIndex, 1);
      newChoices.splice(toIndex, 0, moved);
      return { ...cl, choices: newChoices };
    });

    set({
      form: { ...state.form, choiceLists: newLists },
      redoStack: [],
    });
  },

  // ----------------------------------------------------------
  // Media File Actions
  // ----------------------------------------------------------

  addMediaFile: (file) => {
    const state = get();
    // Check for duplicate filename
    const existing = state.form.mediaFiles.find((f) => f.fileName === file.fileName);
    if (existing) {
      // Merge references and update data
      const merged = {
        ...existing,
        columns: file.columns,
        sampleData: file.sampleData,
        totalRows: file.totalRows,
        rawContent: file.rawContent || existing.rawContent,
        referencedBy: [...new Set([...existing.referencedBy, ...file.referencedBy])],
      };
      set({
        form: {
          ...state.form,
          mediaFiles: state.form.mediaFiles.map((f) =>
            f.fileName === file.fileName ? merged : f
          ),
        },
      });
    } else {
      set({
        form: {
          ...state.form,
          mediaFiles: [...state.form.mediaFiles, file],
        },
      });
    }
  },

  removeMediaFile: (fileId) => {
    const state = get();
    set({
      form: {
        ...state.form,
        mediaFiles: state.form.mediaFiles.filter((f) => f.id !== fileId),
      },
    });
  },

  updateMediaFile: (fileName, updates) => {
    const state = get();
    state.pushUndo();
    set({
      form: {
        ...state.form,
        mediaFiles: state.form.mediaFiles.map((f) =>
          f.fileName === fileName ? { ...f, ...updates } : f
        ),
      },
      redoStack: [],
    });
  },

  linkMediaFileToQuestion: (fileName, questionId) => {
    const state = get();
    set({
      form: {
        ...state.form,
        mediaFiles: state.form.mediaFiles.map((f) =>
          f.fileName === fileName
            ? { ...f, referencedBy: [...new Set([...f.referencedBy, questionId])] }
            : f
        ),
      },
    });
  },

  unlinkMediaFileFromQuestion: (fileName, questionId) => {
    const state = get();
    set({
      form: {
        ...state.form,
        mediaFiles: state.form.mediaFiles.map((f) =>
          f.fileName === fileName
            ? { ...f, referencedBy: f.referencedBy.filter((id) => id !== questionId) }
            : f
        ),
      },
    });
  },

  // ----------------------------------------------------------
  // Settings Actions
  // ----------------------------------------------------------

  updateSettings: (updates) => {
    const state = get();
    state.pushUndo();

    set({
      form: {
        ...state.form,
        settings: { ...state.form.settings, ...updates },
      },
      redoStack: [],
    });
  },

  // ----------------------------------------------------------
  // UI Actions
  // ----------------------------------------------------------

  selectRow: (id) => set({ selectedRowId: id }),
  setPanelView: (view) => set({ panelView: view }),
  setDragging: (isDragging) => set({ isDragging }),
  openExpressionEditor: (rowId, mode) => set({ expressionEditor: { rowId, mode } }),
  closeExpressionEditor: () => set({ expressionEditor: null }),
  openCsvEditor: (rowId, fileName) => set({ csvEditor: { rowId, fileName } }),
  closeCsvEditor: () => set({ csvEditor: null }),
  toggleGroupCollapse: (id) => {
    const state = get();
    const next = new Set(state.collapsedGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ collapsedGroups: next });
  },

  // ----------------------------------------------------------
  // History (Undo/Redo)
  // ----------------------------------------------------------

  pushUndo: () => {
    const state = get();
    const snapshot = JSON.parse(JSON.stringify(state.form));
    set({
      undoStack: [...state.undoStack.slice(-49), snapshot],
    });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;

    const previous = state.undoStack[state.undoStack.length - 1];
    const currentSnapshot = JSON.parse(JSON.stringify(state.form));

    set({
      form: previous,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, currentSnapshot],
      selectedRowId: null,
    });
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;

    const next = state.redoStack[state.redoStack.length - 1];
    const currentSnapshot = JSON.parse(JSON.stringify(state.form));

    set({
      form: next,
      undoStack: [...state.undoStack, currentSnapshot],
      redoStack: state.redoStack.slice(0, -1),
      selectedRowId: null,
    });
  },

  // ----------------------------------------------------------
  // Form Actions
  // ----------------------------------------------------------

  loadForm: (form) => {
    set({
      form: { ...form, mediaFiles: form.mediaFiles || [] },
      selectedRowId: null,
      hasRecoveredForm: false,
      undoStack: [],
      redoStack: [],
    });
  },

  resetForm: () => {
    set({
      form: { ...defaultForm, survey: [], choiceLists: [], mediaFiles: [] },
      selectedRowId: null,
      hasRecoveredForm: false,
      undoStack: [],
      redoStack: [],
    });
  },

  // ----------------------------------------------------------
  // Auto-save Actions
  // ----------------------------------------------------------

  dismissRecovery: () => {
    set({ hasRecoveredForm: false });
  },

  discardRecoveredForm: () => {
    set({
      form: { ...defaultForm, survey: [], choiceLists: [], mediaFiles: [] },
      selectedRowId: null,
      hasRecoveredForm: false,
      undoStack: [],
      redoStack: [],
    });
  },
}),
  // ----------------------------------------------------------
  // Zustand Persist Configuration
  // ----------------------------------------------------------
  {
    name: 'survey123-designer-autosave',
    storage: createJSONStorage(() => idbStorage),
    // Only persist form data and the save timestamp — not UI state
    partialize: (state) => ({
      form: state.form,
      lastSavedAt: state.lastSavedAt,
    }),
    // On rehydration, detect recovered form
    onRehydrateStorage: () => {
      return (state, error) => {
        if (error) {
          console.warn('Auto-save recovery failed:', error);
          return;
        }
        if (state && state.form && state.form.survey.length > 0) {
          // Use setState to properly trigger a re-render with recovered flag
          useSurveyStore.setState({ hasRecoveredForm: true });
        }
      };
    },
  }
));

// ============================================================
// Auto-save timestamp tracking
// ============================================================
// Subscribe to form changes and update lastSavedAt so the indicator works.
// This runs AFTER persist middleware writes to IndexedDB.
let _prevForm = useSurveyStore.getState().form;
useSurveyStore.subscribe((state) => {
  if (state.form !== _prevForm) {
    _prevForm = state.form;
    // Update timestamp after a tick to avoid triggering during the same set() call
    queueMicrotask(() => {
      useSurveyStore.setState({ lastSavedAt: Date.now() });
    });
  }
});

