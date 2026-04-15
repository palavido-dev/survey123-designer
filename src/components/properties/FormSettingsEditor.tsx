/**
 * Form Settings Editor — Polished design matching the new visual system
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
    <div className="mb-4">
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg bg-gray-50/50
          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400
          focus:bg-white transition-smooth placeholder-gray-300
          ${mono ? 'font-mono text-xs' : ''}`}
      />
      {help && <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">{help}</p>}
    </div>
  );
}

export function FormSettingsEditor() {
  const { form, updateSettings } = useSurveyStore();
  const s = form.settings;

  return (
    <div className="p-5">
      <h3 className="text-[13px] font-bold text-gray-900 mb-5">Form Settings</h3>

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
        help="'pages' for page-by-page, 'theme-grid' for grid layout"
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
