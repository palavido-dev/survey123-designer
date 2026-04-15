/**
 * Question Type Catalog
 *
 * Defines all available Survey123 question types organized by category,
 * with their default properties, valid appearances, and metadata.
 * Includes appearance variants as separate draggable cards for ease of use.
 */

import { QuestionCategory, QuestionType, SurveyRow } from '../types/survey';
import { v4 as uuid } from 'uuid';

// ============================================================
// Question Categories for the Sidebar
// ============================================================

export const questionCategories: QuestionCategory[] = [
  {
    id: 'text-input',
    label: 'Text Input',
    icon: 'Type',
    items: [
      { id: 'text', type: 'text', label: 'Text', icon: 'Type' },
      { id: 'text-multiline', type: 'text', label: 'Multiline Text', icon: 'AlignLeft', defaultAppearance: 'multiline' },
      { id: 'email', type: 'email', label: 'Email', icon: 'Mail' },
      { id: 'password', type: 'password', label: 'Password', icon: 'Lock' },
    ],
  },
  {
    id: 'numeric',
    label: 'Numeric',
    icon: 'Hash',
    items: [
      { id: 'integer', type: 'integer', label: 'Integer', icon: 'Hash' },
      { id: 'integer-spinner', type: 'integer', label: 'Spinner', icon: 'Hash', defaultAppearance: 'spinner' },
      { id: 'integer-calculator', type: 'integer', label: 'Calculator', icon: 'Calculator', defaultAppearance: 'calculator' },
      { id: 'decimal', type: 'decimal', label: 'Decimal', icon: 'Percent' },
      { id: 'range', type: 'range', label: 'Range / Slider', icon: 'SlidersHorizontal' },
    ],
  },
  {
    id: 'selection',
    label: 'Selection',
    icon: 'List',
    items: [
      { id: 'select_one', type: 'select_one', label: 'Select One', icon: 'CircleDot' },
      { id: 'select_one-dropdown', type: 'select_one', label: 'Dropdown', icon: 'ChevronDown', defaultAppearance: 'minimal' },
      { id: 'select_one-autocomplete', type: 'select_one', label: 'Autocomplete', icon: 'Search', defaultAppearance: 'autocomplete' },
      { id: 'select_one-likert', type: 'select_one', label: 'Likert Scale', icon: 'SlidersHorizontal', defaultAppearance: 'likert' },
      { id: 'select_multiple', type: 'select_multiple', label: 'Select Multiple', icon: 'CheckSquare' },
      { id: 'rank', type: 'rank', label: 'Rank', icon: 'ArrowUpDown' },
      { id: 'select_one_from_file', type: 'select_one_from_file', label: 'Select One (CSV)', icon: 'FileSpreadsheet' },
      { id: 'select_multiple_from_file', type: 'select_multiple_from_file', label: 'Select Multiple (CSV)', icon: 'FileSpreadsheet' },
    ],
  },
  {
    id: 'location',
    label: 'Location',
    icon: 'MapPin',
    items: [
      { id: 'geopoint', type: 'geopoint', label: 'Geopoint', icon: 'MapPin' },
      { id: 'geotrace', type: 'geotrace', label: 'Geotrace', icon: 'Route' },
      { id: 'geoshape', type: 'geoshape', label: 'Geoshape', icon: 'Pentagon' },
    ],
  },
  {
    id: 'datetime',
    label: 'Date & Time',
    icon: 'Calendar',
    items: [
      { id: 'date', type: 'date', label: 'Date', icon: 'Calendar' },
      { id: 'date-year', type: 'date', label: 'Year Only', icon: 'Calendar', defaultAppearance: 'year' },
      { id: 'date-month-year', type: 'date', label: 'Month-Year', icon: 'Calendar', defaultAppearance: 'month-year' },
      { id: 'time', type: 'time', label: 'Time', icon: 'Clock' },
      { id: 'datetime', type: 'datetime', label: 'Date & Time', icon: 'CalendarClock' },
    ],
  },
  {
    id: 'media',
    label: 'Media & Files',
    icon: 'Camera',
    items: [
      { id: 'image', type: 'image', label: 'Photo', icon: 'Camera' },
      { id: 'image-signature', type: 'image', label: 'Signature', icon: 'Pen', defaultAppearance: 'signature' },
      { id: 'image-draw', type: 'image', label: 'Draw', icon: 'Pen', defaultAppearance: 'draw' },
      { id: 'image-annotate', type: 'image', label: 'Annotate', icon: 'Camera', defaultAppearance: 'annotate' },
      { id: 'audio', type: 'audio', label: 'Audio', icon: 'Mic' },
      { id: 'file', type: 'file', label: 'File Upload', icon: 'Paperclip' },
      { id: 'barcode', type: 'barcode', label: 'Barcode / QR', icon: 'ScanLine' },
    ],
  },
  {
    id: 'structure',
    label: 'Structure',
    icon: 'Layers',
    items: [
      { id: 'note', type: 'note', label: 'Note', icon: 'StickyNote' },
      { id: 'begin_group', type: 'begin_group', label: 'Group', icon: 'FolderOpen' },
      { id: 'begin_repeat', type: 'begin_repeat', label: 'Repeat', icon: 'Repeat' },
    ],
  },
  {
    id: 'hidden-calc',
    label: 'Hidden & Calculated',
    icon: 'Calculator',
    items: [
      { id: 'calculate', type: 'calculate', label: 'Calculate', icon: 'Calculator' },
      { id: 'hidden', type: 'hidden', label: 'Hidden', icon: 'EyeOff' },
    ],
  },
  {
    id: 'metadata',
    label: 'Metadata',
    icon: 'Info',
    items: [
      { id: 'start', type: 'start', label: 'Start Time', icon: 'Play' },
      { id: 'end', type: 'end', label: 'End Time', icon: 'Square' },
      { id: 'username', type: 'username', label: 'Username', icon: 'User' },
      { id: 'deviceid', type: 'deviceid', label: 'Device ID', icon: 'Smartphone' },
    ],
  },
];

// ============================================================
// Valid Appearances per Question Type
// ============================================================

export const validAppearances: Record<string, string[]> = {
  text: ['multiline', 'predictivetext', 'nopredictivetext', 'geocode', 'hidden'],
  email: ['hidden'],
  password: ['hidden'],
  integer: ['distress', 'spinner', 'numbers', 'calculator', 'thousands-sep', 'hidden'],
  decimal: ['spinner', 'numbers', 'calculator', 'thousands-sep', 'hidden'],
  range: ['no-ticks', 'hidden'],
  select_one: ['minimal', 'horizontal', 'compact', 'horizontal-compact', 'likert', 'autocomplete', 'image-map', 'yes_no_toggle', 'randomize', 'hidden'],
  select_multiple: ['minimal', 'horizontal', 'compact', 'horizontal-compact', 'likert', 'autocomplete', 'image-map', 'randomize', 'hidden'],
  select_one_from_file: ['minimal', 'horizontal', 'compact', 'horizontal-compact', 'autocomplete', 'hidden'],
  select_multiple_from_file: ['minimal', 'horizontal', 'compact', 'horizontal-compact', 'autocomplete', 'hidden'],
  rank: ['minimal', 'compact', 'horizontal-compact', 'hidden'],
  geopoint: ['geocode', 'press-to-locate', 'hide-input', 'hidden'],
  geotrace: ['hidden'],
  geoshape: ['hidden'],
  date: ['year', 'month-year', 'week-number', 'hidden'],
  time: ['hidden'],
  datetime: ['hidden'],
  image: ['signature', 'draw', 'annotate', 'spike', 'spike-full-measure', 'spike-point-to-point', 'new-front', 'new-rear', 'multiline', 'hidden'],
  audio: ['hidden'],
  file: ['hidden'],
  barcode: ['minimal', 'hidden'],
  note: ['hidden'],
  calculate: [],
  hidden: [],
  begin_group: ['compact', 'table-list', 'field-list', 'w1', 'w2', 'w3', 'w4'],
  begin_repeat: ['compact', 'field-list'],
};

// ============================================================
// Default Row Factory
// ============================================================

let questionCounter: Record<string, number> = {};

export function resetQuestionCounter() {
  questionCounter = {};
}

export function createDefaultRow(type: QuestionType, appearance?: string): SurveyRow {
  const count = (questionCounter[type] || 0) + 1;
  questionCounter[type] = count;

  const baseName = type.replace(/^begin_/, '').replace(/^end_/, '');
  const name = `${baseName}_${count}`;

  const base: SurveyRow = {
    id: uuid(),
    type,
    name,
    label: getDefaultLabel(type, count),
  };

  // Apply default appearance if provided
  if (appearance) {
    base.appearance = appearance;
  }

  // Type-specific defaults
  switch (type) {
    case 'select_one':
    case 'select_multiple':
    case 'rank':
      base.listName = `list_${name}`;
      break;
    case 'select_one_from_file':
    case 'select_multiple_from_file':
      base.fileName = 'choices.csv';
      break;
    case 'range':
      base.parameters = 'start=0 end=10 step=1';
      break;
    case 'start':
    case 'end':
    case 'username':
    case 'deviceid':
      base.label = '';
      break;
    case 'begin_group':
    case 'begin_repeat':
      // Label stays as default
      break;
    case 'calculate':
      base.label = '';
      base.calculation = '';
      break;
    case 'hidden':
      base.label = '';
      break;
  }

  return base;
}

function getDefaultLabel(type: QuestionType, count: number): string {
  const labels: Partial<Record<QuestionType, string>> = {
    text: 'Text Question',
    email: 'Email Address',
    password: 'Password',
    integer: 'Number',
    decimal: 'Decimal Number',
    range: 'Range',
    select_one: 'Select One',
    select_multiple: 'Select Multiple',
    select_one_from_file: 'Select One (File)',
    select_multiple_from_file: 'Select Multiple (File)',
    rank: 'Rank',
    geopoint: 'Location',
    geotrace: 'Line',
    geoshape: 'Area',
    date: 'Date',
    time: 'Time',
    datetime: 'Date and Time',
    image: 'Photo',
    audio: 'Audio Recording',
    file: 'File Upload',
    barcode: 'Scan Barcode',
    note: 'Note',
    begin_group: 'Group',
    begin_repeat: 'Repeat',
    calculate: '',
    hidden: '',
    start: '',
    end: '',
    username: '',
    deviceid: '',
  };

  const base = labels[type] || type;
  return base ? `${base} ${count}` : '';
}

// ============================================================
// Type column value builder (for XLS export)
// ============================================================

export function buildTypeColumnValue(row: SurveyRow): string {
  switch (row.type) {
    case 'select_one':
    case 'select_multiple':
    case 'rank':
      return `${row.type} ${row.listName || 'unnamed_list'}`;
    case 'select_one_from_file':
    case 'select_multiple_from_file':
      return `${row.type} ${row.fileName || 'choices.csv'}`;
    case 'begin_group':
      return 'begin group';
    case 'end_group':
      return 'end group';
    case 'begin_repeat':
      return 'begin repeat';
    case 'end_repeat':
      return 'end repeat';
    default:
      return row.type;
  }
}
