/**
 * Complete Survey123 XLSForm Type Definitions
 *
 * Models the full specification including all question types,
 * appearances, parameters, Esri custom columns, and form settings.
 */

// ============================================================
// Question Types
// ============================================================

export type QuestionType =
  // Text Input
  | 'text'
  | 'email'
  | 'password'
  // Numeric
  | 'integer'
  | 'decimal'
  | 'range'
  // Selection
  | 'select_one'
  | 'select_multiple'
  | 'select_one_from_file'
  | 'select_multiple_from_file'
  | 'rank'
  // Geographic
  | 'geopoint'
  | 'geotrace'
  | 'geoshape'
  // Date/Time
  | 'date'
  | 'time'
  | 'datetime'
  // Media
  | 'image'
  | 'audio'
  | 'file'
  | 'barcode'
  // Metadata
  | 'start'
  | 'end'
  | 'username'
  | 'deviceid'
  // Structural
  | 'calculate'
  | 'note'
  | 'hidden'
  | 'begin_group'
  | 'end_group'
  | 'begin_repeat'
  | 'end_repeat';

// The XLS "type" column value — includes list_name for selects
export type XlsTypeValue = string;

// ============================================================
// Appearance Types
// ============================================================

export type AppearanceType =
  // Text
  | 'multiline'
  | 'predictivetext'
  | 'nopredictivetext'
  // Selection
  | 'minimal'
  | 'horizontal'
  | 'compact'
  | 'horizontal-compact'
  | 'likert'
  | 'autocomplete'
  | 'image-map'
  | 'yes_no_toggle'
  | 'randomize'
  // Numeric
  | 'distress'
  | 'spinner'
  | 'numbers'
  | 'calculator'
  | 'thousands-sep'
  | 'no-ticks'
  // Date
  | 'year'
  | 'month-year'
  | 'week-number'
  // Location
  | 'geocode'
  | 'rangefinder'
  | 'press-to-locate'
  | 'hide-input'
  // Image
  | 'signature'
  | 'draw'
  | 'annotate'
  | 'spike'
  | 'spike-full-measure'
  | 'spike-point-to-point'
  | 'new-front'
  | 'new-rear'
  // Barcode
  // (uses 'minimal')
  // Layout
  | 'table-list'
  | 'field-list'
  | 'hidden'
  // Search/Integration
  | 'search'
  | 'inframarker'
  | 'getinframarkerid'
  // Grid widths
  | 'w1' | 'w2' | 'w3' | 'w4';

// ============================================================
// Esri Field Types
// ============================================================

export type EsriFieldType =
  | 'esriFieldTypeString'
  | 'esriFieldTypeInteger'
  | 'esriFieldTypeSmallInteger'
  | 'esriFieldTypeDouble'
  | 'esriFieldTypeSingle'
  | 'esriFieldTypeDate'
  | 'esriFieldTypeDateOnly'
  | 'esriFieldTypeTimeOnly'
  | 'esriFieldTypeTimestampOffset'
  | 'esriFieldTypeGUID'
  | 'esriFieldTypeGlobalID'
  | 'esriFieldTypePointZ'
  | 'null';

// ============================================================
// Calculation Modes
// ============================================================

export type CalculationMode = 'auto' | 'manual' | 'always' | 'whenEmpty';

// ============================================================
// Core Question / Row Model
// ============================================================

export interface SurveyRow {
  // Internal ID (not exported to XLS)
  id: string;

  // === Required Columns ===
  type: QuestionType;
  /** For select_one/select_multiple, the list_name reference */
  listName?: string;
  /** For select_*_from_file, the CSV filename */
  fileName?: string;
  name: string;
  label: string;

  // === Common Optional Columns ===
  hint?: string;
  guidance_hint?: string;
  required?: string;           // 'yes', 'no', or expression
  required_message?: string;
  constraint?: string;
  constraint_message?: string;
  relevant?: string;
  calculation?: string;
  default?: string;
  appearance?: string;         // Can be space-separated combination
  choice_filter?: string;
  read_only?: string;          // 'yes' or 'no'
  repeat_count?: string;       // number or expression

  // === Media Columns ===
  'media::image'?: string;
  'media::audio'?: string;

  // === Body Columns ===
  'body::accept'?: string;
  'body::esri:inputMask'?: string;
  'body::esri:style'?: string;
  'body::esri:visible'?: string;
  'body::accuracyThreshold'?: string;

  // === Bind Columns (Esri Extensions) ===
  'bind::type'?: string;
  'bind::esri:fieldType'?: EsriFieldType;
  'bind::esri:fieldLength'?: number;
  'bind::esri:fieldAlias'?: string;
  'bind::esri:workflow'?: string;
  'bind::esri:parameters'?: string;
  'bind::esri:warning'?: string;
  'bind::esri:warning_message'?: string;
  'bind::saveInComplete'?: string;

  // === Parameters Column ===
  parameters?: string;

  // === Translation Columns (dynamic) ===
  // label::language, hint::language, etc.
  // Stored as key-value pairs
  translations?: Record<string, string>;
}

// ============================================================
// Choice Item (choices sheet)
// ============================================================

export interface ChoiceItem {
  id: string;
  list_name: string;
  name: string;
  label: string;
  'media::image'?: string;
  'media::audio'?: string;
  // Custom filter columns
  [key: string]: string | undefined;
}

// ============================================================
// Choice List (group of choices)
// ============================================================

export interface ChoiceList {
  id: string;
  list_name: string;
  choices: ChoiceItem[];
}

// ============================================================
// Form Settings (settings sheet)
// ============================================================

export interface FormSettings {
  form_title: string;
  form_id: string;
  instance_name?: string;
  version?: string;
  style?: string;
  default_language?: string;
  submission_url?: string;
}

// ============================================================
// Complete Form Model
// ============================================================

export interface SurveyForm {
  settings: FormSettings;
  survey: SurveyRow[];
  choiceLists: ChoiceList[];
}

// ============================================================
// Drag & Drop Types
// ============================================================

/** Which platforms support this question type/appearance */
export type PlatformSupport = 'both' | 'field' | 'web';

export interface DragItem {
  id: string;
  type: QuestionType;
  label: string;
  icon: string;
  /** Brief description shown on hover */
  description?: string;
  /** Pre-set appearance when dragged onto canvas (e.g. 'multiline', 'signature') */
  defaultAppearance?: string;
  /** Platform availability: 'both' (default), 'field' only, or 'web' only */
  platform?: PlatformSupport;
}

// ============================================================
// Question Category (for sidebar grouping)
// ============================================================

export interface QuestionCategory {
  id: string;
  label: string;
  icon: string;
  items: DragItem[];
}

// ============================================================
// UI State Types
// ============================================================

export type PanelView = 'properties' | 'choices' | 'settings' | 'preview';

export interface EditorState {
  selectedRowId: string | null;
  panelView: PanelView;
  isDragging: boolean;
  zoom: number;
}
