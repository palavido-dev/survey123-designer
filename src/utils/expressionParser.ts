/**
 * XLSForm Expression Parser
 *
 * Recursive descent parser for Survey123 XLSForm expressions (a subset of XPath 1.0
 * with Survey123-specific extensions like ${field} references and pulldata()).
 *
 * Produces an AST that powers:
 *   - Real-time syntax validation with precise error positions
 *   - Context-aware autocomplete suggestions
 *   - Hover tooltips showing function signatures and field info
 *   - Syntax-highlighted expression rendering
 *
 * Grammar (simplified):
 *   Expression   = OrExpr
 *   OrExpr       = AndExpr ('or' AndExpr)*
 *   AndExpr      = CompareExpr ('and' CompareExpr)*
 *   CompareExpr  = AddExpr (('=' | '!=' | '<' | '>' | '<=' | '>=') AddExpr)?
 *   AddExpr      = MulExpr (('+' | '-') MulExpr)*
 *   MulExpr      = UnionExpr (('*' | 'div' | 'mod') UnionExpr)*
 *   UnionExpr    = UnaryExpr ('|' UnaryExpr)*
 *   UnaryExpr    = '-' UnaryExpr | PrimaryExpr
 *   PrimaryExpr  = FieldRef | FunctionCall | '(' Expression ')' | Literal | PathExpr
 *   FieldRef     = '${' name '}'
 *   FunctionCall = name '(' (Expression (',' Expression)*)? ')'
 *   PathExpr     = '.' | '..' | '//' ...
 *   Literal      = StringLiteral | NumberLiteral
 */

// ============================================================
// Token Types
// ============================================================

export type TokenType =
  | 'field_ref'      // ${fieldname}
  | 'string'         // 'hello'
  | 'number'         // 42, 3.14
  | 'function_name'  // selected, concat, etc. (followed by '(')
  | 'identifier'     // bare name (for paths, etc.)
  | 'operator'       // =, !=, >, <, >=, <=, +, -, *, |
  | 'keyword'        // and, or, not, div, mod
  | 'paren_open'     // (
  | 'paren_close'    // )
  | 'comma'          // ,
  | 'dot'            // .
  | 'dot_dot'        // ..
  | 'slash'          // /
  | 'double_slash'   // //
  | 'whitespace'     // spaces/tabs (preserved for position tracking)
  | 'error'          // unrecognized character
  | 'eof';           // end of input

export interface Token {
  type: TokenType;
  value: string;
  start: number;    // character offset in the original expression
  end: number;      // exclusive end offset
}

// ============================================================
// AST Node Types
// ============================================================

export type ASTNodeType =
  | 'expression'
  | 'binary_op'
  | 'unary_op'
  | 'function_call'
  | 'field_ref'
  | 'string_literal'
  | 'number_literal'
  | 'path_expr'
  | 'group'          // parenthesized expression
  | 'error';

export interface ASTNode {
  type: ASTNodeType;
  start: number;
  end: number;
  children?: ASTNode[];
  /** For binary_op: the operator token */
  operator?: string;
  /** For function_call: the function name */
  functionName?: string;
  /** For function_call: the arguments */
  args?: ASTNode[];
  /** For field_ref: the field name */
  fieldName?: string;
  /** For literals: the raw value */
  value?: string;
  /** For path_expr: the path string */
  path?: string;
  /** For error nodes: the error message */
  errorMessage?: string;
}

// ============================================================
// Diagnostic (validation error with position)
// ============================================================

export interface ExpressionDiagnostic {
  level: 'error' | 'warning' | 'info';
  message: string;
  start: number;
  end: number;
}

// ============================================================
// Function Signature Registry
// ============================================================

export interface FunctionSignature {
  name: string;
  description: string;
  params: { name: string; type: string; optional?: boolean }[];
  returnType: string;
  example: string;
  category: string;
}

export const FUNCTION_REGISTRY: Record<string, FunctionSignature> = {
  // ---- Selection ----
  'selected': {
    name: 'selected',
    description: 'Check if a value is selected in a select_multiple field',
    params: [
      { name: 'field', type: 'node-set' },
      { name: 'value', type: 'string' },
    ],
    returnType: 'boolean',
    example: "selected(${colors}, 'red')",
    category: 'Selection',
  },
  'count-selected': {
    name: 'count-selected',
    description: 'Count how many options are selected in a select_multiple field',
    params: [{ name: 'field', type: 'node-set' }],
    returnType: 'number',
    example: 'count-selected(${colors})',
    category: 'Selection',
  },
  'selected-at': {
    name: 'selected-at',
    description: 'Get the nth selected value from a select_multiple field (0-indexed)',
    params: [
      { name: 'field', type: 'node-set' },
      { name: 'index', type: 'number' },
    ],
    returnType: 'string',
    example: 'selected-at(${colors}, 0)',
    category: 'Selection',
  },
  'jr:choice-name': {
    name: 'jr:choice-name',
    description: 'Get the label text for a choice value from a select question',
    params: [
      { name: 'value', type: 'string' },
      { name: 'field', type: 'node-set' },
    ],
    returnType: 'string',
    example: "jr:choice-name(${status}, '${status}')",
    category: 'Selection',
  },

  // ---- Text ----
  'concat': {
    name: 'concat',
    description: 'Join two or more text values together',
    params: [
      { name: 'value1', type: 'string' },
      { name: 'value2', type: 'string' },
      { name: '...more', type: 'string', optional: true },
    ],
    returnType: 'string',
    example: "concat(${first_name}, ' ', ${last_name})",
    category: 'Text',
  },
  'string-length': {
    name: 'string-length',
    description: 'Get the number of characters in a text value',
    params: [{ name: 'text', type: 'string' }],
    returnType: 'number',
    example: 'string-length(${name})',
    category: 'Text',
  },
  'substr': {
    name: 'substr',
    description: 'Extract a portion of text (start index is 0-based)',
    params: [
      { name: 'text', type: 'string' },
      { name: 'start', type: 'number' },
      { name: 'length', type: 'number', optional: true },
    ],
    returnType: 'string',
    example: 'substr(${phone}, 0, 3)',
    category: 'Text',
  },
  'contains': {
    name: 'contains',
    description: 'Check if text contains a substring',
    params: [
      { name: 'text', type: 'string' },
      { name: 'search', type: 'string' },
    ],
    returnType: 'boolean',
    example: "contains(${notes}, 'urgent')",
    category: 'Text',
  },
  'starts-with': {
    name: 'starts-with',
    description: 'Check if text starts with a prefix',
    params: [
      { name: 'text', type: 'string' },
      { name: 'prefix', type: 'string' },
    ],
    returnType: 'boolean',
    example: "starts-with(${code}, 'ABC')",
    category: 'Text',
  },
  'ends-with': {
    name: 'ends-with',
    description: 'Check if text ends with a suffix',
    params: [
      { name: 'text', type: 'string' },
      { name: 'suffix', type: 'string' },
    ],
    returnType: 'boolean',
    example: "ends-with(${email}, '.gov')",
    category: 'Text',
  },
  'normalize-space': {
    name: 'normalize-space',
    description: 'Remove leading/trailing whitespace and collapse internal spaces',
    params: [{ name: 'text', type: 'string' }],
    returnType: 'string',
    example: 'normalize-space(${address})',
    category: 'Text',
  },
  'translate': {
    name: 'translate',
    description: 'Replace characters in text (like a character-level find/replace)',
    params: [
      { name: 'text', type: 'string' },
      { name: 'from', type: 'string' },
      { name: 'to', type: 'string' },
    ],
    returnType: 'string',
    example: "translate(${input}, 'abc', 'ABC')",
    category: 'Text',
  },
  'upper-case': {
    name: 'upper-case',
    description: 'Convert text to uppercase',
    params: [{ name: 'text', type: 'string' }],
    returnType: 'string',
    example: 'upper-case(${name})',
    category: 'Text',
  },
  'lower-case': {
    name: 'lower-case',
    description: 'Convert text to lowercase',
    params: [{ name: 'text', type: 'string' }],
    returnType: 'string',
    example: 'lower-case(${name})',
    category: 'Text',
  },
  'regex': {
    name: 'regex',
    description: 'Test if text matches a regular expression pattern',
    params: [
      { name: 'text', type: 'string' },
      { name: 'pattern', type: 'string' },
    ],
    returnType: 'boolean',
    example: "regex(${phone}, '^[0-9]{10}$')",
    category: 'Text',
  },
  'join': {
    name: 'join',
    description: 'Join repeat values with a separator',
    params: [
      { name: 'separator', type: 'string' },
      { name: 'field', type: 'node-set' },
    ],
    returnType: 'string',
    example: "join(', ', ${item_name})",
    category: 'Text',
  },

  // ---- Math ----
  'sum': {
    name: 'sum',
    description: 'Sum all values in a repeat or node-set',
    params: [{ name: 'field', type: 'node-set' }],
    returnType: 'number',
    example: 'sum(${quantity})',
    category: 'Math',
  },
  'count': {
    name: 'count',
    description: 'Count the number of nodes in a repeat or node-set',
    params: [{ name: 'field', type: 'node-set' }],
    returnType: 'number',
    example: 'count(${item})',
    category: 'Math',
  },
  'min': {
    name: 'min',
    description: 'Get the smallest value in a node-set',
    params: [{ name: 'field', type: 'node-set' }],
    returnType: 'number',
    example: 'min(${score})',
    category: 'Math',
  },
  'max': {
    name: 'max',
    description: 'Get the largest value in a node-set',
    params: [{ name: 'field', type: 'node-set' }],
    returnType: 'number',
    example: 'max(${score})',
    category: 'Math',
  },
  'round': {
    name: 'round',
    description: 'Round a number to a specified number of decimal places',
    params: [
      { name: 'value', type: 'number' },
      { name: 'decimals', type: 'number', optional: true },
    ],
    returnType: 'number',
    example: 'round(${total} * 1.08, 2)',
    category: 'Math',
  },
  'int': {
    name: 'int',
    description: 'Convert a value to an integer (truncates decimals)',
    params: [{ name: 'value', type: 'number' }],
    returnType: 'number',
    example: 'int(${decimal_value})',
    category: 'Math',
  },
  'abs': {
    name: 'abs',
    description: 'Get the absolute (positive) value of a number',
    params: [{ name: 'value', type: 'number' }],
    returnType: 'number',
    example: 'abs(${temperature})',
    category: 'Math',
  },
  'ceiling': {
    name: 'ceiling',
    description: 'Round a number up to the nearest integer',
    params: [{ name: 'value', type: 'number' }],
    returnType: 'number',
    example: 'ceiling(${quantity} div 12)',
    category: 'Math',
  },
  'floor': {
    name: 'floor',
    description: 'Round a number down to the nearest integer',
    params: [{ name: 'value', type: 'number' }],
    returnType: 'number',
    example: 'floor(${total})',
    category: 'Math',
  },
  'pow': {
    name: 'pow',
    description: 'Raise a number to a power',
    params: [
      { name: 'base', type: 'number' },
      { name: 'exponent', type: 'number' },
    ],
    returnType: 'number',
    example: 'pow(${side}, 2)',
    category: 'Math',
  },
  'sqrt': {
    name: 'sqrt',
    description: 'Get the square root of a number',
    params: [{ name: 'value', type: 'number' }],
    returnType: 'number',
    example: 'sqrt(${area})',
    category: 'Math',
  },
  'log': {
    name: 'log',
    description: 'Get the natural logarithm (ln) of a number',
    params: [{ name: 'value', type: 'number' }],
    returnType: 'number',
    example: 'log(${value})',
    category: 'Math',
  },
  'log10': {
    name: 'log10',
    description: 'Get the base-10 logarithm of a number',
    params: [{ name: 'value', type: 'number' }],
    returnType: 'number',
    example: 'log10(${value})',
    category: 'Math',
  },
  'exp': {
    name: 'exp',
    description: 'Get e raised to a power',
    params: [{ name: 'value', type: 'number' }],
    returnType: 'number',
    example: 'exp(${rate})',
    category: 'Math',
  },
  'exp10': {
    name: 'exp10',
    description: 'Get 10 raised to a power',
    params: [{ name: 'value', type: 'number' }],
    returnType: 'number',
    example: 'exp10(${exponent})',
    category: 'Math',
  },
  'sin': { name: 'sin', description: 'Sine of an angle in radians', params: [{ name: 'radians', type: 'number' }], returnType: 'number', example: 'sin(${angle})', category: 'Math' },
  'cos': { name: 'cos', description: 'Cosine of an angle in radians', params: [{ name: 'radians', type: 'number' }], returnType: 'number', example: 'cos(${angle})', category: 'Math' },
  'tan': { name: 'tan', description: 'Tangent of an angle in radians', params: [{ name: 'radians', type: 'number' }], returnType: 'number', example: 'tan(${angle})', category: 'Math' },
  'asin': { name: 'asin', description: 'Arcsine (inverse sine), returns radians', params: [{ name: 'value', type: 'number' }], returnType: 'number', example: 'asin(${ratio})', category: 'Math' },
  'acos': { name: 'acos', description: 'Arccosine (inverse cosine), returns radians', params: [{ name: 'value', type: 'number' }], returnType: 'number', example: 'acos(${ratio})', category: 'Math' },
  'atan': { name: 'atan', description: 'Arctangent (inverse tangent), returns radians', params: [{ name: 'value', type: 'number' }], returnType: 'number', example: 'atan(${slope})', category: 'Math' },
  'atan2': { name: 'atan2', description: 'Two-argument arctangent', params: [{ name: 'y', type: 'number' }, { name: 'x', type: 'number' }], returnType: 'number', example: 'atan2(${y}, ${x})', category: 'Math' },
  'pi': { name: 'pi', description: 'The constant pi (3.14159...)', params: [], returnType: 'number', example: 'pi()', category: 'Math' },
  'random': { name: 'random', description: 'Generate a random number between 0 and 1', params: [], returnType: 'number', example: 'random()', category: 'Math' },

  // ---- Date/Time ----
  'today': {
    name: 'today',
    description: 'Get the current date (without time)',
    params: [],
    returnType: 'date',
    example: 'today()',
    category: 'Date/Time',
  },
  'now': {
    name: 'now',
    description: 'Get the current date and time',
    params: [],
    returnType: 'datetime',
    example: 'now()',
    category: 'Date/Time',
  },
  'format-date': {
    name: 'format-date',
    description: 'Format a date value using a pattern (%Y = year, %m = month, %d = day, etc.)',
    params: [
      { name: 'date', type: 'date' },
      { name: 'format', type: 'string' },
    ],
    returnType: 'string',
    example: "format-date(${date_field}, '%Y-%m-%d')",
    category: 'Date/Time',
  },
  'date': {
    name: 'date',
    description: 'Convert a value to a date',
    params: [{ name: 'value', type: 'string' }],
    returnType: 'date',
    example: "date('2024-01-15')",
    category: 'Date/Time',
  },
  'date-time': {
    name: 'date-time',
    description: 'Convert a value to a datetime',
    params: [{ name: 'value', type: 'string' }],
    returnType: 'datetime',
    example: "date-time('2024-01-15T08:30:00')",
    category: 'Date/Time',
  },
  'decimal-date-time': {
    name: 'decimal-date-time',
    description: 'Convert a datetime to a decimal number (days since epoch)',
    params: [{ name: 'datetime', type: 'datetime' }],
    returnType: 'number',
    example: 'decimal-date-time(${timestamp})',
    category: 'Date/Time',
  },
  'decimal-time': {
    name: 'decimal-time',
    description: 'Convert a time to a decimal fraction of a day',
    params: [{ name: 'time', type: 'time' }],
    returnType: 'number',
    example: 'decimal-time(${start_time})',
    category: 'Date/Time',
  },

  // ---- Logic ----
  'if': {
    name: 'if',
    description: 'Return one value if a condition is true, another if false',
    params: [
      { name: 'condition', type: 'boolean' },
      { name: 'then_value', type: 'any' },
      { name: 'else_value', type: 'any' },
    ],
    returnType: 'any',
    example: "if(${age} >= 18, 'Adult', 'Minor')",
    category: 'Logic',
  },
  'coalesce': {
    name: 'coalesce',
    description: 'Return the first non-empty value',
    params: [
      { name: 'value1', type: 'any' },
      { name: 'value2', type: 'any' },
    ],
    returnType: 'any',
    example: 'coalesce(${preferred_name}, ${legal_name})',
    category: 'Logic',
  },
  'once': {
    name: 'once',
    description: 'Evaluate expression only on first entry (not on subsequent edits)',
    params: [{ name: 'expression', type: 'any' }],
    returnType: 'any',
    example: 'once(now())',
    category: 'Logic',
  },
  'not': {
    name: 'not',
    description: 'Negate a boolean value (true becomes false, false becomes true)',
    params: [{ name: 'condition', type: 'boolean' }],
    returnType: 'boolean',
    example: "not(selected(${options}, 'none'))",
    category: 'Logic',
  },
  'true': { name: 'true', description: 'Boolean true value', params: [], returnType: 'boolean', example: 'true()', category: 'Logic' },
  'false': { name: 'false', description: 'Boolean false value', params: [], returnType: 'boolean', example: 'false()', category: 'Logic' },
  'boolean-from-string': {
    name: 'boolean-from-string',
    description: 'Convert a string to a boolean ("true"/"1" = true)',
    params: [{ name: 'text', type: 'string' }],
    returnType: 'boolean',
    example: "boolean-from-string('true')",
    category: 'Logic',
  },

  // ---- Type Conversion ----
  'string': {
    name: 'string',
    description: 'Convert a value to text',
    params: [{ name: 'value', type: 'any' }],
    returnType: 'string',
    example: 'string(${number_field})',
    category: 'Type Conversion',
  },
  'number': {
    name: 'number',
    description: 'Convert a value to a number',
    params: [{ name: 'value', type: 'any' }],
    returnType: 'number',
    example: 'number(${text_field})',
    category: 'Type Conversion',
  },
  'boolean': {
    name: 'boolean',
    description: 'Convert a value to a boolean',
    params: [{ name: 'value', type: 'any' }],
    returnType: 'boolean',
    example: 'boolean(${field})',
    category: 'Type Conversion',
  },

  // ---- Data/Lookup ----
  'pulldata': {
    name: 'pulldata',
    description: 'Look up a value from a CSV file, device property, or call a JavaScript function',
    params: [
      { name: 'source', type: 'string' },
      { name: 'return_col_or_property', type: 'string' },
      { name: 'lookup_col', type: 'string', optional: true },
      { name: 'lookup_value', type: 'any', optional: true },
    ],
    returnType: 'any',
    example: "pulldata('facilities', 'address', 'id', ${facility_id})",
    category: 'Data/Lookup',
  },
  'indexed-repeat': {
    name: 'indexed-repeat',
    description: 'Get a value from a specific repeat instance by index',
    params: [
      { name: 'field', type: 'node-set' },
      { name: 'repeat', type: 'node-set' },
      { name: 'index', type: 'number' },
    ],
    returnType: 'any',
    example: 'indexed-repeat(${name}, ${person_repeat}, 1)',
    category: 'Data/Lookup',
  },
  'instance': {
    name: 'instance',
    description: 'Reference a secondary instance (itemset, external data)',
    params: [{ name: 'instance_id', type: 'string' }],
    returnType: 'node-set',
    example: "instance('cities')",
    category: 'Data/Lookup',
  },
  'current': {
    name: 'current',
    description: 'Reference the current context node (used in choice_filter)',
    params: [],
    returnType: 'node-set',
    example: 'current()/../state',
    category: 'Data/Lookup',
  },
  'position': {
    name: 'position',
    description: 'Get the current repeat instance position (1-indexed)',
    params: [{ name: 'path', type: 'string', optional: true }],
    returnType: 'number',
    example: 'position(..)',
    category: 'Data/Lookup',
  },

  // ---- GIS/Spatial ----
  'distance': {
    name: 'distance',
    description: 'Calculate distance between two geopoints in meters',
    params: [
      { name: 'point1', type: 'node-set' },
      { name: 'point2', type: 'node-set' },
    ],
    returnType: 'number',
    example: 'distance(${start_point}, ${end_point})',
    category: 'GIS/Spatial',
  },
  'area': {
    name: 'area',
    description: 'Calculate the area of a geoshape in square meters',
    params: [{ name: 'geoshape', type: 'node-set' }],
    returnType: 'number',
    example: 'area(${polygon})',
    category: 'GIS/Spatial',
  },

  // ---- Other ----
  'uuid': { name: 'uuid', description: 'Generate a unique identifier', params: [], returnType: 'string', example: 'uuid()', category: 'Other' },
  'property': { name: 'property', description: 'Get a form property value', params: [{ name: 'name', type: 'string' }], returnType: 'string', example: "property('version')", category: 'Other' },
  'version': { name: 'version', description: 'Get the form version string', params: [], returnType: 'string', example: 'version()', category: 'Other' },
};

// Set of all known function names for quick lookup
export const KNOWN_FUNCTIONS = new Set(Object.keys(FUNCTION_REGISTRY));

// ============================================================
// Tokenizer
// ============================================================

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Whitespace
    if (/\s/.test(ch)) {
      const start = i;
      while (i < input.length && /\s/.test(input[i])) i++;
      tokens.push({ type: 'whitespace', value: input.slice(start, i), start, end: i });
      continue;
    }

    // Field reference: ${...}
    if (ch === '$' && input[i + 1] === '{') {
      const start = i;
      i += 2; // skip ${
      while (i < input.length && input[i] !== '}') i++;
      if (i < input.length) i++; // skip }
      tokens.push({ type: 'field_ref', value: input.slice(start, i), start, end: i });
      continue;
    }

    // String literal: '...'
    if (ch === "'") {
      const start = i;
      i++; // skip opening quote
      while (i < input.length && input[i] !== "'") {
        if (input[i] === '\\') i++; // skip escape
        i++;
      }
      if (i < input.length) i++; // skip closing quote
      tokens.push({ type: 'string', value: input.slice(start, i), start, end: i });
      continue;
    }

    // Number literal
    if (/\d/.test(ch) || (ch === '.' && i + 1 < input.length && /\d/.test(input[i + 1]))) {
      const start = i;
      while (i < input.length && /[\d.]/.test(input[i])) i++;
      tokens.push({ type: 'number', value: input.slice(start, i), start, end: i });
      continue;
    }

    // Multi-character operators
    if (ch === '!' && input[i + 1] === '=') {
      tokens.push({ type: 'operator', value: '!=', start: i, end: i + 2 });
      i += 2;
      continue;
    }
    if (ch === '>' && input[i + 1] === '=') {
      tokens.push({ type: 'operator', value: '>=', start: i, end: i + 2 });
      i += 2;
      continue;
    }
    if (ch === '<' && input[i + 1] === '=') {
      tokens.push({ type: 'operator', value: '<=', start: i, end: i + 2 });
      i += 2;
      continue;
    }

    // Double slash
    if (ch === '/' && input[i + 1] === '/') {
      tokens.push({ type: 'double_slash', value: '//', start: i, end: i + 2 });
      i += 2;
      continue;
    }

    // Single-char tokens
    if (ch === '(') { tokens.push({ type: 'paren_open', value: '(', start: i, end: i + 1 }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'paren_close', value: ')', start: i, end: i + 1 }); i++; continue; }
    if (ch === ',') { tokens.push({ type: 'comma', value: ',', start: i, end: i + 1 }); i++; continue; }
    if (ch === '=') { tokens.push({ type: 'operator', value: '=', start: i, end: i + 1 }); i++; continue; }
    if (ch === '>') { tokens.push({ type: 'operator', value: '>', start: i, end: i + 1 }); i++; continue; }
    if (ch === '<') { tokens.push({ type: 'operator', value: '<', start: i, end: i + 1 }); i++; continue; }
    if (ch === '+') { tokens.push({ type: 'operator', value: '+', start: i, end: i + 1 }); i++; continue; }
    if (ch === '-') { tokens.push({ type: 'operator', value: '-', start: i, end: i + 1 }); i++; continue; }
    if (ch === '*') { tokens.push({ type: 'operator', value: '*', start: i, end: i + 1 }); i++; continue; }
    if (ch === '|') { tokens.push({ type: 'operator', value: '|', start: i, end: i + 1 }); i++; continue; }
    if (ch === '/') { tokens.push({ type: 'slash', value: '/', start: i, end: i + 1 }); i++; continue; }

    // Dot / Double dot
    if (ch === '.' && input[i + 1] === '.') {
      tokens.push({ type: 'dot_dot', value: '..', start: i, end: i + 2 });
      i += 2;
      continue;
    }
    if (ch === '.') {
      tokens.push({ type: 'dot', value: '.', start: i, end: i + 1 });
      i++;
      continue;
    }

    // Identifiers and keywords (including function names like jr:choice-name)
    if (/[a-zA-Z_]/.test(ch)) {
      const start = i;
      while (i < input.length && /[a-zA-Z0-9_:-]/.test(input[i])) i++;
      const word = input.slice(start, i);
      const lower = word.toLowerCase();

      // Check if keyword
      if (lower === 'and' || lower === 'or' || lower === 'div' || lower === 'mod') {
        tokens.push({ type: 'keyword', value: word, start, end: i });
        continue;
      }

      // Look ahead (skipping whitespace) to see if followed by '('
      let lookahead = i;
      while (lookahead < input.length && /\s/.test(input[lookahead])) lookahead++;
      if (lookahead < input.length && input[lookahead] === '(') {
        tokens.push({ type: 'function_name', value: word, start, end: i });
      } else {
        tokens.push({ type: 'identifier', value: word, start, end: i });
      }
      continue;
    }

    // Unrecognized character
    tokens.push({ type: 'error', value: ch, start: i, end: i + 1 });
    i++;
  }

  tokens.push({ type: 'eof', value: '', start: i, end: i });
  return tokens;
}

// ============================================================
// Parser
// ============================================================

class Parser {
  private tokens: Token[];
  private pos: number = 0;
  public diagnostics: ExpressionDiagnostic[] = [];

  constructor(tokens: Token[]) {
    // Filter out whitespace for parsing, but keep position info
    this.tokens = tokens.filter(t => t.type !== 'whitespace');
  }

  private peek(): Token {
    return this.tokens[this.pos] || { type: 'eof', value: '', start: 0, end: 0 };
  }

  private advance(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private expect(type: TokenType, value?: string): Token | null {
    const tok = this.peek();
    if (tok.type === type && (value === undefined || tok.value === value)) {
      return this.advance();
    }
    const expected = value ? `"${value}"` : type;
    this.diagnostics.push({
      level: 'error',
      message: `Expected ${expected}, got "${tok.value || 'end of expression'}"`,
      start: tok.start,
      end: tok.end,
    });
    return null;
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'eof';
  }

  // ---- Grammar rules ----

  parse(): ASTNode {
    if (this.isAtEnd()) {
      const tok = this.peek();
      return { type: 'expression', start: tok.start, end: tok.end, children: [] };
    }
    const node = this.parseOrExpr();
    if (!this.isAtEnd()) {
      const tok = this.peek();
      this.diagnostics.push({
        level: 'error',
        message: `Unexpected "${tok.value}" after expression`,
        start: tok.start,
        end: tok.end,
      });
    }
    return node;
  }

  private parseOrExpr(): ASTNode {
    let left = this.parseAndExpr();
    while (this.peek().type === 'keyword' && this.peek().value.toLowerCase() === 'or') {
      const op = this.advance();
      const right = this.parseAndExpr();
      left = {
        type: 'binary_op',
        operator: 'or',
        start: left.start,
        end: right.end,
        children: [left, right],
      };
    }
    return left;
  }

  private parseAndExpr(): ASTNode {
    let left = this.parseCompareExpr();
    while (this.peek().type === 'keyword' && this.peek().value.toLowerCase() === 'and') {
      const op = this.advance();
      const right = this.parseCompareExpr();
      left = {
        type: 'binary_op',
        operator: 'and',
        start: left.start,
        end: right.end,
        children: [left, right],
      };
    }
    return left;
  }

  private parseCompareExpr(): ASTNode {
    let left = this.parseAddExpr();
    const tok = this.peek();
    if (tok.type === 'operator' && ['=', '!=', '<', '>', '<=', '>='].includes(tok.value)) {
      const op = this.advance();
      const right = this.parseAddExpr();
      left = {
        type: 'binary_op',
        operator: op.value,
        start: left.start,
        end: right.end,
        children: [left, right],
      };
    }
    return left;
  }

  private parseAddExpr(): ASTNode {
    let left = this.parseMulExpr();
    while (this.peek().type === 'operator' && ['+', '-'].includes(this.peek().value)) {
      const op = this.advance();
      const right = this.parseMulExpr();
      left = {
        type: 'binary_op',
        operator: op.value,
        start: left.start,
        end: right.end,
        children: [left, right],
      };
    }
    return left;
  }

  private parseMulExpr(): ASTNode {
    let left = this.parseUnionExpr();
    while (
      (this.peek().type === 'operator' && this.peek().value === '*') ||
      (this.peek().type === 'keyword' && ['div', 'mod'].includes(this.peek().value.toLowerCase()))
    ) {
      const op = this.advance();
      const right = this.parseUnionExpr();
      left = {
        type: 'binary_op',
        operator: op.value.toLowerCase(),
        start: left.start,
        end: right.end,
        children: [left, right],
      };
    }
    return left;
  }

  private parseUnionExpr(): ASTNode {
    let left = this.parseUnaryExpr();
    while (this.peek().type === 'operator' && this.peek().value === '|') {
      const op = this.advance();
      const right = this.parseUnaryExpr();
      left = {
        type: 'binary_op',
        operator: '|',
        start: left.start,
        end: right.end,
        children: [left, right],
      };
    }
    return left;
  }

  private parseUnaryExpr(): ASTNode {
    if (this.peek().type === 'operator' && this.peek().value === '-') {
      const op = this.advance();
      const operand = this.parseUnaryExpr();
      return {
        type: 'unary_op',
        operator: '-',
        start: op.start,
        end: operand.end,
        children: [operand],
      };
    }
    return this.parsePrimaryExpr();
  }

  private parsePrimaryExpr(): ASTNode {
    const tok = this.peek();

    // Field reference: ${name}
    if (tok.type === 'field_ref') {
      this.advance();
      const fieldName = tok.value.slice(2, -1); // strip ${ and }
      return {
        type: 'field_ref',
        fieldName,
        start: tok.start,
        end: tok.end,
      };
    }

    // String literal
    if (tok.type === 'string') {
      this.advance();
      return {
        type: 'string_literal',
        value: tok.value,
        start: tok.start,
        end: tok.end,
      };
    }

    // Number literal
    if (tok.type === 'number') {
      this.advance();
      return {
        type: 'number_literal',
        value: tok.value,
        start: tok.start,
        end: tok.end,
      };
    }

    // Function call: name(...)
    if (tok.type === 'function_name') {
      return this.parseFunctionCall();
    }

    // Parenthesized expression
    if (tok.type === 'paren_open') {
      const open = this.advance();
      const inner = this.parseOrExpr();
      const close = this.expect('paren_close', ')');
      return {
        type: 'group',
        start: open.start,
        end: close ? close.end : inner.end,
        children: [inner],
      };
    }

    // Path expressions: dot, dot-dot, identifiers, slashes
    if (tok.type === 'dot' || tok.type === 'dot_dot' || tok.type === 'slash' || tok.type === 'double_slash') {
      return this.parsePathExpr();
    }

    // Bare identifier (could be a path segment)
    if (tok.type === 'identifier') {
      return this.parsePathExpr();
    }

    // not() used as a keyword but it's actually a function
    if (tok.type === 'keyword' && tok.value.toLowerCase() === 'not') {
      // Check if followed by (
      const next = this.tokens[this.pos + 1];
      if (next && next.type === 'paren_open') {
        // Treat as function call
        const funcTok = this.advance();
        return this.parseFunctionCallFrom(funcTok);
      }
    }

    // Error recovery
    if (tok.type === 'error') {
      this.advance();
      this.diagnostics.push({
        level: 'error',
        message: `Unexpected character "${tok.value}"`,
        start: tok.start,
        end: tok.end,
      });
      return { type: 'error', errorMessage: `Unexpected "${tok.value}"`, start: tok.start, end: tok.end };
    }

    // Unexpected token
    if (tok.type !== 'eof') {
      this.advance();
      this.diagnostics.push({
        level: 'error',
        message: `Unexpected "${tok.value}"`,
        start: tok.start,
        end: tok.end,
      });
      return { type: 'error', errorMessage: `Unexpected "${tok.value}"`, start: tok.start, end: tok.end };
    }

    // End of input when expecting expression
    this.diagnostics.push({
      level: 'error',
      message: 'Expected an expression',
      start: tok.start,
      end: tok.end,
    });
    return { type: 'error', errorMessage: 'Expected an expression', start: tok.start, end: tok.end };
  }

  private parseFunctionCall(): ASTNode {
    const nameTok = this.advance(); // function name
    return this.parseFunctionCallFrom(nameTok);
  }

  private parseFunctionCallFrom(nameTok: Token): ASTNode {
    const open = this.expect('paren_open', '(');
    if (!open) {
      return {
        type: 'function_call',
        functionName: nameTok.value,
        args: [],
        start: nameTok.start,
        end: nameTok.end,
      };
    }

    const args: ASTNode[] = [];
    if (this.peek().type !== 'paren_close') {
      args.push(this.parseOrExpr());
      while (this.peek().type === 'comma') {
        this.advance(); // skip comma
        args.push(this.parseOrExpr());
      }
    }

    const close = this.expect('paren_close', ')');
    return {
      type: 'function_call',
      functionName: nameTok.value,
      args,
      start: nameTok.start,
      end: close ? close.end : (args.length > 0 ? args[args.length - 1].end : open.end),
    };
  }

  private parsePathExpr(): ASTNode {
    const start = this.peek().start;
    let path = '';

    // Consume path segments: identifiers, dots, slashes
    while (!this.isAtEnd()) {
      const tok = this.peek();
      if (tok.type === 'dot') {
        path += '.';
        this.advance();
      } else if (tok.type === 'dot_dot') {
        path += '..';
        this.advance();
      } else if (tok.type === 'slash') {
        path += '/';
        this.advance();
      } else if (tok.type === 'double_slash') {
        path += '//';
        this.advance();
      } else if (tok.type === 'identifier') {
        path += tok.value;
        this.advance();
      } else {
        break;
      }
    }

    const end = this.tokens[this.pos - 1]?.end ?? start;
    return {
      type: 'path_expr',
      path,
      start,
      end,
    };
  }
}

// ============================================================
// Public API
// ============================================================

export interface ParseResult {
  ast: ASTNode;
  tokens: Token[];
  diagnostics: ExpressionDiagnostic[];
}

/**
 * Parse an XLSForm expression and return the AST, tokens, and diagnostics.
 */
export function parseExpression(input: string): ParseResult {
  const allTokens = tokenize(input);
  const parser = new Parser(allTokens);
  const ast = parser.parse();

  // Check for tokenizer-level errors (unterminated strings, etc.)
  const tokenDiagnostics: ExpressionDiagnostic[] = [];
  for (const tok of allTokens) {
    if (tok.type === 'string' && !tok.value.endsWith("'")) {
      tokenDiagnostics.push({
        level: 'error',
        message: 'Unterminated string literal',
        start: tok.start,
        end: tok.end,
      });
    }
    if (tok.type === 'field_ref' && !tok.value.endsWith('}')) {
      tokenDiagnostics.push({
        level: 'error',
        message: 'Unterminated field reference (missing closing })',
        start: tok.start,
        end: tok.end,
      });
    }
    if (tok.type === 'field_ref' && tok.value === '${}') {
      tokenDiagnostics.push({
        level: 'error',
        message: 'Empty field reference ${}',
        start: tok.start,
        end: tok.end,
      });
    }
  }

  return {
    ast,
    tokens: allTokens,
    diagnostics: [...tokenDiagnostics, ...parser.diagnostics],
  };
}

/**
 * Validate an expression against the form context.
 * Returns diagnostics with precise positions for inline error display.
 */
export function validateExpressionAST(
  input: string,
  fieldNames: Set<string>,
): ExpressionDiagnostic[] {
  if (!input || !input.trim()) return [];

  const { ast, tokens, diagnostics } = parseExpression(input);

  // Additional semantic checks
  const semanticDiags: ExpressionDiagnostic[] = [];

  function walkAST(node: ASTNode): void {
    // Check field references exist
    if (node.type === 'field_ref') {
      const name = node.fieldName || '';
      if (name && name !== '.' && !fieldNames.has(name)) {
        semanticDiags.push({
          level: 'warning',
          message: `Field "${name}" not found in form`,
          start: node.start,
          end: node.end,
        });
      }
    }

    // Check function names are known
    if (node.type === 'function_call') {
      const funcName = (node.functionName || '').toLowerCase();
      if (!KNOWN_FUNCTIONS.has(funcName)) {
        semanticDiags.push({
          level: 'warning',
          message: `Unknown function "${node.functionName}"`,
          start: node.start,
          end: node.start + (node.functionName?.length || 0),
        });
      } else {
        // Check argument count
        const sig = FUNCTION_REGISTRY[funcName];
        if (sig && node.args) {
          const requiredParams = sig.params.filter(p => !p.optional).length;
          const maxParams = sig.params.length;
          const hasVarargs = sig.params.some(p => p.name.startsWith('...'));

          if (!hasVarargs) {
            if (node.args.length < requiredParams) {
              semanticDiags.push({
                level: 'error',
                message: `${sig.name}() expects at least ${requiredParams} argument${requiredParams !== 1 ? 's' : ''}, got ${node.args.length}`,
                start: node.start,
                end: node.end,
              });
            } else if (node.args.length > maxParams) {
              semanticDiags.push({
                level: 'warning',
                message: `${sig.name}() expects at most ${maxParams} argument${maxParams !== 1 ? 's' : ''}, got ${node.args.length}`,
                start: node.start,
                end: node.end,
              });
            }
          }
        }
      }
    }

    // Recurse into children
    if (node.children) {
      for (const child of node.children) walkAST(child);
    }
    if (node.args) {
      for (const arg of node.args) walkAST(arg);
    }
  }

  walkAST(ast);

  return [...diagnostics, ...semanticDiags];
}

// ============================================================
// Autocomplete
// ============================================================

export interface CompletionItem {
  label: string;
  kind: 'function' | 'field' | 'operator' | 'keyword' | 'value';
  detail?: string;
  insertText: string;
  /** Signature hint shown beside the label */
  signature?: string;
  /** Documentation shown in tooltip */
  documentation?: string;
  /** Sort priority (lower = higher in list) */
  sortOrder?: number;
}

/**
 * Get autocomplete suggestions at the given cursor position.
 */
/** Map of choice list name to array of { name, label } values */
export type ChoiceValueMap = Map<string, { name: string; label: string }[]>;

export function getCompletions(
  input: string,
  cursorPos: number,
  fieldNames: Map<string, { type: string; label: string; listName?: string }>,
  choiceValues?: ChoiceValueMap,
): CompletionItem[] {
  const items: CompletionItem[] = [];
  const allTokens = tokenize(input);
  const nonWsTokens = allTokens.filter(t => t.type !== 'whitespace');

  // Find the token at or just before cursor
  let currentToken: Token | null = null;
  let prevToken: Token | null = null;
  for (const tok of nonWsTokens) {
    if (tok.start <= cursorPos && tok.end >= cursorPos) {
      currentToken = tok;
      break;
    }
    if (tok.end <= cursorPos) {
      prevToken = tok;
    }
  }

  // Determine context
  const textBeforeCursor = input.slice(0, cursorPos);

  // Inside a field reference: ${...
  const fieldRefMatch = textBeforeCursor.match(/\$\{([^}]*)$/);
  if (fieldRefMatch) {
    const prefix = fieldRefMatch[1].toLowerCase();
    for (const [name, info] of fieldNames) {
      if (name.toLowerCase().startsWith(prefix)) {
        items.push({
          label: name,
          kind: 'field',
          detail: info.type,
          insertText: name + '}',
          documentation: info.label || name,
          sortOrder: 0,
        });
      }
    }
    return items;
  }

  // ── Choice value suggestions ──────────────────────────────
  // Detect pattern: ${field_name} = or ${field_name} != (with cursor after the operator)
  // Also works for: selected(${field_name}, and inside quotes after the patterns above
  if (choiceValues) {
    const choiceSuggestions = getChoiceValueSuggestions(textBeforeCursor, fieldNames, choiceValues);
    if (choiceSuggestions.length > 0) {
      return choiceSuggestions;
    }
  }

  // After a complete token, determine what makes sense next
  const partialWord = textBeforeCursor.match(/([a-zA-Z_][a-zA-Z0-9_:-]*)$/);
  const prefix = partialWord ? partialWord[1].toLowerCase() : '';

  // Suggest functions
  for (const [name, sig] of Object.entries(FUNCTION_REGISTRY)) {
    if (prefix && !name.toLowerCase().startsWith(prefix)) continue;
    const paramStr = sig.params.map(p => p.optional ? `[${p.name}]` : p.name).join(', ');
    items.push({
      label: name,
      kind: 'function',
      detail: `(${paramStr}) : ${sig.returnType}`,
      signature: `${name}(${paramStr})`,
      insertText: prefix ? name.slice(prefix.length) + '(' : name + '(',
      documentation: sig.description,
      sortOrder: 1,
    });
  }

  // Suggest field references (as ${...})
  for (const [name, info] of fieldNames) {
    if (prefix && !name.toLowerCase().startsWith(prefix)) continue;
    items.push({
      label: '${' + name + '}',
      kind: 'field',
      detail: info.type + (info.label ? ` : ${info.label}` : ''),
      insertText: prefix ? '${' + name + '}' : '${' + name + '}',
      documentation: info.label || name,
      sortOrder: 0,
    });
  }

  // Suggest operators if we're after a value
  if (!prefix) {
    const afterValue = prevToken && ['field_ref', 'string', 'number', 'paren_close', 'identifier'].includes(prevToken.type);
    if (afterValue) {
      const ops = [
        { label: '=', insert: ' = ', detail: 'Equals' },
        { label: '!=', insert: ' != ', detail: 'Not equals' },
        { label: '>', insert: ' > ', detail: 'Greater than' },
        { label: '<', insert: ' < ', detail: 'Less than' },
        { label: '>=', insert: ' >= ', detail: 'Greater or equal' },
        { label: '<=', insert: ' <= ', detail: 'Less or equal' },
        { label: 'and', insert: ' and ', detail: 'Both conditions true' },
        { label: 'or', insert: ' or ', detail: 'Either condition true' },
        { label: '+', insert: ' + ', detail: 'Add' },
        { label: '-', insert: ' - ', detail: 'Subtract' },
        { label: '*', insert: ' * ', detail: 'Multiply' },
        { label: 'div', insert: ' div ', detail: 'Divide' },
        { label: 'mod', insert: ' mod ', detail: 'Modulo' },
      ];
      for (const op of ops) {
        items.push({
          label: op.label,
          kind: 'operator',
          detail: op.detail,
          insertText: op.insert,
          sortOrder: 2,
        });
      }
    }
  }

  // Sort by sortOrder then alphabetically
  items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.label.localeCompare(b.label));

  return items;
}

/**
 * Detect when the cursor is in a position where choice values should be suggested.
 *
 * Supported patterns:
 *   ${field} =           -> suggest 'value1', 'value2', ...
 *   ${field} !=          -> suggest 'value1', 'value2', ...
 *   ${field} = '...      -> filter choice values by partial match
 *   selected(${field},   -> suggest 'value1', 'value2', ...
 *   selected(${field}, ' -> filter choice values by partial match
 */
function getChoiceValueSuggestions(
  textBeforeCursor: string,
  fieldNames: Map<string, { type: string; label: string; listName?: string }>,
  choiceValues: ChoiceValueMap,
): CompletionItem[] {
  // Check if we're typing inside a partial string after a comparison
  // Pattern: ${field} = 'partial or ${field} != 'partial
  const partialStringMatch = textBeforeCursor.match(
    /\$\{([^}]+)\}\s*[!=]{1,2}\s*'([^']*)$/
  );
  // Pattern: selected(${field}, 'partial
  const selectedPartialMatch = textBeforeCursor.match(
    /selected\s*\(\s*\$\{([^}]+)\}\s*,\s*'([^']*)$/
  );

  // Check if cursor is right after an operator with no quote started yet
  // Pattern: ${field} = or ${field} !=
  const afterOperatorMatch = textBeforeCursor.match(
    /\$\{([^}]+)\}\s*[!=]{1,2}\s*$/
  );
  // Pattern: selected(${field},
  const selectedAfterCommaMatch = textBeforeCursor.match(
    /selected\s*\(\s*\$\{([^}]+)\}\s*,\s*$/
  );

  let fieldName: string | null = null;
  let partialValue = '';
  let inQuote = false;

  if (partialStringMatch) {
    fieldName = partialStringMatch[1];
    partialValue = partialStringMatch[2].toLowerCase();
    inQuote = true;
  } else if (selectedPartialMatch) {
    fieldName = selectedPartialMatch[1];
    partialValue = selectedPartialMatch[2].toLowerCase();
    inQuote = true;
  } else if (afterOperatorMatch) {
    fieldName = afterOperatorMatch[1];
  } else if (selectedAfterCommaMatch) {
    fieldName = selectedAfterCommaMatch[1];
  }

  if (!fieldName) return [];

  // Look up the field to get its choice list
  const fieldInfo = fieldNames.get(fieldName);
  if (!fieldInfo || !fieldInfo.listName) return [];

  // Only suggest for select_one / select_multiple types
  if (!fieldInfo.type.startsWith('select_one') && !fieldInfo.type.startsWith('select_multiple')) return [];

  const choices = choiceValues.get(fieldInfo.listName);
  if (!choices || choices.length === 0) return [];

  const items: CompletionItem[] = [];
  for (const choice of choices) {
    if (partialValue && !choice.name.toLowerCase().startsWith(partialValue) &&
        !choice.label.toLowerCase().startsWith(partialValue)) {
      continue;
    }

    // If we're already inside a quote, just complete the value + closing quote
    // If not, insert the full 'value'
    const insertText = inQuote
      ? choice.name.slice(partialValue.length) + "'"
      : "'" + choice.name + "'";

    items.push({
      label: choice.name,
      kind: 'value',
      detail: choice.label !== choice.name ? choice.label : undefined,
      insertText,
      documentation: `Choice value from list "${fieldInfo.listName}"`,
      sortOrder: 0,
    });
  }

  return items;
}

// ============================================================
// Hover Info
// ============================================================

export interface HoverInfo {
  content: string;
  signature?: string;
  description?: string;
  example?: string;
  category?: string;
  fieldType?: string;
  fieldLabel?: string;
  start: number;
  end: number;
}

/**
 * Get hover information at the given cursor position.
 */
export function getHoverInfo(
  input: string,
  cursorPos: number,
  fieldNames: Map<string, { type: string; label: string }>,
): HoverInfo | null {
  const allTokens = tokenize(input);
  const nonWsTokens = allTokens.filter(t => t.type !== 'whitespace');

  // Find the token at cursor
  let hitToken: Token | null = null;
  for (const tok of nonWsTokens) {
    if (tok.start <= cursorPos && tok.end > cursorPos) {
      hitToken = tok;
      break;
    }
  }
  if (!hitToken) return null;

  // Function name hover
  if (hitToken.type === 'function_name') {
    const sig = FUNCTION_REGISTRY[hitToken.value.toLowerCase()];
    if (sig) {
      const paramStr = sig.params.map(p => p.optional ? `[${p.name}: ${p.type}]` : `${p.name}: ${p.type}`).join(', ');
      return {
        content: `${sig.name}(${paramStr}) : ${sig.returnType}`,
        signature: `${sig.name}(${paramStr})`,
        description: sig.description,
        example: sig.example,
        category: sig.category,
        start: hitToken.start,
        end: hitToken.end,
      };
    }
  }

  // Field reference hover
  if (hitToken.type === 'field_ref') {
    const fieldName = hitToken.value.slice(2, -1);
    const info = fieldNames.get(fieldName);
    if (info) {
      return {
        content: `${fieldName} (${info.type})`,
        fieldType: info.type,
        fieldLabel: info.label,
        description: info.label ? `Label: ${info.label}` : undefined,
        start: hitToken.start,
        end: hitToken.end,
      };
    }
    return {
      content: `${fieldName} (unknown field)`,
      description: 'This field was not found in the form',
      start: hitToken.start,
      end: hitToken.end,
    };
  }

  // Keyword hover
  if (hitToken.type === 'keyword') {
    const keywordInfo: Record<string, string> = {
      'and': 'Logical AND: both conditions must be true',
      'or': 'Logical OR: at least one condition must be true',
      'div': 'Integer division',
      'mod': 'Modulo (remainder after division)',
    };
    const desc = keywordInfo[hitToken.value.toLowerCase()];
    if (desc) {
      return {
        content: hitToken.value,
        description: desc,
        start: hitToken.start,
        end: hitToken.end,
      };
    }
  }

  return null;
}
