/**
 * Report Template .docx Import/Export Utilities
 *
 * Import: .docx → mammoth → HTML → preprocessed for TipTap
 * Export: TipTap HTML → postprocessed → html-to-docx → .docx download
 */

import mammoth from 'mammoth';
import { preprocessTemplateHtml, postprocessTemplateHtml } from '../components/report/TemplateTokenExtension';

// ============================================================
// Import: .docx → HTML (for TipTap editor)
// ============================================================

export interface ImportResult {
  html: string;
  warnings: string[];
  stats: {
    templateVars: number;
    conditionals: number;
    repeats: number;
    tables: number;
  };
}

/**
 * Import a .docx file and convert to TipTap-compatible HTML
 * with template expressions converted to parseable spans.
 */
export async function importDocxToHtml(file: File): Promise<ImportResult> {
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
    }
  );

  const rawHtml = result.value;
  const warnings = result.messages
    .filter((m) => m.type === 'warning')
    .map((m) => m.message);

  // Count template elements before preprocessing
  const templateVars = (rawHtml.match(/\$\{[^}]+\}/g) || []).length;
  const conditionals = (rawHtml.match(/\$\{if /g) || []).length;
  const repeats = (rawHtml.match(/\$\{#/g) || []).length;
  const tables = (rawHtml.match(/<table/g) || []).length;

  // Preprocess: convert ${...} to <span data-template-token>
  const processedHtml = preprocessTemplateHtml(rawHtml);

  return {
    html: processedHtml,
    warnings,
    stats: { templateVars, conditionals, repeats, tables },
  };
}

// ============================================================
// Export: TipTap HTML → .docx download
// ============================================================

/**
 * Export TipTap editor HTML to a downloadable .docx file.
 */
export async function exportHtmlToDocx(
  editorHtml: string,
  fileName: string = 'report_template.docx'
): Promise<void> {
  // Post-process: convert <span data-template-token> back to ${...}
  const cleanHtml = postprocessTemplateHtml(editorHtml);

  // Wrap in full HTML document for the converter
  const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #999; padding: 4px 8px; vertical-align: top; }
  h1 { font-size: 16pt; }
  h2 { font-size: 14pt; }
  h3 { font-size: 12pt; }
</style>
</head><body>${cleanHtml}</body></html>`;

  // Dynamic import to handle browser/Node compatibility
  const HTMLtoDOCX = (await import('html-to-docx')).default;

  const docxBlob = await HTMLtoDOCX(fullHtml, null, {
    table: { row: { cantSplit: true } },
    font: 'Arial',
    fontSize: 22, // half-points → 11pt
    margins: {
      top: 720,
      bottom: 720,
      left: 720,
      right: 720,
    },
  });

  // Trigger download
  const blob = docxBlob instanceof Blob ? docxBlob : new Blob([docxBlob], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
