/**
 * PaletteManager
 *
 * Shows existing palette files and allows creating/editing/deleting them.
 * Embedded in the Media tab of the properties panel.
 */

import React, { useState } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { PaletteEditorModal } from './PaletteEditorModal';
import { exportPaletteToJSON } from '../../utils/paletteExport';

export function PaletteManager() {
  const { form, removePaletteFile } = useSurveyStore();
  const palettes = form.paletteFiles || [];
  const [editorOpen, setEditorOpen] = useState<string | 'new' | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-medium text-gray-600">Drawing Palettes</span>
        <button
          onClick={() => setEditorOpen('new')}
          className="px-2.5 py-1 text-[11px] font-medium text-[#007a62] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
        >
          + New Palette
        </button>
      </div>

      {palettes.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-[12px] text-gray-400 mb-1">No custom palettes yet</p>
          <p className="text-[11px] text-gray-400">
            Create a palette to customize draw/annotate tools
          </p>
        </div>
      )}

      <div className="space-y-2">
        {palettes.map((p) => (
          <div
            key={p.id}
            className="group bg-white border border-gray-200 rounded-lg px-3 py-2.5 hover:border-emerald-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-800 truncate">{p.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono text-gray-400">{p.name}.palette</span>
                  <span className="text-[10px] text-gray-400">
                    {p.toolsets.reduce((s, ts) => s + ts.tools.length, 0)} tools,{' '}
                    {p.toolsets.length} toolset{p.toolsets.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setPreviewId(previewId === p.id ? null : p.id)}
                  className="p-1.5 text-gray-400 hover:text-[#007a62] rounded transition-colors"
                  title="Preview JSON"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </button>
                <button
                  onClick={() => setEditorOpen(p.id)}
                  className="p-1.5 text-gray-400 hover:text-[#007a62] rounded transition-colors"
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => removePaletteFile(p.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-2 14H7L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Toolset pills */}
            <div className="flex flex-wrap gap-1 mt-2">
              {p.toolsets.map((ts) => (
                <span
                  key={ts.id}
                  className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                >
                  {ts.title} ({ts.tools.length})
                </span>
              ))}
            </div>

            {/* JSON preview */}
            {previewId === p.id && (
              <pre className="mt-3 p-3 bg-gray-50 rounded-lg text-[10px] font-mono text-gray-600 overflow-x-auto max-h-48 overflow-y-auto">
                {exportPaletteToJSON(p)}
              </pre>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
        <p className="text-[11px] text-emerald-700">
          <strong>Field app only:</strong> Custom palettes work with draw and annotate appearances
          in the Survey123 field app. Set <code className="bg-emerald-100 px-1 rounded">palette=name</code> in
          the question's parameters. Palettes are included in ZIP export automatically.
        </p>
      </div>

      {/* Modal */}
      {editorOpen && (
        <PaletteEditorModal
          paletteId={editorOpen === 'new' ? undefined : editorOpen}
          onClose={() => setEditorOpen(null)}
        />
      )}
    </div>
  );
}
