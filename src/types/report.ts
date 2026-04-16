/**
 * Report Template Builder Type Definitions
 *
 * Types for the Feature Report template editor, supporting
 * Survey123 report template syntax (${field}, ${if}, ${#repeat}, pipe filters).
 */

// ============================================================
// Application Mode
// ============================================================

export type AppMode = 'form' | 'report';

// ============================================================
// Template Token Types
// ============================================================

export type TemplateTokenType =
  | 'field'             // ${fieldname}
  | 'field_filtered'    // ${fieldname | filter:args}
  | 'conditional_start' // ${if condition}
  | 'conditional_end'   // ${/}
  | 'repeat_start'      // ${#repeatfield}
  | 'repeat_end'        // ${/}
  | 'keyword';          // $date, $image, $map, etc.

// ============================================================
// Pipe Filter Definitions
// ============================================================

export interface PipeFilter {
  name: string;
  label: string;
  description: string;
  args?: PipeFilterArg[];
  /** Which field types this filter applies to */
  appliesTo: FieldCategory[];
}

export interface PipeFilterArg {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
}

export type FieldCategory =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'image'
  | 'file'
  | 'geo'
  | 'repeat'
  | 'all';

// ============================================================
// Survey123 Special Keywords
// ============================================================

export const REPORT_KEYWORDS = [
  { name: '$date', label: 'Report Date', description: 'Date the report was generated' },
  { name: '$image', label: 'Image', description: 'Inline image from attachment' },
  { name: '$map', label: 'Map', description: 'Map snapshot of feature geometry' },
  { name: '$file', label: 'File', description: 'File attachment reference' },
  { name: '$attachment', label: 'Attachment', description: 'Attachment by name' },
  { name: '$feature', label: 'Feature', description: 'Current feature reference' },
  { name: '$layers', label: 'Layers', description: 'Map layers reference' },
] as const;

// ============================================================
// Pipe Filter Catalog
// ============================================================

export const PIPE_FILTERS: PipeFilter[] = [
  {
    name: 'appearance',
    label: 'Appearance',
    description: 'Control display format',
    args: [{ name: 'value', label: 'Style', type: 'select', options: [
      { label: 'Multiline', value: 'multiline' },
      { label: 'Bullets', value: 'bullets' },
      { label: 'Numbered', value: 'numbered' },
    ], required: true }],
    appliesTo: ['text', 'all'],
  },
  {
    name: 'size',
    label: 'Size',
    description: 'Set width and height (for images/files)',
    args: [
      { name: 'width', label: 'Width (px)', type: 'number', placeholder: '460', required: true },
      { name: 'height', label: 'Height (px)', type: 'number', placeholder: '0 (auto)' },
    ],
    appliesTo: ['image', 'file'],
  },
  {
    name: 'selected',
    label: 'Selected',
    description: 'Check if a choice value is selected',
    args: [{ name: 'value', label: 'Choice value', type: 'text', placeholder: 'value', required: true }],
    appliesTo: ['select'],
  },
  {
    name: 'format',
    label: 'Format',
    description: 'Date/number format string',
    args: [{ name: 'pattern', label: 'Pattern', type: 'text', placeholder: 'MM/DD/YYYY', required: true }],
    appliesTo: ['date', 'number'],
  },
  {
    name: 'getValue',
    label: 'Get Value',
    description: 'Get value from another field',
    args: [{ name: 'field', label: 'Field name', type: 'text', placeholder: 'fieldname', required: true }],
    appliesTo: ['all'],
  },
  {
    name: 'round',
    label: 'Round',
    description: 'Round number to N decimal places',
    args: [{ name: 'decimals', label: 'Decimal places', type: 'number', placeholder: '2', required: true }],
    appliesTo: ['number'],
  },
  {
    name: 'useGroupBy',
    label: 'Group By',
    description: 'Group repeat data by a field value',
    args: [{ name: 'field', label: 'Group field', type: 'text', placeholder: 'category', required: true }],
    appliesTo: ['repeat'],
  },
  {
    name: 'orderByFields',
    label: 'Order By',
    description: 'Sort repeat data by field(s)',
    args: [{ name: 'fields', label: 'Sort fields', type: 'text', placeholder: 'date DESC', required: true }],
    appliesTo: ['repeat'],
  },
  {
    name: 'where',
    label: 'Where',
    description: 'Filter repeat rows by condition',
    args: [{ name: 'condition', label: 'SQL WHERE clause', type: 'text', placeholder: "status = 'active'", required: true }],
    appliesTo: ['repeat'],
  },
];

// ============================================================
// Utility: Get field category from question type
// ============================================================

export function getFieldCategory(questionType: string): FieldCategory {
  switch (questionType) {
    case 'text':
    case 'email':
    case 'password':
    case 'note':
    case 'calculate':
    case 'hidden':
    case 'barcode':
    case 'username':
    case 'deviceid':
      return 'text';
    case 'integer':
    case 'decimal':
    case 'range':
      return 'number';
    case 'date':
    case 'time':
    case 'datetime':
    case 'start':
    case 'end':
      return 'date';
    case 'select_one':
    case 'select_multiple':
    case 'select_one_from_file':
    case 'select_multiple_from_file':
    case 'rank':
      return 'select';
    case 'image':
    case 'audio':
      return 'image';
    case 'file':
      return 'file';
    case 'geopoint':
    case 'geotrace':
    case 'geoshape':
      return 'geo';
    case 'begin_repeat':
      return 'repeat';
    default:
      return 'text';
  }
}
