/**
 * Form Settings Editor — Matches left-pane font sizes and padding
 */

import React from 'react';
import { useSurveyStore } from '../../store/surveyStore';

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
  help,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  mono?: boolean;
  help?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="block text-gray-500" style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ padding: '8px 12px', fontSize: mono ? 12 : 13 }}
        className={`w-full border border-gray-200 rounded-lg bg-white
          focus:border-[#00856a] transition-fast placeholder-gray-300
          ${mono ? 'font-mono' : ''}`}
      />
      {help && (
        <p className="text-gray-400" style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
          {help}
        </p>
      )}
    </div>
  );
}

export function FormSettingsEditor() {
  const { form, updateSettings } = useSurveyStore();
  const s = form.settings;

  return (
    <div style={{ padding: 16 }}>
      <h3 className="text-gray-800" style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
        Form Settings
      </h3>

      <Field
        label="Form Title"
        value={s.form_title}
        onChange={(v) => updateSettings({ form_title: v })}
        placeholder="My Survey"
        help="Displayed at the top of the form"
      />

      <Field
        label="Form ID"
        value={s.form_id}
        onChange={(v) => updateSettings({ form_id: v })}
        placeholder="my_survey"
        mono
        help="Feature layer name (no spaces, use underscores)"
      />

      <Field
        label="Version"
        value={s.version || ''}
        onChange={(v) => updateSettings({ version: v })}
        placeholder="1.0"
        help="Track form versions"
      />

      <Field
        label="Instance Name"
        value={s.instance_name || ''}
        onChange={(v) => updateSettings({ instance_name: v })}
        placeholder="concat(${field}, ' - ', ${username})"
        mono
        help="Template for individual response names"
      />

      <Field
        label="Style"
        value={s.style || ''}
        onChange={(v) => updateSettings({ style: v })}
        placeholder="pages"
        help="'pages' for page-by-page, 'theme-grid' for grid"
      />

      <Field
        label="Default Language"
        value={s.default_language || ''}
        onChange={(v) => updateSettings({ default_language: v })}
        placeholder="en"
        help="Language code (en, es, fr, etc.)"
      />

      <Field
        label="Submission URL"
        value={s.submission_url || ''}
        onChange={(v) => updateSettings({ submission_url: v })}
        placeholder="https://..."
        mono
        help="Custom submission endpoint (optional)"
      />
    </div>
  );
}
