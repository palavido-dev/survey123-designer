/**
 * XLSX Export Engine
 *
 * Converts the internal SurveyForm model to a Survey123-compatible
 * XLSX file matching the full Advanced Template format from Survey123 Connect.
 * Includes all 40 survey columns, 8 choice columns, 8 settings columns,
 * plus reference sheets (Version, Question types, Appearances, Field types, Reserved).
 */

import * as XLSX from 'xlsx-js-style';
import { SurveyForm, SurveyRow, ChoiceList, ChoiceItem, FormSettings, QuestionType } from '../types/survey';
import { buildTypeColumnValue } from '../data/questionTypes';

// ============================================================
// Full Survey Sheet Columns (matching Survey123 Connect Advanced Template)
// ============================================================

const SURVEY_COLUMNS = [
  'type',
  'name',
  'label',
  'hint',
  'guidance_hint',
  'appearance',
  'required',
  'required_message',
  'readonly',
  'default',
  'calculation',
  'constraint',
  'constraint_message',
  'relevant',
  'choice_filter',
  'repeat_count',
  'media::audio',
  'media::image',
  'bind::type',
  'bind::esri:fieldType',
  'bind::esri:fieldLength',
  'bind::esri:fieldAlias',
  'body::esri:style',
  'bind::esri:parameters',
  'parameters',
  'body::accept',
  'body::esri:visible',
  'body::esri:inputMask',
  'label::language (xx)',
  'hint::language (xx)',
  'guidance_hint::language (xx)',
  'required_message::language (xx)',
  'constraint_message::language (xx)',
  'media::audio::language (xx)',
  'media::image::language (xx)',
  'body::accuracyThreshold',
  'bind::esri:warning',
  'bind::esri:warning_message',
  'bind::saveIncomplete',
  'bind::esri:workflow',
];

// ============================================================
// Full Choices Sheet Columns
// ============================================================

const CHOICES_COLUMNS = [
  'list_name',
  'name',
  'label',
  'media::audio',
  'media::image',
  'label::language (xx)',
  'media::audio::language (xx)',
  'media::image::language (xx)',
];

// ============================================================
// Full Settings Sheet Columns
// ============================================================

const SETTINGS_COLUMNS = [
  'form_title',
  'form_id',
  'instance_name',
  'submission_url',
  'default_language',
  'version',
  'style',
  'namespaces',
];

// ============================================================
// Export Function
// ============================================================

export function exportToXlsx(form: SurveyForm): void {
  const wb = XLSX.utils.book_new();

  // --- Survey Sheet (always all columns) ---
  const surveyData = buildSurveySheet(form.survey);
  const surveyWs = XLSX.utils.aoa_to_sheet(surveyData);
  applyColumnWidths(surveyWs, surveyData);
  applyGroupRepeatShading(surveyWs, form.survey, surveyData[0].length);
  XLSX.utils.book_append_sheet(wb, surveyWs, 'survey');

  // --- Choices Sheet (always all columns) ---
  const choicesData = buildChoicesSheet(form.choiceLists);
  const choicesWs = XLSX.utils.aoa_to_sheet(choicesData);
  applyColumnWidths(choicesWs, choicesData);
  XLSX.utils.book_append_sheet(wb, choicesWs, 'choices');

  // --- Settings Sheet (always all columns) ---
  const settingsData = buildSettingsSheet(form.settings);
  const settingsWs = XLSX.utils.aoa_to_sheet(settingsData);
  applyColumnWidths(settingsWs, settingsData);
  XLSX.utils.book_append_sheet(wb, settingsWs, 'settings');

  // --- Reference Sheets ---
  addVersionSheet(wb);
  addQuestionTypesSheet(wb);
  addAppearancesSheet(wb);
  addFieldTypesSheet(wb);
  addReservedSheet(wb);

  // --- Download ---
  const fileName = `${form.settings.form_id || 'survey'}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ============================================================
// Build Survey Sheet — ALL 40 columns always present
// ============================================================

function buildSurveySheet(rows: SurveyRow[]): string[][] {
  const header = [...SURVEY_COLUMNS];
  const data: string[][] = [header];

  // Map internal field names to template column names
  const fieldMap: Record<string, string> = {
    'read_only': 'readonly',
    'bind::saveInComplete': 'bind::saveIncomplete',
  };

  for (const row of rows) {
    const rowData: string[] = SURVEY_COLUMNS.map((col) => {
      if (col === 'type') return buildTypeColumnValue(row);

      // Check direct match first
      let val = (row as Record<string, any>)[col];

      // Check field name mapping (our internal names vs template names)
      if (val === undefined || val === null || val === '') {
        for (const [internalName, templateName] of Object.entries(fieldMap)) {
          if (templateName === col) {
            val = (row as Record<string, any>)[internalName];
          }
        }
      }

      if (val === undefined || val === null) return '';
      return val.toString();
    });
    data.push(rowData);
  }

  return data;
}

// ============================================================
// Build Choices Sheet — ALL 8 columns always present
// ============================================================

function buildChoicesSheet(choiceLists: ChoiceList[]): string[][] {
  // Start with standard columns, then add any custom filter columns
  const customColumns = new Set<string>();
  for (const list of choiceLists) {
    for (const choice of list.choices) {
      for (const key of Object.keys(choice)) {
        if (!CHOICES_COLUMNS.includes(key) && key !== 'id') {
          customColumns.add(key);
        }
      }
    }
  }

  const allColumns = [...CHOICES_COLUMNS, ...Array.from(customColumns)];
  const data: string[][] = [allColumns];

  for (const list of choiceLists) {
    for (const choice of list.choices) {
      const rowData = allColumns.map((col) => {
        const val = (choice as Record<string, any>)[col];
        return val?.toString() || '';
      });
      data.push(rowData);
    }
  }

  return data;
}

// ============================================================
// Build Settings Sheet — ALL 8 columns always present
// ============================================================

function buildSettingsSheet(settings: FormSettings): string[][] {
  const header = [...SETTINGS_COLUMNS];
  const values = SETTINGS_COLUMNS.map((col) => {
    if (col === 'namespaces') return 'esri="https://esri.com/xforms"';
    const val = (settings as Record<string, any>)[col];
    return val?.toString() || '';
  });

  return [header, values];
}

// ============================================================
// Reference Sheets (matching Survey123 Connect Advanced Template)
// ============================================================

function addVersionSheet(wb: XLSX.WorkBook): void {
  const data = [
    ['ArcGIS Survey123 XLSForm Template \u2013 Advanced'],
    [],
    ['Template version:', '3.19'],
    ['Revision date:', new Date().toISOString().split('T')[0]],
    [],
    ['Generated by Survey123 Designer \u2014 a visual XLSForm builder.'],
    ['This template includes all supported XLSForm features. Please refer to the Question types and Appearances sheets for Survey123 field app and Survey123 web app compatibility.'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 50 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Version');
}

function addQuestionTypesSheet(wb: XLSX.WorkBook): void {
  const data = [
    ['Question type', 'Description'],
    ['text', 'Free text response.'],
    ['integer', 'Integer (i.e. whole number) input.'],
    ['decimal', 'Decimal input.'],
    ['date', 'Date input.'],
    ['time', 'Time input.'],
    ['dateTime', 'Date and time input.'],
    ['select_one list_name', "Multiple choice question; only one answer can be selected. Replace 'list_name' with the name of your choice list on the choices sheet."],
    ['select_one_from_file file_name.csv', "Multiple choice question; only one answer can be selected. Replace 'file_name.csv' with the name of the file located in the survey's media folder that contains the list of choices."],
    ['select_multiple list_name', "Multiple choice question; multiple answers can be selected. Replace 'list_name' with the name of your choice list on the choices sheet."],
    ['select_multiple_from_file file_name.csv', "Multiple choice question; multiple answers can be selected. Replace 'file_name.csv' with the name of the file located in the survey's media folder that contains the list of choices."],
    ['rank list_name', "Ranking question; rank the options in order of preference. Replace 'list_name' with the name of your choice list on the choices sheet."],
    ['note', 'Display a note on the screen, takes no input. Optionally use with calculation.'],
    ['geopoint', 'Collect a single set of GPS coordinates.'],
    ['geotrace', 'Record a line feature (collection of two or more GPS coordinates).'],
    ['geoshape', 'Record a polygon feature (collection of three or more GPS coordinates forming a closed shape).'],
    ['image', 'Take a photo or upload an image file.'],
    ['audio', 'Take an audio recording or upload an audio file.'],
    ['file', 'Upload a file.'],
    ['barcode', 'Scan a barcode, QR code, or NFC tag.'],
    ['begin group', 'Begin a group of questions.'],
    ['end group', 'End a group of questions.'],
    ['begin repeat', 'Begin a set of repeating questions.'],
    ['end repeat', 'End a set of repeating questions.'],
    ['calculate', 'Perform a calculation on values in the form. Not displayed on the form.'],
    ['hidden', 'A field not displayed on the form that can accept a value through calculation or default.'],
    ['range', 'A slider-based number input.'],
    ['username', "Automatically captures the username of the signed-in user. Not displayed on form. Use with 'esri:fieldType' to control storage."],
    ['email', 'Free text response with email validation.'],
    ['start', 'Start date and time of the survey.'],
    ['end', 'End date and time of the survey.'],
    ['deviceid', "Collect the unique device ID. Use pulldata('@property', 'deviceid') for cross-platform support."],
    ['password', 'Masked text input for passwords.'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 40 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Question types');
}

function addAppearancesSheet(wb: XLSX.WorkBook): void {
  const data = [
    ['Appearance', 'Applies to', 'Description', 'Field app', 'Web app'],
    ['minimal', 'select_one, select_multiple, barcode, begin repeat', 'Presents questions in a more space-efficient manner.', 'Yes', 'Yes'],
    ['minimal compact', 'begin repeat', 'Group of questions is displayed both collapsed and hidden.', 'Yes', 'Yes'],
    ['compact', 'select_one, select_multiple, begin group, begin repeat', "For select questions, presents choices horizontally in a space-efficient manner. Use 'compact-n' to set max columns. Groups and repeats will appear collapsed.", 'Yes', 'Yes'],
    ['horizontal', 'select_one, select_multiple', 'Presents choices horizontally in columns of equal width.', 'Yes', 'Yes'],
    ['horizontal-compact', 'select_one, select_multiple', "Same as 'compact' for select questions.", 'Yes', 'Yes'],
    ['image-map', 'select_one, select_multiple', "Displays an SVG image with selectable regions. SVG file must be stored in the survey's media folder.", 'Yes', 'No'],
    ['autocomplete', 'select_one', 'Presents choices in a drop-down menu, with text input to narrow down options.', 'Yes', 'Yes'],
    ['likert', 'select_one', 'Presents choices as a Likert scale.', 'Yes', 'Yes'],
    ['search()', 'select_one, select_multiple', "Populates the choice list with values from a CSV file in the survey's media folder or an existing feature layer or table.", 'Yes', 'Yes'],
    ['multiline', 'text, image, file', 'Presents a text question as a multiline text box. Allows multiple attachments for an image or file question.', 'Yes', 'Yes'],
    ['geocode', 'text, geopoint', 'Presents a search box for address lookup with geocoding suggestions.', 'Yes', 'Yes'],
    ['numbers', 'integer, decimal', 'Presents numeric keyboard on mobile devices.', 'Yes', 'No'],
    ['calculator', 'integer, decimal', 'Presents calculator-style keyboard.', 'Yes', 'No'],
    ['spinner', 'integer, decimal', 'Provides increment/decrement buttons for numeric values.', 'Yes', 'Yes'],
    ['thousands-sep', 'integer, decimal', 'Displays numbers with thousands separators.', 'Yes', 'Yes'],
    ['distress', 'integer', 'Presents a 0-10 distress/pain scale.', 'Yes', 'Yes'],
    ['signature', 'image', 'Presents a signature capture popup.', 'Yes', 'Yes'],
    ['draw', 'image', 'Presents a drawing canvas for freehand sketching.', 'Yes', 'Yes'],
    ['annotate', 'image', 'Allows drawing annotations on a captured image.', 'Yes', 'No'],
    ['year', 'date', 'Presents year-only selector.', 'Yes', 'Yes'],
    ['month-year', 'date', 'Presents month and year selector.', 'Yes', 'Yes'],
    ['week-number', 'date', 'Presents date as a week number.', 'Yes', 'Yes'],
    ['no-ticks', 'range', 'Range slider without tick marks.', 'Yes', 'Yes'],
    ['press-to-locate', 'geopoint', 'Captures location only when user presses the button.', 'Yes', 'No'],
    ['hide-input', 'geopoint', 'Hides the coordinate input display.', 'Yes', 'No'],
    ['new-front', 'image', 'Opens front camera by default.', 'Yes', 'No'],
    ['new-rear', 'image', 'Opens rear camera by default.', 'Yes', 'No'],
    ['randomize', 'select_one, select_multiple', 'Randomizes the order of choices.', 'Yes', 'No'],
    ['table-list', 'begin group', 'Displays questions in the group in a tabular layout.', 'Yes', 'Yes'],
    ['field-list', 'begin group, begin repeat', 'Displays group/repeat on a separate page.', 'Yes', 'Yes'],
    ['w1', 'any question in a grid group', 'Sets the width of a question in a grid group to 1 column.', 'Yes', 'Yes'],
    ['w2', 'any question in a grid group', 'Sets the width of a question in a grid group to 2 columns.', 'Yes', 'Yes'],
    ['w3', 'any question in a grid group', 'Sets the width of a question in a grid group to 3 columns.', 'Yes', 'Yes'],
    ['w4', 'any question in a grid group', 'Sets the width of a question in a grid group to 4 columns.', 'Yes', 'Yes'],
    ['hidden', 'any', 'Hides the question from the form while still accepting values.', 'Yes', 'Yes'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 22 }, { wch: 45 }, { wch: 70 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Appearances');
}

function addFieldTypesSheet(wb: XLSX.WorkBook): void {
  const data = [
    ['Esri field types', 'Description', 'Learn more'],
    ['esriFieldTypeDate', 'Day, month, year, and time values in local time', 'https://doc.arcgis.com/en/survey123/desktop/create-surveys/esricustomcolumns.htm'],
    ['esriFieldTypeDateOnly', 'Day, month, and year values', ''],
    ['esriFieldTypeTimeOnly', 'Time values', ''],
    ['esriFieldTypeTimestampOffset', 'Day, month, year, and time values with UTC offset', ''],
    ['esriFieldTypeSingle', 'Single-precision floating point numbers', ''],
    ['esriFieldTypeDouble', 'Double-precision floating point numbers', ''],
    ['esriFieldTypeInteger', 'Whole numbers', ''],
    ['esriFieldTypeSmallInteger', 'Small whole numbers (from -32,768 to 32,767)', ''],
    ['esriFieldTypeBigInteger', 'Whole numbers (from -9,007,199,254,740,991 to 9,007,199,254,740,991)', ''],
    ['esriFieldTypeString', 'A series of alphanumeric symbols', ''],
    ['esriFieldTypeGUID', 'Globally unique identifier', ''],
    ['esriFieldTypeGlobalID', 'Global ID for geodatabase features', ''],
    ['esriFieldTypePointZ', 'Point geometry with z-value', ''],
    ['null', 'Omits the question from the feature layer', ''],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 30 }, { wch: 60 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Field types');
}

function addReservedSheet(wb: XLSX.WorkBook): void {
  // Common SQL/geodatabase reserved keywords that cannot be used as field names
  const reserved = [
    'A','ABS','ABSENT','ABSOLUTE','ACCESS','ACCORDING','ACCOUNT','ACTION','ACTIVATE',
    'ADA','ADD','ADMIN','AFTER','AGGREGATE','ALIAS','ALL','ALLOCATE','ALSO','ALTER',
    'ALWAYS','ANALYSE','ANALYZE','AND','ANY','ARE','ARRAY','AS','ASC','ASENSITIVE',
    'ASSERTION','ASSIGNMENT','ASYMMETRIC','AT','ATOMIC','ATTRIBUTE','ATTRIBUTES',
    'AUTHORIZATION','AVG','BACKWARD','BASE64','BEFORE','BEGIN','BERNOULLI','BETWEEN',
    'BIGINT','BINARY','BIT','BITVAR','BIT_LENGTH','BLOB','BLOCKED','BOOLEAN','BOTH',
    'BREADTH','BY','CACHE','CALL','CALLED','CARDINALITY','CASCADE','CASCADED','CASE',
    'CAST','CATALOG','CATALOG_NAME','CEIL','CEILING','CHAIN','CHANGE','CHAR',
    'CHARACTER','CHARACTERISTICS','CHARACTERS','CHARACTER_LENGTH','CHARACTER_SET_CATALOG',
    'CHARACTER_SET_NAME','CHARACTER_SET_SCHEMA','CHAR_LENGTH','CHECK','CHECKED',
    'CHECKPOINT','CLASS','CLASS_ORIGIN','CLOB','CLOSE','CLUSTER','COALESCE','COBOL',
    'COLLATE','COLLATION','COLLATION_CATALOG','COLLATION_NAME','COLLATION_SCHEMA',
    'COLLECT','COLUMN','COLUMNS','COLUMN_NAME','COMMAND_FUNCTION','COMMAND_FUNCTION_CODE',
    'COMMENT','COMMIT','COMMITTED','COMPLETION','COMPRESS','CONDITION','CONDITION_NUMBER',
    'CONFIGURATION','CONNECT','CONNECTION','CONNECTION_NAME','CONSTRAINT','CONSTRAINTS',
    'CONSTRAINT_CATALOG','CONSTRAINT_NAME','CONSTRAINT_SCHEMA','CONSTRUCTOR','CONTAINS',
    'CONTINUE','CONVERSION','CONVERT','COPY','CORR','CORRESPONDING','COUNT','COVAR_POP',
    'COVAR_SAMP','CREATE','CREATEDB','CREATEROLE','CREATEUSER','CROSS','CSV','CUBE',
    'CUME_DIST','CURRENT','CURRENT_DATE','CURRENT_DEFAULT_TRANSFORM_GROUP','CURRENT_PATH',
    'CURRENT_ROLE','CURRENT_TIME','CURRENT_TIMESTAMP','CURRENT_TRANSFORM_GROUP_FOR_TYPE',
    'CURRENT_USER','CURSOR','CURSOR_NAME','CYCLE','DATA','DATABASE','DATE','DATETIME',
    'DATETIME_INTERVAL_CODE','DATETIME_INTERVAL_PRECISION','DAY','DEALLOCATE','DEC',
    'DECIMAL','DECLARE','DEFAULT','DEFAULTS','DEFERRABLE','DEFERRED','DEFINED','DEFINER',
    'DEGREE','DELETE','DELIMITER','DELIMITERS','DENSE_RANK','DEPTH','DEREF','DERIVED',
    'DESC','DESCRIBE','DESCRIPTOR','DESTROY','DESTRUCTOR','DETERMINISTIC','DIAGNOSTICS',
    'DICTIONARY','DISABLE','DISCONNECT','DISPATCH','DISTINCT','DO','DOMAIN','DOUBLE',
    'DROP','DYNAMIC','DYNAMIC_FUNCTION','DYNAMIC_FUNCTION_CODE','EACH','ELEMENT','ELSE',
    'ENABLE','ENCODING','ENCRYPTED','END','END-EXEC','EQUALS','ESCAPE','EVERY','EXCEPT',
    'EXCEPTION','EXCLUDE','EXCLUDING','EXCLUSIVE','EXEC','EXECUTE','EXISTING','EXISTS',
    'EXP','EXPLAIN','EXTERNAL','EXTRACT','FALSE','FETCH','FILE','FILTER','FINAL','FIRST',
    'FLOAT','FLOOR','FOLLOWING','FOR','FORCE','FOREIGN','FORTRAN','FORWARD','FOUND',
    'FREE','FREEZE','FROM','FULL','FUNCTION','FUSION','GENERAL','GENERATED','GET',
    'GLOBAL','GO','GOTO','GRANT','GRANTED','GREATEST','GROUP','GROUPING','HANDLER',
    'HAVING','HEADER','HIERARCHY','HOLD','HOST','HOUR','IDENTITY','IF','IGNORE','ILIKE',
    'IMMEDIATE','IMMUTABLE','IMPLEMENTATION','IMPLICIT','IN','INCLUDING','INCREMENT',
    'INDEX','INDICATOR','INFIX','INHERIT','INHERITS','INITIALIZE','INITIALLY','INNER',
    'INOUT','INPUT','INSENSITIVE','INSERT','INSTANCE','INSTANTIABLE','INSTEAD','INT',
    'INTEGER','INTERSECT','INTERSECTION','INTERVAL','INTO','INVOKER','IS','ISNULL',
    'ISOLATION','ITERATE','JOIN','KEY','KEY_MEMBER','KEY_TYPE','LANCOMPILER','LANGUAGE',
    'LARGE','LAST','LATERAL','LEADING','LEAST','LEFT','LENGTH','LESS','LEVEL','LIKE',
    'LIMIT','LISTEN','LN','LOAD','LOCAL','LOCALTIME','LOCALTIMESTAMP','LOCATION',
    'LOCATOR','LOCK','LOGIN','LOWER','MAP','MATCH','MATCHED','MAX','MAXVALUE',
    'MEMBER','MERGE','MESSAGE_LENGTH','MESSAGE_OCTET_LENGTH','MESSAGE_TEXT','METHOD',
    'MIN','MINUTE','MINVALUE','MOD','MODE','MODIFIES','MODIFY','MODULE','MONTH','MORE',
    'MOVE','MULTISET','MUMPS','NAME','NAMES','NATIONAL','NATURAL','NCHAR','NCLOB',
    'NESTING','NEW','NEXT','NO','NOCREATEDB','NOCREATEROLE','NOCREATEUSER','NOINHERIT',
    'NOLOGIN','NONE','NORMALIZE','NORMALIZED','NOSUPERUSER','NOT','NOTHING','NOTIFY',
    'NOTNULL','NOWAIT','NULL','NULLABLE','NULLIF','NULLS','NUMBER','NUMERIC','OBJECT',
    'OBJECTID','OCTET_LENGTH','OF','OFF','OFFSET','OIDS','OLD','ON','ONLY','OPEN',
    'OPERATION','OPERATOR','OPTION','OPTIONS','OR','ORDER','ORDERING','ORDINALITY',
    'OTHERS','OUT','OUTER','OUTPUT','OVER','OVERLAPS','OVERLAY','OVERRIDING','OWNER',
    'PAD','PARAMETER','PARAMETERS','PARAMETER_MODE','PARAMETER_NAME',
    'PARAMETER_ORDINAL_POSITION','PARAMETER_SPECIFIC_CATALOG','PARAMETER_SPECIFIC_NAME',
    'PARAMETER_SPECIFIC_SCHEMA','PARTIAL','PARTITION','PASCAL','PASSWORD','PATH',
    'PERCENTILE_CONT','PERCENTILE_DISC','PERCENT_RANK','PLACING','PLI','POSITION',
    'POSTFIX','POWER','PRECEDING','PRECISION','PREFIX','PREORDER','PREPARE','PREPARED',
    'PRESERVE','PRIMARY','PRIOR','PRIVILEGES','PROCEDURAL','PROCEDURE','PUBLIC','QUOTE',
    'RANGE','RANK','READ','READS','REAL','RECHECK','RECURSIVE','REF','REFERENCES',
    'REFERENCING','REGR_AVGX','REGR_AVGY','REGR_COUNT','REGR_INTERCEPT','REGR_R2',
    'REGR_SLOPE','REGR_SXX','REGR_SXY','REGR_SYY','REINDEX','RELATIVE','RELEASE',
    'RENAME','REPEATABLE','REPLACE','RESET','RESTART','RESTRICT','RESULT','RETURN',
    'RETURNED_CARDINALITY','RETURNED_LENGTH','RETURNED_OCTET_LENGTH','RETURNED_SQLSTATE',
    'RETURNS','REVOKE','RIGHT','ROLE','ROLLBACK','ROLLUP','ROUTINE','ROUTINE_CATALOG',
    'ROUTINE_NAME','ROUTINE_SCHEMA','ROW','ROWS','ROW_COUNT','ROW_NUMBER','RULE',
    'SAVEPOINT','SCALE','SCHEMA','SCHEMA_NAME','SCOPE','SCOPE_CATALOG','SCOPE_NAME',
    'SCOPE_SCHEMA','SCROLL','SEARCH','SECOND','SECTION','SECURITY','SELECT','SELF',
    'SENSITIVE','SEQUENCE','SERIALIZABLE','SERVER_NAME','SESSION','SESSION_USER','SET',
    'SETOF','SETS','SHAPE','SHARE','SIMILAR','SIMPLE','SIZE','SMALLINT','SOME','SOURCE',
    'SPACE','SPECIFIC','SPECIFICTYPE','SPECIFIC_NAME','SQL','SQLCODE','SQLERROR',
    'SQLEXCEPTION','SQLSTATE','SQLWARNING','SQRT','STABLE','START','STATE','STATEMENT',
    'STATIC','STATISTICS','STDDEV_POP','STDDEV_SAMP','STDIN','STDOUT','STORAGE','STRICT',
    'STRUCTURE','STYLE','SUBCLASS_ORIGIN','SUBLIST','SUBMULTISET','SUBSTRING','SUM',
    'SUPERUSER','SYMMETRIC','SYSID','SYSTEM','SYSTEM_USER','TABLE','TABLESAMPLE',
    'TABLESPACE','TABLE_NAME','TEMP','TEMPLATE','TEMPORARY','TERMINATE','TEXT','THAN',
    'THEN','TIES','TIME','TIMESTAMP','TIMEZONE_HOUR','TIMEZONE_MINUTE','TO','TOAST',
    'TOP_LEVEL_COUNT','TRAILING','TRANSACTION','TRANSACTIONS_COMMITTED',
    'TRANSACTIONS_ROLLED_BACK','TRANSACTION_ACTIVE','TRANSFORM','TRANSFORMS','TRANSLATE',
    'TRANSLATION','TREAT','TRIGGER','TRIGGER_CATALOG','TRIGGER_NAME','TRIGGER_SCHEMA',
    'TRIM','TRUE','TRUNCATE','TRUSTED','TYPE','UESCAPE','UNBOUNDED','UNCOMMITTED',
    'UNDER','UNENCRYPTED','UNION','UNIQUE','UNKNOWN','UNLISTEN','UNNAMED','UNNEST',
    'UNTIL','UPDATE','UPPER','USAGE','USER','USER_DEFINED_TYPE_CATALOG',
    'USER_DEFINED_TYPE_CODE','USER_DEFINED_TYPE_NAME','USER_DEFINED_TYPE_SCHEMA','USING',
    'VACUUM','VALID','VALIDATOR','VALUE','VALUES','VARCHAR','VARIABLE','VARYING',
    'VAR_POP','VAR_SAMP','VERBOSE','VIEW','VOLATILE','WHEN','WHENEVER','WHERE',
    'WIDTH_BUCKET','WINDOW','WITH','WITHIN','WITHOUT','WORK','WRITE','XML','XMLAGG',
    'XMLATTRIBUTES','XMLBINARY','XMLCAST','XMLCOMMENT','XMLCONCAT','XMLDOCUMENT',
    'XMLELEMENT','XMLEXISTS','XMLFOREST','XMLITERATE','XMLNAMESPACES','XMLPARSE',
    'XMLPI','XMLQUERY','XMLROOT','XMLSCHEMA','XMLSERIALIZE','XMLTABLE','XMLTEXT',
    'XMLVALIDATE','YEAR','YES','ZONE',
  ];

  const data: string[][] = [
    ['Reserved keywords', 'These common database keywords cannot be used as the name of a question.'],
    ...reserved.map((kw) => [kw]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 30 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Reserved');
}

// ============================================================
// Helpers
// ============================================================

// ============================================================
// Row Shading for Groups & Repeats
// ============================================================

/** Light purple for begin_group / end_group rows */
const GROUP_FILL = { fgColor: { rgb: 'E8DEF8' } };
/** Light teal for begin_repeat / end_repeat rows */
const REPEAT_FILL = { fgColor: { rgb: 'D0F0E8' } };
/** Dark header style */
const HEADER_FILL = { fgColor: { rgb: '374151' } };
const HEADER_FONT = { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 };

function applyGroupRepeatShading(
  ws: XLSX.WorkSheet,
  rows: SurveyRow[],
  numCols: number
): void {
  // Style header row (row 0 in sheet = row 1 in Excel, cell address R=0)
  for (let c = 0; c < numCols; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) {
      ws[addr].s = { fill: HEADER_FILL, font: HEADER_FONT };
    }
  }

  // Style data rows — rows array is offset by 1 (header is row 0)
  for (let i = 0; i < rows.length; i++) {
    const rowType = rows[i].type;
    let fill: { fgColor: { rgb: string } } | null = null;

    if (rowType === 'begin_group' || rowType === 'end_group') {
      fill = GROUP_FILL;
    } else if (rowType === 'begin_repeat' || rowType === 'end_repeat') {
      fill = REPEAT_FILL;
    }

    if (fill) {
      const excelRow = i + 1; // +1 for header
      for (let c = 0; c < numCols; c++) {
        const addr = XLSX.utils.encode_cell({ r: excelRow, c });
        if (!ws[addr]) {
          // Create empty styled cell so the background shows
          ws[addr] = { t: 's', v: '', s: { fill } };
        } else {
          ws[addr].s = { ...(ws[addr].s || {}), fill };
        }
      }
    }
  }
}

function applyColumnWidths(ws: XLSX.WorkSheet, data: string[][]): void {
  if (data.length === 0) return;
  const colWidths = data[0].map((header, colIdx) => {
    let maxLen = header.length;
    for (const row of data) {
      const cellLen = (row[colIdx] || '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    }
    return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
  });
  ws['!cols'] = colWidths;
}

// ============================================================
// Import from XLSX (for opening existing forms)
// ============================================================

export function importFromXlsx(file: File): Promise<SurveyForm> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        const form = parseWorkbook(wb);
        resolve(form);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function parseWorkbook(wb: XLSX.WorkBook): SurveyForm {
  const surveySheet = wb.Sheets['survey'];
  const choicesSheet = wb.Sheets['choices'];
  const settingsSheet = wb.Sheets['settings'];

  if (!surveySheet) throw new Error('Missing "survey" sheet');

  // Parse survey rows — skip empty rows
  const surveyData = XLSX.utils.sheet_to_json<Record<string, any>>(surveySheet, {
    defval: '',
  });

  const survey: SurveyRow[] = surveyData
    .filter((raw) => {
      const typeStr = (raw['type'] || '').toString().trim();
      return typeStr.length > 0;
    })
    .map((raw) => {
      const typeStr = (raw['type'] || '').toString().trim();
      const { questionType, listName, fileName } = parseTypeColumn(typeStr);

      return {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        type: questionType as QuestionType,
        listName,
        fileName,
        name: raw['name'] || '',
        label: raw['label'] || '',
        hint: raw['hint'] || undefined,
        guidance_hint: raw['guidance_hint'] || undefined,
        required: raw['required'] || undefined,
        required_message: raw['required_message'] || undefined,
        constraint: raw['constraint'] || undefined,
        constraint_message: raw['constraint_message'] || undefined,
        relevant: raw['relevant'] || undefined,
        calculation: raw['calculation'] || undefined,
        default: raw['default'] || undefined,
        appearance: raw['appearance'] || undefined,
        choice_filter: raw['choice_filter'] || undefined,
        read_only: raw['readonly'] || raw['read_only'] || undefined,
        repeat_count: raw['repeat_count']?.toString() || undefined,
        'media::image': raw['media::image'] || undefined,
        'media::audio': raw['media::audio'] || undefined,
        'body::accept': raw['body::accept'] || undefined,
        'body::esri:inputMask': raw['body::esri:inputMask'] || undefined,
        'body::esri:style': raw['body::esri:style'] || undefined,
        'body::esri:visible': raw['body::esri:visible'] || undefined,
        'bind::type': raw['bind::type'] || undefined,
        'bind::esri:fieldType': raw['bind::esri:fieldType'] || undefined,
        'bind::esri:fieldLength': raw['bind::esri:fieldLength']
          ? Number(raw['bind::esri:fieldLength'])
          : undefined,
        'bind::esri:fieldAlias': raw['bind::esri:fieldAlias'] || undefined,
        'bind::esri:workflow': raw['bind::esri:workflow'] || undefined,
        'bind::esri:parameters': raw['bind::esri:parameters'] || undefined,
        'bind::saveInComplete': raw['bind::saveIncomplete'] || raw['bind::saveInComplete'] || undefined,
        'bind::esri:warning': raw['bind::esri:warning'] || undefined,
        'bind::esri:warning_message': raw['bind::esri:warning_message'] || undefined,
        'body::accuracyThreshold': raw['body::accuracyThreshold'] || undefined,
        parameters: raw['parameters'] || undefined,
      };
    });

  // Parse choices
  const choiceLists: ChoiceList[] = [];
  if (choicesSheet) {
    const choicesData = XLSX.utils.sheet_to_json<Record<string, any>>(choicesSheet, {
      defval: '',
    });

    const listMap = new Map<string, ChoiceItem[]>();
    for (const raw of choicesData) {
      const listName = raw['list_name']?.toString() || '';
      if (!listName) continue;
      if (!listMap.has(listName)) listMap.set(listName, []);
      listMap.get(listName)!.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        list_name: listName,
        name: raw['name']?.toString() || '',
        label: raw['label']?.toString() || '',
        'media::image': raw['media::image'] || undefined,
        'media::audio': raw['media::audio'] || undefined,
      });
    }

    for (const [listName, choices] of listMap) {
      choiceLists.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        list_name: listName,
        choices,
      });
    }
  }

  // Parse settings
  const settings: FormSettings = {
    form_title: 'Imported Survey',
    form_id: 'imported_survey',
  };
  if (settingsSheet) {
    const settingsData = XLSX.utils.sheet_to_json<Record<string, any>>(settingsSheet, {
      defval: '',
    });
    if (settingsData.length > 0) {
      const raw = settingsData[0];
      settings.form_title = raw['form_title'] || settings.form_title;
      settings.form_id = raw['form_id'] || settings.form_id;
      settings.instance_name = raw['instance_name'] || undefined;
      settings.version = raw['version']?.toString() || undefined;
      settings.style = raw['style'] || undefined;
      settings.default_language = raw['default_language'] || undefined;
      settings.submission_url = raw['submission_url'] || undefined;
    }
  }

  return { settings, survey, choiceLists, mediaFiles: [] };
}

function parseTypeColumn(typeStr: string): {
  questionType: string;
  listName?: string;
  fileName?: string;
} {
  const parts = typeStr.split(/\s+/);
  const raw = parts[0];

  if (raw === 'begin' || raw === 'end') {
    const subtype = parts[1];
    if (subtype === 'group') return { questionType: `${raw}_group` };
    if (subtype === 'repeat') return { questionType: `${raw}_repeat` };
    return { questionType: raw };
  }

  if (raw === 'select_one' || raw === 'select_multiple' || raw === 'rank') {
    return { questionType: raw, listName: parts[1] };
  }

  if (raw === 'select_one_from_file' || raw === 'select_multiple_from_file') {
    return { questionType: raw, fileName: parts[1] };
  }

  // Handle dateTime -> datetime mapping
  if (raw === 'dateTime') return { questionType: 'datetime' };

  return { questionType: raw };
}
