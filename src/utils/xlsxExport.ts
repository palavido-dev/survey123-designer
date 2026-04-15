/**
 * XLSX Export Engine
 *
 * Converts the internal SurveyForm model to a Survey123-compatible
 * XLSX file with survey, choices, and settings sheets.
 */

import * as XLSX from 'xlsx';
import { SurveyForm, SurveyRow, ChoiceList, ChoiceItem, FormSettings, QuestionType } from '../types/survey';
import { buildTypeColumnValue } from '../data/questionTypes';

// ============================================================
// Survey Sheet Columns (in order)
// ============================================================

const SURVEY_COLUMNS = [
  'type',
  'name',
  'label',
  'hint',
  'required',
  'required_message',
  'constraint',
  'constraint_message',
  'relevant',
  'calculation',
  'default',
  'appearance',
  'choice_filter',
  'read_only',
  'repeat_count',
  'media::image',
  'media::audio',
  'body::accept',
  'body::esri:inputMask',
  'body::esri:style',
  'bind::type',
  'bind::esri:fieldType',
  'bind::esri:fieldLength',
  'bind::esri:fieldAlias',
  'bind::esri:workflow',
  'bind::esri:parameters',
  'bind::saveInComplete',
  'parameters',
];

// ============================================================
// Choices Sheet Columns (in order)
// ============================================================

const CHOICES_COLUMNS = [
  'list_name',
  'name',
  'label',
  'media::image',
  'media::audio',
];

// ============================================================
// Settings Sheet Columns (in order)
// ============================================================

const SETTINGS_COLUMNS = [
  'form_title',
  'form_id',
  'instance_name',
  'version',
  'style',
  'default_language',
  'submission_url',
];

// ============================================================
// Export Function
// ============================================================

export function exportToXlsx(form: SurveyForm): void {
  const wb = XLSX.utils.book_new();

  // --- Survey Sheet ---
  const surveyData = buildSurveySheet(form.survey);
  const surveyWs = XLSX.utils.aoa_to_sheet(surveyData);
  applyColumnWidths(surveyWs, surveyData);
  XLSX.utils.book_append_sheet(wb, surveyWs, 'survey');

  // --- Choices Sheet ---
  const choicesData = buildChoicesSheet(form.choiceLists);
  const choicesWs = XLSX.utils.aoa_to_sheet(choicesData);
  applyColumnWidths(choicesWs, choicesData);
  XLSX.utils.book_append_sheet(wb, choicesWs, 'choices');

  // --- Settings Sheet ---
  const settingsData = buildSettingsSheet(form.settings);
  const settingsWs = XLSX.utils.aoa_to_sheet(settingsData);
  applyColumnWidths(settingsWs, settingsData);
  XLSX.utils.book_append_sheet(wb, settingsWs, 'settings');

  // --- Download ---
  const fileName = `${form.settings.form_id || 'survey'}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ============================================================
// Build Survey Sheet Data
// ============================================================

function buildSurveySheet(rows: SurveyRow[]): string[][] {
  // Determine which columns are actually used
  const usedColumns = getUsedSurveyColumns(rows);
  const header = usedColumns;
  const data: string[][] = [header];

  for (const row of rows) {
    const rowData: string[] = usedColumns.map((col) => {
      if (col === 'type') return buildTypeColumnValue(row);
      if (col === 'bind::esri:fieldLength') {
        return row['bind::esri:fieldLength']?.toString() || '';
      }
      return (row as Record<string, any>)[col]?.toString() || '';
    });
    data.push(rowData);
  }

  return data;
}

// ============================================================
// Build Choices Sheet Data
// ============================================================

function buildChoicesSheet(choiceLists: ChoiceList[]): string[][] {
  // Collect all custom columns across all choice lists
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
  const header = allColumns;
  const data: string[][] = [header];

  for (const list of choiceLists) {
    for (const choice of list.choices) {
      const rowData = allColumns.map((col) => {
        return (choice as Record<string, any>)[col]?.toString() || '';
      });
      data.push(rowData);
    }
  }

  return data;
}

// ============================================================
// Build Settings Sheet Data
// ============================================================

function buildSettingsSheet(settings: FormSettings): string[][] {
  const usedColumns = SETTINGS_COLUMNS.filter(
    (col) => (settings as Record<string, any>)[col]
  );
  // Always include form_title and form_id
  if (!usedColumns.includes('form_title')) usedColumns.unshift('form_title');
  if (!usedColumns.includes('form_id')) {
    const idx = usedColumns.indexOf('form_title') + 1;
    usedColumns.splice(idx, 0, 'form_id');
  }

  const header = usedColumns;
  const values = usedColumns.map(
    (col) => (settings as Record<string, any>)[col]?.toString() || ''
  );

  return [header, values];
}

// ============================================================
// Helpers
// ============================================================

function getUsedSurveyColumns(rows: SurveyRow[]): string[] {
  // Always include type, name, label
  const always = ['type', 'name', 'label'];
  const used = new Set<string>(always);

  for (const row of rows) {
    for (const col of SURVEY_COLUMNS) {
      if (always.includes(col)) continue;
      const val = (row as Record<string, any>)[col];
      if (val !== undefined && val !== null && val !== '') {
        used.add(col);
      }
    }
  }

  // Return in original column order
  return SURVEY_COLUMNS.filter((col) => used.has(col));
}

function applyColumnWidths(ws: XLSX.WorkSheet, data: string[][]): void {
  if (data.length === 0) return;
  const colWidths = data[0].map((_, colIdx) => {
    let maxLen = 10;
    for (const row of data) {
      const cellLen = (row[colIdx] || '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    }
    return { wch: Math.min(maxLen + 2, 50) };
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

  // Parse survey rows
  const surveyData = XLSX.utils.sheet_to_json<Record<string, any>>(surveySheet, {
    defval: '',
  });

  const survey: SurveyRow[] = surveyData.map((raw) => {
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
      required: raw['required'] || undefined,
      required_message: raw['required_message'] || undefined,
      constraint: raw['constraint'] || undefined,
      constraint_message: raw['constraint_message'] || undefined,
      relevant: raw['relevant'] || undefined,
      calculation: raw['calculation'] || undefined,
      default: raw['default'] || undefined,
      appearance: raw['appearance'] || undefined,
      choice_filter: raw['choice_filter'] || undefined,
      read_only: raw['read_only'] || undefined,
      repeat_count: raw['repeat_count']?.toString() || undefined,
      'media::image': raw['media::image'] || undefined,
      'media::audio': raw['media::audio'] || undefined,
      'body::accept': raw['body::accept'] || undefined,
      'body::esri:inputMask': raw['body::esri:inputMask'] || undefined,
      'body::esri:style': raw['body::esri:style'] || undefined,
      'bind::type': raw['bind::type'] || undefined,
      'bind::esri:fieldType': raw['bind::esri:fieldType'] || undefined,
      'bind::esri:fieldLength': raw['bind::esri:fieldLength']
        ? Number(raw['bind::esri:fieldLength'])
        : undefined,
      'bind::esri:fieldAlias': raw['bind::esri:fieldAlias'] || undefined,
      'bind::esri:workflow': raw['bind::esri:workflow'] || undefined,
      'bind::esri:parameters': raw['bind::esri:parameters'] || undefined,
      'bind::saveInComplete': raw['bind::saveInComplete'] || undefined,
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

  return { settings, survey, choiceLists };
}

function parseTypeColumn(typeStr: string): {
  questionType: string;
  listName?: string;
  fileName?: string;
} {
  const parts = typeStr.split(/\s+/);
  const raw = parts[0];

  // Map XLS type strings to internal types
  const typeMap: Record<string, string> = {
    'begin': parts[1] === 'group' ? 'begin_group' : parts[1] === 'repeat' ? 'begin_repeat' : raw,
    'end': parts[1] === 'group' ? 'end_group' : parts[1] === 'repeat' ? 'end_repeat' : raw,
    'select_one': 'select_one',
    'select_multiple': 'select_multiple',
    'select_one_from_file': 'select_one_from_file',
    'select_multiple_from_file': 'select_multiple_from_file',
    'rank': 'rank',
  };

  if (raw === 'begin' || raw === 'end') {
    return { questionType: typeMap[raw] };
  }

  if (raw === 'select_one' || raw === 'select_multiple' || raw === 'rank') {
    return { questionType: raw, listName: parts[1] };
  }

  if (raw === 'select_one_from_file' || raw === 'select_multiple_from_file') {
    return { questionType: raw, fileName: parts[1] };
  }

  return { questionType: raw };
}
