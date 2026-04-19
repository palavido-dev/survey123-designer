/**
 * Form Validation Utilities
 *
 * Expression validation (powered by AST parser from expressionParser.ts)
 * Field name validation (lowercase, no reserved words, valid chars)
 * PostgreSQL + Esri/ArcGIS reserved word checking
 */

import { validateExpressionAST } from './expressionParser';

// ============================================================
// Expression Validation
// ============================================================

export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;
}

/**
 * Validate an XLSForm expression using the AST-based parser.
 * Returns simplified issues (without position info) for form-level validation.
 */
export function validateExpression(
  value: string,
  fieldNames: Set<string>
): ValidationIssue[] {
  if (!value || !value.trim()) return [];

  const diagnostics = validateExpressionAST(value, fieldNames);

  // Deduplicate by message
  const seen = new Set<string>();
  const issues: ValidationIssue[] = [];
  for (const d of diagnostics) {
    if (!seen.has(d.message)) {
      seen.add(d.message);
      issues.push({ level: d.level === 'info' ? 'warning' : d.level, message: d.message });
    }
  }
  return issues;
}

// ============================================================
// Field Name Validation
// ============================================================

/**
 * PostgreSQL reserved words that cannot be used as column names
 * without quoting — and Survey123/ArcGIS won't quote them.
 * This is a comprehensive list of the most commonly problematic ones.
 */
const POSTGRES_RESERVED_WORDS = new Set([
  // SQL standard reserved words
  'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc',
  'asymmetric', 'authorization', 'between', 'bigint', 'binary', 'bit',
  'boolean', 'both', 'case', 'cast', 'char', 'character', 'check',
  'coalesce', 'collate', 'collation', 'column', 'concurrently',
  'constraint', 'create', 'cross', 'current', 'current_catalog',
  'current_date', 'current_role', 'current_schema', 'current_time',
  'current_timestamp', 'current_user', 'date', 'day', 'dec', 'decimal',
  'default', 'deferrable', 'desc', 'distinct', 'do', 'else', 'end',
  'except', 'exists', 'extract', 'false', 'fetch', 'float', 'for',
  'foreign', 'freeze', 'from', 'full', 'grant', 'greatest', 'group',
  'having', 'hour', 'ilike', 'in', 'index', 'initially', 'inner',
  'inout', 'insert', 'int', 'integer', 'intersect', 'interval', 'into',
  'is', 'isnull', 'join', 'key', 'lateral', 'leading', 'least', 'left',
  'level', 'like', 'limit', 'localtime', 'localtimestamp', 'minute',
  'month', 'name', 'national', 'natural', 'nchar', 'new', 'none', 'not',
  'nothing', 'notnull', 'null', 'nullif', 'numeric', 'offset', 'old',
  'on', 'only', 'or', 'order', 'out', 'outer', 'overlaps', 'overlay',
  'placing', 'position', 'precision', 'primary', 'real', 'references',
  'returning', 'right', 'row', 'rows', 'select', 'session_user',
  'setof', 'similar', 'smallint', 'some', 'substring', 'symmetric',
  'table', 'tablesample', 'then', 'time', 'timestamp', 'to', 'trailing',
  'treat', 'trim', 'true', 'type', 'union', 'unique', 'update', 'user',
  'using', 'values', 'varchar', 'variadic', 'verbose', 'when', 'where',
  'window', 'with', 'xmlattributes', 'xmlconcat', 'xmlelement',
  'xmlexists', 'xmlforest', 'xmlnamespaces', 'xmlparse', 'xmlpi',
  'xmlroot', 'xmlserialize', 'xmltable', 'year', 'zone',
  // Additional PostgreSQL-specific
  'abort', 'access', 'action', 'add', 'admin', 'after', 'aggregate',
  'also', 'alter', 'always', 'assertion', 'assignment', 'at',
  'attach', 'attribute', 'backward', 'before', 'begin', 'by',
  'cache', 'call', 'called', 'cascade', 'catalog', 'chain',
  'characteristics', 'checkpoint', 'class', 'close', 'cluster',
  'comment', 'comments', 'commit', 'committed', 'configuration',
  'conflict', 'connection', 'constraints', 'content', 'continue',
  'conversion', 'copy', 'cost', 'csv', 'cube', 'cursor', 'cycle',
  'data', 'database', 'deallocate', 'declare', 'defaults',
  'deferred', 'definer', 'delete', 'delimiter', 'delimiters',
  'depends', 'detach', 'dictionary', 'disable', 'discard',
  'document', 'domain', 'double', 'drop', 'each', 'enable',
  'encoding', 'encrypted', 'enum', 'escape', 'event', 'exclude',
  'excluding', 'exclusive', 'execute', 'explain', 'expression',
  'extension', 'external', 'family', 'filter', 'first', 'following',
  'force', 'forward', 'function', 'functions', 'generated', 'global',
  'granted', 'groups', 'handler', 'header', 'hold', 'identity', 'if',
  'immediate', 'immutable', 'implicit', 'import', 'include',
  'including', 'increment', 'indexes', 'inherit', 'inherits',
  'inline', 'input', 'insensitive', 'instead', 'invoker',
  'isolation', 'label', 'language', 'large', 'last', 'leakproof',
  'listen', 'load', 'local', 'location', 'lock', 'locked', 'logged',
  'mapping', 'match', 'materialized', 'maxvalue', 'method',
  'minvalue', 'mode', 'move', 'names', 'next', 'no', 'normalize',
  'normalized', 'notify', 'nowait', 'object', 'of', 'off', 'oids',
  'operator', 'option', 'options', 'ordinality', 'others', 'over',
  'overriding', 'owned', 'owner', 'parallel', 'parser', 'partial',
  'partition', 'passing', 'password', 'plans', 'policy',
  'preceding', 'prepare', 'prepared', 'preserve', 'prior',
  'privileges', 'procedural', 'procedure', 'procedures', 'program',
  'publication', 'quote', 'range', 'read', 'reassign', 'recheck',
  'recursive', 'ref', 'referencing', 'refresh', 'reindex',
  'relative', 'release', 'rename', 'repeatable', 'replace',
  'replica', 'reset', 'restart', 'restrict', 'return', 'revoke',
  'role', 'rollback', 'rollup', 'routine', 'routines', 'rule',
  'savepoint', 'schema', 'schemas', 'scroll', 'search', 'second',
  'security', 'sequence', 'sequences', 'serializable', 'server',
  'session', 'set', 'sets', 'share', 'show', 'simple', 'skip',
  'snapshot', 'sql', 'stable', 'standalone', 'start', 'statement',
  'statistics', 'stdin', 'stdout', 'storage', 'stored', 'strict',
  'strip', 'subscription', 'support', 'sysid', 'system', 'tables',
  'temp', 'template', 'temporary', 'text', 'ties', 'transaction',
  'transform', 'trigger', 'truncate', 'trusted', 'types',
  'unbounded', 'uncommitted', 'unencrypted', 'unknown', 'unlisten',
  'unlogged', 'until', 'vacuum', 'valid', 'validate', 'validator',
  'value', 'varying', 'version', 'view', 'views', 'volatile',
  'whitespace', 'without', 'work', 'wrapper', 'write', 'xml', 'yes',
]);

/**
 * Esri/ArcGIS reserved field names that conflict with system columns
 */
const ESRI_RESERVED_FIELDS = new Set([
  'objectid', 'fid', 'shape', 'shape_length', 'shape_area',
  'globalid', 'gdb_geomattr_data', 'created_user', 'created_date',
  'last_edited_user', 'last_edited_date', 'editor', 'editdate',
  'creator', 'createdate', 'gdb_from_date', 'gdb_to_date',
  'gdb_is_delete', 'gdb_branch_id',
]);

export interface FieldNameIssue {
  level: 'error' | 'warning';
  message: string;
  autoFix?: string; // suggested corrected name
}

export function validateFieldName(name: string): FieldNameIssue[] {
  if (!name) return [{ level: 'error', message: 'Field name is empty' }];

  const issues: FieldNameIssue[] = [];

  // Check for uppercase characters
  if (name !== name.toLowerCase()) {
    issues.push({
      level: 'warning',
      message: 'Name has uppercase chars — will fail on publish',
      autoFix: name.toLowerCase(),
    });
  }

  // Check for spaces
  if (/\s/.test(name)) {
    issues.push({
      level: 'error',
      message: 'Spaces not allowed in field names',
      autoFix: name.replace(/\s+/g, '_').toLowerCase(),
    });
  }

  // Check for invalid starting character
  if (/^[0-9]/.test(name)) {
    issues.push({
      level: 'error',
      message: 'Cannot start with a number',
      autoFix: `f_${name}`.toLowerCase(),
    });
  }

  // Check for invalid characters (only alphanumeric + underscore allowed)
  if (/[^a-zA-Z0-9_]/.test(name)) {
    issues.push({
      level: 'error',
      message: 'Only letters, numbers, and underscores allowed',
      autoFix: name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
    });
  }

  // Check field name length (ArcGIS limit is typically 64 chars)
  if (name.length > 64) {
    issues.push({
      level: 'warning',
      message: `Name too long (${name.length}/64 chars)`,
      autoFix: name.substring(0, 64).toLowerCase(),
    });
  }

  // Check against PostgreSQL reserved words
  const lower = name.toLowerCase();
  if (POSTGRES_RESERVED_WORDS.has(lower)) {
    issues.push({
      level: 'error',
      message: `"${lower}" is a PostgreSQL reserved word`,
      autoFix: `${lower}_field`,
    });
  }

  // Check against Esri reserved field names
  if (ESRI_RESERVED_FIELDS.has(lower)) {
    issues.push({
      level: 'error',
      message: `"${lower}" is reserved by ArcGIS`,
      autoFix: `${lower}_val`,
    });
  }

  return issues;
}

/**
 * Sanitize a field name to be safe for publishing.
 * Lowercases, replaces invalid chars, avoids reserved words.
 */
export function sanitizeFieldName(name: string): string {
  let sanitized = name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  // Prefix if starts with number
  if (/^[0-9]/.test(sanitized)) {
    sanitized = `f_${sanitized}`;
  }

  // Append suffix if reserved
  if (POSTGRES_RESERVED_WORDS.has(sanitized) || ESRI_RESERVED_FIELDS.has(sanitized)) {
    sanitized = `${sanitized}_field`;
  }

  return sanitized || 'unnamed_field';
}

// ============================================================
// Row-level Validation (combines all checks for a single row)
// ============================================================

export interface RowValidationResult {
  fieldNameIssues: FieldNameIssue[];
  expressionIssues: { field: string; issues: ValidationIssue[] }[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

export function validateRow(
  row: { name: string; relevant?: string; calculation?: string; constraint?: string; type: string },
  allFieldNames: Set<string>
): RowValidationResult {
  const fieldNameIssues = validateFieldName(row.name);

  const expressionIssues: { field: string; issues: ValidationIssue[] }[] = [];

  if (row.relevant) {
    const issues = validateExpression(row.relevant, allFieldNames);
    if (issues.length > 0) expressionIssues.push({ field: 'relevant', issues });
  }
  if (row.calculation) {
    const issues = validateExpression(row.calculation, allFieldNames);
    if (issues.length > 0) expressionIssues.push({ field: 'calculation', issues });
  }
  if (row.constraint) {
    const issues = validateExpression(row.constraint, allFieldNames);
    if (issues.length > 0) expressionIssues.push({ field: 'constraint', issues });
  }

  const hasErrors =
    fieldNameIssues.some((i) => i.level === 'error') ||
    expressionIssues.some((ei) => ei.issues.some((i) => i.level === 'error'));

  const hasWarnings =
    fieldNameIssues.some((i) => i.level === 'warning') ||
    expressionIssues.some((ei) => ei.issues.some((i) => i.level === 'warning'));

  return { fieldNameIssues, expressionIssues, hasErrors, hasWarnings };
}

// ============================================================
// Form-wide Validation
// ============================================================

export interface FormValidationIssue {
  level: 'error' | 'warning';
  category: 'duplicate-name' | 'missing-label' | 'orphaned-list' | 'unused-list'
    | 'broken-ref' | 'unmatched-group' | 'field-name' | 'expression'
    | 'missing-list' | 'missing-file' | 'empty-list';
  message: string;
  /** Row ID this issue applies to (null for form-level issues) */
  rowId?: string;
  /** Field name for row-level issues */
  fieldName?: string;
}

export interface FormValidationResult {
  issues: FormValidationIssue[];
  errorCount: number;
  warningCount: number;
  /** Per-row issue counts for quick canvas indicators */
  rowIssues: Map<string, { errors: number; warnings: number }>;
}

interface ValidateFormInput {
  survey: Array<{
    id: string;
    type: string;
    name: string;
    label: string;
    listName?: string;
    fileName?: string;
    relevant?: string;
    calculation?: string;
    constraint?: string;
    choice_filter?: string;
    required?: string;
    required_message?: string;
    constraint_message?: string;
    repeat_count?: string;
    default?: string;
    appearance?: string;
  }>;
  choiceLists: Array<{
    list_name: string;
    choices: Array<{ name: string; label: string }>;
  }>;
  mediaFiles: Array<{ fileName: string }>;
  scriptFiles?: Array<{ fileName: string; content: string }>;
}

export function validateForm(input: ValidateFormInput): FormValidationResult {
  const issues: FormValidationIssue[] = [];
  const rowIssues = new Map<string, { errors: number; warnings: number }>();

  const addIssue = (issue: FormValidationIssue) => {
    issues.push(issue);
    if (issue.rowId) {
      const existing = rowIssues.get(issue.rowId) || { errors: 0, warnings: 0 };
      if (issue.level === 'error') existing.errors++;
      else existing.warnings++;
      rowIssues.set(issue.rowId, existing);
    }
  };

  const allFieldNames = new Set(
    input.survey
      .filter((r) => !['end_group', 'end_repeat'].includes(r.type))
      .map((r) => r.name)
      .filter(Boolean)
  );

  // 1. Duplicate field names
  const nameCounts = new Map<string, string[]>();
  for (const row of input.survey) {
    if (['end_group', 'end_repeat'].includes(row.type)) continue;
    if (!row.name) continue;
    const ids = nameCounts.get(row.name) || [];
    ids.push(row.id);
    nameCounts.set(row.name, ids);
  }
  for (const [name, ids] of nameCounts) {
    if (ids.length > 1) {
      for (const id of ids) {
        addIssue({
          level: 'error',
          category: 'duplicate-name',
          message: `Duplicate field name "${name}" (${ids.length} occurrences)`,
          rowId: id,
          fieldName: name,
        });
      }
    }
  }

  // 2. Missing labels on visible question types
  const structuralTypes = new Set([
    'end_group', 'end_repeat', 'calculate', 'hidden',
    'start', 'end', 'username', 'deviceid',
  ]);
  for (const row of input.survey) {
    if (structuralTypes.has(row.type)) continue;
    if (!row.label || !row.label.trim()) {
      addIssue({
        level: 'warning',
        category: 'missing-label',
        message: `Question "${row.name || '(unnamed)'}" has no label`,
        rowId: row.id,
        fieldName: row.name,
      });
    }
  }

  // 3. Unmatched groups/repeats
  const groupStack: { type: string; id: string; name: string }[] = [];
  for (const row of input.survey) {
    if (row.type === 'begin_group' || row.type === 'begin_repeat') {
      groupStack.push({ type: row.type, id: row.id, name: row.name });
    } else if (row.type === 'end_group') {
      if (groupStack.length === 0 || groupStack[groupStack.length - 1].type !== 'begin_group') {
        addIssue({
          level: 'error',
          category: 'unmatched-group',
          message: `end_group "${row.name}" has no matching begin_group`,
          rowId: row.id,
          fieldName: row.name,
        });
      } else {
        groupStack.pop();
      }
    } else if (row.type === 'end_repeat') {
      if (groupStack.length === 0 || groupStack[groupStack.length - 1].type !== 'begin_repeat') {
        addIssue({
          level: 'error',
          category: 'unmatched-group',
          message: `end_repeat "${row.name}" has no matching begin_repeat`,
          rowId: row.id,
          fieldName: row.name,
        });
      } else {
        groupStack.pop();
      }
    }
  }
  for (const unclosed of groupStack) {
    const typeName = unclosed.type === 'begin_group' ? 'Group' : 'Repeat';
    addIssue({
      level: 'error',
      category: 'unmatched-group',
      message: `${typeName} "${unclosed.name}" is never closed`,
      rowId: unclosed.id,
      fieldName: unclosed.name,
    });
  }

  // 4. Missing choice lists (select referencing non-existent list)
  const choiceListNames = new Set(input.choiceLists.map((cl) => cl.list_name));
  for (const row of input.survey) {
    if (['select_one', 'select_multiple', 'rank'].includes(row.type)) {
      if (row.listName && !choiceListNames.has(row.listName)) {
        addIssue({
          level: 'error',
          category: 'missing-list',
          message: `Choice list "${row.listName}" not found`,
          rowId: row.id,
          fieldName: row.name,
        });
      }
    }
  }

  // 5. Missing CSV files (select_from_file referencing non-existent file)
  const mediaFileNames = new Set(input.mediaFiles.map((f) => f.fileName));
  for (const row of input.survey) {
    if (['select_one_from_file', 'select_multiple_from_file'].includes(row.type)) {
      if (row.fileName && !mediaFileNames.has(row.fileName)) {
        addIssue({
          level: 'warning',
          category: 'missing-file',
          message: `CSV file "${row.fileName}" not uploaded`,
          rowId: row.id,
          fieldName: row.name,
        });
      }
    }
  }

  // 6. Empty choice lists
  for (const cl of input.choiceLists) {
    if (cl.choices.length === 0) {
      addIssue({
        level: 'error',
        category: 'empty-list',
        message: `Choice list "${cl.list_name}" has no choices`,
      });
    }
  }

  // 7. Unused choice lists (lists not referenced by any question)
  const usedLists = new Set(
    input.survey
      .filter((r) => ['select_one', 'select_multiple', 'rank'].includes(r.type))
      .map((r) => r.listName)
      .filter(Boolean)
  );
  for (const cl of input.choiceLists) {
    if (!usedLists.has(cl.list_name)) {
      addIssue({
        level: 'warning',
        category: 'unused-list',
        message: `Choice list "${cl.list_name}" is not used by any question`,
      });
    }
  }

  // 8. Per-row field name validation
  for (const row of input.survey) {
    if (['end_group', 'end_repeat'].includes(row.type)) continue;
    // Notes don't require a field name — they can be blank or use bind::esri:fieldType=null
    if (row.type === 'note' && !row.name) continue;
    const nameIssues = validateFieldName(row.name);
    for (const issue of nameIssues) {
      addIssue({
        level: issue.level,
        category: 'field-name',
        message: `${row.name}: ${issue.message}`,
        rowId: row.id,
        fieldName: row.name,
      });
    }
  }

  // 9. Expression validation on all rows
  const exprFields: { key: string; label: string }[] = [
    { key: 'relevant', label: 'relevant' },
    { key: 'calculation', label: 'calculation' },
    { key: 'constraint', label: 'constraint' },
    { key: 'choice_filter', label: 'choice_filter' },
    { key: 'required', label: 'required' },
    { key: 'repeat_count', label: 'repeat_count' },
  ];
  for (const row of input.survey) {
    for (const { key, label } of exprFields) {
      const val = (row as any)[key] as string | undefined;
      if (!val || val === 'yes' || val === 'no') continue;
      const exprIssues = validateExpression(val, allFieldNames);
      for (const issue of exprIssues) {
        addIssue({
          level: issue.level,
          category: 'expression',
          message: `${row.name} → ${label}: ${issue.message}`,
          rowId: row.id,
          fieldName: row.name,
        });
      }
    }
  }

  // 10. Validate pulldata("@javascript") references
  if (input.scriptFiles && input.scriptFiles.length > 0) {
    const scriptFileNames = new Set(input.scriptFiles.map((f) => f.fileName));
    const jsRefPattern = /pulldata\s*\(\s*["']@javascript["']\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/g;

    for (const row of input.survey) {
      const exprFieldsToCheck = ['calculation', 'constraint', 'relevant', 'default', 'required', 'choice_filter', 'repeat_count'];
      for (const field of exprFieldsToCheck) {
        const val = (row as any)[field] as string | undefined;
        if (!val) continue;
        let match;
        jsRefPattern.lastIndex = 0;
        const localPattern = new RegExp(jsRefPattern.source, 'g');
        while ((match = localPattern.exec(val)) !== null) {
          const refFileName = match[1];
          const refFuncName = match[2];
          if (!scriptFileNames.has(refFileName)) {
            addIssue({
              level: 'error',
              category: 'broken-ref',
              message: `${row.name} → ${field}: Script file "${refFileName}" not found`,
              rowId: row.id,
              fieldName: row.name,
            });
          }
        }
      }
    }
  }

  const errorCount = issues.filter((i) => i.level === 'error').length;
  const warningCount = issues.filter((i) => i.level === 'warning').length;

  return { issues, errorCount, warningCount, rowIssues };
}
