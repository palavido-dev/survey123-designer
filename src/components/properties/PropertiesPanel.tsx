/**
 * Properties Panel (Right Side) — Clean tabbed interface matching Survey123 style
 */

import React from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { QuestionProperties } from './QuestionProperties';
import { ChoiceListEditor } from './ChoiceListEditor';
import { FormSettingsEditor } from './FormSettingsEditor';
import { MediaPanel } from './MediaPanel';
import { Settings, MousePointerClick } from '../../utils/icons';

export function PropertiesPanel() {
  const { form, selectedRowId, panelView, setPanelView } = useSurveyStore();

  const selectedRow = selectedRowId
    ? form.survey.find((r) => r.id === selectedRowId)
    : null;

  const isSelectType =
    selectedRow &&
    ['select_one', 'select_multiple', 'rank'].includes(selectedRow.type);

  // Count media files for the tab badge
  const mediaFileCount = (form.mediaFiles || []).length;
  // Check for missing references (select_from_file with no uploaded CSV)
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

  return (
    <div className="bg-white border-l border-gray-200 flex flex-col h-full"
      style={{ width: 320 }}>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-[#fafafa]"
        style={{ padding: '0 4px' }}>
        <TabButton
          active={panelView === 'properties'}
          onClick={() => setPanelView('properties')}
          label="Properties"
        />
        {isSelectType && (
          <TabButton
            active={panelView === 'choices'}
            onClick={() => setPanelView('choices')}
            label="Choices"
          />
        )}
        <TabButton
          active={panelView === 'media'}
          onClick={() => setPanelView('media')}
          label="Media"
          icon={<MediaTabIcon size={13} />}
          badge={mediaBadge}
        />
        <TabButton
          active={panelView === 'settings'}
          onClick={() => setPanelView('settings')}
          label="Settings"
          icon={<Settings size={13} />}
        />
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {panelView === 'media' ? (
          <MediaPanel />
        ) : panelView === 'settings' ? (
          <FormSettingsEditor />
        ) : panelView === 'choices' && selectedRow && isSelectType ? (
          <ChoiceListEditor listName={selectedRow.listName!} />
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
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  badge?: 'count' | 'warn';
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center transition-fast relative
        ${active
          ? 'text-[#007a62] bg-white border-b-2 border-[#007a62]'
          : 'text-gray-400 hover:text-gray-600'
        }`}
      style={{ padding: '10px 16px', gap: 6, fontSize: 13, fontWeight: 600 }}
    >
      {icon}
      {label}
      {badge === 'warn' && (
        <span className="w-2 h-2 rounded-full bg-amber-400" style={{ marginLeft: 2 }} />
      )}
      {badge === 'count' && (
        <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ marginLeft: 2 }} />
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
