/**
 * Question Type Catalog
 *
 * Defines all available Survey123 question types organized by category,
 * with their default properties, valid appearances, and metadata.
 * Includes appearance variants as separate draggable cards for ease of use.
 */

import { QuestionCategory, QuestionType, SurveyRow, PlatformSupport } from '../types/survey';
import { v4 as uuid } from 'uuid';

// ============================================================
// Question Categories for the Sidebar
// ============================================================

/**
 * Platform support key:
 *   'both'  = Field App + Web App (default if omitted)
 *   'field' = Field App only (not available in web forms)
 *   'web'   = Web App only (not available in field app)
 *
 * Based on ArcGIS Survey123 documentation:
 * Web app does NOT support: geotrace, geoshape, barcode, audio recording,
 * file upload, draw, annotate, spike appearances, distress, spinner,
 * calculator appearances, rank, select from file, year/month-year dates,
 * range slider, and deviceid metadata.
 */

export const questionCategories: QuestionCategory[] = [
  {
    id: 'text-input',
    label: 'Text Input',
    icon: 'Type',
    items: [
      { id: 'text', type: 'text', label: 'Text', icon: 'Type' },
      { id: 'text-multiline', type: 'text', label: 'Multiline Text', icon: 'AlignLeft', defaultAppearance: 'multiline' },
      { id: 'text-geocode', type: 'text', label: 'Geocode', icon: 'MapPin', defaultAppearance: 'geocode', platform: 'field' },
      { id: 'text-predictive', type: 'text', label: 'Predictive Text', icon: 'Type', defaultAppearance: 'predictivetext', platform: 'field' },
      { id: 'text-nopredictive', type: 'text', label: 'No Predictive', icon: 'Type', defaultAppearance: 'nopredictivetext', platform: 'field' },
      { id: 'email', type: 'email', label: 'Email', icon: 'Mail' },
      { id: 'password', type: 'password', label: 'Password', icon: 'Lock', platform: 'field' },
    ],
  },
  {
    id: 'numeric',
    label: 'Numeric',
    icon: 'Hash',
    items: [
      { id: 'integer', type: 'integer', label: 'Integer', icon: 'Hash' },
      { id: 'integer-spinner', type: 'integer', label: 'Spinner', icon: 'Hash', defaultAppearance: 'spinner', platform: 'field' },
      { id: 'integer-calculator', type: 'integer', label: 'Calculator', icon: 'Calculator', defaultAppearance: 'calculator', platform: 'field' },
      { id: 'integer-distress', type: 'integer', label: 'Distress', icon: 'Hash', defaultAppearance: 'distress', platform: 'field' },
      { id: 'integer-numbers', type: 'integer', label: 'Numeric Keypad', icon: 'Hash', defaultAppearance: 'numbers', platform: 'field' },
      { id: 'integer-thousands', type: 'integer', label: 'Thousands Sep', icon: 'Hash', defaultAppearance: 'thousands-sep' },
      { id: 'decimal', type: 'decimal', label: 'Decimal', icon: 'Percent' },
      { id: 'decimal-spinner', type: 'decimal', label: 'Decimal Spinner', icon: 'Percent', defaultAppearance: 'spinner', platform: 'field' },
      { id: 'decimal-calculator', type: 'decimal', label: 'Decimal Calc', icon: 'Calculator', defaultAppearance: 'calculator', platform: 'field' },
      { id: 'decimal-numbers', type: 'decimal', label: 'Decimal Keypad', icon: 'Percent', defaultAppearance: 'numbers', platform: 'field' },
      { id: 'decimal-thousands', type: 'decimal', label: 'Decimal 1000s', icon: 'Percent', defaultAppearance: 'thousands-sep' },
      { id: 'range', type: 'range', label: 'Range / Slider', icon: 'SlidersHorizontal', platform: 'field' },
      { id: 'range-noticks', type: 'range', label: 'Range No Ticks', icon: 'SlidersHorizontal', defaultAppearance: 'no-ticks', platform: 'field' },
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
      { id: 'select_one-horizontal', type: 'select_one', label: 'Horizontal', icon: 'CircleDot', defaultAppearance: 'horizontal' },
      { id: 'select_one-compact', type: 'select_one', label: 'Compact', icon: 'CircleDot', defaultAppearance: 'compact' },
      { id: 'select_one-imagemap', type: 'select_one', label: 'Image Map', icon: 'CircleDot', defaultAppearance: 'image-map', platform: 'field' },
      { id: 'select_multiple', type: 'select_multiple', label: 'Select Multiple', icon: 'CheckSquare' },
      { id: 'select_multiple-dropdown', type: 'select_multiple', label: 'Multi Dropdown', icon: 'ChevronDown', defaultAppearance: 'minimal' },
      { id: 'select_multiple-autocomplete', type: 'select_multiple', label: 'Multi Autocomplete', icon: 'Search', defaultAppearance: 'autocomplete' },
      { id: 'select_multiple-horizontal', type: 'select_multiple', label: 'Multi Horizontal', icon: 'CheckSquare', defaultAppearance: 'horizontal' },
      { id: 'select_multiple-compact', type: 'select_multiple', label: 'Multi Compact', icon: 'CheckSquare', defaultAppearance: 'compact' },
      { id: 'select_multiple-likert', type: 'select_multiple', label: 'Multi Likert', icon: 'SlidersHorizontal', defaultAppearance: 'likert' },
      { id: 'select_multiple-imagemap', type: 'select_multiple', label: 'Multi Image Map', icon: 'CheckSquare', defaultAppearance: 'image-map', platform: 'field' },
      { id: 'rank', type: 'rank', label: 'Rank', icon: 'ArrowUpDown', platform: 'field' },
      { id: 'rank-minimal', type: 'rank', label: 'Rank Dropdown', icon: 'ArrowUpDown', defaultAppearance: 'minimal', platform: 'field' },
      { id: 'rank-compact', type: 'rank', label: 'Rank Compact', icon: 'ArrowUpDown', defaultAppearance: 'compact', platform: 'field' },
      { id: 'select_one_from_file', type: 'select_one_from_file', label: 'Select One (CSV)', icon: 'FileSpreadsheet', platform: 'field' },
      { id: 'select_one_from_file-dropdown', type: 'select_one_from_file', label: 'CSV Dropdown', icon: 'FileSpreadsheet', defaultAppearance: 'minimal', platform: 'field' },
      { id: 'select_one_from_file-autocomplete', type: 'select_one_from_file', label: 'CSV Autocomplete', icon: 'FileSpreadsheet', defaultAppearance: 'autocomplete', platform: 'field' },
      { id: 'select_multiple_from_file', type: 'select_multiple_from_file', label: 'Select Multiple (CSV)', icon: 'FileSpreadsheet', platform: 'field' },
      { id: 'select_multiple_from_file-dropdown', type: 'select_multiple_from_file', label: 'CSV Multi Dropdown', icon: 'FileSpreadsheet', defaultAppearance: 'minimal', platform: 'field' },
      { id: 'select_multiple_from_file-autocomplete', type: 'select_multiple_from_file', label: 'CSV Multi Auto', icon: 'FileSpreadsheet', defaultAppearance: 'autocomplete', platform: 'field' },
    ],
  },
  {
    id: 'location',
    label: 'Location',
    icon: 'MapPin',
    items: [
      { id: 'geopoint', type: 'geopoint', label: 'Geopoint', icon: 'MapPin' },
      { id: 'geopoint-press', type: 'geopoint', label: 'Press to Locate', icon: 'MapPin', defaultAppearance: 'press-to-locate', platform: 'field' },
      { id: 'geopoint-hideinput', type: 'geopoint', label: 'Map Only', icon: 'MapPin', defaultAppearance: 'hide-input', platform: 'field' },
      { id: 'geopoint-geocode', type: 'geopoint', label: 'Geocode Search', icon: 'MapPin', defaultAppearance: 'geocode' },
      { id: 'geotrace', type: 'geotrace', label: 'Geotrace', icon: 'Route', platform: 'field' },
      { id: 'geoshape', type: 'geoshape', label: 'Geoshape', icon: 'Pentagon', platform: 'field' },
    ],
  },
  {
    id: 'datetime',
    label: 'Date & Time',
    icon: 'Calendar',
    items: [
      { id: 'date', type: 'date', label: 'Date', icon: 'Calendar' },
      { id: 'date-year', type: 'date', label: 'Year Only', icon: 'Calendar', defaultAppearance: 'year', platform: 'field' },
      { id: 'date-month-year', type: 'date', label: 'Month-Year', icon: 'Calendar', defaultAppearance: 'month-year', platform: 'field' },
      { id: 'date-week', type: 'date', label: 'Week Number', icon: 'Calendar', defaultAppearance: 'week-number', platform: 'field' },
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
      { id: 'image-draw', type: 'image', label: 'Draw', icon: 'Pen', defaultAppearance: 'draw', platform: 'field' },
      { id: 'image-annotate', type: 'image', label: 'Annotate', icon: 'Camera', defaultAppearance: 'annotate', platform: 'field' },
      { id: 'image-spike', type: 'image', label: 'Spike', icon: 'Camera', defaultAppearance: 'spike', platform: 'field' },
      { id: 'image-spike-full', type: 'image', label: 'Spike Full', icon: 'Camera', defaultAppearance: 'spike-full-measure', platform: 'field' },
      { id: 'image-spike-p2p', type: 'image', label: 'Spike Point-to-Point', icon: 'Camera', defaultAppearance: 'spike-point-to-point', platform: 'field' },
      { id: 'image-newfront', type: 'image', label: 'New Front Camera', icon: 'Camera', defaultAppearance: 'new-front', platform: 'field' },
      { id: 'image-newrear', type: 'image', label: 'New Rear Camera', icon: 'Camera', defaultAppearance: 'new-rear', platform: 'field' },
      { id: 'image-multiline', type: 'image', label: 'Multi Photo', icon: 'Camera', defaultAppearance: 'multiline' },
      { id: 'audio', type: 'audio', label: 'Audio', icon: 'Mic', platform: 'field' },
      { id: 'file', type: 'file', label: 'File Upload', icon: 'Paperclip', platform: 'field' },
      { id: 'barcode', type: 'barcode', label: 'Barcode / QR', icon: 'ScanLine', platform: 'field' },
      { id: 'barcode-minimal', type: 'barcode', label: 'Barcode Minimal', icon: 'ScanLine', defaultAppearance: 'minimal', platform: 'field' },
    ],
  },
  {
    id: 'structure',
    label: 'Structure',
    icon: 'Layers',
    items: [
      { id: 'note', type: 'note', label: 'Note', icon: 'StickyNote' },
      { id: 'begin_group', type: 'begin_group', label: 'Group', icon: 'FolderOpen' },
      { id: 'begin_group-compact', type: 'begin_group', label: 'Compact Group', icon: 'FolderOpen', defaultAppearance: 'compact' },
      { id: 'begin_group-fieldlist', type: 'begin_group', label: 'Field List', icon: 'FolderOpen', defaultAppearance: 'field-list' },
      { id: 'begin_group-tablelist', type: 'begin_group', label: 'Table List', icon: 'FolderOpen', defaultAppearance: 'table-list' },
      { id: 'begin_repeat', type: 'begin_repeat', label: 'Repeat', icon: 'Repeat' },
      { id: 'begin_repeat-compact', type: 'begin_repeat', label: 'Compact Repeat', icon: 'Repeat', defaultAppearance: 'compact' },
      { id: 'begin_repeat-fieldlist', type: 'begin_repeat', label: 'Field List Repeat', icon: 'Repeat', defaultAppearance: 'field-list' },
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
      { id: 'deviceid', type: 'deviceid', label: 'Device ID', icon: 'Smartphone', platform: 'field' },
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
