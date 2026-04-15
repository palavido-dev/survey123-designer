/**
 * Properties Panel (Right Side) — Clean tabbed interface matching Survey123 style
 */

import React from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { QuestionProperties } from './QuestionProperties';
import { ChoiceListEditor } from './ChoiceListEditor';
import { FormSettingsEditor } from './FormSettingsEditor';
import { Settings, MousePointerClick } from '../../utils/icons';

export function PropertiesPanel() {
  const { form, selectedRowId, panelView, setPanelView } = useSurveyStore();

  const selectedRow = selectedRowId
    ? form.survey.find((r) => r.id === selectedRowId)
    : null;

  const isSelectType =
    selectedRow &&
    ['select_one', 'select_multiple', 'rank'].includes(selectedRow.type);

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
          active={panelView === 'settings'}
          onClick={() => setPanelView('settings')}
          label="Settings"
          icon={<Settings size={13} />}
        />
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {panelView === 'settings' ? (
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
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
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
    </button>
  );
}
