/**
 * Parameter Builder — Context-aware parameter editor for Survey123 XLSForm
 *
 * Shows only the valid parameters for the current question type + appearance.
 * Each parameter has a typed input (number, select, color, text) with
 * descriptions from official ArcGIS Survey123 documentation.
 *
 * Outputs a space-separated key=value string for the XLS parameters column.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { QuestionType, PlatformSupport } from '../../types/survey';
import { ChevronDown, ChevronRight } from '../../utils/icons';

// ============================================================
// Parameter Definition Types
// ============================================================

type ParamInputType = 'text' | 'number' | 'select' | 'color' | 'boolean' | 'expression';

interface ParameterDef {
  /** Parameter key as it appears in XLS (e.g. "max-pixels") */
  key: string;
  /** Human-readable label */
  label: string;
  /** Brief description from Esri docs */
  description: string;
  /** Input control type */
  inputType: ParamInputType;
  /** For select inputs, the available options */
  options?: { value: string; label: string }[];
  /** Placeholder text */
  placeholder?: string;
  /** Platform support */
  platform: PlatformSupport;
  /** Which question types this applies to */
  types: QuestionType[];
  /** Optional: only show when appearance includes one of these */
  appearances?: string[];
  /** Optional: category grouping */
  category?: string;
}

// ============================================================
// Complete Parameter Catalog (from Esri documentation)
// ============================================================

const ALL_PARAMETERS: ParameterDef[] = [
  // ── General ──────────────────────────────────────────────
  {
    key: 'calculationMode',
    label: 'Calculation Mode',
    description: 'Controls when calculations are performed for this question',
    inputType: 'select',
    options: [
      { value: 'auto', label: 'Auto (default)' },
      { value: 'manual', label: 'Manual' },
      { value: 'always', label: 'Always' },
      { value: 'whenEmpty', label: 'When Empty' },
    ],
    platform: 'field',
    types: ['text', 'decimal', 'integer', 'note', 'date', 'time', 'datetime', 'select_one', 'select_multiple', 'geopoint', 'calculate', 'hidden'],
    category: 'General',
  },
  {
    key: 'placeholderText',
    label: 'Placeholder Text',
    description: 'Text displayed in empty input areas. Use @[hint] or @[guidance_hint] to reference those columns',
    inputType: 'text',
    placeholder: '@[hint]',
    platform: 'field',
    types: ['text', 'integer', 'decimal', 'select_one', 'barcode'],
    category: 'General',
  },

  // ── Text ──────────────────────────────────────────────────
  {
    key: 'defaultHeight',
    label: 'Default Height',
    description: 'Initial text box height in number of lines',
    inputType: 'number',
    placeholder: '4',
    platform: 'field',
    types: ['text'],
    appearances: ['multiline'],
    category: 'Text',
  },
  {
    key: 'geocode',
    label: 'Geocode Locator',
    description: 'ArcGIS item ID of the locator service for geocoded results',
    inputType: 'text',
    placeholder: '<locator item ID>',
    platform: 'both',
    types: ['text', 'geopoint', 'geotrace', 'geoshape'],
    category: 'Geocode',
  },
  {
    key: 'maxResults',
    label: 'Max Results',
    description: 'Maximum number of geocoded results returned (default: 6)',
    inputType: 'number',
    placeholder: '6',
    platform: 'both',
    types: ['text'],
    appearances: ['geocode'],
    category: 'Geocode',
  },
  {
    key: 'suggestions',
    label: 'Show Suggestions',
    description: 'Controls whether geocode suggestions appear as you type',
    inputType: 'select',
    options: [
      { value: 'yes', label: 'Yes (default)' },
      { value: 'no', label: 'No' },
    ],
    platform: 'field',
    types: ['text'],
    appearances: ['geocode'],
    category: 'Geocode',
  },
  {
    key: 'indicator',
    label: 'Direction Indicator',
    description: 'Shows direction or distance from device location in geocode results',
    inputType: 'select',
    options: [
      { value: 'none', label: 'None' },
      { value: 'direction', label: 'Direction' },
      { value: 'distance', label: 'Distance' },
    ],
    platform: 'field',
    types: ['text'],
    appearances: ['geocode'],
    category: 'Geocode',
  },
  {
    key: 'proximity',
    label: 'Proximity Radius',
    description: 'Restricts geocode results to a radius around device location (e.g. "500m", "10km")',
    inputType: 'text',
    placeholder: '500m',
    platform: 'field',
    types: ['text'],
    appearances: ['geocode'],
    category: 'Geocode',
  },

  // ── Numeric / Range ───────────────────────────────────────
  {
    key: 'start',
    label: 'Range Start',
    description: 'Starting value of the range slider',
    inputType: 'number',
    placeholder: '0',
    platform: 'both',
    types: ['range'],
    category: 'Range',
  },
  {
    key: 'end',
    label: 'Range End',
    description: 'Ending value of the range slider',
    inputType: 'number',
    placeholder: '10',
    platform: 'both',
    types: ['range'],
    category: 'Range',
  },
  {
    key: 'step',
    label: 'Range Step',
    description: 'Increment value for the range slider',
    inputType: 'number',
    placeholder: '1',
    platform: 'both',
    types: ['range'],
    category: 'Range',
  },
  {
    key: 'startColor',
    label: 'Start Color',
    description: 'Color of the slider at the range start',
    inputType: 'color',
    platform: 'both',
    types: ['range'],
    category: 'Range Style',
  },
  {
    key: 'endColor',
    label: 'End Color',
    description: 'Color of the slider at the range end',
    inputType: 'color',
    platform: 'both',
    types: ['range'],
    category: 'Range Style',
  },
  {
    key: 'color',
    label: 'Fill Color',
    description: 'Fill color between the start and selected value',
    inputType: 'color',
    platform: 'both',
    types: ['range'],
    category: 'Range Style',
  },

  // ── Rangefinder ───────────────────────────────────────────
  {
    key: 'measurement',
    label: 'Measurement Type',
    description: 'Which rangefinder measurement to store',
    inputType: 'select',
    options: [
      { value: 'height', label: 'Height' },
      { value: 'azimuth', label: 'Azimuth' },
      { value: 'horizontalDistance', label: 'Horizontal Distance' },
      { value: 'slopeDistance', label: 'Slope Distance' },
      { value: 'inclination', label: 'Inclination' },
      { value: 'multipleHeights', label: 'Multiple Heights' },
    ],
    platform: 'field',
    types: ['text', 'decimal', 'integer'],
    appearances: ['rangefinder'],
    category: 'Rangefinder',
  },

  // ── Selection ─────────────────────────────────────────────
  {
    key: 'randomize',
    label: 'Randomize Choices',
    description: 'Randomize the order of choices in the list',
    inputType: 'boolean',
    platform: 'both',
    types: ['select_one', 'select_multiple', 'rank'],
    category: 'Selection',
  },

  // ── Image ─────────────────────────────────────────────────
  {
    key: 'max-pixels',
    label: 'Max Pixels',
    description: 'Maximum image dimension on longest edge. For signatures, sets popup width. For draw, creates a square canvas.',
    inputType: 'number',
    placeholder: '1024',
    platform: 'both',
    types: ['image'],
    category: 'Image',
  },
  {
    key: 'method',
    label: 'Capture Method',
    description: 'How the image is captured',
    inputType: 'select',
    options: [
      { value: 'browse', label: 'Browse files' },
      { value: 'camera', label: 'Camera' },
      { value: 'map', label: 'Map (annotate only)' },
    ],
    platform: 'both',
    types: ['image'],
    category: 'Image',
  },
  {
    key: 'fileName',
    label: 'File Name Expression',
    description: 'Dynamically name files using an expression',
    inputType: 'text',
    placeholder: 'concat(${site_name}, "_photo")',
    platform: 'both',
    types: ['image', 'audio', 'file'],
    category: 'File',
  },
  {
    key: 'max-size',
    label: 'Max File Size (MB)',
    description: 'Maximum file size in megabytes (default: 10 MB)',
    inputType: 'number',
    placeholder: '10',
    platform: 'both',
    types: ['image', 'audio', 'file'],
    category: 'File',
  },
  {
    key: 'allowAdds',
    label: 'Allow Adds',
    description: 'Allow adding new images when editing existing records',
    inputType: 'select',
    options: [
      { value: 'true', label: 'Yes (default)' },
      { value: 'false', label: 'No' },
    ],
    platform: 'field',
    types: ['image'],
    category: 'Image',
  },
  {
    key: 'allowRename',
    label: 'Allow Rename',
    description: 'Allow users to edit file names',
    inputType: 'boolean',
    platform: 'field',
    types: ['image'],
    category: 'Image',
  },
  {
    key: 'fileNameVisible',
    label: 'Show File Name',
    description: 'Show or hide the file name in the survey',
    inputType: 'boolean',
    platform: 'field',
    types: ['image'],
    category: 'Image',
  },
  {
    key: 'previewHeight',
    label: 'Preview Height',
    description: 'Image preview height after selection (e.g. "4lines", "50%", "200pixels")',
    inputType: 'text',
    placeholder: '4lines',
    platform: 'field',
    types: ['image'],
    category: 'Image',
  },
  {
    key: 'footerText',
    label: 'Signature Footer',
    description: 'Text displayed at the bottom of the signature dialog',
    inputType: 'text',
    placeholder: '@[hint]',
    platform: 'field',
    types: ['image'],
    appearances: ['signature'],
    category: 'Image',
  },
  {
    key: 'palette',
    label: 'Drawing Palette',
    description: 'Custom drawing tools palette name for draw/annotate appearances',
    inputType: 'text',
    placeholder: 'palette_name',
    platform: 'field',
    types: ['image'],
    appearances: ['draw', 'annotate'],
    category: 'Image',
  },

  // ── Audio ─────────────────────────────────────────────────
  {
    key: 'codec',
    label: 'Audio Codec',
    description: 'Preferred audio codec(s), comma-separated. Device uses first compatible option.',
    inputType: 'text',
    placeholder: 'aac',
    platform: 'field',
    types: ['audio'],
    category: 'Audio',
  },
  {
    key: 'max-duration',
    label: 'Max Duration (seconds)',
    description: 'Maximum recording duration in seconds (default: 600 in web app)',
    inputType: 'number',
    placeholder: '600',
    platform: 'field',
    types: ['audio'],
    category: 'Audio',
  },

  // ── Barcode ───────────────────────────────────────────────
  {
    key: 'barcodeType',
    label: 'Barcode Type',
    description: 'Which barcode format(s) users can scan',
    inputType: 'select',
    options: [
      { value: 'all', label: 'All types' },
      { value: '1d', label: 'All 1D types' },
      { value: '2d', label: 'All 2D types' },
      { value: 'qrcode', label: 'QR Code' },
      { value: 'code128', label: 'Code 128' },
      { value: 'code39', label: 'Code 39' },
      { value: 'ean13', label: 'EAN-13' },
      { value: 'ean8', label: 'EAN-8' },
      { value: 'upca', label: 'UPC-A' },
      { value: 'upce', label: 'UPC-E' },
      { value: 'datamatrix', label: 'Data Matrix' },
      { value: 'pdf417', label: 'PDF417' },
      { value: 'aztec', label: 'Aztec' },
      { value: 'codabar', label: 'Codabar' },
      { value: 'code93', label: 'Code 93' },
      { value: 'itf', label: 'ITF' },
    ],
    platform: 'field',
    types: ['barcode'],
    category: 'Barcode',
  },

  // ── Map / Geo ─────────────────────────────────────────────
  {
    key: 'map',
    label: 'Default Basemap',
    description: 'Map name or ArcGIS item ID for the default basemap',
    inputType: 'text',
    placeholder: '<map item ID>',
    platform: 'both',
    types: ['geopoint', 'geotrace', 'geoshape'],
    category: 'Map',
  },
  {
    key: 'height',
    label: 'Map Height',
    description: 'Map preview height (e.g. "6lines", "50%", "300pixels")',
    inputType: 'text',
    placeholder: '6lines',
    platform: 'field',
    types: ['geopoint', 'geotrace', 'geoshape'],
    category: 'Map',
  },
  {
    key: 'method',
    label: 'Capture Method',
    description: 'How geometry is captured on the map',
    inputType: 'select',
    options: [
      { value: 'sketch', label: 'Sketch' },
      { value: 'vertex', label: 'Vertex' },
      { value: 'streaming', label: 'Streaming (Field only)' },
    ],
    platform: 'both',
    types: ['geotrace', 'geoshape'],
    category: 'Map',
  },
  {
    key: 'lineColor',
    label: 'Line Color',
    description: 'Line color for geotrace/geoshape features on the map',
    inputType: 'color',
    platform: 'field',
    types: ['geotrace', 'geoshape'],
    category: 'Map Style',
  },
  {
    key: 'fillColor',
    label: 'Fill Color',
    description: 'Polygon fill color for geoshape on the map',
    inputType: 'color',
    platform: 'field',
    types: ['geoshape'],
    category: 'Map Style',
  },
  {
    key: 'lineWidth',
    label: 'Line Width',
    description: 'Line width in pixels on the map preview',
    inputType: 'number',
    placeholder: '2',
    platform: 'field',
    types: ['geotrace', 'geoshape'],
    category: 'Map Style',
  },
  {
    key: 'precision',
    label: 'Coordinate Precision',
    description: 'Number of decimal places captured and displayed',
    inputType: 'number',
    placeholder: '6',
    platform: 'web',
    types: ['geopoint', 'geotrace', 'geoshape'],
    category: 'Map',
  },
  {
    key: 'minCaptureZoomLevel',
    label: 'Min Capture Zoom',
    description: 'Minimum map zoom level required before geometry can be captured',
    inputType: 'number',
    placeholder: '14',
    platform: 'web',
    types: ['geopoint', 'geotrace', 'geoshape'],
    category: 'Map',
  },
  {
    key: 'snapMode',
    label: 'Snap Mode',
    description: 'Snapping behavior when using vertex capture method',
    inputType: 'select',
    options: [
      { value: 'feature', label: 'Snap to features' },
      { value: 'self', label: 'Snap to self' },
    ],
    platform: 'web',
    types: ['geotrace', 'geoshape'],
    appearances: ['vertex'],
    category: 'Map',
  },
  {
    key: 'mapTools',
    label: 'Map Tools',
    description: 'Available map tools (comma-separated: search, mapSwitcher, zoom, home, locate)',
    inputType: 'text',
    placeholder: 'search zoom locate',
    platform: 'field',
    types: ['geopoint', 'geotrace', 'geoshape'],
    category: 'Map',
  },

  // ── Group ─────────────────────────────────────────────────
  {
    key: 'backgroundColor',
    label: 'Background Color',
    description: 'Background color for the group or repeat section',
    inputType: 'color',
    platform: 'field',
    types: ['begin_group', 'begin_repeat'],
    category: 'Style',
  },
  {
    key: 'borderColor',
    label: 'Border Color',
    description: 'Border color for the group or repeat section',
    inputType: 'color',
    platform: 'field',
    types: ['begin_group', 'begin_repeat'],
    category: 'Style',
  },
  {
    key: 'layout',
    label: 'Grid Layout',
    description: 'Controls the grid layout style for questions inside this group',
    inputType: 'select',
    options: [
      { value: 'dynamic-grid', label: 'Dynamic Grid' },
      { value: 'fixed-grid', label: 'Fixed Grid' },
    ],
    platform: 'field',
    types: ['begin_group'],
    category: 'Style',
  },

  // ── Repeat ────────────────────────────────────────────────
  {
    key: 'allowAdds',
    label: 'Allow Adds',
    description: 'Allow adding new repeat records',
    inputType: 'boolean',
    platform: 'field',
    types: ['begin_repeat'],
    category: 'Repeat',
  },
  {
    key: 'allowUpdates',
    label: 'Allow Updates',
    description: 'Allow modifying existing repeat records',
    inputType: 'boolean',
    platform: 'field',
    types: ['begin_repeat'],
    category: 'Repeat',
  },
  {
    key: 'query',
    label: 'Repeat Query',
    description: 'SQL-style query to filter which repeat records are shown',
    inputType: 'text',
    placeholder: '"status = \'active\'"',
    platform: 'field',
    types: ['begin_repeat'],
    category: 'Repeat',
  },
];

// ============================================================
// Props
// ============================================================

interface Props {
  value: string;
  onChange: (val: string) => void;
  questionType: QuestionType;
  appearance?: string;
}

// ============================================================
// Parse / Serialize Helpers
// ============================================================

/** Parse "key1=val1 key2=val2" into a Map */
function parseParams(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!raw.trim()) return map;

  // Handle quoted values and simple key=value pairs
  const regex = /(\S+?)=("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\S+)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const key = match[1];
    let val = match[2];
    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    map.set(key, val);
  }
  return map;
}

/** Serialize Map back to space-separated key=value string */
function serializeParams(map: Map<string, string>): string {
  const parts: string[] = [];
  map.forEach((val, key) => {
    if (val.includes(' ')) {
      parts.push(`${key}="${val}"`);
    } else {
      parts.push(`${key}=${val}`);
    }
  });
  return parts.join(' ');
}

// ============================================================
// Main ParameterBuilder Component
// ============================================================

export function ParameterBuilder({ value, onChange, questionType, appearance }: Props) {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  // Filter parameters for this question type + appearance
  const applicableParams = useMemo(() => {
    return ALL_PARAMETERS.filter((p) => {
      // Must match question type
      if (!p.types.includes(questionType)) return false;
      // If appearance filter is set, check it
      if (p.appearances && p.appearances.length > 0) {
        const currentAppearance = appearance || '';
        if (!p.appearances.some((a) => currentAppearance.includes(a))) return false;
      }
      return true;
    });
  }, [questionType, appearance]);

  // Group by category
  const groupedParams = useMemo(() => {
    const groups = new Map<string, ParameterDef[]>();
    for (const p of applicableParams) {
      const cat = p.category || 'Other';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(p);
    }
    return groups;
  }, [applicableParams]);

  // Parse current value
  const currentParams = useMemo(() => parseParams(value || ''), [value]);

  const updateParam = useCallback((key: string, val: string) => {
    const newMap = new Map(parseParams(value || ''));
    if (val === '' || val === undefined) {
      newMap.delete(key);
    } else {
      newMap.set(key, val);
    }
    onChange(serializeParams(newMap));
  }, [value, onChange]);

  // If no applicable parameters exist, show a simple text field
  if (applicableParams.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <label className="text-[12px] font-medium text-gray-500">Parameters</label>
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="No known parameters for this type"
          className="w-full text-[13px] border border-gray-200 rounded-lg bg-white text-gray-700
            placeholder-gray-400 transition-fast font-mono"
          style={{ padding: '8px 12px' }}
        />
      </div>
    );
  }

  // Count how many params are currently set
  const setCount = applicableParams.filter((p) => currentParams.has(p.key)).length;

  return (
    <div>
      {/* Header with toggle */}
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <label className="text-[12px] font-medium text-gray-500">Parameters</label>
        <button
          onClick={() => setIsBuilderOpen(!isBuilderOpen)}
          className="flex items-center gap-1 text-[11px] font-medium text-[#00856a] hover:text-[#006b54] transition-fast"
        >
          {isBuilderOpen ? (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              Hide Builder
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Parameter Builder ({applicableParams.length} available{setCount > 0 ? `, ${setCount} set` : ''})
            </>
          )}
        </button>
      </div>

      {/* Raw text input (always visible) */}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={applicableParams.slice(0, 2).map((p) => `${p.key}=...`).join(' ')}
        className="w-full text-[13px] border border-gray-200 rounded-lg bg-white text-gray-700
          placeholder-gray-400 transition-fast font-mono"
        style={{ padding: '8px 12px' }}
      />

      {/* Builder panel */}
      {isBuilderOpen && (
        <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden"
          style={{ marginTop: 8 }}>
          {Array.from(groupedParams.entries()).map(([category, params]) => (
            <ParameterGroup
              key={category}
              category={category}
              params={params}
              currentParams={currentParams}
              onUpdateParam={updateParam}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Parameter Group (collapsible category)
// ============================================================

function ParameterGroup({
  category,
  params,
  currentParams,
  onUpdateParam,
}: {
  category: string;
  params: ParameterDef[];
  currentParams: Map<string, string>;
  onUpdateParam: (key: string, val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const setCount = params.filter((p) => currentParams.has(p.key)).length;

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left hover:bg-gray-100 transition-fast"
        style={{ padding: '8px 12px' }}
      >
        <div className="flex items-center gap-1.5">
          {isOpen ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
          <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{category}</span>
          {setCount > 0 && (
            <span className="text-[9px] bg-[#00856a] text-white rounded-full flex items-center justify-center"
              style={{ width: 16, height: 16 }}>
              {setCount}
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-400">{params.length} params</span>
      </button>

      {isOpen && (
        <div style={{ padding: '4px 12px 10px 12px' }}>
          {params.map((param) => (
            <ParameterInput
              key={param.key}
              param={param}
              value={currentParams.get(param.key) || ''}
              onChange={(val) => onUpdateParam(param.key, val)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Individual Parameter Input
// ============================================================

function ParameterInput({
  param,
  value,
  onChange,
}: {
  param: ParameterDef;
  value: string;
  onChange: (val: string) => void;
}) {
  const platformBadge = param.platform !== 'both' && (
    <span className={`text-[9px] font-medium rounded px-1 py-0.5 ${
      param.platform === 'field'
        ? 'bg-amber-100 text-amber-600'
        : 'bg-blue-100 text-blue-600'
    }`}>
      {param.platform === 'field' ? 'Field' : 'Web'}
    </span>
  );

  const isSet = value !== '';

  return (
    <div className={`rounded-lg transition-fast ${isSet ? 'bg-white border border-gray-200' : ''}`}
      style={{ padding: '8px 10px', marginBottom: 4 }}>
      {/* Label row */}
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-medium ${isSet ? 'text-[#007a62]' : 'text-gray-600'}`}>
            {param.label}
          </span>
          {platformBadge}
        </div>
        {isSet && (
          <button
            onClick={() => onChange('')}
            className="text-[10px] text-gray-400 hover:text-red-500 transition-fast"
          >
            Clear
          </button>
        )}
      </div>

      {/* Description */}
      <p className="text-[10px] text-gray-400 leading-snug" style={{ marginBottom: 6 }}>
        {param.description}
      </p>

      {/* Input control */}
      {param.inputType === 'select' && param.options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-[12px] border border-gray-200 rounded-md bg-white text-gray-700"
          style={{ padding: '5px 8px' }}
        >
          <option value="">— Not set —</option>
          {param.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : param.inputType === 'boolean' ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(e.target.checked ? 'true' : '')}
            className="w-4 h-4 accent-[#00856a]"
          />
          <span className="text-[12px] text-gray-600">Enabled</span>
        </label>
      ) : param.inputType === 'color' ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || '#007a62'}
            onChange={(e) => onChange(e.target.value)}
            className="w-7 h-7 rounded border border-gray-200 cursor-pointer"
            style={{ padding: 1 }}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#007a62 or color name"
            className="flex-1 text-[12px] border border-gray-200 rounded-md bg-white text-gray-700 font-mono"
            style={{ padding: '5px 8px' }}
          />
        </div>
      ) : param.inputType === 'number' ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={param.placeholder}
          className="w-full text-[12px] border border-gray-200 rounded-md bg-white text-gray-700 font-mono"
          style={{ padding: '5px 8px' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={param.placeholder}
          className="w-full text-[12px] border border-gray-200 rounded-md bg-white text-gray-700 font-mono"
          style={{ padding: '5px 8px' }}
        />
      )}

      {/* Key name hint */}
      <p className="text-[9px] text-gray-300 font-mono" style={{ marginTop: 3 }}>
        {param.key}={value || '…'}
      </p>
    </div>
  );
}
