/**
 * Expression Builder — Visual expression editor for XLSForm logic
 *
 * Features:
 *   - **Guided Quick Start wizard**: pick a template → pick field(s) → fill value → done
 *   - Click to insert field references from the survey
 *   - Operator palette (=, !=, >, <, and, or, etc.)
 *   - Common function snippets (selected, count-selected, concat, etc.)
 *   - Live expression preview with syntax highlighting
 *   - Raw edit mode for power users
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { SurveyRow } from '../../types/survey';
import { parseJavaScriptFunctions } from '../../utils/scriptParser';
import { ScriptFunctionPicker } from '../scripts/ScriptFunctionPicker';

interface Props {
  value: string;
  onChange: (val: string) => void;
  currentRowId: string;
  label: string;
  placeholder?: string;
  mode?: 'relevant' | 'calculation' | 'constraint' | 'general';
  /** If true, opens directly in expanded modal view */
  initialExpanded?: boolean;
  /** Called when the expanded modal is closed (useful when rendering standalone) */
  onCloseExpanded?: () => void;
}

// ============================================================
// Operator and Function definitions
// ============================================================

interface OperatorItem {
  label: string;
  insert: string;
  description: string;
}

const COMPARISON_OPS: OperatorItem[] = [
  { label: '=', insert: ' = ', description: 'Equals' },
  { label: '!=', insert: ' != ', description: 'Not equals' },
  { label: '>', insert: ' > ', description: 'Greater than' },
  { label: '<', insert: ' < ', description: 'Less than' },
  { label: '>=', insert: ' >= ', description: 'Greater or equal' },
  { label: '<=', insert: ' <= ', description: 'Less or equal' },
];

const LOGICAL_OPS: OperatorItem[] = [
  { label: 'and', insert: ' and ', description: 'Both conditions true' },
  { label: 'or', insert: ' or ', description: 'Either condition true' },
  { label: 'not()', insert: 'not()', description: 'Negate a condition' },
];

const COMMON_VALUES: OperatorItem[] = [
  { label: "'yes'", insert: "'yes'", description: 'Text value yes' },
  { label: "'no'", insert: "'no'", description: 'Text value no' },
  { label: "''", insert: "''", description: 'Empty text' },
  { label: '0', insert: '0', description: 'Zero' },
  { label: '1', insert: '1', description: 'One' },
  { label: 'null', insert: "'' ", description: 'Check for empty/null' },
];

// ============================================================
// Function Slot System — guided function insertion
// ============================================================

type SlotType = 'field' | 'value' | 'number' | 'text' | 'format' | 'csv_file' | 'csv_column';

interface FunctionSlot {
  type: SlotType;
  label: string;
  placeholder?: string;
  /** For field slots: only show fields matching this filter */
  fieldFilter?: 'select' | 'numeric' | 'text' | 'date' | 'any';
  /** For value slots: derive choices from a previous field slot by index */
  choicesFromField?: number;
  /** For csv_column slots: which previous slot index has the CSV filename */
  csvFileSlotIndex?: number;
  /** Preset options for text/format slots */
  options?: { label: string; value: string }[];
  /** Default value if user skips or for optional params */
  defaultValue?: string;
}

interface FunctionTemplate {
  label: string;
  /** Fallback template for raw insert (used when no slots or user skips wizard) */
  template: string;
  description: string;
  category: 'selection' | 'text' | 'math' | 'date' | 'logic';
  /** Guided slots — if present, clicking the function opens a mini-wizard */
  slots?: FunctionSlot[];
  /** Build expression from slot values. If omitted, uses template fallback. */
  build?: (values: string[]) => string;
}

/** Field type filters for slot fieldFilter */
const FIELD_FILTERS: Record<string, (r: SurveyRow) => boolean> = {
  select: (r) => ['select_one', 'select_multiple', 'rank'].includes(r.type),
  numeric: (r) => ['integer', 'decimal', 'range', 'calculate'].includes(r.type),
  text: (r) => ['text', 'email', 'barcode', 'calculate', 'hidden'].includes(r.type),
  date: (r) => ['date', 'time', 'datetime'].includes(r.type),
  any: () => true,
};

const FUNCTIONS: FunctionTemplate[] = [
  // ---- Selection ----
  {
    label: 'selected',
    template: "selected(${field}, 'value')",
    description: 'Check if value is selected in multi-select',
    category: 'selection',
    slots: [
      { type: 'field', label: 'Which select field?', fieldFilter: 'select' },
      { type: 'value', label: 'Which option?', choicesFromField: 0, placeholder: 'option_1' },
    ],
    build: (v) => `selected(\${${v[0]}}, '${v[1]}')`,
  },
  {
    label: 'count-selected',
    template: 'count-selected(${field})',
    description: 'Count how many options are selected',
    category: 'selection',
    slots: [
      { type: 'field', label: 'Which select field?', fieldFilter: 'select' },
    ],
    build: (v) => `count-selected(\${${v[0]}})`,
  },
  {
    label: 'selected-at',
    template: 'selected-at(${field}, 0)',
    description: 'Get the nth selected value',
    category: 'selection',
    slots: [
      { type: 'field', label: 'Which select field?', fieldFilter: 'select' },
      { type: 'number', label: 'Which index? (0 = first)', placeholder: '0', defaultValue: '0' },
    ],
    build: (v) => `selected-at(\${${v[0]}}, ${v[1]})`,
  },
  // ---- Text ----
  {
    label: 'concat',
    template: "concat(${field}, ' ', ${field})",
    description: 'Join text values together',
    category: 'text',
    slots: [
      { type: 'field', label: 'First field', fieldFilter: 'any' },
      { type: 'text', label: 'Separator', placeholder: ' ', defaultValue: ' ' },
      { type: 'field', label: 'Second field', fieldFilter: 'any' },
    ],
    build: (v) => `concat(\${${v[0]}}, '${v[1]}', \${${v[2]}})`,
  },
  {
    label: 'string-length',
    template: 'string-length(${field})',
    description: 'Length of text value',
    category: 'text',
    slots: [
      { type: 'field', label: 'Which field?', fieldFilter: 'any' },
    ],
    build: (v) => `string-length(\${${v[0]}})`,
  },
  {
    label: 'substr',
    template: 'substr(${field}, 0, 5)',
    description: 'Extract part of text',
    category: 'text',
    slots: [
      { type: 'field', label: 'Which field?', fieldFilter: 'any' },
      { type: 'number', label: 'Start position', placeholder: '0', defaultValue: '0' },
      { type: 'number', label: 'Length', placeholder: '5', defaultValue: '5' },
    ],
    build: (v) => `substr(\${${v[0]}}, ${v[1]}, ${v[2]})`,
  },
  {
    label: 'contains',
    template: "contains(${field}, 'text')",
    description: 'Check if text contains a substring',
    category: 'text',
    slots: [
      { type: 'field', label: 'Which field?', fieldFilter: 'any' },
      { type: 'text', label: 'Text to search for', placeholder: 'search text' },
    ],
    build: (v) => `contains(\${${v[0]}}, '${v[1]}')`,
  },
  {
    label: 'regex',
    template: "regex(${field}, '[0-9]+')",
    description: 'Test text against a pattern',
    category: 'text',
    slots: [
      { type: 'field', label: 'Which field?', fieldFilter: 'any' },
      { type: 'text', label: 'Regex pattern', placeholder: '[0-9]+' },
    ],
    build: (v) => `regex(\${${v[0]}}, '${v[1]}')`,
  },
  // ---- Math ----
  {
    label: 'sum',
    template: 'sum(${field})',
    description: 'Sum of repeat values',
    category: 'math',
    slots: [{ type: 'field', label: 'Which field?', fieldFilter: 'numeric' }],
    build: (v) => `sum(\${${v[0]}})`,
  },
  {
    label: 'count',
    template: 'count(${field})',
    description: 'Count of repeat instances',
    category: 'math',
    slots: [{ type: 'field', label: 'Which field?', fieldFilter: 'any' }],
    build: (v) => `count(\${${v[0]}})`,
  },
  {
    label: 'min',
    template: 'min(${field})',
    description: 'Minimum value',
    category: 'math',
    slots: [{ type: 'field', label: 'Which field?', fieldFilter: 'numeric' }],
    build: (v) => `min(\${${v[0]}})`,
  },
  {
    label: 'max',
    template: 'max(${field})',
    description: 'Maximum value',
    category: 'math',
    slots: [{ type: 'field', label: 'Which field?', fieldFilter: 'numeric' }],
    build: (v) => `max(\${${v[0]}})`,
  },
  {
    label: 'round',
    template: 'round(${field}, 2)',
    description: 'Round to decimal places',
    category: 'math',
    slots: [
      { type: 'field', label: 'Which numeric field?', fieldFilter: 'numeric' },
      { type: 'number', label: 'Decimal places', placeholder: '2', defaultValue: '2' },
    ],
    build: (v) => `round(\${${v[0]}}, ${v[1]})`,
  },
  {
    label: 'int',
    template: 'int(${field})',
    description: 'Convert to integer',
    category: 'math',
    slots: [{ type: 'field', label: 'Which field?', fieldFilter: 'numeric' }],
    build: (v) => `int(\${${v[0]}})`,
  },
  // ---- Date (no slots for today/now) ----
  { label: 'today', template: 'today()', description: "Today's date", category: 'date' },
  { label: 'now', template: 'now()', description: 'Current date and time', category: 'date' },
  {
    label: 'format-date',
    template: "format-date(${field}, '%Y-%m-%d')",
    description: 'Format a date value',
    category: 'date',
    slots: [
      { type: 'field', label: 'Which date field?', fieldFilter: 'date' },
      {
        type: 'format', label: 'Date format',
        options: [
          { label: 'YYYY-MM-DD', value: '%Y-%m-%d' },
          { label: 'MM/DD/YYYY', value: '%m/%d/%Y' },
          { label: 'DD/MM/YYYY', value: '%d/%m/%Y' },
          { label: 'Month D, YYYY', value: '%b %e, %Y' },
          { label: 'YYYY', value: '%Y' },
        ],
        defaultValue: '%Y-%m-%d',
      },
    ],
    build: (v) => `format-date(\${${v[0]}}, '${v[1]}')`,
  },
  // ---- Logic ----
  {
    label: 'if',
    template: "if(condition, 'yes_value', 'no_value')",
    description: 'Conditional value',
    category: 'logic',
    slots: [
      { type: 'field', label: 'Which field to check?', fieldFilter: 'any' },
      { type: 'value', label: 'Equals what value?', choicesFromField: 0, placeholder: 'yes' },
      { type: 'text', label: 'Result when true', placeholder: 'Result A' },
      { type: 'text', label: 'Result when false', placeholder: 'Result B' },
    ],
    build: (v) => `if(\${${v[0]}} = '${v[1]}', '${v[2]}', '${v[3]}')`,
  },
  {
    label: 'coalesce',
    template: 'coalesce(${field}, ${field})',
    description: 'First non-empty value',
    category: 'logic',
    slots: [
      { type: 'field', label: 'Primary field', fieldFilter: 'any' },
      { type: 'field', label: 'Fallback field', fieldFilter: 'any' },
    ],
    build: (v) => `coalesce(\${${v[0]}}, \${${v[1]}})`,
  },
  {
    label: 'once',
    template: 'once(${field})',
    description: 'Calculate only on first entry',
    category: 'logic',
    slots: [{ type: 'field', label: 'Which field?', fieldFilter: 'any' }],
    build: (v) => `once(\${${v[0]}})`,
  },
  {
    label: 'pulldata',
    template: "pulldata('filename', 'return_col', 'lookup_col', ${field})",
    description: 'Look up value from CSV',
    category: 'logic',
    slots: [
      { type: 'csv_file', label: 'Which CSV file?', placeholder: 'my_data' },
      { type: 'csv_column', label: 'Return which column?', csvFileSlotIndex: 0, placeholder: 'result_column' },
      { type: 'csv_column', label: 'Lookup by which column?', csvFileSlotIndex: 0, placeholder: 'key_column' },
      { type: 'field', label: 'Lookup value field', fieldFilter: 'any' },
    ],
    build: (v) => `pulldata('${v[0]}', '${v[1]}', '${v[2]}', \${${v[3]}})`,
  },
];

// ============================================================
// Function Wizard State
// ============================================================

interface FuncWizardState {
  func: FunctionTemplate;
  /** Current slot index */
  slotIndex: number;
  /** Collected values for each slot */
  values: string[];
  /** Search term for field picker */
  fieldSearch: string;
}

// ============================================================
// Quick Start Wizard Templates
// ============================================================

interface WizardTemplate {
  label: string;
  description: string;
  /** How many field slots to fill (0 = no fields needed, e.g. constraint self-ref) */
  fieldCount: number;
  /** Labels for each field slot */
  fieldLabels?: string[];
  /** Does it need a user-provided value? */
  needsValue?: boolean;
  /** Label for the value input */
  valueLabel?: string;
  /** Placeholder for value input */
  valuePlaceholder?: string;
  /** Value type hint */
  valueType?: 'text' | 'number' | 'choice';
  /** Preset value (skip the value step) */
  presetValue?: string;
  /** Build the final expression from collected parts */
  build: (fields: string[], value: string) => string;
}

function getWizardTemplates(mode: string): WizardTemplate[] {
  if (mode === 'relevant') {
    return [
      {
        label: 'Show when equals...',
        description: 'Show this question when another field equals a specific value',
        fieldCount: 1,
        fieldLabels: ['Which field should control visibility?'],
        needsValue: true,
        valueLabel: 'Equal to what value?',
        valuePlaceholder: 'yes',
        valueType: 'text',
        build: (fields, value) => `\${${fields[0]}} = '${value}'`,
      },
      {
        label: 'Show when not empty',
        description: 'Show this question when another field has any value',
        fieldCount: 1,
        fieldLabels: ['Which field must have a value?'],
        needsValue: false,
        build: (fields) => `\${${fields[0]}} != ''`,
      },
      {
        label: 'Show when yes',
        description: "Show when another field is answered 'yes'",
        fieldCount: 1,
        fieldLabels: ['Which yes/no field?'],
        needsValue: false,
        presetValue: 'yes',
        build: (fields) => `\${${fields[0]}} = 'yes'`,
      },
      {
        label: 'Show when selected...',
        description: 'Show when a specific option is selected in a multi-select',
        fieldCount: 1,
        fieldLabels: ['Which select field?'],
        needsValue: true,
        valueLabel: 'Which option value?',
        valuePlaceholder: 'option_1',
        valueType: 'choice',
        build: (fields, value) => `selected(\${${fields[0]}}, '${value}')`,
      },
      {
        label: 'Show when greater than...',
        description: 'Show when a numeric field exceeds a threshold',
        fieldCount: 1,
        fieldLabels: ['Which numeric field?'],
        needsValue: true,
        valueLabel: 'Greater than what number?',
        valuePlaceholder: '0',
        valueType: 'number',
        build: (fields, value) => `\${${fields[0]}} > ${value}`,
      },
      {
        label: 'Show when between...',
        description: 'Show when a field value falls within a range',
        fieldCount: 1,
        fieldLabels: ['Which field to check?'],
        needsValue: true,
        valueLabel: 'Range (e.g. 1,10)',
        valuePlaceholder: '1,10',
        valueType: 'text',
        build: (fields, value) => {
          const parts = value.split(',').map(s => s.trim());
          if (parts.length === 2) return `\${${fields[0]}} >= ${parts[0]} and \${${fields[0]}} <= ${parts[1]}`;
          return `\${${fields[0]}} >= ${value}`;
        },
      },
    ];
  }

  if (mode === 'calculation') {
    return [
      {
        label: 'Add two fields',
        description: 'Sum two field values together',
        fieldCount: 2,
        fieldLabels: ['First field', 'Second field'],
        needsValue: false,
        build: (fields) => `\${${fields[0]}} + \${${fields[1]}}`,
      },
      {
        label: 'Concatenate text',
        description: 'Join two text fields with a separator',
        fieldCount: 2,
        fieldLabels: ['First field', 'Second field'],
        needsValue: true,
        valueLabel: 'Separator (e.g. space, comma)',
        valuePlaceholder: ' ',
        valueType: 'text',
        build: (fields, value) => `concat(\${${fields[0]}}, '${value}', \${${fields[1]}})`,
      },
      {
        label: 'Conditional value',
        description: 'Return different values based on a condition',
        fieldCount: 1,
        fieldLabels: ['Which field to check?'],
        needsValue: true,
        valueLabel: "Value to check for (e.g. 'yes')",
        valuePlaceholder: 'yes',
        valueType: 'text',
        build: (fields, value) => `if(\${${fields[0]}} = '${value}', 'Result A', 'Result B')`,
      },
      {
        label: 'Count selected options',
        description: 'Count how many options are selected in a multi-select',
        fieldCount: 1,
        fieldLabels: ['Which select field?'],
        needsValue: false,
        build: (fields) => `count-selected(\${${fields[0]}})`,
      },
      {
        label: "Today's date",
        description: 'Insert the current date',
        fieldCount: 0,
        needsValue: false,
        build: () => 'today()',
      },
    ];
  }

  if (mode === 'constraint') {
    return [
      {
        label: 'Must be positive',
        description: 'Value must be greater than zero',
        fieldCount: 0,
        needsValue: false,
        build: () => '. > 0',
      },
      {
        label: 'Range...',
        description: 'Value must be between two numbers',
        fieldCount: 0,
        needsValue: true,
        valueLabel: 'Range (e.g. 0,100)',
        valuePlaceholder: '0,100',
        valueType: 'text',
        build: (_, value) => {
          const parts = value.split(',').map(s => s.trim());
          if (parts.length === 2) return `. >= ${parts[0]} and . <= ${parts[1]}`;
          return `. > ${value}`;
        },
      },
      {
        label: 'Not empty',
        description: 'Field cannot be left blank',
        fieldCount: 0,
        needsValue: false,
        build: () => ". != ''",
      },
      {
        label: 'Min length...',
        description: 'Text must be at least N characters',
        fieldCount: 0,
        needsValue: true,
        valueLabel: 'Minimum characters',
        valuePlaceholder: '3',
        valueType: 'number',
        build: (_, value) => `string-length(.) >= ${value}`,
      },
      {
        label: 'Regex pattern...',
        description: 'Match a custom pattern',
        fieldCount: 0,
        needsValue: true,
        valueLabel: 'Regex pattern',
        valuePlaceholder: '[A-Z][0-9]{3}',
        valueType: 'text',
        build: (_, value) => `regex(., '${value}')`,
      },
    ];
  }

  return [];
}

// ============================================================
// Wizard State
// ============================================================

interface WizardState {
  template: WizardTemplate;
  /** Which step: 'field_0', 'field_1', 'value', 'done' */
  step: string;
  fields: string[];
  value: string;
  fieldSearch: string;
}

// ============================================================
// Expression Builder Component
// ============================================================

export function ExpressionBuilder({ value, onChange, currentRowId, label, placeholder, mode = 'general', initialExpanded, onCloseExpanded }: Props) {
  const { form } = useSurveyStore();
  const [isOpen, setIsOpen] = useState(!!initialExpanded);
  const [isExpanded, setIsExpanded] = useState(!!initialExpanded);
  const [activeTab, setActiveTab] = useState<'fields' | 'operators' | 'functions'>('fields');
  const [fieldSearch, setFieldSearch] = useState('');
  const [funcCategory, setFuncCategory] = useState<string>('all');
  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [funcWizard, setFuncWizard] = useState<FuncWizardState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const expandedTextareaRef = useRef<HTMLTextAreaElement>(null);
  const builderRef = useRef<HTMLDivElement>(null);
  const valueInputRef = useRef<HTMLInputElement>(null);
  const funcValueInputRef = useRef<HTMLInputElement>(null);

  const availableFields = form.survey.filter(
    (r) =>
      r.id !== currentRowId &&
      !['end_group', 'end_repeat'].includes(r.type) &&
      r.name
  );

  const filteredFields = fieldSearch
    ? availableFields.filter(
        (r) =>
          r.name.toLowerCase().includes(fieldSearch.toLowerCase()) ||
          r.label.toLowerCase().includes(fieldSearch.toLowerCase())
      )
    : availableFields;

  // Wizard-filtered fields (same logic but separate search)
  const wizardFilteredFields = wizard?.fieldSearch
    ? availableFields.filter(
        (r) =>
          r.name.toLowerCase().includes(wizard.fieldSearch.toLowerCase()) ||
          r.label.toLowerCase().includes(wizard.fieldSearch.toLowerCase())
      )
    : availableFields;

  // Function wizard: filtered fields for current slot
  const funcWizardFields = React.useMemo(() => {
    if (!funcWizard) return availableFields;
    const slot = funcWizard.func.slots?.[funcWizard.slotIndex];
    if (!slot || slot.type !== 'field') return availableFields;
    const filterFn = FIELD_FILTERS[slot.fieldFilter || 'any'];
    const filtered = filterFn ? availableFields.filter(filterFn) : availableFields;
    if (!funcWizard.fieldSearch) return filtered;
    const search = funcWizard.fieldSearch.toLowerCase();
    return filtered.filter(
      (r) => r.name.toLowerCase().includes(search) || r.label.toLowerCase().includes(search)
    );
  }, [funcWizard, availableFields]);

  // Function wizard: get choices for a value slot that references a field slot.
  // Handles both standard choice lists AND select_*_from_file questions
  // whose values live in a CSV MediaFile rather than a choiceList.
  const funcWizardChoices = React.useMemo(() => {
    if (!funcWizard) return [];
    const slot = funcWizard.func.slots?.[funcWizard.slotIndex];
    if (!slot || slot.type !== 'value' || slot.choicesFromField === undefined) return [];
    const fieldName = funcWizard.values[slot.choicesFromField];
    if (!fieldName) return [];
    const row = form.survey.find((r) => r.name === fieldName);
    if (!row) return [];

    // 1) Standard choice list (select_one / select_multiple)
    if (row.listName) {
      const list = form.choiceLists.find((cl) => cl.list_name === row.listName);
      if (list?.choices?.length) return list.choices;
    }

    // 2) select_*_from_file — pull values from uploaded CSV's "name" column
    if (
      ['select_one_from_file', 'select_multiple_from_file'].includes(row.type) &&
      row.fileName
    ) {
      const csvFileName = row.fileName;
      const mediaFiles = form.mediaFiles || [];
      const csv = mediaFiles.find((f) => f.fileName === csvFileName);
      if (csv && csv.sampleData.length > 0) {
        // Survey123 expects a "name" column for the choice value
        // and an optional "label" column for display
        const hasName = csv.columns.includes('name');
        const hasLabel = csv.columns.includes('label');
        if (hasName) {
          return csv.sampleData
            .filter((r) => r['name'])
            .map((r, i) => ({
              id: `csv_${i}`,
              name: r['name'],
              label: hasLabel && r['label'] ? r['label'] : r['name'],
            }));
        }
      }
    }

    return [];
  }, [funcWizard, form.survey, form.choiceLists, form.mediaFiles]);

  // CSV files available for expression builder
  const csvFiles = React.useMemo(() => form.mediaFiles || [], [form.mediaFiles]);

  const relevantFunctions = FUNCTIONS.filter((f) => {
    if (funcCategory !== 'all') return f.category === funcCategory;
    if (mode === 'relevant') return ['selection', 'logic', 'text'].includes(f.category);
    if (mode === 'calculation') return true;
    if (mode === 'constraint') return ['math', 'text', 'logic'].includes(f.category);
    return true;
  });

  const scriptFiles = form.scriptFiles || [];
  const hasScripts = scriptFiles.length > 0;
  const [showJsPicker, setShowJsPicker] = useState(false);

  const funcCategories = [
    { value: 'all', label: 'All' },
    { value: 'selection', label: 'Selection' },
    { value: 'text', label: 'Text' },
    { value: 'math', label: 'Math' },
    { value: 'date', label: 'Date' },
    { value: 'logic', label: 'Logic' },
    ...(hasScripts ? [{ value: 'javascript', label: 'JS' }] : []),
  ];

  const quickTemplates = getWizardTemplates(mode);

  const insertAtCursor = (text: string) => {
    try {
      const textarea = isExpanded ? expandedTextareaRef.current : textareaRef.current;
      if (!textarea) {
        onChange((value || '') + text);
        return;
      }
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      const currentValue = value || '';
      const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        try {
          if (textarea && textarea.isConnected) {
            textarea.focus();
            const cursorPos = start + text.length;
            textarea.setSelectionRange(cursorPos, cursorPos);
          }
        } catch (_) { /* textarea may have been unmounted */ }
      });
    } catch (err) {
      // Fallback: just append the text
      console.error('insertAtCursor error:', err);
      onChange((value || '') + text);
    }
  };

  const insertFieldRef = (fieldName: string) => {
    insertAtCursor('${' + fieldName + '}');
  };

  const insertFunction = (template: string) => {
    insertAtCursor(template);
  };

  /** Start guided function wizard (or raw-insert if no slots) */
  const startFuncWizard = (func: FunctionTemplate) => {
    if (!func.slots || func.slots.length === 0) {
      // No slots — insert template directly (e.g. today(), now())
      insertAtCursor(func.template);
      return;
    }
    setFuncWizard({ func, slotIndex: 0, values: [], fieldSearch: '' });
  };

  /** Advance to next slot or complete */
  const funcWizardNext = (slotValue: string) => {
    if (!funcWizard) return;
    const newValues = [...funcWizard.values, slotValue];
    const nextIndex = funcWizard.slotIndex + 1;
    const totalSlots = funcWizard.func.slots!.length;

    if (nextIndex >= totalSlots) {
      // All slots filled — build and insert
      const expr = funcWizard.func.build
        ? funcWizard.func.build(newValues)
        : funcWizard.func.template;
      insertAtCursor(expr);
      setFuncWizard(null);
    } else {
      setFuncWizard({ ...funcWizard, slotIndex: nextIndex, values: newValues, fieldSearch: '' });
    }
  };

  const funcWizardBack = () => {
    if (!funcWizard) return;
    if (funcWizard.slotIndex === 0) {
      setFuncWizard(null); // Cancel back to function list
    } else {
      setFuncWizard({
        ...funcWizard,
        slotIndex: funcWizard.slotIndex - 1,
        values: funcWizard.values.slice(0, -1),
        fieldSearch: '',
      });
    }
  };

  /** Skip wizard and insert raw template */
  const funcWizardSkip = () => {
    if (!funcWizard) return;
    insertAtCursor(funcWizard.func.template);
    setFuncWizard(null);
  };

  // Focus the value input when entering a text/number/format slot
  useEffect(() => {
    if (!funcWizard) return;
    const slot = funcWizard.func.slots?.[funcWizard.slotIndex];
    if (slot && ['text', 'number', 'format', 'value'].includes(slot.type)) {
      requestAnimationFrame(() => funcValueInputRef.current?.focus());
    }
  }, [funcWizard?.slotIndex]);

  // Close builder when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (builderRef.current && !builderRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setWizard(null);
        setFuncWizard(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Focus value input when wizard reaches value step
  useEffect(() => {
    if (wizard?.step === 'value') {
      requestAnimationFrame(() => valueInputRef.current?.focus());
    }
  }, [wizard?.step]);

  // ---- Wizard Logic ----

  const startWizard = (template: WizardTemplate) => {
    // If no fields needed and no value needed, apply immediately
    if (template.fieldCount === 0 && !template.needsValue) {
      onChange(template.build([], ''));
      return;
    }
    // If no fields needed but value needed, jump to value step
    if (template.fieldCount === 0) {
      setWizard({
        template,
        step: 'value',
        fields: [],
        value: '',
        fieldSearch: '',
      });
      return;
    }
    // Otherwise start at first field
    setWizard({
      template,
      step: 'field_0',
      fields: [],
      value: '',
      fieldSearch: '',
    });
  };

  const wizardPickField = (fieldName: string) => {
    if (!wizard) return;
    const newFields = [...wizard.fields, fieldName];
    const currentFieldIndex = parseInt(wizard.step.split('_')[1]);
    const nextFieldIndex = currentFieldIndex + 1;

    if (nextFieldIndex < wizard.template.fieldCount) {
      // More fields to pick
      setWizard({ ...wizard, fields: newFields, step: `field_${nextFieldIndex}`, fieldSearch: '' });
    } else if (wizard.template.needsValue) {
      // Move to value step
      setWizard({ ...wizard, fields: newFields, step: 'value', fieldSearch: '' });
    } else {
      // Done! Build and apply
      const expr = wizard.template.build(newFields, '');
      onChange(expr);
      setWizard(null);
    }
  };

  const wizardSetValue = (val: string) => {
    if (!wizard) return;
    setWizard({ ...wizard, value: val });
  };

  const wizardApply = () => {
    if (!wizard) return;
    const expr = wizard.template.build(wizard.fields, wizard.value);
    onChange(expr);
    setWizard(null);
  };

  const wizardCancel = () => {
    setWizard(null);
  };

  const wizardBack = () => {
    if (!wizard) return;
    if (wizard.step === 'value') {
      if (wizard.template.fieldCount > 0) {
        const lastIdx = wizard.template.fieldCount - 1;
        setWizard({ ...wizard, step: `field_${lastIdx}`, fields: wizard.fields.slice(0, lastIdx), fieldSearch: '' });
      } else {
        setWizard(null);
      }
    } else if (wizard.step.startsWith('field_')) {
      const idx = parseInt(wizard.step.split('_')[1]);
      if (idx === 0) {
        setWizard(null);
      } else {
        setWizard({ ...wizard, step: `field_${idx - 1}`, fields: wizard.fields.slice(0, idx - 1), fieldSearch: '' });
      }
    }
  };

  // Get choices for a field (for choice-type value input)
  const getChoicesForField = (fieldName: string) => {
    const row = form.survey.find(r => r.name === fieldName);
    if (!row?.listName) return [];
    const list = form.choiceLists.find(cl => cl.list_name === row.listName);
    return list?.choices || [];
  };

  const getTypeColor = (type: string) => {
    if (type.startsWith('select_')) return 'bg-blue-50 text-blue-600 border-blue-200';
    if (['integer', 'decimal', 'range'].includes(type)) return 'bg-amber-50 text-amber-600 border-amber-200';
    if (['text', 'email', 'password'].includes(type)) return 'bg-gray-50 text-gray-600 border-gray-200';
    if (['date', 'time', 'datetime'].includes(type)) return 'bg-green-50 text-green-600 border-green-200';
    if (['begin_group', 'begin_repeat'].includes(type)) return 'bg-purple-50 text-purple-600 border-purple-200';
    if (['calculate', 'hidden'].includes(type)) return 'bg-slate-50 text-slate-600 border-slate-200';
    return 'bg-gray-50 text-gray-500 border-gray-200';
  };

  // Compute wizard progress
  const getWizardProgress = () => {
    if (!wizard) return { current: 0, total: 0 };
    const total = wizard.template.fieldCount + (wizard.template.needsValue ? 1 : 0);
    let current = wizard.fields.length;
    if (wizard.step === 'value') current = wizard.template.fieldCount;
    return { current, total };
  };

  // Get live preview of what the expression will look like
  const getWizardPreview = () => {
    if (!wizard) return '';
    const filledFields = [...wizard.fields];
    // Fill remaining fields with placeholder
    while (filledFields.length < wizard.template.fieldCount) {
      filledFields.push('___');
    }
    return wizard.template.build(filledFields, wizard.value || '___');
  };

  // ---- Field Picker subcomponent (shared by wizard and fields tab) ----

  const renderFieldPicker = (
    fields: SurveyRow[],
    search: string,
    onSearchChange: (v: string) => void,
    onPick: (name: string) => void,
    headerLabel?: string
  ) => (
    <div style={{ padding: 8 }}>
      {headerLabel && (
        <p className="text-[#007a62]" style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, padding: '0 4px' }}>
          {headerLabel}
        </p>
      )}
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search fields..."
        style={{ padding: '6px 10px', fontSize: 12, marginBottom: 6 }}
        className="w-full border border-gray-200 rounded-md bg-gray-50 focus:border-[#00856a] transition-fast placeholder-gray-300"
      />
      {fields.length === 0 ? (
        <p className="text-gray-400 text-center" style={{ padding: '16px 0', fontSize: 12 }}>
          {search ? 'No matching fields' : 'No fields in the form yet'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {fields.map((field) => (
            <button
              key={field.id}
              onClick={() => onPick(field.name)}
              className="flex items-center text-left rounded-md hover:bg-[#f0faf7] transition-fast group"
              style={{ padding: '6px 8px', gap: 8 }}
            >
              <span
                className={`inline-block rounded border ${getTypeColor(field.type)} shrink-0`}
                style={{ padding: '1px 6px', fontSize: 10, fontWeight: 600 }}
              >
                {field.type.replace(/_/g, ' ')}
              </span>
              <span className="font-mono text-gray-700 truncate" style={{ fontSize: 12 }}>
                {field.name}
              </span>
              {field.label && field.label !== field.name && (
                <span className="text-gray-400 truncate" style={{ fontSize: 11 }}>
                  {field.label}
                </span>
              )}
              <span className="ml-auto text-[#007a62] opacity-0 group-hover:opacity-100 transition-fast shrink-0"
                style={{ fontSize: 10, fontWeight: 600 }}>
                + Pick
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div ref={builderRef} style={initialExpanded ? { display: 'contents' } : { marginBottom: 14 }}>
      {/* Label row with builder toggle */}
      <div className="flex items-center justify-between" style={{ marginBottom: 6, display: initialExpanded ? 'none' : undefined }}>
        <label className="block text-gray-500" style={{ fontSize: 12, fontWeight: 500 }}>
          {label}
        </label>
        <div className="flex items-center" style={{ gap: 4 }}>
          <button
            onClick={() => { setIsExpanded(true); setIsOpen(true); }}
            className="flex items-center gap-1 rounded text-gray-400 hover:text-[#007a62] hover:bg-[#f0faf7] transition-fast"
            style={{ padding: '2px 6px', fontSize: 11, fontWeight: 600 }}
            title="Open full-screen expression editor"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
          <button
            onClick={() => { setIsOpen(!isOpen); if (isOpen) { setWizard(null); setFuncWizard(null); setIsExpanded(false); } }}
            className={`flex items-center rounded transition-fast ${
              isOpen
                ? 'text-[#007a62] bg-[#f0faf7]'
                : 'text-gray-400 hover:text-[#007a62] hover:bg-[#f0faf7]'
            }`}
            style={{ padding: '2px 8px', gap: 4, fontSize: 11, fontWeight: 600 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v18M3 12h18M9 6l-3 3 3 3M15 12l3 3-3 3" />
            </svg>
            {isOpen ? 'Close Builder' : 'Expression Builder'}
          </button>
        </div>
      </div>

      {/* Expression textarea */}
      {!initialExpanded && (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={value.length > 60 ? 3 : 2}
          style={{ padding: '8px 12px', fontSize: 12, lineHeight: 1.6 }}
          className="w-full font-mono border border-gray-200 rounded-lg bg-white
            focus:border-[#00856a] transition-fast placeholder-gray-300 resize-y"
        />
      )}

      {/* Expression tokens preview */}
      {value && !isOpen && !initialExpanded && (
        <div className="flex flex-wrap items-center" style={{ gap: 4, marginTop: 6 }}>
          {tokenizeExpression(value).map((token, i) => (
            <span
              key={i}
              className={`inline-block rounded ${
                token.type === 'field'
                  ? 'bg-[#f0faf7] text-[#007a62] border border-[#007a62]/20'
                  : token.type === 'operator'
                  ? 'bg-orange-50 text-orange-600'
                  : token.type === 'function'
                  ? 'bg-blue-50 text-blue-600'
                  : token.type === 'string'
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-gray-600'
              }`}
              style={{ padding: '1px 5px', fontSize: 11, fontFamily: 'monospace' }}
            >
              {token.text}
            </span>
          ))}
        </div>
      )}

      {/* Inline validation */}
      {value && !isOpen && !initialExpanded && (
        <ExpressionValidator value={value} fields={availableFields} />
      )}

      {/* Builder Panel */}
      {isOpen && !initialExpanded && (
        <div className="border border-[#00856a]/30 rounded-lg bg-white shadow-sm overflow-hidden"
          style={{ marginTop: 8 }}>

          {/* ===================== WIZARD MODE ===================== */}
          {wizard ? (
            <div>
              {/* Wizard Header */}
              <div className="bg-[#f0faf7] border-b border-[#00856a]/10"
                style={{ padding: '10px 12px' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span className="text-[#007a62]" style={{ fontSize: 12, fontWeight: 700 }}>
                    {wizard.template.label}
                  </span>
                  <button onClick={wizardCancel}
                    className="text-gray-400 hover:text-gray-600 transition-fast"
                    style={{ padding: 2 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-500" style={{ fontSize: 11, lineHeight: 1.3 }}>
                  {wizard.template.description}
                </p>

                {/* Progress dots */}
                {(() => {
                  const { current, total } = getWizardProgress();
                  if (total <= 1) return null;
                  return (
                    <div className="flex items-center" style={{ gap: 4, marginTop: 8 }}>
                      {Array.from({ length: total }, (_, i) => (
                        <div key={i} className="flex items-center" style={{ gap: 4 }}>
                          <div
                            className={`rounded-full transition-fast ${
                              i < current
                                ? 'bg-[#007a62]'
                                : i === current
                                ? 'bg-[#007a62] ring-2 ring-[#007a62]/20'
                                : 'bg-gray-200'
                            }`}
                            style={{ width: i === current ? 8 : 6, height: i === current ? 8 : 6 }}
                          />
                          {i < total - 1 && (
                            <div className={`${i < current ? 'bg-[#007a62]' : 'bg-gray-200'}`}
                              style={{ width: 16, height: 2, borderRadius: 1 }} />
                          )}
                        </div>
                      ))}
                      <span className="text-gray-400 ml-2" style={{ fontSize: 10 }}>
                        Step {current + 1} of {total}
                      </span>
                    </div>
                  );
                })()}

                {/* Live preview */}
                <div className="bg-white rounded border border-gray-200 font-mono"
                  style={{ padding: '6px 10px', marginTop: 8, fontSize: 11, color: '#555' }}>
                  <span className="text-gray-400" style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Preview:{' '}
                  </span>
                  {getWizardPreview()}
                </div>
              </div>

              {/* Wizard step content */}
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>

                {/* Field picker step */}
                {wizard.step.startsWith('field_') && (
                  <>
                    {/* Show already-picked fields */}
                    {wizard.fields.length > 0 && (
                      <div className="bg-gray-50 border-b border-gray-100"
                        style={{ padding: '8px 12px' }}>
                        {wizard.fields.map((f, i) => (
                          <div key={i} className="flex items-center" style={{ gap: 6, marginBottom: 2 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#007a62" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="text-gray-500" style={{ fontSize: 11 }}>
                              {wizard.template.fieldLabels?.[i] || `Field ${i + 1}`}:
                            </span>
                            <span className="font-mono text-[#007a62]" style={{ fontSize: 11, fontWeight: 600 }}>
                              {'${' + f + '}'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {renderFieldPicker(
                      wizardFilteredFields,
                      wizard.fieldSearch,
                      (v) => setWizard({ ...wizard, fieldSearch: v }),
                      wizardPickField,
                      wizard.template.fieldLabels?.[parseInt(wizard.step.split('_')[1])] || 'Choose a field'
                    )}
                  </>
                )}

                {/* Value input step */}
                {wizard.step === 'value' && (
                  <div style={{ padding: 12 }}>
                    {/* Show picked fields */}
                    {wizard.fields.length > 0 && (
                      <div className="bg-gray-50 rounded-md border border-gray-100"
                        style={{ padding: '8px 12px', marginBottom: 12 }}>
                        {wizard.fields.map((f, i) => (
                          <div key={i} className="flex items-center" style={{ gap: 6, marginBottom: 2 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#007a62" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="text-gray-500" style={{ fontSize: 11 }}>
                              {wizard.template.fieldLabels?.[i] || `Field ${i + 1}`}:
                            </span>
                            <span className="font-mono text-[#007a62]" style={{ fontSize: 11, fontWeight: 600 }}>
                              {'${' + f + '}'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-[#007a62]" style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                      {wizard.template.valueLabel || 'Enter a value'}
                    </p>

                    {/* If the template value type is 'choice' and we have a select field, show choice buttons */}
                    {wizard.template.valueType === 'choice' && wizard.fields.length > 0 && (() => {
                      const choices = getChoicesForField(wizard.fields[wizard.fields.length - 1]);
                      if (choices.length > 0) {
                        return (
                          <div style={{ marginBottom: 8 }}>
                            <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Available Choices
                            </p>
                            <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 8 }}>
                              {choices.map((c) => (
                                <button
                                  key={c.name}
                                  onClick={() => {
                                    setWizard({ ...wizard, value: c.name });
                                  }}
                                  className={`border rounded-md transition-fast ${
                                    wizard.value === c.name
                                      ? 'bg-[#f0faf7] border-[#007a62] text-[#007a62]'
                                      : 'bg-white border-gray-200 text-gray-600 hover:border-[#007a62] hover:bg-[#f0faf7]'
                                  }`}
                                  style={{ padding: '4px 10px', fontSize: 11 }}
                                >
                                  <span className="font-mono" style={{ fontWeight: 600 }}>{c.name}</span>
                                  {c.label !== c.name && (
                                    <span className="text-gray-400 ml-1">{c.label}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <input
                      ref={valueInputRef}
                      type={wizard.template.valueType === 'number' ? 'number' : 'text'}
                      value={wizard.value}
                      onChange={(e) => wizardSetValue(e.target.value)}
                      placeholder={wizard.template.valuePlaceholder}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && wizard.value) {
                          e.preventDefault();
                          wizardApply();
                        }
                      }}
                      style={{ padding: '8px 12px', fontSize: 13, marginBottom: 10 }}
                      className="w-full border border-gray-200 rounded-lg bg-white
                        focus:border-[#00856a] transition-fast placeholder-gray-300 font-mono"
                    />

                    <div className="flex items-center justify-between">
                      <button
                        onClick={wizardBack}
                        className="text-gray-400 hover:text-gray-600 transition-fast"
                        style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500 }}
                      >
                        Back
                      </button>
                      <button
                        onClick={wizardApply}
                        disabled={!wizard.value}
                        className="bg-[#007a62] text-white rounded-lg hover:bg-[#006652] transition-fast
                          disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                        style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600 }}
                      >
                        Apply Expression
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ===================== NORMAL MODE ===================== */
            <>
              {/* Quick Templates */}
              {quickTemplates.length > 0 && (
                <div className="bg-[#fafafa] border-b border-gray-100"
                  style={{ padding: '10px 12px' }}>
                  <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Quick Start — Guided
                  </p>
                  <div className="flex flex-wrap" style={{ gap: 4 }}>
                    {quickTemplates.map((qt, i) => (
                      <button
                        key={i}
                        onClick={() => startWizard(qt)}
                        className="text-gray-500 bg-white border border-gray-200 rounded-md hover:border-[#007a62] hover:text-[#007a62] hover:bg-[#f0faf7] transition-fast flex items-center"
                        style={{ padding: '4px 10px', gap: 4, fontSize: 11 }}
                      >
                        {qt.label}
                        {(qt.fieldCount > 0 || qt.needsValue) && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Bar */}
              <div className="flex border-b border-gray-100 bg-[#fafafa]"
                style={{ padding: '0 4px' }}>
                {(['fields', 'operators', 'functions'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); if (tab !== 'functions') setFuncWizard(null); }}
                    className={`transition-fast relative ${
                      activeTab === tab
                        ? 'text-[#007a62] bg-white border-b-2 border-[#007a62]'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}
                  >
                    {tab === 'fields' ? `Fields (${availableFields.length})` : tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {activeTab === 'fields' && renderFieldPicker(
                  filteredFields,
                  fieldSearch,
                  setFieldSearch,
                  insertFieldRef
                )}

                {activeTab === 'operators' && (
                  <div style={{ padding: 12 }}>
                    <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Comparison
                    </p>
                    <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 12 }}>
                      {COMPARISON_OPS.map((op) => (
                        <button key={op.label} onClick={() => insertAtCursor(op.insert)}
                          className="font-mono bg-white border border-gray-200 rounded-md hover:border-[#007a62] hover:bg-[#f0faf7] transition-fast text-gray-700 hover:text-[#007a62]"
                          style={{ padding: '5px 12px', fontSize: 13, fontWeight: 600, minWidth: 36, textAlign: 'center' }}
                          title={op.description}>{op.label}</button>
                      ))}
                    </div>

                    <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Logical
                    </p>
                    <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 12 }}>
                      {LOGICAL_OPS.map((op) => (
                        <button key={op.label} onClick={() => insertAtCursor(op.insert)}
                          className="font-mono bg-white border border-gray-200 rounded-md hover:border-[#007a62] hover:bg-[#f0faf7] transition-fast text-gray-700 hover:text-[#007a62]"
                          style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600 }}
                          title={op.description}>{op.label}</button>
                      ))}
                    </div>

                    <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Arithmetic
                    </p>
                    <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 12 }}>
                      {[
                        { label: '+', insert: ' + ', description: 'Add' },
                        { label: '-', insert: ' - ', description: 'Subtract' },
                        { label: '*', insert: ' * ', description: 'Multiply' },
                        { label: 'div', insert: ' div ', description: 'Divide' },
                        { label: 'mod', insert: ' mod ', description: 'Remainder' },
                        { label: '( )', insert: '()', description: 'Parentheses' },
                      ].map((op) => (
                        <button key={op.label} onClick={() => insertAtCursor(op.insert)}
                          className="font-mono bg-white border border-gray-200 rounded-md hover:border-[#007a62] hover:bg-[#f0faf7] transition-fast text-gray-700 hover:text-[#007a62]"
                          style={{ padding: '5px 12px', fontSize: 13, fontWeight: 600, minWidth: 36, textAlign: 'center' }}
                          title={op.description}>{op.label}</button>
                      ))}
                    </div>

                    <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Common Values
                    </p>
                    <div className="flex flex-wrap" style={{ gap: 4 }}>
                      {COMMON_VALUES.map((v) => (
                        <button key={v.label} onClick={() => insertAtCursor(v.insert)}
                          className="font-mono bg-white border border-gray-200 rounded-md hover:border-[#007a62] hover:bg-[#f0faf7] transition-fast text-gray-700 hover:text-[#007a62]"
                          style={{ padding: '5px 10px', fontSize: 12, fontWeight: 500 }}
                          title={v.description}>{v.label}</button>
                      ))}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-md" style={{ padding: '8px 10px', marginTop: 12 }}>
                      <p className="text-blue-600" style={{ fontSize: 11, lineHeight: 1.4 }}>
                        <strong>Tip:</strong> Use <code className="bg-blue-100 rounded px-1">.</code> (a dot) to reference the current field's own value. Common in constraints like <code className="bg-blue-100 rounded px-1">. &gt; 0</code>
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'functions' && (
                  <div style={{ padding: 8 }}>
                    {funcWizard ? (
                      <FuncWizardPanel
                        funcWizard={funcWizard}
                        funcWizardFields={funcWizardFields}
                        funcWizardChoices={funcWizardChoices}
                        csvFiles={csvFiles}
                        onNext={funcWizardNext}
                        onBack={funcWizardBack}
                        onSkip={funcWizardSkip}
                        onSearchChange={(v) => setFuncWizard({ ...funcWizard, fieldSearch: v })}
                        valueInputRef={funcValueInputRef}
                        getTypeColor={getTypeColor}
                      />
                    ) : funcCategory === 'javascript' ? (
                      /* JavaScript functions from script files */
                      <>
                        <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 8, padding: '0 4px' }}>
                          {funcCategories.map((cat) => (
                            <button key={cat.value} onClick={() => setFuncCategory(cat.value)}
                              className={`rounded-full transition-fast ${
                                funcCategory === cat.value
                                  ? cat.value === 'javascript' ? 'bg-amber-500 text-white' : 'bg-[#007a62] text-white'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                              style={{ padding: '3px 10px', fontSize: 11, fontWeight: 500 }}>{cat.label}</button>
                          ))}
                        </div>
                        <ScriptFunctionPicker
                          onInsert={(expr) => { insertAtCursor(expr); setShowJsPicker(false); }}
                          onClose={() => setFuncCategory('all')}
                          currentRowId={currentRowId}
                        />
                      </>
                    ) : (
                      <>
                        <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 8, padding: '0 4px' }}>
                          {funcCategories.map((cat) => (
                            <button key={cat.value} onClick={() => setFuncCategory(cat.value)}
                              className={`rounded-full transition-fast ${
                                funcCategory === cat.value
                                  ? 'bg-[#007a62] text-white'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                              style={{ padding: '3px 10px', fontSize: 11, fontWeight: 500 }}>{cat.label}</button>
                          ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {relevantFunctions.map((fn) => (
                            <button key={fn.label} onClick={() => startFuncWizard(fn)}
                              className="flex flex-col text-left rounded-md hover:bg-[#f0faf7] transition-fast group"
                              style={{ padding: '8px 10px' }}>
                              <div className="flex items-center" style={{ gap: 6 }}>
                                <span className="font-mono text-[#007a62]" style={{ fontSize: 12, fontWeight: 600 }}>
                                  {fn.label}()
                                </span>
                                {fn.slots && fn.slots.length > 0 ? (
                                  <span className="ml-auto text-[#007a62] opacity-0 group-hover:opacity-100 transition-fast shrink-0"
                                    style={{ fontSize: 10, fontWeight: 600 }}>
                                    Guided
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                      style={{ display: 'inline', marginLeft: 3, verticalAlign: 'middle' }}>
                                      <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                  </span>
                                ) : (
                                  <span className="ml-auto text-[#007a62] opacity-0 group-hover:opacity-100 transition-fast shrink-0"
                                    style={{ fontSize: 10, fontWeight: 600 }}>+ Insert</span>
                                )}
                              </div>
                              <span className="text-gray-400" style={{ fontSize: 11, marginTop: 2 }}>{fn.description}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================== EXPANDED MODAL ===================== */}
      {(isExpanded || initialExpanded) && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setIsExpanded(false); onCloseExpanded?.(); } }}
        >
          <div className="bg-white rounded-xl shadow-2xl flex flex-col"
            style={{ width: '90vw', maxWidth: 1000, height: '80vh', maxHeight: 700 }}>
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-200"
              style={{ padding: '16px 24px' }}>
              <div>
                <h2 className="text-gray-800" style={{ fontSize: 16, fontWeight: 700 }}>
                  {label}
                </h2>
                <p className="text-gray-400" style={{ fontSize: 12, marginTop: 2 }}>
                  Build and validate your expression
                </p>
              </div>
              <button
                onClick={() => { setIsExpanded(false); onCloseExpanded?.(); }}
                className="text-gray-400 hover:text-gray-600 transition-fast rounded-lg hover:bg-gray-100"
                style={{ padding: 8 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal body — two-column layout */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left: Expression editor */}
              <div className="flex-1 flex flex-col border-r border-gray-200" style={{ padding: 24 }}>
                <label className="text-gray-500" style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                  Expression
                </label>
                <textarea
                  ref={expandedTextareaRef}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 font-mono border border-gray-200 rounded-lg bg-[#fafafa]
                    focus:border-[#00856a] transition-fast placeholder-gray-300 resize-none"
                  style={{ padding: '16px 20px', fontSize: 14, lineHeight: 1.8 }}
                />

                {/* Syntax preview */}
                {value && (
                  <div style={{ marginTop: 12 }}>
                    <label className="text-gray-400" style={{ fontSize: 11, fontWeight: 500 }}>Preview</label>
                    <div className="flex flex-wrap items-center" style={{ gap: 4, marginTop: 6 }}>
                      {tokenizeExpression(value).map((token, i) => (
                        <span
                          key={i}
                          className={`inline-block rounded ${
                            token.type === 'field'
                              ? 'bg-[#f0faf7] text-[#007a62] border border-[#007a62]/20'
                              : token.type === 'operator'
                              ? 'bg-orange-50 text-orange-600'
                              : token.type === 'function'
                              ? 'bg-blue-50 text-blue-600'
                              : token.type === 'string'
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-gray-600'
                          }`}
                          style={{ padding: '2px 6px', fontSize: 12, fontFamily: 'monospace' }}
                        >
                          {token.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Validation */}
                <ExpressionValidator value={value} fields={availableFields} />
              </div>

              {/* Right: Field picker + operators + functions */}
              <div className="flex flex-col" style={{ width: 340 }}>
                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-[#fafafa]" style={{ padding: '0 4px' }}>
                  {(['fields', 'operators', 'functions'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); if (tab !== 'functions') setFuncWizard(null); }}
                      className={`transition-fast capitalize ${
                        activeTab === tab
                          ? 'text-[#007a62] border-b-2 border-[#007a62]'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600 }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
                  {activeTab === 'fields' && (
                    <div>
                      <input
                        type="text"
                        value={fieldSearch}
                        onChange={(e) => setFieldSearch(e.target.value)}
                        placeholder="Search fields..."
                        className="w-full border border-gray-200 rounded-lg bg-white focus:border-[#00856a] transition-fast"
                        style={{ padding: '6px 10px', fontSize: 12, marginBottom: 8 }}
                      />
                      <div className="space-y-1">
                        {filteredFields.map((field) => (
                          <button
                            key={field.id}
                            onClick={() => insertFieldRef(field.name)}
                            className="w-full text-left rounded-lg hover:bg-[#f0faf7] transition-fast flex items-center justify-between"
                            style={{ padding: '6px 10px' }}
                          >
                            <span className="text-gray-700 truncate" style={{ fontSize: 12 }}>{field.name}</span>
                            <span className="text-gray-400 shrink-0" style={{ fontSize: 10 }}>{field.type}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'operators' && (
                    <div>
                      <p className="text-gray-400" style={{ fontSize: 11, fontWeight: 500, marginBottom: 6 }}>Comparison</p>
                      <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 12 }}>
                        {COMPARISON_OPS.map((op) => (
                          <button key={op.label} onClick={() => insertAtCursor(op.insert)}
                            className="rounded-lg border border-gray-200 bg-white hover:bg-[#f0faf7] hover:border-[#00856a]/30 transition-fast"
                            style={{ padding: '5px 12px', fontSize: 12, fontFamily: 'monospace' }}
                            title={op.description}
                          >{op.label}</button>
                        ))}
                      </div>
                      <p className="text-gray-400" style={{ fontSize: 11, fontWeight: 500, marginBottom: 6 }}>Logical</p>
                      <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 12 }}>
                        {LOGICAL_OPS.map((op) => (
                          <button key={op.label} onClick={() => insertAtCursor(op.insert)}
                            className="rounded-lg border border-gray-200 bg-white hover:bg-[#f0faf7] hover:border-[#00856a]/30 transition-fast"
                            style={{ padding: '5px 12px', fontSize: 12 }}
                            title={op.description}
                          >{op.label}</button>
                        ))}
                      </div>
                      <p className="text-gray-400" style={{ fontSize: 11, fontWeight: 500, marginBottom: 6 }}>Common Values</p>
                      <div className="flex flex-wrap" style={{ gap: 4 }}>
                        {COMMON_VALUES.map((op) => (
                          <button key={op.label} onClick={() => insertAtCursor(op.insert)}
                            className="rounded-lg border border-gray-200 bg-white hover:bg-[#f0faf7] hover:border-[#00856a]/30 transition-fast"
                            style={{ padding: '5px 12px', fontSize: 12, fontFamily: 'monospace' }}
                            title={op.description}
                          >{op.label}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'functions' && (
                    <div>
                      {funcWizard ? (
                        /* ===== GUIDED FUNCTION WIZARD ===== */
                        <FuncWizardPanel
                          funcWizard={funcWizard}
                          funcWizardFields={funcWizardFields}
                          funcWizardChoices={funcWizardChoices}
                          csvFiles={csvFiles}
                          onNext={funcWizardNext}
                          onBack={funcWizardBack}
                          onSkip={funcWizardSkip}
                          onSearchChange={(v) => setFuncWizard({ ...funcWizard, fieldSearch: v })}
                          valueInputRef={funcValueInputRef}
                          getTypeColor={getTypeColor}
                        />
                      ) : (
                        /* ===== FUNCTION LIST ===== */
                        <>
                          <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 8 }}>
                            {funcCategories.map((cat) => (
                              <button
                                key={cat.value}
                                onClick={() => setFuncCategory(cat.value)}
                                className={`rounded-full transition-fast ${
                                  funcCategory === cat.value
                                    ? 'bg-[#007a62] text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                                style={{ padding: '3px 10px', fontSize: 11, fontWeight: 500 }}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>
                          <div className="space-y-1">
                            {relevantFunctions.map((fn) => (
                              <button
                                key={fn.label}
                                onClick={() => startFuncWizard(fn)}
                                className="w-full text-left rounded-lg hover:bg-[#f0faf7] transition-fast group"
                                style={{ padding: '6px 10px' }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[#007a62]" style={{ fontSize: 12 }}>{fn.label}()</span>
                                  {fn.slots && fn.slots.length > 0 && (
                                    <span className="text-[#007a62] opacity-0 group-hover:opacity-100 transition-fast"
                                      style={{ fontSize: 10, fontWeight: 600 }}>
                                      Guided
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                        style={{ display: 'inline', marginLeft: 3, verticalAlign: 'middle' }}>
                                        <polyline points="9 18 15 12 9 6" />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-400" style={{ fontSize: 10, marginTop: 1 }}>{fn.description}</p>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Guided Function Wizard Panel
// ============================================================

function FuncWizardPanel({
  funcWizard,
  funcWizardFields,
  funcWizardChoices,
  csvFiles,
  onNext,
  onBack,
  onSkip,
  onSearchChange,
  valueInputRef,
  getTypeColor,
}: {
  funcWizard: FuncWizardState;
  funcWizardFields: SurveyRow[];
  funcWizardChoices: { id: string; name: string; label: string }[];
  csvFiles: { id: string; fileName: string; columns: string[]; totalRows: number }[];
  onNext: (value: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onSearchChange: (v: string) => void;
  valueInputRef: React.RefObject<HTMLInputElement | null>;
  getTypeColor: (type: string) => string;
}) {
  const [inputValue, setInputValue] = React.useState('');
  const slot = funcWizard.func.slots![funcWizard.slotIndex];
  const totalSlots = funcWizard.func.slots!.length;
  const isLastSlot = funcWizard.slotIndex === totalSlots - 1;

  // For csv_column slots, find the columns from the selected CSV file
  const wizardCsvFileName = slot.type === 'csv_column' && slot.csvFileSlotIndex !== undefined
    ? funcWizard.values[slot.csvFileSlotIndex] || ''
    : '';
  const csvColumnsForSlot = React.useMemo(() => {
    if (slot.type !== 'csv_column' || !wizardCsvFileName) return [];
    // Match by filename (with or without .csv extension)
    const csvFile = csvFiles.find((f) =>
      f.fileName.replace(/\.csv$/i, '') === wizardCsvFileName ||
      f.fileName === wizardCsvFileName ||
      f.fileName === wizardCsvFileName + '.csv'
    );
    return csvFile?.columns || [];
  }, [slot.type, wizardCsvFileName, csvFiles]);

  // Reset input value when slot changes
  React.useEffect(() => {
    setInputValue(slot.defaultValue || '');
  }, [funcWizard.slotIndex]);

  // Build a live preview of the expression
  const getPreview = () => {
    const previewValues = [...funcWizard.values];
    // Fill remaining slots with placeholders
    while (previewValues.length < totalSlots) {
      previewValues.push('___');
    }
    if (funcWizard.func.build) {
      try { return funcWizard.func.build(previewValues); }
      catch { return funcWizard.func.template; }
    }
    return funcWizard.func.template;
  };

  return (
    <div>
      {/* Header with function name and back button */}
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <button
          onClick={onBack}
          className="flex items-center text-gray-400 hover:text-gray-600 transition-fast"
          style={{ gap: 4, fontSize: 11, fontWeight: 500 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <button
          onClick={onSkip}
          className="text-gray-400 hover:text-gray-600 transition-fast"
          style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px' }}
          title="Insert raw template instead"
        >
          Skip wizard
        </button>
      </div>

      {/* Function name and description */}
      <div className="bg-[#f0faf7] rounded-lg border border-[#007a62]/10" style={{ padding: '10px 12px', marginBottom: 10 }}>
        <div className="flex items-center" style={{ gap: 6, marginBottom: 4 }}>
          <span className="font-mono text-[#007a62]" style={{ fontSize: 13, fontWeight: 700 }}>
            {funcWizard.func.label}()
          </span>
          <span className="text-gray-400" style={{ fontSize: 10 }}>
            Step {funcWizard.slotIndex + 1} of {totalSlots}
          </span>
        </div>
        <p className="text-gray-500" style={{ fontSize: 11 }}>{funcWizard.func.description}</p>
      </div>

      {/* Progress dots */}
      {totalSlots > 1 && (
        <div className="flex items-center" style={{ gap: 4, marginBottom: 10 }}>
          {Array.from({ length: totalSlots }, (_, i) => (
            <React.Fragment key={i}>
              <div
                className={`rounded-full transition-fast ${
                  i < funcWizard.slotIndex
                    ? 'bg-[#007a62]'
                    : i === funcWizard.slotIndex
                    ? 'bg-[#007a62] ring-2 ring-[#007a62]/20'
                    : 'bg-gray-200'
                }`}
                style={{ width: i === funcWizard.slotIndex ? 8 : 6, height: i === funcWizard.slotIndex ? 8 : 6 }}
              />
              {i < totalSlots - 1 && (
                <div className={`${i < funcWizard.slotIndex ? 'bg-[#007a62]' : 'bg-gray-200'}`}
                  style={{ width: 12, height: 2, borderRadius: 1 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Completed slot values */}
      {funcWizard.values.length > 0 && (
        <div className="bg-gray-50 rounded-md border border-gray-100" style={{ padding: '6px 10px', marginBottom: 10 }}>
          {funcWizard.values.map((v, i) => (
            <div key={i} className="flex items-center" style={{ gap: 6, marginBottom: 2 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#007a62" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-gray-400" style={{ fontSize: 10 }}>{funcWizard.func.slots![i].label}:</span>
              <span className="font-mono text-[#007a62]" style={{ fontSize: 11, fontWeight: 600 }}>
                {funcWizard.func.slots![i].type === 'field' ? '${' + v + '}' : v}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Current slot label */}
      <p className="text-[#007a62]" style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
        {slot.label}
      </p>

      {/* === FIELD SLOT === */}
      {slot.type === 'field' && (
        <div>
          <input
            type="text"
            value={funcWizard.fieldSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search fields..."
            className="w-full border border-gray-200 rounded-md bg-gray-50 focus:border-[#00856a] transition-fast placeholder-gray-300"
            style={{ padding: '6px 10px', fontSize: 12, marginBottom: 6 }}
          />
          {funcWizardFields.length === 0 ? (
            <p className="text-gray-400 text-center" style={{ padding: '16px 0', fontSize: 11 }}>
              {funcWizard.fieldSearch ? 'No matching fields' : `No ${slot.fieldFilter !== 'any' ? slot.fieldFilter + ' ' : ''}fields in the form`}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 220, overflowY: 'auto' }}>
              {funcWizardFields.map((field) => (
                <button
                  key={field.id}
                  onClick={() => onNext(field.name)}
                  className="flex items-center text-left rounded-md hover:bg-[#f0faf7] transition-fast group"
                  style={{ padding: '5px 8px', gap: 6 }}
                >
                  <span
                    className={`inline-block rounded border ${getTypeColor(field.type)} shrink-0`}
                    style={{ padding: '1px 5px', fontSize: 9, fontWeight: 600 }}
                  >
                    {field.type.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-gray-700 truncate" style={{ fontSize: 11 }}>
                    {field.name}
                  </span>
                  {field.label && field.label !== field.name && (
                    <span className="text-gray-400 truncate" style={{ fontSize: 10 }}>
                      {field.label}
                    </span>
                  )}
                  <span className="ml-auto text-[#007a62] opacity-0 group-hover:opacity-100 transition-fast shrink-0"
                    style={{ fontSize: 10, fontWeight: 600 }}>Pick</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === VALUE SLOT (with choices from a field) === */}
      {slot.type === 'value' && (
        <div>
          {funcWizardChoices.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Available Choices
              </p>
              <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 6 }}>
                {funcWizardChoices.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => onNext(c.name)}
                    className="border rounded-md bg-white border-gray-200 text-gray-600 hover:border-[#007a62] hover:bg-[#f0faf7] hover:text-[#007a62] transition-fast"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                  >
                    <span className="font-mono" style={{ fontWeight: 600 }}>{c.name}</span>
                    {c.label !== c.name && (
                      <span className="text-gray-400 ml-1">{c.label}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center" style={{ gap: 6 }}>
            <input
              ref={valueInputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={slot.placeholder || 'Enter value...'}
              onKeyDown={(e) => { if (e.key === 'Enter' && inputValue) { e.preventDefault(); onNext(inputValue); } }}
              className="flex-1 border border-gray-200 rounded-md bg-white focus:border-[#00856a] transition-fast placeholder-gray-300 font-mono"
              style={{ padding: '6px 10px', fontSize: 12 }}
            />
            <button
              onClick={() => onNext(inputValue || slot.placeholder || '')}
              disabled={!inputValue && !slot.placeholder}
              className="bg-[#007a62] text-white rounded-md hover:bg-[#006652] transition-fast disabled:opacity-40 shrink-0"
              style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600 }}
            >
              {isLastSlot ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {/* === TEXT SLOT === */}
      {slot.type === 'text' && (
        <div className="flex items-center" style={{ gap: 6 }}>
          <input
            ref={valueInputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={slot.placeholder || 'Enter text...'}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onNext(inputValue || slot.defaultValue || ''); } }}
            className="flex-1 border border-gray-200 rounded-md bg-white focus:border-[#00856a] transition-fast placeholder-gray-300 font-mono"
            style={{ padding: '6px 10px', fontSize: 12 }}
          />
          <button
            onClick={() => onNext(inputValue || slot.defaultValue || slot.placeholder || '')}
            className="bg-[#007a62] text-white rounded-md hover:bg-[#006652] transition-fast shrink-0"
            style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600 }}
          >
            {isLastSlot ? 'Done' : 'Next'}
          </button>
        </div>
      )}

      {/* === NUMBER SLOT === */}
      {slot.type === 'number' && (
        <div className="flex items-center" style={{ gap: 6 }}>
          <input
            ref={valueInputRef}
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={slot.placeholder || '0'}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onNext(inputValue || slot.defaultValue || '0'); } }}
            className="flex-1 border border-gray-200 rounded-md bg-white focus:border-[#00856a] transition-fast placeholder-gray-300 font-mono"
            style={{ padding: '6px 10px', fontSize: 12 }}
          />
          <button
            onClick={() => onNext(inputValue || slot.defaultValue || slot.placeholder || '0')}
            className="bg-[#007a62] text-white rounded-md hover:bg-[#006652] transition-fast shrink-0"
            style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600 }}
          >
            {isLastSlot ? 'Done' : 'Next'}
          </button>
        </div>
      )}

      {/* === FORMAT SLOT (dropdown with preset options) === */}
      {slot.type === 'format' && slot.options && (
        <div>
          <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 8 }}>
            {slot.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onNext(opt.value)}
                className="border rounded-md bg-white border-gray-200 text-gray-600 hover:border-[#007a62] hover:bg-[#f0faf7] hover:text-[#007a62] transition-fast"
                style={{ padding: '5px 10px', fontSize: 11 }}
              >
                <span className="font-mono" style={{ fontWeight: 600 }}>{opt.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center" style={{ gap: 6 }}>
            <input
              ref={valueInputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={slot.defaultValue || 'Custom format...'}
              onKeyDown={(e) => { if (e.key === 'Enter' && inputValue) { e.preventDefault(); onNext(inputValue); } }}
              className="flex-1 border border-gray-200 rounded-md bg-white focus:border-[#00856a] transition-fast placeholder-gray-300 font-mono"
              style={{ padding: '6px 10px', fontSize: 12 }}
            />
            <button
              onClick={() => onNext(inputValue || slot.defaultValue || '')}
              disabled={!inputValue && !slot.defaultValue}
              className="bg-[#007a62] text-white rounded-md hover:bg-[#006652] transition-fast disabled:opacity-40 shrink-0"
              style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600 }}
            >
              {isLastSlot ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {/* === CSV FILE SLOT (pick from uploaded CSVs or type name) === */}
      {slot.type === 'csv_file' && (
        <div>
          {csvFiles.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Uploaded CSV Files
              </p>
              <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 6 }}>
                {csvFiles.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onNext(f.fileName.replace(/\.csv$/i, ''))}
                    className="border rounded-md bg-white border-gray-200 text-gray-600 hover:border-[#007a62] hover:bg-[#f0faf7] hover:text-[#007a62] transition-fast"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                  >
                    <span className="font-mono" style={{ fontWeight: 600 }}>{f.fileName.replace(/\.csv$/i, '')}</span>
                    <span className="text-gray-400 ml-1.5" style={{ fontSize: 9 }}>
                      {f.columns.length} cols
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center" style={{ gap: 6 }}>
            <input
              ref={valueInputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={slot.placeholder || 'CSV filename (without .csv)'}
              onKeyDown={(e) => { if (e.key === 'Enter' && inputValue) { e.preventDefault(); onNext(inputValue); } }}
              className="flex-1 border border-gray-200 rounded-md bg-white focus:border-[#00856a] transition-fast placeholder-gray-300 font-mono"
              style={{ padding: '6px 10px', fontSize: 12 }}
            />
            <button
              onClick={() => onNext(inputValue || slot.placeholder || '')}
              disabled={!inputValue && !slot.placeholder}
              className="bg-[#007a62] text-white rounded-md hover:bg-[#006652] transition-fast disabled:opacity-40 shrink-0"
              style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600 }}
            >
              Next
            </button>
          </div>
          {csvFiles.length === 0 && (
            <p className="text-gray-400" style={{ fontSize: 10, marginTop: 6 }}>
              Tip: Upload CSV files on select_from_file questions to get column autocompletion here.
            </p>
          )}
        </div>
      )}

      {/* === CSV COLUMN SLOT (pick from columns of selected CSV) === */}
      {slot.type === 'csv_column' && (
        <div>
          {csvColumnsForSlot.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p className="text-gray-400" style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Columns in {wizardCsvFileName || 'CSV'}
              </p>
              <div className="flex flex-wrap" style={{ gap: 4, marginBottom: 6 }}>
                {csvColumnsForSlot.map((col) => (
                  <button
                    key={col}
                    onClick={() => onNext(col)}
                    className="border rounded-md bg-white border-gray-200 text-gray-600 hover:border-[#007a62] hover:bg-[#f0faf7] hover:text-[#007a62] transition-fast"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                  >
                    <span className="font-mono" style={{ fontWeight: 600 }}>{col}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center" style={{ gap: 6 }}>
            <input
              ref={valueInputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={slot.placeholder || 'Column name'}
              onKeyDown={(e) => { if (e.key === 'Enter' && inputValue) { e.preventDefault(); onNext(inputValue); } }}
              className="flex-1 border border-gray-200 rounded-md bg-white focus:border-[#00856a] transition-fast placeholder-gray-300 font-mono"
              style={{ padding: '6px 10px', fontSize: 12 }}
            />
            <button
              onClick={() => onNext(inputValue || slot.placeholder || '')}
              disabled={!inputValue && !slot.placeholder}
              className="bg-[#007a62] text-white rounded-md hover:bg-[#006652] transition-fast disabled:opacity-40 shrink-0"
              style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600 }}
            >
              {isLastSlot ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {/* Live preview */}
      <div className="bg-white rounded border border-gray-200 font-mono"
        style={{ padding: '6px 10px', marginTop: 10, fontSize: 10, color: '#555' }}>
        <span className="text-gray-400" style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Preview:{' '}
        </span>
        {getPreview()}
      </div>
    </div>
  );
}

// ============================================================
// Expression Validator — checks for common issues
// ============================================================

function ExpressionValidator({ value, fields }: { value: string; fields: SurveyRow[] }) {
  if (!value.trim()) return null;

  const issues: { level: 'error' | 'warning'; message: string }[] = [];
  const fieldNames = new Set(fields.map((f) => f.name));

  // Check matching parentheses
  let parenDepth = 0;
  for (const ch of value) {
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth--;
    if (parenDepth < 0) break;
  }
  if (parenDepth !== 0) {
    issues.push({ level: 'error', message: 'Unmatched parentheses' });
  }

  // Check matching quotes
  const singleQuotes = (value.match(/'/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    issues.push({ level: 'error', message: 'Unmatched single quote' });
  }

  // Check field references exist
  const fieldRefs = value.match(/\$\{([^}]+)\}/g) || [];
  for (const ref of fieldRefs) {
    const name = ref.slice(2, -1);
    if (!fieldNames.has(name) && name !== '.') {
      issues.push({ level: 'warning', message: `Field "${name}" not found in form` });
    }
  }

  // Check for empty field refs
  if (value.includes('${}')) {
    issues.push({ level: 'error', message: 'Empty field reference ${}' });
  }

  // Check for common XLSForm function names (basic validation)
  const funcCalls = value.match(/([a-z_-]+)\s*\(/gi) || [];
  const knownFuncs = new Set([
    'selected', 'count-selected', 'selected-at', 'concat', 'string-length',
    'substr', 'contains', 'regex', 'sum', 'count', 'min', 'max', 'round',
    'int', 'today', 'now', 'format-date', 'if', 'coalesce', 'once',
    'pulldata', 'not', 'true', 'false', 'string', 'number', 'boolean',
    'ceiling', 'floor', 'abs', 'pow', 'log', 'log10', 'sqrt', 'exp',
    'exp10', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
    'pi', 'random', 'indexed-repeat', 'position', 'instance', 'current',
    'jr:choice-name', 'join', 'distance', 'area', 'normalize-space',
    'translate', 'upper-case', 'lower-case', 'starts-with', 'ends-with',
    'uuid', 'property', 'version', 'decimal-date-time', 'decimal-time',
    'date', 'date-time', 'boolean-from-string', 'mod',
  ]);
  for (const call of funcCalls) {
    const funcName = call.replace(/\s*\($/, '').toLowerCase();
    if (!knownFuncs.has(funcName)) {
      issues.push({ level: 'warning', message: `Unknown function "${funcName}"` });
    }
  }

  // Check for doubled operators
  if (/\b(and|or)\s+(and|or)\b/i.test(value)) {
    issues.push({ level: 'error', message: 'Consecutive logical operators (and/or)' });
  }

  if (issues.length === 0) {
    return (
      <div className="flex items-center" style={{ marginTop: 10, gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 500 }}>Expression looks valid</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      {issues.map((issue, i) => (
        <div key={i} className="flex items-start" style={{ gap: 6, marginBottom: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke={issue.level === 'error' ? '#dc2626' : '#d97706'}
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ marginTop: 1, flexShrink: 0 }}>
            {issue.level === 'error' ? (
              <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>
            ) : (
              <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>
            )}
          </svg>
          <span style={{ fontSize: 11, color: issue.level === 'error' ? '#dc2626' : '#d97706', fontWeight: 500 }}>
            {issue.message}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Expression Tokenizer — for syntax-highlighted preview
// ============================================================

interface ExpressionToken {
  type: 'field' | 'operator' | 'function' | 'string' | 'number' | 'text';
  text: string;
}

function tokenizeExpression(expr: string): ExpressionToken[] {
  const tokens: ExpressionToken[] = [];
  const regex = /(\$\{[^}]+\})|(!=|>=|<=|[=><])|\b(and|or|not|div|mod)\b|([a-z_-]+)\s*(?=\()|('(?:[^'\\]|\\.)*')|(\d+(?:\.\d+)?)|([().,])|(\S+)/gi;

  let match;
  while ((match = regex.exec(expr)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'field', text: match[1] });
    } else if (match[2]) {
      tokens.push({ type: 'operator', text: match[2] });
    } else if (match[3]) {
      tokens.push({ type: 'operator', text: match[3] });
    } else if (match[4]) {
      tokens.push({ type: 'function', text: match[4] });
    } else if (match[5]) {
      tokens.push({ type: 'string', text: match[5] });
    } else if (match[6]) {
      tokens.push({ type: 'number', text: match[6] });
    } else {
      tokens.push({ type: 'text', text: match[0] });
    }
  }

  return tokens;
}
