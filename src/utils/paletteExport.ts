/**
 * Palette Export Utility
 *
 * Converts internal PaletteFile data model to the .palette JSON format
 * used by Survey123 Connect / Field App for custom draw/annotate palettes.
 *
 * The .palette format is a JSON file with the following structure:
 * {
 *   "title": string,
 *   "type": "drawTools",
 *   "description"?: string,
 *   "icon"?: { name?: string, url?: string },
 *   "toolsets": [
 *     {
 *       "title": string,
 *       "icon"?: { name?: string, url?: string },
 *       "tools": [
 *         {
 *           "type": "line"|"area"|"marker"|"text",
 *           "label": string,
 *           "drawType"?: string,
 *           "symbol"?: { ... Esri symbol JSON ... },
 *           "textSymbol"?: { ... Esri text symbol JSON ... },
 *           "multiline"?: boolean,
 *           "textAnchor"?: string,
 *           "beginDecoration"?: string,
 *           "endDecoration"?: string,
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Derived from Esri's xls2palette.py (Apache 2.0 licensed).
 */

import type {
  PaletteFile,
  PaletteToolset,
  PaletteTool,
  EsriSymbol,
  EsriTextSymbol,
} from '../types/survey';

// ============================================================
// Export to .palette JSON
// ============================================================

interface PaletteJSON {
  title: string;
  type: 'drawTools';
  description?: string;
  icon?: { name?: string; url?: string };
  toolsets: ToolsetJSON[];
}

interface ToolsetJSON {
  title: string;
  icon?: { name?: string; url?: string };
  tools: ToolJSON[];
}

interface ToolJSON {
  type: string;
  label: string;
  drawType?: string;
  symbol?: Record<string, unknown>;
  textSymbol?: Record<string, unknown>;
  multiline?: boolean;
  textAnchor?: string;
  beginDecoration?: string;
  endDecoration?: string;
}

/**
 * Convert a PaletteFile to a .palette JSON string.
 */
export function exportPaletteToJSON(palette: PaletteFile): string {
  const toolsets = palette.toolsets
    .filter((ts) => ts.tools.length > 0)
    .map((ts) => convertToolset(ts));

  const output: PaletteJSON = {
    title: palette.title,
    type: 'drawTools',
    toolsets,
  };

  if (palette.description) {
    output.description = palette.description;
  }

  if (palette.icon && (palette.icon.name || palette.icon.url)) {
    output.icon = palette.icon;
  }

  return JSON.stringify(output, null, 4);
}

function convertToolset(toolset: PaletteToolset): ToolsetJSON {
  const ts: ToolsetJSON = {
    title: toolset.title,
    tools: toolset.tools.map((t) => convertTool(t)),
  };

  if (toolset.icon && (toolset.icon.name || toolset.icon.url)) {
    ts.icon = toolset.icon;
  }

  return ts;
}

function convertTool(tool: PaletteTool): ToolJSON {
  const t: ToolJSON = {
    type: tool.type,
    label: tool.label,
  };

  if (tool.drawType) {
    t.drawType = tool.drawType;
  }

  if (tool.symbol) {
    t.symbol = cleanSymbol(tool.symbol);
  }

  if (tool.textSymbol) {
    const ts = cleanTextSymbol(tool.textSymbol);
    if (ts) {
      t.textSymbol = ts;
    }
  }

  if (tool.multiline !== undefined) {
    t.multiline = tool.multiline;
  }

  if (tool.textAnchor) {
    t.textAnchor = tool.textAnchor;
  }

  if (tool.beginDecoration) {
    t.beginDecoration = tool.beginDecoration;
  }

  if (tool.endDecoration) {
    t.endDecoration = tool.endDecoration;
  }

  return t;
}

function cleanSymbol(symbol: EsriSymbol): Record<string, unknown> {
  const out: Record<string, unknown> = { type: symbol.type };

  if ('color' in symbol && symbol.color) out.color = symbol.color;
  if ('width' in symbol && symbol.width !== undefined) out.width = symbol.width;
  if ('size' in symbol && symbol.size !== undefined) out.size = symbol.size;
  if ('height' in symbol && symbol.height !== undefined) out.height = symbol.height;
  if ('style' in symbol && symbol.style) out.style = symbol.style;
  if ('url' in symbol && symbol.url) out.url = symbol.url;

  if ('outline' in symbol && symbol.outline) {
    const outline: Record<string, unknown> = { type: 'esriSLS' };
    if (symbol.outline.color) outline.color = symbol.outline.color;
    if (symbol.outline.width !== undefined) outline.width = symbol.outline.width;
    if (symbol.outline.style) outline.style = symbol.outline.style;
    out.outline = outline;
  }

  return out;
}

function cleanTextSymbol(ts: EsriTextSymbol): Record<string, unknown> | null {
  const out: Record<string, unknown> = { type: 'esriTS' };

  if (ts.color) out.color = ts.color;
  if (ts.haloColor) out.haloColor = ts.haloColor;
  if (ts.haloSize) out.haloSize = ts.haloSize;
  if (ts.backgroundColor) out.backgroundColor = ts.backgroundColor;
  if (ts.borderLineColor) out.borderLineColor = ts.borderLineColor;
  if (ts.borderLineSize) out.borderLineSize = ts.borderLineSize;
  if (ts.horizontalAlignment) out.horizontalAlignment = ts.horizontalAlignment;
  if (ts.verticalAlignment) out.verticalAlignment = ts.verticalAlignment;

  if (ts.font) {
    const font: Record<string, unknown> = {};
    if (ts.font.size !== undefined) font.size = ts.font.size;
    if (ts.font.style) font.style = ts.font.style;
    if (ts.font.weight) font.weight = ts.font.weight;
    out.font = font;
  }

  return out;
}
