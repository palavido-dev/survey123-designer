/**
 * Properties Panel (Right Side) — Tabbed interface with Properties, Choices, Scripts, Media, Settings
 *
 * Tabs:
 *  - Properties: question editor (when a question is selected)
 *  - Choices: inline choice list editor for select questions, or choice list manager overview
 *  - Scripts: visual function library with pre-built Survey123 templates
 *  - Media: CSV file references and uploads
 *  - Settings: form-level settings
 */

import React, { useState } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { QuestionProperties } from './QuestionProperties';
import { ChoiceListEditor } from './ChoiceListEditor';
import { ChoiceListManager } from './ChoiceListManager';
import { FormSettingsEditor } from './FormSettingsEditor';
import { MediaPanel } from './MediaPanel';
import { ScriptFunctionLibrary } from '../scripts/ScriptFunctionLibrary';
import { ScriptEditorModal } from '../scripts/ScriptEditorModal';
// CascadingSelectWizard is now launched from per-question badges on the canvas
import { Settings, MousePointerClick, List } from '../../utils/icons';

export function PropertiesPanel() {
  const { form, selectedRowId, panelView, setPanelView } = useSurveyStore();
  const [showScriptSourceEditor, setShowScriptSourceEditor] = useState(false);
  // Cascading wizard is now launched from per-question badges on the canvas

  const selectedRow = selectedRowId
    ? form.survey.find((r) => r.id === selectedRowId)
    : null;

  const isSelectType =
    selectedRow &&
    ['select_one', 'select_multiple', 'rank'].includes(selectedRow.type);

  // Count media files for the tab badge
  const mediaFileCount = (form.mediaFiles || []).length;
  const missingMediaCount = React.useMemo(() => {
    const uploaded = new Set((form.mediaFiles || []).map((f) => f.fileName));
    return form.survey.filter(
      (r) =>
        ['select_one_from_file', 'select_multiple_from_file'].includes(r.type) &&
        r.fileName &&
        !uploaded.has(r.fileName)
    ).length;
  }, [form.survey, form.mediaFiles]);
  const mediaBadge = missingMediaCount > 0 ? 'warn' : mediaFileCount > 0 ? 'count' : undefined;

  // Script / choice list counts for badges
  const scriptFuncCount = React.useMemo(() => {
    let count = 0;
    for (const f of form.scriptFiles || []) {
      // Quick count: match "function " occurrences
      const matches = f.content.match(/function\s+\w+/g);
      if (matches) count += matches.length;
    }
    return count;
  }, [form.scriptFiles]);

  const choiceListCount = (form.choiceLists || []).length;

  return (
    <div className="bg-white border-l border-gray-200 flex flex-col h-full"
      style={{ width: 320 }}>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-[#fafafa] shrink-0"
        style={{ padding: '0 4px' }}>
        <TabButton
          active={panelView === 'properties'}
          onClick={() => setPanelView('properties')}
          label="Properties"
        />
        <TabButton
          active={panelView === 'choices' || panelView === 'choiceLists'}
          onClick={() => {
            if (isSelectType) {
              setPanelView('choices');
            } else {
              setPanelView('choiceLists');
            }
          }}
          label="Choices"
          badge={choiceListCount > 0 ? 'count' : undefined}
        />
        <TabButton
          active={panelView === 'scripts'}
          onClick={() => setPanelView('scripts')}
          label="Scripts"
          badge={scriptFuncCount > 0 ? 'count' : undefined}
        />
        <TabButton
          active={panelView === 'media'}
          onClick={() => setPanelView('media')}
          icon={<MediaTabIcon size={12} />}
          badge={mediaBadge}
          title="Media"
        />
        <TabButton
          active={panelView === 'settings'}
          onClick={() => setPanelView('settings')}
          icon={<Settings size={14} />}
          title="Settings"
        />
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {panelView === 'scripts' ? (
          <ScriptFunctionLibrary onOpenSourceEditor={() => setShowScriptSourceEditor(true)} />
        ) : panelView === 'media' ? (
          <MediaPanel />
        ) : panelView === 'settings' ? (
          <FormSettingsEditor />
        ) : panelView === 'choiceLists' ? (
          <ChoiceListManager />
        ) : panelView === 'choices' && selectedRow && isSelectType ? (
          <div className="flex flex-col h-full">
            <ChoiceListEditor listName={selectedRow.listName!} />
            <div className="shrink-0 border-t border-gray-100" style={{ padding: '6px 14px' }}>
              <button
                onClick={() => setPanelView('choiceLists')}
                className="w-full text-[11px] text-gray-400 hover:text-[#007a62] transition-colors text-center"
                style={{ padding: '4px 0' }}
              >
                View All Choice Lists ({choiceListCount})
              </button>
            </div>
          </div>
        ) : selectedRow ? (
          <QuestionProperties row={selectedRow} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-300"
            style={{ padding: '0 32px' }}>
            <div className="rounded-full bg-gray-50 flex items-center justify-center"
              style={{ width: 56, height: 56, marginBottom: 16 }}>
              <MousePointerClick size={24} className="text-gray-300" />
            </div>
            <p className="text-[13px] text-gray-400 text-center">
              Select a question to edit its properties
            </p>
          </div>
        )}
      </div>

      {/* Script Source Editor Modal */}
      {showScriptSourceEditor && (
        <ScriptEditorModal onClose={() => setShowScriptSourceEditor(false)} />
      )}

    </div>
  );
}

// ============================================================
// Tab Button
// ============================================================

function TabButton({
  active,
  onClick,
  label,
  icon,
  badge,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
  badge?: 'count' | 'warn';
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title || label || ''}
      className={`flex items-center transition-fast relative whitespace-nowrap
        ${active
          ? 'text-[#007a62] bg-white border-b-2 border-[#007a62]'
          : 'text-gray-400 hover:text-gray-600'
        }`}
      style={{ padding: label ? '10px 8px' : '10px 8px', gap: 4, fontSize: 11, fontWeight: 600 }}
    >
      {icon}
      {label}
      {badge === 'warn' && (
        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" style={{ marginLeft: 1 }} />
      )}
      {badge === 'count' && (
        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" style={{ marginLeft: 1 }} />
      )}
    </button>
  );
}

function MediaTabIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
