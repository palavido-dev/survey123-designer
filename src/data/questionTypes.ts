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
      { id: 'text', type: 'text', label: 'Text', icon: 'Type', description: 'Free text response, single line' },
      { id: 'text-multiline', type: 'text', label: 'Multiline Text', icon: 'AlignLeft', defaultAppearance: 'multiline', description: 'Multi-line text box with configurable height' },
      { id: 'text-geocode', type: 'text', label: 'Geocode', icon: 'MapPin', defaultAppearance: 'geocode', platform: 'field', description: 'Search and submit geocoded addresses with autocomplete' },
      { id: 'text-predictive', type: 'text', label: 'Predictive Text', icon: 'Type', defaultAppearance: 'predictivetext', platform: 'field', description: 'Enables predictive text suggestions on mobile' },
      { id: 'text-nopredictive', type: 'text', label: 'No Predictive', icon: 'Type', defaultAppearance: 'nopredictivetext', platform: 'field', description: 'Disables predictive text suggestions on mobile' },
      { id: 'email', type: 'email', label: 'Email', icon: 'Mail', description: 'Email address input with validation' },
      { id: 'password', type: 'password', label: 'Password', icon: 'Lock', platform: 'field', description: 'Masked text input for sensitive data' },
    ],
  },
  {
    id: 'numeric',
    label: 'Numeric',
    icon: 'Hash',
    items: [
      { id: 'integer', type: 'integer', label: 'Integer', icon: 'Hash', description: 'Whole number input' },
      { id: 'integer-spinner', type: 'integer', label: 'Spinner', icon: 'Hash', defaultAppearance: 'spinner', platform: 'field', description: 'Increment/decrement buttons for whole numbers' },
      { id: 'integer-calculator', type: 'integer', label: 'Calculator', icon: 'Calculator', defaultAppearance: 'calculator', platform: 'field', description: 'Calculator keypad for number entry' },
      { id: 'integer-distress', type: 'integer', label: 'Distress', icon: 'Hash', defaultAppearance: 'distress', platform: 'field', description: '10-point scale for measuring stress, pain, or happiness' },
      { id: 'integer-numbers', type: 'integer', label: 'Numeric Keypad', icon: 'Hash', defaultAppearance: 'numbers', platform: 'field', description: 'Custom numeric keyboard for input' },
      { id: 'integer-thousands', type: 'integer', label: 'Thousands Sep', icon: 'Hash', defaultAppearance: 'thousands-sep', description: 'Whole numbers displayed with thousands separators' },
      { id: 'decimal', type: 'decimal', label: 'Decimal', icon: 'Percent', description: 'Decimal number input' },
      { id: 'decimal-spinner', type: 'decimal', label: 'Decimal Spinner', icon: 'Percent', defaultAppearance: 'spinner', platform: 'field', description: 'Increment/decrement buttons for decimals' },
      { id: 'decimal-calculator', type: 'decimal', label: 'Decimal Calc', icon: 'Calculator', defaultAppearance: 'calculator', platform: 'field', description: 'Calculator keypad for decimal entry' },
      { id: 'decimal-numbers', type: 'decimal', label: 'Decimal Keypad', icon: 'Percent', defaultAppearance: 'numbers', platform: 'field', description: 'Custom numeric keyboard for decimal input' },
      { id: 'decimal-thousands', type: 'decimal', label: 'Decimal 1000s', icon: 'Percent', defaultAppearance: 'thousands-sep', description: 'Decimals displayed with thousands separators' },
      { id: 'range', type: 'range', label: 'Range / Slider', icon: 'SlidersHorizontal', platform: 'field', description: 'Slider input for a given range of numbers' },
      { id: 'range-noticks', type: 'range', label: 'Range No Ticks', icon: 'SlidersHorizontal', defaultAppearance: 'no-ticks', platform: 'field', description: 'Range slider without tick marks or min/max labels' },
    ],
  },
  {
    id: 'selection',
    label: 'Selection',
    icon: 'List',
    items: [
      { id: 'select_one', type: 'select_one', label: 'Select One', icon: 'CircleDot', description: 'Single choice from a list of options (radio buttons)' },
      { id: 'select_one-dropdown', type: 'select_one', label: 'Dropdown', icon: 'ChevronDown', defaultAppearance: 'minimal', description: 'Single choice presented as a dropdown menu' },
      { id: 'select_one-autocomplete', type: 'select_one', label: 'Autocomplete', icon: 'Search', defaultAppearance: 'autocomplete', description: 'Type-ahead search to filter a long choice list' },
      { id: 'select_one-likert', type: 'select_one', label: 'Likert Scale', icon: 'SlidersHorizontal', defaultAppearance: 'likert', description: 'Horizontal rating scale for agreement statements' },
      { id: 'select_one-horizontal', type: 'select_one', label: 'Horizontal', icon: 'CircleDot', defaultAppearance: 'horizontal', description: 'Choices displayed horizontally in equal-width columns' },
      { id: 'select_one-compact', type: 'select_one', label: 'Compact', icon: 'CircleDot', defaultAppearance: 'compact', description: 'Space-efficient horizontal choice layout' },
      { id: 'select_one-imagemap', type: 'select_one', label: 'Image Map', icon: 'CircleDot', defaultAppearance: 'image-map', platform: 'field', description: 'Select by tapping regions on an SVG image' },
      { id: 'select_multiple', type: 'select_multiple', label: 'Select Multiple', icon: 'CheckSquare', description: 'Choose multiple options from a list (checkboxes)' },
      { id: 'select_multiple-dropdown', type: 'select_multiple', label: 'Multi Dropdown', icon: 'ChevronDown', defaultAppearance: 'minimal', description: 'Multi-select presented as a dropdown menu' },
      { id: 'select_multiple-autocomplete', type: 'select_multiple', label: 'Multi Autocomplete', icon: 'Search', defaultAppearance: 'autocomplete', description: 'Type-ahead multi-select for long choice lists' },
      { id: 'select_multiple-horizontal', type: 'select_multiple', label: 'Multi Horizontal', icon: 'CheckSquare', defaultAppearance: 'horizontal', description: 'Multi-select checkboxes in horizontal columns' },
      { id: 'select_multiple-compact', type: 'select_multiple', label: 'Multi Compact', icon: 'CheckSquare', defaultAppearance: 'compact', description: 'Space-efficient horizontal multi-select layout' },
      { id: 'select_multiple-likert', type: 'select_multiple', label: 'Multi Likert', icon: 'SlidersHorizontal', defaultAppearance: 'likert', description: 'Likert scale allowing multiple selections' },
      { id: 'select_multiple-imagemap', type: 'select_multiple', label: 'Multi Image Map', icon: 'CheckSquare', defaultAppearance: 'image-map', platform: 'field', description: 'Select multiple regions on an SVG image' },
      { id: 'rank', type: 'rank', label: 'Rank', icon: 'ArrowUpDown', platform: 'field', description: 'Drag choices into a ranked order' },
      { id: 'rank-minimal', type: 'rank', label: 'Rank Dropdown', icon: 'ArrowUpDown', defaultAppearance: 'minimal', platform: 'field', description: 'Rank choices using dropdown selectors' },
      { id: 'rank-compact', type: 'rank', label: 'Rank Compact', icon: 'ArrowUpDown', defaultAppearance: 'compact', platform: 'field', description: 'Compact ranking layout' },
      { id: 'select_one_from_file', type: 'select_one_from_file', label: 'Select One (CSV)', icon: 'FileSpreadsheet', platform: 'field', description: 'Single choice loaded from an external CSV file' },
      { id: 'select_one_from_file-dropdown', type: 'select_one_from_file', label: 'CSV Dropdown', icon: 'FileSpreadsheet', defaultAppearance: 'minimal', platform: 'field', description: 'CSV-sourced choices as a dropdown menu' },
      { id: 'select_one_from_file-autocomplete', type: 'select_one_from_file', label: 'CSV Autocomplete', icon: 'FileSpreadsheet', defaultAppearance: 'autocomplete', platform: 'field', description: 'Type-ahead search for CSV-sourced choices' },
      { id: 'select_multiple_from_file', type: 'select_multiple_from_file', label: 'Select Multiple (CSV)', icon: 'FileSpreadsheet', platform: 'field', description: 'Multi-select loaded from an external CSV file' },
      { id: 'select_multiple_from_file-dropdown', type: 'select_multiple_from_file', label: 'CSV Multi Dropdown', icon: 'FileSpreadsheet', defaultAppearance: 'minimal', platform: 'field', description: 'CSV-sourced multi-select as a dropdown' },
      { id: 'select_multiple_from_file-autocomplete', type: 'select_multiple_from_file', label: 'CSV Multi Auto', icon: 'FileSpreadsheet', defaultAppearance: 'autocomplete', platform: 'field', description: 'Type-ahead multi-select for CSV choices' },
    ],
  },
  {
    id: 'location',
    label: 'Location',
    icon: 'MapPin',
    items: [
      { id: 'geopoint', type: 'geopoint', label: 'Geopoint', icon: 'MapPin', description: 'Capture a single GPS coordinate on a map' },
      { id: 'geopoint-press', type: 'geopoint', label: 'Press to Locate', icon: 'MapPin', defaultAppearance: 'press-to-locate', platform: 'field', description: 'Requires user tap before capturing GPS location' },
      { id: 'geopoint-hideinput', type: 'geopoint', label: 'Map Only', icon: 'MapPin', defaultAppearance: 'hide-input', platform: 'field', description: 'Shows read-only coordinates, no text input box' },
      { id: 'geopoint-geocode', type: 'geopoint', label: 'Geocode Search', icon: 'MapPin', defaultAppearance: 'geocode', description: 'Geopoint with address search for location lookup' },
      { id: 'geotrace', type: 'geotrace', label: 'Geotrace', icon: 'Route', platform: 'field', description: 'Collect a line (path or route) on a map' },
      { id: 'geoshape', type: 'geoshape', label: 'Geoshape', icon: 'Pentagon', platform: 'field', description: 'Collect a polygon (area boundary) on a map' },
    ],
  },
  {
    id: 'datetime',
    label: 'Date & Time',
    icon: 'Calendar',
    items: [
      { id: 'date', type: 'date', label: 'Date', icon: 'Calendar', description: 'Date picker (calendar input)' },
      { id: 'date-year', type: 'date', label: 'Year Only', icon: 'Calendar', defaultAppearance: 'year', platform: 'field', description: 'Year-only selector with increment/decrement' },
      { id: 'date-month-year', type: 'date', label: 'Month-Year', icon: 'Calendar', defaultAppearance: 'month-year', platform: 'field', description: 'Month and year selector' },
      { id: 'date-week', type: 'date', label: 'Week Number', icon: 'Calendar', defaultAppearance: 'week-number', platform: 'field', description: 'Calendar picker that returns the week number' },
      { id: 'time', type: 'time', label: 'Time', icon: 'Clock', description: 'Time-of-day input' },
      { id: 'datetime', type: 'datetime', label: 'Date & Time', icon: 'CalendarClock', description: 'Combined date and time input' },
    ],
  },
  {
    id: 'media',
    label: 'Media & Files',
    icon: 'Camera',
    items: [
      { id: 'image', type: 'image', label: 'Photo', icon: 'Camera', description: 'Capture a photo using the device camera' },
      { id: 'image-signature', type: 'image', label: 'Signature', icon: 'Pen', defaultAppearance: 'signature', description: 'Pop-up canvas for capturing signatures as JPG' },
      { id: 'image-draw', type: 'image', label: 'Draw', icon: 'Pen', defaultAppearance: 'draw', platform: 'field', description: 'Freehand sketch canvas with drawing tools' },
      { id: 'image-annotate', type: 'image', label: 'Annotate', icon: 'Camera', defaultAppearance: 'annotate', platform: 'field', description: 'Take a photo then add graphics and text overlay' },
      { id: 'image-spike', type: 'image', label: 'Spike', icon: 'Camera', defaultAppearance: 'spike', platform: 'field', description: 'Photo with laser measurement via Spike app' },
      { id: 'image-spike-full', type: 'image', label: 'Spike Full', icon: 'Camera', defaultAppearance: 'spike-full-measure', platform: 'field', description: 'Extended Spike measurements (distance, area, length)' },
      { id: 'image-spike-p2p', type: 'image', label: 'Spike Point-to-Point', icon: 'Camera', defaultAppearance: 'spike-point-to-point', platform: 'field', description: 'Point-to-point distance measurement via Spike' },
      { id: 'image-newfront', type: 'image', label: 'New Front Camera', icon: 'Camera', defaultAppearance: 'new-front', platform: 'field', description: 'Opens front-facing (selfie) camera by default' },
      { id: 'image-newrear', type: 'image', label: 'New Rear Camera', icon: 'Camera', defaultAppearance: 'new-rear', platform: 'field', description: 'Opens rear-facing camera by default' },
      { id: 'image-multiline', type: 'image', label: 'Multi Photo', icon: 'Camera', defaultAppearance: 'multiline', description: 'Capture multiple images in a single question' },
      { id: 'audio', type: 'audio', label: 'Audio', icon: 'Mic', platform: 'field', description: 'Record an audio sample from the microphone' },
      { id: 'file', type: 'file', label: 'File Upload', icon: 'Paperclip', platform: 'field', description: 'Upload a file from the device' },
      { id: 'barcode', type: 'barcode', label: 'Barcode / QR', icon: 'ScanLine', platform: 'field', description: 'Scan a barcode or QR code using the camera' },
      { id: 'barcode-minimal', type: 'barcode', label: 'Barcode Minimal', icon: 'ScanLine', defaultAppearance: 'minimal', platform: 'field', description: 'Single scan button without visible text box' },
    ],
  },
  {
    id: 'structure',
    label: 'Structure',
    icon: 'Layers',
    items: [
      { id: 'note', type: 'note', label: 'Note', icon: 'StickyNote', description: 'Display read-only text on screen, takes no input' },
      { id: 'begin_group', type: 'begin_group', label: 'Group', icon: 'FolderOpen', description: 'Group related questions together' },
      { id: 'begin_group-compact', type: 'begin_group', label: 'Compact Group', icon: 'FolderOpen', defaultAppearance: 'compact', description: 'Group that starts collapsed, expandable by user' },
      { id: 'begin_group-fieldlist', type: 'begin_group', label: 'Field List', icon: 'FolderOpen', defaultAppearance: 'field-list', description: 'Group displayed on a separate page (with pages style)' },
      { id: 'begin_group-tablelist', type: 'begin_group', label: 'Table List', icon: 'FolderOpen', defaultAppearance: 'table-list', description: 'Formats select_one questions inside as a table' },
      { id: 'begin_repeat', type: 'begin_repeat', label: 'Repeat', icon: 'Repeat', description: 'Repeating set of questions (add multiple entries)' },
      { id: 'begin_repeat-compact', type: 'begin_repeat', label: 'Compact Repeat', icon: 'Repeat', defaultAppearance: 'compact', description: 'Repeat that starts collapsed, expandable by user' },
      { id: 'begin_repeat-fieldlist', type: 'begin_repeat', label: 'Field List Repeat', icon: 'Repeat', defaultAppearance: 'field-list', description: 'Each repeat entry displays on a separate page' },
    ],
  },
  {
    id: 'hidden-calc',
    label: 'Hidden & Calculated',
    icon: 'Calculator',
    items: [
      { id: 'calculate', type: 'calculate', label: 'Calculate', icon: 'Calculator', description: 'Hidden field that performs a calculation' },
      { id: 'hidden', type: 'hidden', label: 'Hidden', icon: 'EyeOff', description: 'Invisible field that stores a value (no UI)' },
    ],
  },
  {
    id: 'metadata',
    label: 'Metadata',
    icon: 'Info',
    items: [
      { id: 'start', type: 'start', label: 'Start Time', icon: 'Play', description: 'Auto-records when the survey was opened' },
      { id: 'end', type: 'end', label: 'End Time', icon: 'Square', description: 'Auto-records when the survey was submitted' },
      { id: 'username', type: 'username', label: 'Username', icon: 'User', description: 'Auto-populated with the signed-in account username' },
      { id: 'deviceid', type: 'deviceid', label: 'Device ID', icon: 'Smartphone', platform: 'field', description: 'Unique device identifier generated by Survey123' },
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
