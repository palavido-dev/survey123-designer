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
  description?: string;
  instance_name?: string;
  version?: string;
  style?: string;
  default_language?: string;
  submission_url?: string;
  // Web app customization (exported as generated_note_ rows)
  submit_text?: string;
  thank_you_message?: string;
  footer_text?: string;
}

// ============================================================
// Media Files (CSV files for select_from_file, pulldata, etc.)
// ============================================================

export interface MediaFile {
  /** Unique ID */
  id: string;
  /** Filename (e.g. "species.csv") */
  fileName: string;
  /** Column names from the CSV header row */
  columns: string[];
  /** First N rows of data for value picking (max 200 rows stored) */
  sampleData: Record<string, string>[];
  /** Total row count in the original file */
  totalRows: number;
  /** Which question IDs reference this file */
  referencedBy: string[];
  /** Raw CSV text content — stored for editing and export */
  rawContent?: string;
}

// ============================================================
// Script Files (JavaScript functions for pulldata("@javascript"))
// ============================================================

export interface ScriptFile {
  /** Unique ID */
  id: string;
  /** Filename (e.g. "utils.js") — stored in scripts/ folder */
  fileName: string;
  /** Full JavaScript source code */
  content: string;
}

/** Parsed function signature extracted from a JS file */
export interface ParsedFunction {
  name: string;
  params: string[];
  /** The script file this function belongs to */
  fileName: string;
  /** Line number in the source (1-based) */
  line: number;
  /** JSDoc description if present */
  description?: string;
}

// ============================================================
// Drawing Palette Files (.palette for draw/annotate)
// ============================================================

/** Esri line symbol styles */
export type EsriLineStyle = 'esriSLSSolid' | 'esriSLSDash' | 'esriSLSDashDot' | 'esriSLSDashDotDot' | 'esriSLSDot' | 'esriSLSNull';

/** Esri fill symbol styles */
export type EsriFillStyle = 'esriSFSSolid' | 'esriSFSBackwardDiagonal' | 'esriSFSCross' | 'esriSFSDiagonalCross' | 'esriSFSForwardDiagonal' | 'esriSFSHorizontal' | 'esriSFSNull' | 'esriSFSVertical';

/** Esri simple marker styles */
export type EsriMarkerStyle = 'esriSMSCircle' | 'esriSMSCross' | 'esriSMSDiamond' | 'esriSMSSquare' | 'esriSMSX' | 'esriSMSTriangle';

export interface EsriOutline {
  type: 'esriSLS';
  color?: string;
  width?: number;
  style?: EsriLineStyle | number[];
}

export interface EsriLineSymbol {
  type: 'esriSLS';
  color?: string;
  width?: number;
  style?: EsriLineStyle | number[];
}

export interface EsriFillSymbol {
  type: 'esriSFS';
  color?: string;
  style?: EsriFillStyle;
  outline?: EsriOutline;
}

export interface EsriSimpleMarkerSymbol {
  type: 'esriSMS';
  style?: EsriMarkerStyle;
  color?: string;
  size?: number;
  outline?: EsriOutline;
}

export interface EsriPictureMarkerSymbol {
  type: 'esriPMS';
  url: string;
  width?: number;
  height?: number;
}

export type EsriSymbol = EsriLineSymbol | EsriFillSymbol | EsriSimpleMarkerSymbol | EsriPictureMarkerSymbol;

export interface EsriTextSymbol {
  type: 'esriTS';
  color?: string;
  font?: { size?: number; style?: 'italic'; weight?: 'bold' };
  horizontalAlignment?: 'left' | 'center' | 'right';
  verticalAlignment?: 'top' | 'middle' | 'bottom';
  haloColor?: string;
  haloSize?: string;
  backgroundColor?: string;
  borderLineColor?: string;
  borderLineSize?: string;
  anchor?: string;
}

export type PaletteToolType = 'line' | 'area' | 'marker' | 'text';
export type PaletteDrawType = 'line' | 'freehand' | 'polyline' | 'polygon' | 'smart' | 'arrowto' | 'arrowfrom' | 'arrowdouble' | 'multiline';
export type ArrowDecoration = 'arrowheadOpen' | 'arrowheadClosed' | 'arrowheadFilled';

export interface PaletteTool {
  id: string;
  type: PaletteToolType;
  label: string;
  drawType?: PaletteDrawType;
  symbol?: EsriSymbol;
  textSymbol?: EsriTextSymbol;
  multiline?: boolean;
  textAnchor?: string;
  beginDecoration?: ArrowDecoration;
  endDecoration?: ArrowDecoration;
}

export interface PaletteToolset {
  id: string;
  title: string;
  icon?: { name?: string; url?: string };
  tools: PaletteTool[];
}

export interface PaletteFile {
  id: string;
  /** Filename without extension (e.g. "Electrical") */
  name: string;
  title: string;
  description?: string;
  icon?: { name?: string; url?: string };
  toolsets: PaletteToolset[];
}

// ============================================================
// Complete Form Model
// ============================================================

export interface SurveyForm {
  settings: FormSettings;
  survey: SurveyRow[];
  choiceLists: ChoiceList[];
  mediaFiles: MediaFile[];
  scriptFiles: ScriptFile[];
  paletteFiles?: PaletteFile[];
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

export type PanelView = 'properties' | 'choices' | 'choiceLists' | 'settings' | 'media' | 'scripts' | 'preview';

export interface EditorState {
  selectedRowId: string | null;
  panelView: PanelView;
  isDragging: boolean;
  zoom: number;
}
