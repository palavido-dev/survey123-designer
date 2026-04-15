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
    <div className="w-[320px] bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-[#fafafa]">
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
          icon={<Settings size={12} />}
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
          <div className="flex flex-col items-center justify-center h-full text-gray-300 px-8">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
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
      className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold transition-fast relative
        ${active
          ? 'text-[#007a62] bg-white border-b-2 border-[#007a62]'
          : 'text-gray-400 hover:text-gray-600'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
