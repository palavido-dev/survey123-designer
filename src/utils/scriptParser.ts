/**
 * JavaScript Function Parser
 *
 * Parses JavaScript source code to extract function signatures
 * for the function picker and validation. Handles:
 * - function declarations: function myFunc(a, b) { ... }
 * - const/let/var arrow functions: const myFunc = (a, b) => { ... }
 * - const/let/var function expressions: const myFunc = function(a, b) { ... }
 * - JSDoc comments above functions
 */

import { ParsedFunction } from '../types/survey';

/**
 * Parse a JavaScript source string and extract all top-level function signatures.
 */
export function parseJavaScriptFunctions(source: string, fileName: string): ParsedFunction[] {
  const functions: ParsedFunction[] = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Try to extract JSDoc from preceding lines
    const jsdoc = extractJSDoc(lines, i);

    // Pattern 1: function declaration — function myFunc(a, b)
    const funcDeclMatch = line.match(/^\s*function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/);
    if (funcDeclMatch) {
      functions.push({
        name: funcDeclMatch[1],
        params: parseParams(funcDeclMatch[2]),
        fileName,
        line: lineNum,
        description: jsdoc,
      });
      continue;
    }

    // Pattern 2: const/let/var name = function(params)
    const funcExprMatch = line.match(
      /^\s*(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function\s*\(([^)]*)\)/
    );
    if (funcExprMatch) {
      functions.push({
        name: funcExprMatch[1],
        params: parseParams(funcExprMatch[2]),
        fileName,
        line: lineNum,
        description: jsdoc,
      });
      continue;
    }

    // Pattern 3: const/let/var name = (params) =>
    const arrowMatch = line.match(
      /^\s*(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\(([^)]*)\)\s*=>/
    );
    if (arrowMatch) {
      functions.push({
        name: arrowMatch[1],
        params: parseParams(arrowMatch[2]),
        fileName,
        line: lineNum,
        description: jsdoc,
      });
      continue;
    }

    // Pattern 4: const/let/var name = param =>  (single param arrow, no parens)
    const singleArrowMatch = line.match(
      /^\s*(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/
    );
    if (singleArrowMatch) {
      functions.push({
        name: singleArrowMatch[1],
        params: [singleArrowMatch[2].trim()],
        fileName,
        line: lineNum,
        description: jsdoc,
      });
      continue;
    }
  }

  return functions;
}

function parseParams(paramStr: string): string[] {
  if (!paramStr.trim()) return [];
  return paramStr
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      // Strip default values: "x = 5" → "x"
      const eqIdx = p.indexOf('=');
      if (eqIdx !== -1) return p.slice(0, eqIdx).trim();
      // Strip destructuring / rest: "...args" → "args"
      return p.replace(/^\.\.\./, '').trim();
    });
}

/**
 * Extract a JSDoc comment block ending on the line just before lineIndex.
 */
function extractJSDoc(lines: string[], lineIndex: number): string | undefined {
  // Walk backwards from the line before, looking for a closing */
  let endLine = lineIndex - 1;
  while (endLine >= 0 && lines[endLine].trim() === '') endLine--;
  if (endLine < 0 || !lines[endLine].trim().endsWith('*/')) return undefined;

  // Find the opening /**
  let startLine = endLine;
  while (startLine >= 0 && !lines[startLine].includes('/**')) startLine--;
  if (startLine < 0) return undefined;

  // Extract the description (strip comment markers)
  const docLines: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    let text = lines[i]
      .replace(/^\s*\/\*\*\s*/, '')
      .replace(/\s*\*\/\s*$/, '')
      .replace(/^\s*\*\s?/, '')
      .trim();
    // Skip @param, @returns, etc. tags — we just want the description
    if (text.startsWith('@')) continue;
    if (text) docLines.push(text);
  }

  return docLines.length > 0 ? docLines.join(' ') : undefined;
}

/**
 * Generate a pulldata("@javascript") expression for a parsed function.
 * @param func - the parsed function signature
 * @param paramValues - map of param name → form field reference (e.g. "${field_name}")
 */
export function generatePulldataExpression(
  func: ParsedFunction,
  paramValues: Record<string, string>
): string {
  const args = [
    `"@javascript"`,
    `"${func.fileName}"`,
    `"${func.name}"`,
    ...func.params.map((p) => paramValues[p] || `""`),
  ];
  return `pulldata(${args.join(', ')})`;
}
