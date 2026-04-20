/**
 * Palette Editor Modal
 *
 * Visual editor for creating and editing custom draw/annotate palettes.
 * Replaces the XLSPalette XLSX + Python conversion workflow in Survey123 Connect
 * by letting users visually configure drawing tools and exporting .palette JSON directly.
 */

import React, { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { useSurveyStore } from '../../store/surveyStore';
import type {
  PaletteFile,
  PaletteToolset,
  PaletteTool,
  PaletteToolType,
  PaletteDrawType,
  EsriLineSymbol,
  EsriFillSymbol,
  EsriSimpleMarkerSymbol,
  EsriTextSymbol,
  EsriLineStyle,
  EsriFillStyle,
  EsriMarkerStyle,
  ArrowDecoration,
} from '../../types/survey';
import { ToolEditor } from './ToolEditor';

// ============================================================
// Constants
// ============================================================

const CALCITE_ICONS = [
  'freehand', 'pencil', 'pin', 'arrow-up-right', 'line', 'polygon',
  'circle', 'square', 'triangle', 'diamond', 'x', 'check',
  'cursor', 'measure', 'layer', 'map-pin', 'compass', 'gear',
  'wrench', 'hammer', 'lightbulb', 'flash', 'drop', 'flame',
  'tree', 'car', 'truck', 'walking', 'camera', 'image',
];

// ============================================================
// Main Modal
// ============================================================

interface PaletteEditorModalProps {
  paletteId?: string;
  onClose: () => void;
}

export function PaletteEditorModal({ paletteId, onClose }: PaletteEditorModalProps) {
  const { form, addPaletteFile, updatePaletteFile } = useSurveyStore();
  const existing = paletteId
    ? (form.paletteFiles || []).find((p) => p.id === paletteId)
    : undefined;

  const [palette, setPalette] = useState<PaletteFile>(
    existing || {
      id: uuid(),
      name: 'my_palette',
      title: 'My Palette',
      toolsets: [createDefaultToolset()],
    }
  );

  const [activeToolsetIdx, setActiveToolsetIdx] = useState(0);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);

  // ----------------------------------------------------------
  // Palette-level handlers
  // ----------------------------------------------------------

  const updatePaletteMeta = useCallback(
    (updates: Partial<Pick<PaletteFile, 'name' | 'title' | 'description'>>) => {
      setPalette((p) => ({ ...p, ...updates }));
    },
    []
  );

  // ----------------------------------------------------------
  // Toolset handlers
  // ----------------------------------------------------------

  const addToolset = useCallback(() => {
    setPalette((p) => ({
      ...p,
      toolsets: [...p.toolsets, createDefaultToolset()],
    }));
    setActiveToolsetIdx(palette.toolsets.length);
  }, [palette.toolsets.length]);

  const removeToolset = useCallback(
    (idx: number) => {
      setPalette((p) => ({
        ...p,
        toolsets: p.toolsets.filter((_, i) => i !== idx),
      }));
      if (activeToolsetIdx >= palette.toolsets.length - 1) {
        setActiveToolsetIdx(Math.max(0, palette.toolsets.length - 2));
      }
    },
    [activeToolsetIdx, palette.toolsets.length]
  );

  const updateToolset = useCallback((idx: number, updates: Partial<PaletteToolset>) => {
    setPalette((p) => ({
      ...p,
      toolsets: p.toolsets.map((ts, i) => (i === idx ? { ...ts, ...updates } : ts)),
    }));
  }, []);

  // ----------------------------------------------------------
  // Tool handlers
  // ----------------------------------------------------------

  const addTool = useCallback(
    (type: PaletteToolType) => {
      const tool = createDefaultTool(type);
      setPalette((p) => ({
        ...p,
        toolsets: p.toolsets.map((ts, i) =>
          i === activeToolsetIdx ? { ...ts, tools: [...ts.tools, tool] } : ts
        ),
      }));
      setEditingToolId(tool.id);
    },
    [activeToolsetIdx]
  );

  const removeTool = useCallback(
    (toolId: string) => {
      setPalette((p) => ({
        ...p,
        toolsets: p.toolsets.map((ts, i) =>
          i === activeToolsetIdx
            ? { ...ts, tools: ts.tools.filter((t) => t.id !== toolId) }
            : ts
        ),
      }));
      if (editingToolId === toolId) setEditingToolId(null);
    },
    [activeToolsetIdx, editingToolId]
  );

  const updateTool = useCallback(
    (toolId: string, updates: Partial<PaletteTool>) => {
      setPalette((p) => ({
        ...p,
        toolsets: p.toolsets.map((ts, i) =>
          i === activeToolsetIdx
            ? {
                ...ts,
                tools: ts.tools.map((t) => (t.id === toolId ? { ...t, ...updates } : t)),
              }
            : ts
        ),
      }));
    },
    [activeToolsetIdx]
  );

  const moveTool = useCallback(
    (fromIdx: number, toIdx: number) => {
      setPalette((p) => ({
        ...p,
        toolsets: p.toolsets.map((ts, i) => {
          if (i !== activeToolsetIdx) return ts;
          const tools = [...ts.tools];
          const [moved] = tools.splice(fromIdx, 1);
          tools.splice(toIdx, 0, moved);
          return { ...ts, tools };
        }),
      }));
    },
    [activeToolsetIdx]
  );

  // ----------------------------------------------------------
  // Save
  // ----------------------------------------------------------

  const handleSave = useCallback(() => {
    if (existing) {
      updatePaletteFile(palette.id, palette);
    } else {
      addPaletteFile(palette);
    }
    onClose();
  }, [palette, existing, addPaletteFile, updatePaletteFile, onClose]);

  // ----------------------------------------------------------
  // Current state
  // ----------------------------------------------------------

  const currentToolset = palette.toolsets[activeToolsetIdx];
  const editingTool = editingToolId
    ? currentToolset?.tools.find((t) => t.id === editingToolId)
    : null;

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 920, maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007a62" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-800">
                {existing ? 'Edit Palette' : 'New Drawing Palette'}
              </h2>
              <p className="text-[11px] text-gray-400">
                Custom tools for draw and annotate questions (field app only)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Palette meta + toolset tabs + tool list */}
          <div className="flex-1 flex flex-col border-r border-gray-100 overflow-y-auto" style={{ minWidth: 0 }}>
            {/* Palette meta */}
            <div className="px-6 pt-5 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-gray-500 font-medium block mb-1.5">Palette Name</label>
                  <input
                    type="text"
                    value={palette.name}
                    onChange={(e) => updatePaletteMeta({ name: e.target.value.replace(/\s/g, '_') })}
                    className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg font-mono focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62]/20 focus:outline-none"
                    placeholder="my_palette"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 font-medium block mb-1.5">Display Title</label>
                  <input
                    type="text"
                    value={palette.title}
                    onChange={(e) => updatePaletteMeta({ title: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62]/20 focus:outline-none"
                    placeholder="My Palette"
                  />
                </div>
              </div>
            </div>

            {/* Toolset tabs */}
            <div className="px-6 pb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {palette.toolsets.map((ts, idx) => (
                  <button
                    key={ts.id}
                    onClick={() => {
                      setActiveToolsetIdx(idx);
                      setEditingToolId(null);
                    }}
                    className={`group px-3 py-1.5 text-[12px] rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                      idx === activeToolsetIdx
                        ? 'bg-[#e8f5f1] text-[#007a62]'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {ts.title || `Toolset ${idx + 1}`}
                    {palette.toolsets.length > 1 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          removeToolset(idx);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-1 transition-opacity"
                      >
                        &times;
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={addToolset}
                  className="px-2.5 py-1.5 text-[12px] text-gray-400 hover:text-[#007a62] hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  + Add Toolset
                </button>
              </div>
            </div>

            {/* Toolset config */}
            {currentToolset && (
              <div className="px-6 pb-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[11px] text-gray-500 font-medium block mb-1.5">Toolset Title</label>
                    <input
                      type="text"
                      value={currentToolset.title}
                      onChange={(e) => updateToolset(activeToolsetIdx, { title: e.target.value })}
                      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62]/20 focus:outline-none"
                    />
                  </div>
                  <div style={{ width: 140 }}>
                    <label className="text-[11px] text-gray-500 font-medium block mb-1.5">Icon</label>
                    <select
                      value={currentToolset.icon?.name || ''}
                      onChange={(e) =>
                        updateToolset(activeToolsetIdx, {
                          icon: e.target.value ? { name: e.target.value } : undefined,
                        })
                      }
                      className="w-full px-2.5 py-2 text-[12px] border border-gray-200 rounded-lg bg-white focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62]/20 focus:outline-none"
                    >
                      <option value="">None</option>
                      {CALCITE_ICONS.map((ic) => (
                        <option key={ic} value={ic}>{ic}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Separator */}
            <div className="border-t border-gray-100" />

            {/* Tool list */}
            {currentToolset && (
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-semibold text-gray-600">
                    Tools ({currentToolset.tools.length})
                  </span>
                </div>

                {/* Add tool buttons */}
                <div className={`grid grid-cols-4 gap-2 ${currentToolset.tools.length > 0 ? 'mb-3' : 'mb-0'}`}>
                  {([
                    { type: 'line' as PaletteToolType, icon: 'M5 19L19 5', label: 'Line' },
                    { type: 'area' as PaletteToolType, icon: 'M4,20 12,4 20,20', label: 'Area' },
                    { type: 'marker' as PaletteToolType, icon: '', label: 'Marker' },
                    { type: 'text' as PaletteToolType, icon: '', label: 'Text' },
                  ]).map(({ type, label }) => (
                    <button
                      key={type}
                      onClick={() => addTool(type)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-medium border border-dashed border-gray-300 text-gray-500 hover:border-[#007a62] hover:text-[#007a62] hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <ToolTypeIcon type={type} color="currentColor" />
                      <span>+ {label}</span>
                    </button>
                  ))}
                </div>

                {currentToolset.tools.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-[11px]">
                    Add a tool type above to get started
                  </div>
                )}

                <div className="space-y-1">
                  {currentToolset.tools.map((tool, idx) => (
                    <ToolRow
                      key={tool.id}
                      tool={tool}
                      isActive={editingToolId === tool.id}
                      index={idx}
                      totalCount={currentToolset.tools.length}
                      onSelect={() => setEditingToolId(tool.id)}
                      onRemove={() => removeTool(tool.id)}
                      onMoveUp={() => idx > 0 && moveTool(idx, idx - 1)}
                      onMoveDown={() => idx < currentToolset.tools.length - 1 && moveTool(idx, idx + 1)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Tool detail editor */}
          <div
            className="bg-gray-50 overflow-y-auto"
            style={{ width: 360 }}
          >
            {editingTool ? (
              <ToolEditor
                tool={editingTool}
                onUpdate={(updates) => updateTool(editingTool.id, updates)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-[12px]">
                Select a tool to edit its properties
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-[11px] text-gray-400">
            {palette.toolsets.reduce((sum, ts) => sum + ts.tools.length, 0)} total tools across{' '}
            {palette.toolsets.length} toolset{palette.toolsets.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[13px] text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-[13px] text-white bg-[#007a62] rounded-lg hover:bg-[#006652] transition-colors font-medium"
            >
              {existing ? 'Save Changes' : 'Create Palette'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tool Row (list item with preview)
// ============================================================

function ToolRow({
  tool,
  isActive,
  index,
  totalCount,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  tool: PaletteTool;
  isActive: boolean;
  index: number;
  totalCount: number;
  onSelect: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const symbolColor = getToolColor(tool);

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-[#e8f5f1] border border-emerald-200' : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      {/* Color swatch / preview */}
      <div
        className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: symbolColor || '#e5e7eb' }}
      >
        <ToolTypeIcon type={tool.type} color={symbolColor ? '#fff' : '#9ca3af'} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-gray-800 truncate">{tool.label}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
            {tool.type}
          </span>
          {tool.drawType && (
            <span className="text-[10px] text-gray-400">{tool.drawType}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {index > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Move up"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
        )}
        {index < totalCount - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Move down"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 text-gray-400 hover:text-red-500 rounded"
          title="Remove"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function ToolTypeIcon({ type, color }: { type: string; color: string }) {
  const s = { width: 14, height: 14 };
  switch (type) {
    case 'line':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
          <path d="M5 19L19 5" />
        </svg>
      );
    case 'area':
      return (
        <svg {...s} viewBox="0 0 24 24" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2">
          <polygon points="4,20 12,4 20,20" />
        </svg>
      );
    case 'marker':
      return (
        <svg {...s} viewBox="0 0 24 24" fill={color}>
          <circle cx="12" cy="12" r="6" />
        </svg>
      );
    case 'text':
      return (
        <svg {...s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
          <path d="M6 4h12M12 4v16" />
        </svg>
      );
    default:
      return null;
  }
}

function getToolColor(tool: PaletteTool): string | undefined {
  if (tool.symbol && 'color' in tool.symbol) {
    return tool.symbol.color;
  }
  if (tool.textSymbol?.color) {
    return tool.textSymbol.color;
  }
  return undefined;
}

function createDefaultToolset(): PaletteToolset {
  return {
    id: uuid(),
    title: 'Drawing Tools',
    icon: { name: 'freehand' },
    tools: [],
  };
}

function createDefaultTool(type: PaletteToolType): PaletteTool {
  const id = uuid();
  const base: PaletteTool = { id, type, label: '' };

  switch (type) {
    case 'line':
      base.label = 'New Line';
      base.drawType = 'freehand';
      base.symbol = {
        type: 'esriSLS',
        color: '#ef4444',
        width: 4,
        style: 'esriSLSSolid',
      };
      break;
    case 'area':
      base.label = 'New Area';
      base.drawType = 'polygon';
      base.symbol = {
        type: 'esriSFS',
        color: '#3b82f6',
        style: 'esriSFSSolid',
        outline: { type: 'esriSLS', color: '#1d4ed8', width: 2, style: 'esriSLSSolid' },
      };
      break;
    case 'marker':
      base.label = 'New Marker';
      base.symbol = {
        type: 'esriSMS',
        style: 'esriSMSCircle',
        color: '#22c55e',
        size: 20,
      };
      break;
    case 'text':
      base.label = 'New Text';
      base.multiline = true;
      base.textSymbol = {
        type: 'esriTS',
        color: '#000000',
        font: { size: 16 },
      };
      break;
  }

  return base;
}
