/**
 * Form Validation Utilities
 *
 * Expression validation (reusable from ExpressionBuilder)
 * Field name validation (lowercase, no reserved words, valid chars)
 * PostgreSQL + Esri/ArcGIS reserved word checking
 */

// ============================================================
// Expression Validation
// ============================================================

export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;
}

export function validateExpression(
  value: string,
  fieldNames: Set<string>
): ValidationIssue[] {
  if (!value || !value.trim()) return [];

  const issues: ValidationIssue[] = [];

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
      issues.push({ level: 'warning', message: `Field "${name}" not found` });
    }
  }

  // Check for empty field refs
  if (value.includes('${}')) {
    issues.push({ level: 'error', message: 'Empty field reference ${}' });
  }

  // Check for common XLSForm function names
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
    issues.push({ level: 'error', message: 'Consecutive logical operators' });
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
