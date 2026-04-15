/**
 * Properties Panel (Right Side)
 *
 * Displays editable properties for the currently selected question,
 * choice list editor, or form settings.
 */

import React from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { QuestionProperties } from './QuestionProperties';
import { ChoiceListEditor } from './ChoiceListEditor';
import { FormSettingsEditor } from './FormSettingsEditor';
import { Settings, AlertCircle } from '../../utils/icons';

export function PropertiesPanel() {
  const { form, selectedRowId, panelView, setPanelView } = useSurveyStore();

  const selectedRow = selectedRowId
    ? form.survey.find((r) => r.id === selectedRowId)
    : null;

  const isSelectType =
    selectedRow &&
    ['select_one', 'select_multiple', 'rank'].includes(selectedRow.type);

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setPanelView('properties')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors
            ${panelView === 'properties'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Properties
        </button>
        {isSelectType && (
          <button
            onClick={() => setPanelView('choices')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors
              ${panelView === 'choices'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Choices
          </button>
        )}
        <button
          onClick={() => setPanelView('settings')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors
            ${panelView === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Settings size={12} className="inline mr-1" />
          Settings
        </button>
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
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6">
            <AlertCircle size={32} className="mb-3" />
            <p className="text-sm text-center">
              Select a question on the canvas to edit its properties
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
