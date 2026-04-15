/**
 * Question Properties Editor — Clean Survey123 style
 *
 * Dynamic property editor that shows relevant fields based on question type.
 * Supports all Survey123 XLS columns including Esri extensions.
 */

import React, { useState } from 'react';
import { SurveyRow, EsriFieldType } from '../../types/survey';
import { useSurveyStore } from '../../store/surveyStore';
import { validAppearances } from '../../data/questionTypes';
import { ChevronDown } from '../../utils/icons';

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
  const cls = `w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white
    focus:border-[#00856a] focus:bg-white transition-fast placeholder-gray-300
    ${mono ? 'font-mono text-[12px]' : ''}`;

  return (
    <div className="mb-3">
      <label className="block text-[11px] font-medium text-gray-500 mb-1">{label}</label>
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
      <label className="block text-[11px] font-medium text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-white
          focus:border-[#00856a] transition-fast"
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
      <label className="text-[12px] text-gray-600">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-fast
          ${value ? 'bg-[#00856a]' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-fast
          ${value ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
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
        className="flex items-center gap-2 w-full px-4 py-2.5 text-[12px] font-semibold
          text-gray-500 hover:bg-gray-50 transition-fast"
      >
        <div className={`transition-transform duration-150 ${open ? 'rotate-0' : '-rotate-90'}`}>
          <ChevronDown size={12} />
        </div>
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

  const availableLists = form.choiceLists.map((cl) => ({
    value: cl.list_name,
    label: cl.list_name,
  }));

  return (
    <div>
      {/* Question type badge */}
      <div className="px-4 py-3 bg-[#f0faf7] border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="inline-block px-2 py-0.5 text-[11px] font-semibold text-[#007a62] bg-white rounded border border-[#007a62]/20">
            {row.type.replace(/_/g, ' ')}
          </span>
          <span className="text-[12px] text-gray-500 truncate">{row.name}</span>
        </div>
      </div>

      {/* Basic Properties */}
      <Section title="Basic" defaultOpen={true}>
        <TextField
          label="Name (field ID)"
          value={row.name}
          onChange={(v) => update('name', v)}
          placeholder="field_name"
          mono
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
          <>
            <TextField
              label="Hint"
              value={row.hint || ''}
              onChange={(v) => update('hint', v)}
              placeholder="Help text below the question"
            />
            <TextField
              label="Guidance Hint"
              value={row.guidance_hint || ''}
              onChange={(v) => update('guidance_hint', v)}
              placeholder="Expandable guidance text"
            />
          </>
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
            label="Relevant (visibility)"
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

      {/* Body (Esri) */}
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
          <ToggleField
            label="Visible"
            value={row['body::esri:visible'] !== 'false'}
            onChange={(v) => update('body::esri:visible', v ? undefined : 'false')}
          />
          {(isGroup || isRepeat) && (
            <TextField
              label="Style"
              value={row['body::esri:style'] || ''}
              onChange={(v) => update('body::esri:style', v)}
              placeholder="backgroundColor=blue"
              mono
            />
          )}
        </Section>
      )}

      {/* Bind (Esri) */}
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
            label="Bind Parameters"
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

          <TextField
            label="Warning"
            value={row['bind::esri:warning'] || ''}
            onChange={(v) => update('bind::esri:warning', v)}
            placeholder="Warning condition expression"
            mono
          />

          <TextField
            label="Warning Message"
            value={row['bind::esri:warning_message'] || ''}
            onChange={(v) => update('bind::esri:warning_message', v)}
            placeholder="Warning message to display"
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
