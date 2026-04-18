/**
 * Cascading Select Wizard — Guided setup for cascading/filtered selects
 *
 * Walks the user through:
 *  1. Pick parent select question (auto-selected if initialParentId provided)
 *  2. Pick/create child select question
 *  3. Define parent-child mapping (add filter column to child choices)
 *  4. Auto-generate choice_filter expression
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { SurveyRow, ChoiceList, ChoiceItem } from '../../types/survey';
import { X } from '../../utils/icons';
import { v4 as uuid } from 'uuid';

interface Props {
  onClose: () => void;
  /** If provided, auto-selects this question as the parent and starts at step 2 */
  initialParentId?: string;
  /** If provided AND the question is a child (has choice_filter), start in "child" role */
  initialChildId?: string;
}

type WizardStep = 'parent' | 'child' | 'mapping' | 'done';

export function CascadingSelectWizard({ onClose, initialParentId, initialChildId }: Props) {
  const { form, updateRow, pushUndo } = useSurveyStore();

  // Determine initial state based on props
  const getInitialState = () => {
    if (initialParentId) {
      const pRow = form.survey.find((r) => r.id === initialParentId);
      if (pRow) {
        return { step: 'child' as WizardStep, parentId: initialParentId, filterCol: pRow.name };
      }
    }
    return { step: 'parent' as WizardStep, parentId: null as string | null, filterCol: '' };
  };

  const initial = getInitialState();
  const [step, setStep] = useState<WizardStep>(initial.step);
  const [parentRowId, setParentRowId] = useState<string | null>(initial.parentId);
  const [childRowId, setChildRowId] = useState<string | null>(null);
  const [filterColumnName, setFilterColumnName] = useState(initial.filterCol);
  const [mappings, setMappings] = useState<Map<string, string>>(new Map());

  // Get all select_one questions as potential parents
  const selectOneRows = useMemo(() =>
    form.survey.filter((r) =>
      r.type === 'select_one' && r.listName
    ),
    [form.survey]
  );

  const parentRow = parentRowId ? form.survey.find((r) => r.id === parentRowId) : null;
  const parentChoiceList = parentRow?.listName
    ? form.choiceLists.find((cl) => cl.list_name === parentRow.listName)
    : null;

  const childCandidates = useMemo(() => {
    // Child must appear AFTER the parent in form order
    const parentIndex = parentRowId
      ? form.survey.findIndex((r) => r.id === parentRowId)
      : -1;
    return form.survey.filter((r, idx) =>
      (r.type === 'select_one' || r.type === 'select_multiple') &&
      r.listName &&
      r.id !== parentRowId &&
      (parentIndex === -1 || idx > parentIndex)
    );
  }, [form.survey, parentRowId]);

  const childRow = childRowId ? form.survey.find((r) => r.id === childRowId) : null;
  const childChoiceList = childRow?.listName
    ? form.choiceLists.find((cl) => cl.list_name === childRow.listName)
    : null;

  const handleSelectParent = (rowId: string) => {
    setParentRowId(rowId);
    const pRow = form.survey.find((r) => r.id === rowId);
    if (pRow) setFilterColumnName(pRow.name);
    setStep('child');
  };

  const handleSelectChild = (rowId: string) => {
    setChildRowId(rowId);
    const cRow = form.survey.find((r) => r.id === rowId);
    const cList = cRow?.listName
      ? form.choiceLists.find((cl) => cl.list_name === cRow.listName)
      : null;
    if (cList) {
      const newMap = new Map<string, string>();
      for (const choice of cList.choices) {
        newMap.set(choice.id, '');
      }
      setMappings(newMap);
    }
    setStep('mapping');
  };

  const handleUpdateMapping = (choiceId: string, parentChoiceName: string) => {
    setMappings((prev) => {
      const next = new Map(prev);
      next.set(choiceId, parentChoiceName);
      return next;
    });
  };

  const handleApply = () => {
    if (!childRow || !childChoiceList || !parentRow || !filterColumnName) return;

    pushUndo();

    const store = useSurveyStore.getState();
    const updatedChoiceLists = store.form.choiceLists.map((cl) => {
      if (cl.list_name !== childChoiceList.list_name) return cl;
      return {
        ...cl,
        choices: cl.choices.map((c) => ({
          ...c,
          [filterColumnName]: mappings.get(c.id) || '',
        })),
      };
    });

    const choiceFilterExpr = `${filterColumnName} = \${${parentRow.name}}`;
    const updatedSurvey = store.form.survey.map((r) =>
      r.id === childRow.id ? { ...r, choice_filter: choiceFilterExpr } : r
    );

    useSurveyStore.setState({
      form: {
        ...store.form,
        survey: updatedSurvey,
        choiceLists: updatedChoiceLists,
      },
    });

    setStep('done');
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      style={{ padding: 24 }}
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-[560px] max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-gray-200"
          style={{ padding: '14px 20px' }}>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Cascading Select Wizard</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {step === 'parent' && 'Step 1: Select the parent question'}
              {step === 'child' && 'Step 2: Select the child question'}
              {step === 'mapping' && 'Step 3: Map child choices to parent values'}
              {step === 'done' && 'Setup complete!'}
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="shrink-0 flex items-center bg-gray-50 border-b border-gray-100"
          style={{ padding: '10px 20px', gap: 4 }}>
          {['parent', 'child', 'mapping', 'done'].map((s, i) => {
            const steps = ['parent', 'child', 'mapping', 'done'];
            const currentIdx = steps.indexOf(step);
            return (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 ${
                  step === s ? 'text-[#007a62]' : i < currentIdx ? 'text-green-500' : 'text-gray-300'
                }`}>
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    step === s ? 'bg-[#007a62] text-white'
                    : i < currentIdx ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                  }`}>
                    {i < currentIdx ? '✓' : i + 1}
                  </span>
                  <span className="text-[11px] font-medium">
                    {s === 'parent' ? 'Parent' : s === 'child' ? 'Child' : s === 'mapping' ? 'Mapping' : 'Done'}
                  </span>
                </div>
                {i < 3 && <div className={`flex-1 h-px ${
                  i < currentIdx ? 'bg-green-300' : 'bg-gray-200'
                }`} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>
          {step === 'parent' && (
            <div>
              <p className="text-[12px] text-gray-500" style={{ marginBottom: 12 }}>
                Choose the parent question. The child question's choices will be filtered
                based on the selected value of this question.
              </p>
              {selectOneRows.length === 0 ? (
                <div className="text-center text-gray-400" style={{ padding: '32px 0' }}>
                  <p className="text-sm font-medium">No select_one questions found</p>
                  <p className="text-xs mt-1">Add at least two select_one questions to your form first.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectOneRows.map((row) => (
                    <button
                      key={row.id}
                      onClick={() => handleSelectParent(row.id)}
                      className="w-full text-left rounded-lg border border-gray-200 hover:border-[#007a62] hover:bg-[#f0faf7] transition-colors"
                      style={{ padding: '10px 14px' }}
                    >
                      <div className="text-[13px] font-medium text-gray-800">{row.label || row.name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {row.name} — {row.listName} ({form.choiceLists.find((cl) => cl.list_name === row.listName)?.choices.length || 0} choices)
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'child' && (
            <div>
              <div className="bg-[#f0faf7] rounded-lg text-[12px] text-[#007a62]"
                style={{ padding: '8px 12px', marginBottom: 12 }}>
                <strong>Parent:</strong> {parentRow?.label || parentRow?.name} ({parentRow?.listName})
              </div>
              <p className="text-[12px] text-gray-500" style={{ marginBottom: 12 }}>
                Choose the child question whose choices will be filtered by the parent's value.
              </p>
              {childCandidates.length === 0 ? (
                <div className="text-center text-gray-400" style={{ padding: '32px 0' }}>
                  <p className="text-sm font-medium">No other select questions found</p>
                  <p className="text-xs mt-1">Add another select question to create a cascading pair.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {childCandidates.map((row) => (
                    <button
                      key={row.id}
                      onClick={() => handleSelectChild(row.id)}
                      className="w-full text-left rounded-lg border border-gray-200 hover:border-[#007a62] hover:bg-[#f0faf7] transition-colors"
                      style={{ padding: '10px 14px' }}
                    >
                      <div className="text-[13px] font-medium text-gray-800">{row.label || row.name}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {row.name} — {row.listName} ({form.choiceLists.find((cl) => cl.list_name === row.listName)?.choices.length || 0} choices)
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => { setStep('parent'); setParentRowId(null); }}
                className="text-[12px] text-gray-500 hover:text-gray-700"
                style={{ marginTop: 12 }}>
                ← Back
              </button>
            </div>
          )}

          {step === 'mapping' && childChoiceList && parentChoiceList && (
            <div>
              <div className="bg-[#f0faf7] rounded-lg text-[12px] text-[#007a62]"
                style={{ padding: '8px 12px', marginBottom: 12 }}>
                <div><strong>Parent:</strong> {parentRow?.label || parentRow?.name} ({parentRow?.listName})</div>
                <div style={{ marginTop: 2 }}><strong>Child:</strong> {childRow?.label || childRow?.name} ({childRow?.listName})</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                  Filter Column Name
                </label>
                <input
                  type="text"
                  value={filterColumnName}
                  onChange={(e) => setFilterColumnName(e.target.value.replace(/\s/g, '_').toLowerCase())}
                  className="w-full border border-gray-300 rounded-lg focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62] outline-none"
                  style={{ marginTop: 4, padding: '6px 10px', fontSize: 13 }}
                  placeholder="e.g. region, category"
                />
                <p className="text-[10px] text-gray-400" style={{ marginTop: 4 }}>
                  This column will be added to the child choice list to link each child choice to a parent value.
                </p>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                  Map Each Child Choice → Parent Value
                </label>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200"
                  style={{ padding: '6px 12px' }}>
                  <span className="text-[11px] font-semibold text-gray-500">Child Choice</span>
                  <span className="text-[11px] font-semibold text-gray-500">Parent Value</span>
                </div>
                <div className="max-h-[250px] overflow-y-auto divide-y divide-gray-100">
                  {childChoiceList.choices.map((choice) => (
                    <div key={choice.id} className="grid grid-cols-2 items-center hover:bg-gray-50"
                      style={{ padding: '6px 12px' }}>
                      <div>
                        <span className="text-[12px] text-gray-700">{choice.label || choice.name}</span>
                        <span className="text-[10px] text-gray-400 ml-1.5">({choice.name})</span>
                      </div>
                      <select
                        value={mappings.get(choice.id) || ''}
                        onChange={(e) => handleUpdateMapping(choice.id, e.target.value)}
                        className="text-[12px] border border-gray-200 rounded focus:border-[#007a62] outline-none bg-white"
                        style={{ padding: '4px 8px' }}
                      >
                        <option value="">— Select parent —</option>
                        {parentChoiceList.choices.map((pc) => (
                          <option key={pc.id} value={pc.name}>
                            {pc.label || pc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg" style={{ marginTop: 12, padding: '8px 12px' }}>
                <p className="text-[10px] text-gray-500">
                  <strong>Generated expression:</strong>{' '}
                  <code className="text-[#007a62] font-mono">
                    {filterColumnName} = ${'{'}${parentRow?.name}{'}'}
                  </code>
                </p>
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
                <button onClick={() => setStep('child')}
                  className="text-[12px] text-gray-500 hover:text-gray-700">
                  ← Back
                </button>
                <button
                  onClick={handleApply}
                  disabled={!filterColumnName || Array.from(mappings.values()).every((v) => !v)}
                  className="text-[13px] font-semibold text-white bg-[#007a62] rounded-lg hover:bg-[#006652] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ padding: '8px 16px' }}
                >
                  Apply Cascading Filter
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center" style={{ padding: '32px 0' }}>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-[15px] font-semibold text-gray-800 mb-1">Cascading Select Created!</h3>
              <p className="text-[12px] text-gray-500 mb-4">
                The choice_filter has been set on <strong>{childRow?.name}</strong> and the
                filter column <strong>{filterColumnName}</strong> has been added to the{' '}
                <strong>{childRow?.listName}</strong> choice list.
              </p>
              <button
                onClick={onClose}
                className="text-[13px] font-semibold text-white bg-[#007a62] rounded-lg hover:bg-[#006652] transition-colors"
                style={{ padding: '8px 16px' }}
              >
                Close Wizard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
