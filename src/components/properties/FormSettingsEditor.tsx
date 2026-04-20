/**
 * Form Settings Editor — Matches left-pane font sizes and padding
 */

import React, { useState } from 'react';
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
  const { form, updateSettings, saveDefaultSettings, clearDefaultSettings, defaultSettings } = useSurveyStore();
  const s = form.settings;
  const [showDefaultSaved, setShowDefaultSaved] = useState(false);

  const handleSaveAsDefault = () => {
    saveDefaultSettings(s);
    setShowDefaultSaved(true);
    setTimeout(() => setShowDefaultSaved(false), 2500);
  };

  const handleClearDefaults = () => {
    clearDefaultSettings();
  };

  return (
    <div style={{ padding: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <h3 className="text-gray-800" style={{ fontSize: 14, fontWeight: 600 }}>
          Form Settings
        </h3>
        {showDefaultSaved && (
          <span className="text-[11px] text-green-600 font-medium">Saved as default</span>
        )}
      </div>

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

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
        <p className="text-gray-600 text-[12px] font-medium mb-3">Web App Customization</p>
        <p className="text-gray-400 text-[11px] mb-4" style={{ lineHeight: 1.4 }}>
          These settings customize the Survey123 web app appearance. Supports HTML and {'${field}'} references (except submit text).
        </p>

        <Field
          label="Submit Button Text"
          value={s.submit_text || ''}
          onChange={(v) => updateSettings({ submit_text: v })}
          placeholder="Submit"
          help="Custom label for the submit button (plain text only)"
        />

        <Field
          label="Thank You Message"
          value={s.thank_you_message || ''}
          onChange={(v) => updateSettings({ thank_you_message: v })}
          placeholder="Thank you for your response!"
          help="Shown after submission. Supports HTML."
        />

        <Field
          label="Form Footer"
          value={s.footer_text || ''}
          onChange={(v) => updateSettings({ footer_text: v })}
          placeholder="© 2026 My Organization"
          help="Displayed at the bottom of the form. Supports HTML."
        />
      </div>

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
        <p className="text-gray-600 text-[12px] font-medium mb-3">Save as defaults</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSaveAsDefault}
            className="flex-1 py-2 px-3 text-[12px] font-medium rounded-lg
              bg-[#00856a] text-white hover:bg-[#007560]
              transition-fast active:scale-[0.98]"
          >
            Save as default
          </button>
          {defaultSettings && (
            <button
              onClick={handleClearDefaults}
              className="flex-1 py-2 px-3 text-[12px] font-medium rounded-lg
                bg-gray-100 text-gray-700 hover:bg-gray-200
                transition-fast active:scale-[0.98]"
            >
              Clear defaults
            </button>
          )}
        </div>
        {defaultSettings && (
          <p className="text-gray-400 text-[11px] mt-2">
            New blank forms will use these settings
          </p>
        )}
      </div>
    </div>
  );
}
