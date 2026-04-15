/**
 * Question Properties Editor
 *
 * Dynamic property editor that shows relevant fields based on question type.
 * Supports all Survey123 XLS columns including Esri extensions.
 */

import React, { useState } from 'react';
import { SurveyRow, EsriFieldType } from '../../types/survey';
import { useSurveyStore } from '../../store/surveyStore';
import { validAppearances } from '../../data/questionTypes';
import { ChevronDown, ChevronRight } from '../../utils/icons';

interface Props {
  row: SurveyRow;
}

// ============================================================
// Field Components
// ============================================================

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
  mono?: boolean;
}) {
  const cls = `w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${mono ? 'font-mono text-xs' : ''}`;

  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cls + ' resize-y'}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- None --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors
          ${value ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
          ${value ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}

// ============================================================
// Collapsible Section
// ============================================================

function Section({ title, children, defaultOpen = false }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-2 text-xs font-semibold
          text-gray-500 uppercase tracking-wide hover:bg-gray-50"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function QuestionProperties({ row }: Props) {
  const { updateRow, form } = useSurveyStore();

  const update = (field: string, value: any) => {
    updateRow(row.id, { [field]: value || undefined });
  };

  const isStructural = ['begin_group', 'end_group', 'begin_repeat', 'end_repeat'].includes(row.type);
  const isSelectType = ['select_one', 'select_multiple', 'rank'].includes(row.type);
  const isRepeat = row.type === 'begin_repeat';
  const isGroup = row.type === 'begin_group';
  const isMetadata = ['start', 'end', 'username', 'deviceid'].includes(row.type);
  const isCalcOrHidden = ['calculate', 'hidden'].includes(row.type);

  const appearances = validAppearances[row.type] || [];

  // Available choice lists for select types
  const availableLists = form.choiceLists.map((cl) => ({
    value: cl.list_name,
    label: cl.list_name,
  }));

  return (
    <div className="divide-y divide-gray-100">
      {/* Basic Properties — Always shown */}
      <Section title="Basic" defaultOpen={true}>
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <div className="px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-500">
            {row.type.replace(/_/g, ' ')}
          </div>
        </div>

        <TextField
          label="Name (field ID)"
          value={row.name}
          onChange={(v) => update('name', v)}
          placeholder="field_name"
        />

        {!isMetadata && !isCalcOrHidden && (
          <TextField
            label="Label"
            value={row.label}
            onChange={(v) => update('label', v)}
            placeholder="Question text..."
          />
        )}

        {!isMetadata && !isStructural && !isCalcOrHidden && (
          <TextField
            label="Hint"
            value={row.hint || ''}
            onChange={(v) => update('hint', v)}
            placeholder="Help text shown below the question"
          />
        )}

        {isSelectType && (
          <SelectField
            label="Choice List"
            value={row.listName || ''}
            onChange={(v) => update('listName', v)}
            options={availableLists}
          />
        )}

        {isRepeat && (
          <TextField
            label="Repeat Count"
            value={row.repeat_count || ''}
            onChange={(v) => update('repeat_count', v)}
            placeholder="Number or expression"
            mono
          />
        )}
      </Section>

      {/* Validation */}
      {!isStructural && !isMetadata && (
        <Section title="Validation">
          <ToggleField
            label="Required"
            value={row.required === 'yes'}
            onChange={(v) => update('required', v ? 'yes' : undefined)}
          />

          {row.required === 'yes' && (
            <TextField
              label="Required Message"
              value={row.required_message || ''}
              onChange={(v) => update('required_message', v)}
              placeholder="Custom error message"
            />
          )}

          <TextField
            label="Constraint"
            value={row.constraint || ''}
            onChange={(v) => update('constraint', v)}
            placeholder=". > 0 and . < 100"
            mono
          />

          {row.constraint && (
            <TextField
              label="Constraint Message"
              value={row.constraint_message || ''}
              onChange={(v) => update('constraint_message', v)}
              placeholder="Validation error message"
            />
          )}
        </Section>
      )}

      {/* Logic */}
      {!isMetadata && (
        <Section title="Logic">
          <TextField
            label="Relevant (visibility condition)"
            value={row.relevant || ''}
            onChange={(v) => update('relevant', v)}
            placeholder="${other_question} = 'yes'"
            mono
          />

          {(isCalcOrHidden || !isStructural) && (
            <TextField
              label="Calculation"
              value={row.calculation || ''}
              onChange={(v) => update('calculation', v)}
              placeholder="concat(${first_name}, ' ', ${last_name})"
              mono
              multiline
            />
          )}

          <TextField
            label="Default Value"
            value={row.default || ''}
            onChange={(v) => update('default', v)}
            placeholder="Default value or expression"
            mono
          />

          {isSelectType && (
            <TextField
              label="Choice Filter"
              value={row.choice_filter || ''}
              onChange={(v) => update('choice_filter', v)}
              placeholder="state = ${state_question}"
              mono
            />
          )}

          <ToggleField
            label="Read Only"
            value={row.read_only === 'yes'}
            onChange={(v) => update('read_only', v ? 'yes' : undefined)}
          />
        </Section>
      )}

      {/* Appearance */}
      {appearances.length > 0 && (
        <Section title="Appearance">
          <SelectField
            label="Appearance"
            value={row.appearance || ''}
            onChange={(v) => update('appearance', v)}
            options={appearances.map((a) => ({ value: a, label: a }))}
          />

          {(isGroup || isRepeat) && (
            <TextField
              label="Grid Width (w1-w4)"
              value=""
              onChange={() => {}}
              placeholder="e.g., w4"
            />
          )}
        </Section>
      )}

      {/* Parameters */}
      {!isStructural && !isMetadata && (
        <Section title="Parameters">
          <TextField
            label="Parameters"
            value={row.parameters || ''}
            onChange={(v) => update('parameters', v)}
            placeholder="max-pixels=800 codec=aac"
            mono
          />
        </Section>
      )}

      {/* Media */}
      {!isStructural && !isMetadata && !isCalcOrHidden && (
        <Section title="Media">
          <TextField
            label="Image"
            value={row['media::image'] || ''}
            onChange={(v) => update('media::image', v)}
            placeholder="image_filename.jpg"
          />
          <TextField
            label="Audio"
            value={row['media::audio'] || ''}
            onChange={(v) => update('media::audio', v)}
            placeholder="audio_filename.mp3"
          />
        </Section>
      )}

      {/* Body Columns */}
      {!isStructural && !isMetadata && (
        <Section title="Body (Esri)">
          <TextField
            label="Input Mask"
            value={row['body::esri:inputMask'] || ''}
            onChange={(v) => update('body::esri:inputMask', v)}
            placeholder="(___) ___-____"
            mono
          />
          <TextField
            label="Accept (file types)"
            value={row['body::accept'] || ''}
            onChange={(v) => update('body::accept', v)}
            placeholder=".pdf,.docx"
          />
          {(isGroup || isRepeat) && (
            <TextField
              label="Style"
              value={row['body::esri:style'] || ''}
              onChange={(v) => update('body::esri:style', v)}
              placeholder="backgroundColor=blue borderColor=#FF0000"
              mono
            />
          )}
        </Section>
      )}

      {/* Bind Columns (Esri Extensions) */}
      {!isMetadata && (
        <Section title="Bind (Esri)">
          <SelectField
            label="Field Type"
            value={row['bind::esri:fieldType'] || ''}
            onChange={(v) => update('bind::esri:fieldType', v as EsriFieldType)}
            options={[
              { value: 'esriFieldTypeString', label: 'String' },
              { value: 'esriFieldTypeInteger', label: 'Integer' },
              { value: 'esriFieldTypeSmallInteger', label: 'Small Integer' },
              { value: 'esriFieldTypeDouble', label: 'Double' },
              { value: 'esriFieldTypeSingle', label: 'Single' },
              { value: 'esriFieldTypeDate', label: 'Date' },
              { value: 'esriFieldTypeDateOnly', label: 'Date Only' },
              { value: 'esriFieldTypeTimeOnly', label: 'Time Only' },
              { value: 'esriFieldTypeGUID', label: 'GUID' },
              { value: 'esriFieldTypeGlobalID', label: 'Global ID' },
              { value: 'null', label: 'null (omit field)' },
            ]}
          />

          <TextField
            label="Field Length"
            value={row['bind::esri:fieldLength']?.toString() || ''}
            onChange={(v) => update('bind::esri:fieldLength', v ? Number(v) : undefined)}
            placeholder="255"
          />

          <TextField
            label="Field Alias"
            value={row['bind::esri:fieldAlias'] || ''}
            onChange={(v) => update('bind::esri:fieldAlias', v)}
            placeholder="Display name in feature layer"
          />

          <TextField
            label="Parameters"
            value={row['bind::esri:parameters'] || ''}
            onChange={(v) => update('bind::esri:parameters', v)}
            placeholder="calculationMode=whenEmpty"
            mono
          />

          <TextField
            label="Workflow"
            value={row['bind::esri:workflow'] || ''}
            onChange={(v) => update('bind::esri:workflow', v)}
            placeholder="rangefinderMode=height"
            mono
          />

          <ToggleField
            label="Save Incomplete"
            value={row['bind::saveInComplete'] === 'true'}
            onChange={(v) => update('bind::saveInComplete', v ? 'true' : undefined)}
          />
        </Section>
      )}
    </div>
  );
}
