/**
 * ToolEditor
 *
 * Right-side detail panel for editing a single palette tool's properties:
 * label, draw type, symbol (color, width, style, outline), text symbol, arrows.
 */

import React from 'react';
import type {
  PaletteTool,
  PaletteToolType,
  PaletteDrawType,
  EsriSymbol,
  EsriLineSymbol,
  EsriFillSymbol,
  EsriSimpleMarkerSymbol,
  EsriPictureMarkerSymbol,
  EsriTextSymbol,
  EsriOutline,
  EsriLineStyle,
  EsriFillStyle,
  EsriMarkerStyle,
  ArrowDecoration,
} from '../../types/survey';

// ============================================================
// Option maps
// ============================================================

const LINE_DRAW_TYPES: { value: PaletteDrawType; label: string }[] = [
  { value: 'freehand', label: 'Freehand' },
  { value: 'line', label: 'Straight line' },
  { value: 'polyline', label: 'Polyline (vertex)' },
  { value: 'smart', label: 'Smart shape' },
  { value: 'arrowto', label: 'Arrow (to end)' },
  { value: 'arrowfrom', label: 'Arrow (from start)' },
  { value: 'arrowdouble', label: 'Arrow (both ends)' },
];

const AREA_DRAW_TYPES: { value: PaletteDrawType; label: string }[] = [
  { value: 'freehand', label: 'Freehand' },
  { value: 'polygon', label: 'Polygon (vertex)' },
  { value: 'smart', label: 'Smart shape' },
];

const LINE_STYLES: { value: EsriLineStyle; label: string }[] = [
  { value: 'esriSLSSolid', label: 'Solid' },
  { value: 'esriSLSDash', label: 'Dash' },
  { value: 'esriSLSDashDot', label: 'Dash-dot' },
  { value: 'esriSLSDashDotDot', label: 'Dash-dot-dot' },
  { value: 'esriSLSDot', label: 'Dot' },
  { value: 'esriSLSNull', label: 'None' },
];

const FILL_STYLES: { value: EsriFillStyle; label: string }[] = [
  { value: 'esriSFSSolid', label: 'Solid' },
  { value: 'esriSFSBackwardDiagonal', label: 'Backward diagonal' },
  { value: 'esriSFSForwardDiagonal', label: 'Forward diagonal' },
  { value: 'esriSFSCross', label: 'Cross' },
  { value: 'esriSFSDiagonalCross', label: 'Diagonal cross' },
  { value: 'esriSFSHorizontal', label: 'Horizontal' },
  { value: 'esriSFSVertical', label: 'Vertical' },
  { value: 'esriSFSNull', label: 'None' },
];

const MARKER_STYLES: { value: EsriMarkerStyle; label: string }[] = [
  { value: 'esriSMSCircle', label: 'Circle' },
  { value: 'esriSMSSquare', label: 'Square' },
  { value: 'esriSMSDiamond', label: 'Diamond' },
  { value: 'esriSMSTriangle', label: 'Triangle' },
  { value: 'esriSMSCross', label: 'Cross (+)' },
  { value: 'esriSMSX', label: 'X' },
];

const ARROW_STYLES: { value: ArrowDecoration | ''; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'arrowheadOpen', label: 'Open' },
  { value: 'arrowheadClosed', label: 'Closed' },
  { value: 'arrowheadFilled', label: 'Filled' },
];

const TEXT_ANCHORS: { value: string; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'topLeft', label: 'Top-left' },
  { value: 'topRight', label: 'Top-right' },
  { value: 'bottomLeft', label: 'Bottom-left' },
  { value: 'bottomRight', label: 'Bottom-right' },
  { value: 'begin', label: 'Begin (line start)' },
  { value: 'end', label: 'End (line end)' },
];

// ============================================================
// Shared input components
// ============================================================

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="text-[11px] text-gray-500 font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-white focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62]/20 focus:outline-none ${mono ? 'font-mono' : ''}`}
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-full px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-white font-mono focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62]/20 focus:outline-none"
    />
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Support both named colors and hex
  const isHex = value?.startsWith('#');
  return (
    <div className="flex gap-2 items-center">
      <input
        type="color"
        value={isHex ? value.slice(0, 7) : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
        style={{ padding: 1 }}
      />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#ff0000 or red"
        className="flex-1 px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-white font-mono focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62]/20 focus:outline-none"
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2.5 py-1.5 text-[12px] border border-gray-200 rounded-lg bg-white focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62]/20 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ============================================================
// Section header
// ============================================================

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 first:mt-0">
      {title}
    </div>
  );
}

// ============================================================
// ToolEditor
// ============================================================

interface ToolEditorProps {
  tool: PaletteTool;
  onUpdate: (updates: Partial<PaletteTool>) => void;
}

export function ToolEditor({ tool, onUpdate }: ToolEditorProps) {
  const isArrow = tool.drawType?.startsWith('arrow') || false;

  // Helper to update nested symbol properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSymbol = (updates: Record<string, unknown>) => {
    onUpdate({ symbol: { ...(tool.symbol as any), ...updates } as EsriSymbol });
  };

  const updateOutline = (updates: Partial<EsriOutline>) => {
    const sym = tool.symbol as any;
    onUpdate({
      symbol: {
        ...sym,
        outline: { type: 'esriSLS' as const, ...(sym?.outline || {}), ...updates },
      },
    });
  };

  const updateTextSymbol = (updates: Partial<EsriTextSymbol>) => {
    onUpdate({
      textSymbol: { type: 'esriTS', ...(tool.textSymbol || {}), ...updates } as EsriTextSymbol,
    });
  };

  const updateTextFont = (updates: Record<string, unknown>) => {
    const current = tool.textSymbol?.font || {};
    onUpdate({
      textSymbol: {
        type: 'esriTS',
        ...(tool.textSymbol || {}),
        font: { ...current, ...updates },
      } as EsriTextSymbol,
    });
  };

  return (
    <div className="p-4">
      {/* Basic */}
      <SectionHeader title="Basic" />

      <Field label="Label">
        <TextInput value={tool.label} onChange={(v) => onUpdate({ label: v })} placeholder="Tool name" />
      </Field>

      {/* Draw type (line/area only) */}
      {tool.type === 'line' && (
        <Field label="Draw Mode">
          <SelectInput
            value={tool.drawType || 'freehand'}
            onChange={(v) => {
              const updates: Partial<PaletteTool> = { drawType: v as PaletteDrawType };
              // Clear arrow decorations when switching away from arrow types
              if (!v.startsWith('arrow')) {
                updates.beginDecoration = undefined;
                updates.endDecoration = undefined;
              }
              onUpdate(updates);
            }}
            options={LINE_DRAW_TYPES}
          />
        </Field>
      )}

      {tool.type === 'area' && (
        <Field label="Draw Mode">
          <SelectInput
            value={tool.drawType || 'polygon'}
            onChange={(v) => onUpdate({ drawType: v as PaletteDrawType })}
            options={AREA_DRAW_TYPES}
          />
        </Field>
      )}

      {/* Arrow decorations */}
      {tool.type === 'line' && isArrow && (
        <>
          {(tool.drawType === 'arrowfrom' || tool.drawType === 'arrowdouble') && (
            <Field label="Start Arrow">
              <SelectInput
                value={tool.beginDecoration || ''}
                onChange={(v) => onUpdate({ beginDecoration: (v || undefined) as ArrowDecoration | undefined })}
                options={ARROW_STYLES}
              />
            </Field>
          )}
          {(tool.drawType === 'arrowto' || tool.drawType === 'arrowdouble') && (
            <Field label="End Arrow">
              <SelectInput
                value={tool.endDecoration || ''}
                onChange={(v) => onUpdate({ endDecoration: (v || undefined) as ArrowDecoration | undefined })}
                options={ARROW_STYLES}
              />
            </Field>
          )}
        </>
      )}

      {/* ----------------------------------------------------------
         Symbol section (line, area, marker)
         ---------------------------------------------------------- */}
      {tool.type !== 'text' && (
        <>
          <SectionHeader title="Symbol" />

          {/* LINE symbol */}
          {tool.type === 'line' && tool.symbol?.type === 'esriSLS' && (
            <>
              <Field label="Color">
                <ColorInput
                  value={(tool.symbol as EsriLineSymbol).color || ''}
                  onChange={(v) => updateSymbol({ color: v })}
                />
              </Field>
              <Field label="Width (px)">
                <NumberInput
                  value={(tool.symbol as EsriLineSymbol).width}
                  onChange={(v) => updateSymbol({ width: v })}
                  min={1}
                  max={50}
                />
              </Field>
              <Field label="Style">
                <SelectInput
                  value={((tool.symbol as EsriLineSymbol).style as string) || 'esriSLSSolid'}
                  onChange={(v) => updateSymbol({ style: v as EsriLineStyle })}
                  options={LINE_STYLES}
                />
              </Field>
            </>
          )}

          {/* AREA / FILL symbol */}
          {tool.type === 'area' && tool.symbol?.type === 'esriSFS' && (
            <>
              <Field label="Fill Color">
                <ColorInput
                  value={(tool.symbol as EsriFillSymbol).color || ''}
                  onChange={(v) => updateSymbol({ color: v })}
                />
              </Field>
              <Field label="Fill Style">
                <SelectInput
                  value={(tool.symbol as EsriFillSymbol).style || 'esriSFSSolid'}
                  onChange={(v) => updateSymbol({ style: v as EsriFillStyle })}
                  options={FILL_STYLES}
                />
              </Field>
              <div className="pl-3 border-l-2 border-gray-200 mb-3">
                <div className="text-[10px] text-gray-400 font-medium mb-2">Outline</div>
                <Field label="Color">
                  <ColorInput
                    value={(tool.symbol as EsriFillSymbol).outline?.color || ''}
                    onChange={(v) => updateOutline({ color: v })}
                  />
                </Field>
                <Field label="Width (px)">
                  <NumberInput
                    value={(tool.symbol as EsriFillSymbol).outline?.width}
                    onChange={(v) => updateOutline({ width: v })}
                    min={0}
                    max={20}
                  />
                </Field>
              </div>
            </>
          )}

          {/* MARKER symbol */}
          {tool.type === 'marker' && tool.symbol?.type === 'esriSMS' && (
            <>
              <Field label="Shape">
                <SelectInput
                  value={(tool.symbol as EsriSimpleMarkerSymbol).style || 'esriSMSCircle'}
                  onChange={(v) => updateSymbol({ style: v as EsriMarkerStyle })}
                  options={MARKER_STYLES}
                />
              </Field>
              <Field label="Color">
                <ColorInput
                  value={(tool.symbol as EsriSimpleMarkerSymbol).color || ''}
                  onChange={(v) => updateSymbol({ color: v })}
                />
              </Field>
              <Field label="Size (px)">
                <NumberInput
                  value={(tool.symbol as EsriSimpleMarkerSymbol).size}
                  onChange={(v) => updateSymbol({ size: v })}
                  min={4}
                  max={100}
                />
              </Field>
              <div className="pl-3 border-l-2 border-gray-200 mb-3">
                <div className="text-[10px] text-gray-400 font-medium mb-2">Outline</div>
                <Field label="Color">
                  <ColorInput
                    value={(tool.symbol as EsriSimpleMarkerSymbol).outline?.color || ''}
                    onChange={(v) => updateOutline({ color: v })}
                  />
                </Field>
                <Field label="Width (px)">
                  <NumberInput
                    value={(tool.symbol as EsriSimpleMarkerSymbol).outline?.width}
                    onChange={(v) => updateOutline({ width: v })}
                    min={0}
                    max={20}
                  />
                </Field>
              </div>
            </>
          )}

          {/* Picture marker */}
          {tool.type === 'marker' && tool.symbol?.type === 'esriPMS' && (
            <>
              <Field label="Image URL">
                <TextInput
                  value={(tool.symbol as EsriPictureMarkerSymbol).url || ''}
                  onChange={(v) => updateSymbol({ url: v })}
                  placeholder="icon.svg"
                  mono
                />
              </Field>
              <Field label="Size (px)">
                <NumberInput
                  value={(tool.symbol as EsriPictureMarkerSymbol).width}
                  onChange={(v) => updateSymbol({ width: v, height: v })}
                  min={8}
                  max={200}
                />
              </Field>
            </>
          )}

          {/* Toggle between simple marker and picture marker */}
          {tool.type === 'marker' && (
            <div className="mt-2 mb-3">
              <button
                onClick={() => {
                  if (tool.symbol?.type === 'esriSMS') {
                    onUpdate({
                      symbol: { type: 'esriPMS', url: '', width: 24, height: 24 },
                    });
                  } else {
                    onUpdate({
                      symbol: {
                        type: 'esriSMS',
                        style: 'esriSMSCircle',
                        color: '#22c55e',
                        size: 20,
                      },
                    });
                  }
                }}
                className="text-[11px] text-[#007a62] hover:text-[#006652] font-medium"
              >
                Switch to {tool.symbol?.type === 'esriSMS' ? 'image marker' : 'simple marker'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ----------------------------------------------------------
         Text Symbol section (all types can have text labels)
         ---------------------------------------------------------- */}
      <SectionHeader title={tool.type === 'text' ? 'Text Symbol' : 'Text Label (optional)'} />

      {tool.type === 'text' && (
        <Field label="Multiline">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={tool.multiline ?? false}
              onChange={(e) => onUpdate({ multiline: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-[12px] text-gray-600">Allow multiline input</span>
          </label>
        </Field>
      )}

      <Field label="Text Color">
        <ColorInput
          value={tool.textSymbol?.color || ''}
          onChange={(v) => updateTextSymbol({ color: v })}
        />
      </Field>

      <Field label="Font Size (px)">
        <NumberInput
          value={tool.textSymbol?.font?.size}
          onChange={(v) => updateTextFont({ size: v })}
          min={6}
          max={100}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Style">
          <SelectInput
            value={tool.textSymbol?.font?.style || ''}
            onChange={(v) => updateTextFont({ style: v || undefined })}
            options={[
              { value: '', label: 'Normal' },
              { value: 'italic', label: 'Italic' },
            ]}
          />
        </Field>
        <Field label="Weight">
          <SelectInput
            value={tool.textSymbol?.font?.weight || ''}
            onChange={(v) => updateTextFont({ weight: v || undefined })}
            options={[
              { value: '', label: 'Normal' },
              { value: 'bold', label: 'Bold' },
            ]}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="H-Align">
          <SelectInput
            value={tool.textSymbol?.horizontalAlignment || ''}
            onChange={(v) => updateTextSymbol({ horizontalAlignment: (v || undefined) as any })}
            options={[
              { value: '', label: 'Default' },
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </Field>
        <Field label="V-Align">
          <SelectInput
            value={tool.textSymbol?.verticalAlignment || ''}
            onChange={(v) => updateTextSymbol({ verticalAlignment: (v || undefined) as any })}
            options={[
              { value: '', label: 'Default' },
              { value: 'top', label: 'Top' },
              { value: 'middle', label: 'Middle' },
              { value: 'bottom', label: 'Bottom' },
            ]}
          />
        </Field>
      </div>

      {/* Text anchor (for non-text types) */}
      {tool.type !== 'text' && (
        <Field label="Text Anchor">
          <SelectInput
            value={tool.textAnchor || ''}
            onChange={(v) => onUpdate({ textAnchor: v || undefined })}
            options={TEXT_ANCHORS}
          />
        </Field>
      )}

      {/* Background / border (sticky note style) */}
      <Field label="Background Color">
        <ColorInput
          value={tool.textSymbol?.backgroundColor || ''}
          onChange={(v) => updateTextSymbol({ backgroundColor: v || undefined })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Border Color">
          <ColorInput
            value={tool.textSymbol?.borderLineColor || ''}
            onChange={(v) => updateTextSymbol({ borderLineColor: v || undefined })}
          />
        </Field>
        <Field label="Border Size">
          <TextInput
            value={tool.textSymbol?.borderLineSize || ''}
            onChange={(v) => updateTextSymbol({ borderLineSize: v || undefined })}
            placeholder="2"
            mono
          />
        </Field>
      </div>

      {/* Halo */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Halo Color">
          <ColorInput
            value={tool.textSymbol?.haloColor || ''}
            onChange={(v) => updateTextSymbol({ haloColor: v || undefined })}
          />
        </Field>
        <Field label="Halo Size">
          <TextInput
            value={tool.textSymbol?.haloSize || ''}
            onChange={(v) => updateTextSymbol({ haloSize: v || undefined })}
            placeholder="2"
            mono
          />
        </Field>
      </div>

      {/* Live preview */}
      <SectionHeader title="Preview" />
      <ToolPreview tool={tool} />
    </div>
  );
}

// ============================================================
// Tool Preview
// ============================================================

function ToolPreview({ tool }: { tool: PaletteTool }) {
  const symbolColor = getPreviewColor(tool);
  const width = (tool.symbol && 'width' in tool.symbol ? tool.symbol.width : undefined) || 4;

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center"
      style={{ height: 80 }}
    >
      {tool.type === 'line' && (
        <svg width="200" height="60" viewBox="0 0 200 60">
          <line
            x1="20"
            y1="40"
            x2="180"
            y2="20"
            stroke={symbolColor || '#999'}
            strokeWidth={Math.min(width, 10)}
            strokeDasharray={getStrokeDash(tool.symbol as EsriLineSymbol)}
          />
          {tool.endDecoration && (
            <polygon
              points="180,20 170,12 170,28"
              fill={symbolColor || '#999'}
            />
          )}
          {tool.beginDecoration && (
            <polygon
              points="20,40 30,32 30,48"
              fill={symbolColor || '#999'}
            />
          )}
        </svg>
      )}

      {tool.type === 'area' && (
        <svg width="200" height="60" viewBox="0 0 200 60">
          <polygon
            points="30,50 100,10 170,50"
            fill={symbolColor || '#ccc'}
            fillOpacity={0.5}
            stroke={(tool.symbol as EsriFillSymbol)?.outline?.color || symbolColor || '#666'}
            strokeWidth={(tool.symbol as EsriFillSymbol)?.outline?.width || 2}
          />
        </svg>
      )}

      {tool.type === 'marker' && (
        <svg width="200" height="60" viewBox="0 0 200 60">
          {tool.symbol?.type === 'esriSMS' && (
            <MarkerShape
              style={(tool.symbol as EsriSimpleMarkerSymbol).style || 'esriSMSCircle'}
              color={symbolColor || '#22c55e'}
              size={Math.min((tool.symbol as EsriSimpleMarkerSymbol).size || 20, 40)}
              outline={(tool.symbol as EsriSimpleMarkerSymbol).outline}
            />
          )}
          {tool.symbol?.type === 'esriPMS' && (
            <text x="100" y="35" textAnchor="middle" fill="#999" fontSize="11">
              [Image: {(tool.symbol as EsriPictureMarkerSymbol).url || '?'}]
            </text>
          )}
        </svg>
      )}

      {tool.type === 'text' && (
        <div
          style={{
            color: tool.textSymbol?.color || '#000',
            fontSize: Math.min(tool.textSymbol?.font?.size || 16, 28),
            fontStyle: tool.textSymbol?.font?.style || 'normal',
            fontWeight: tool.textSymbol?.font?.weight || 'normal',
            backgroundColor: tool.textSymbol?.backgroundColor || 'transparent',
            border: tool.textSymbol?.borderLineColor
              ? `${tool.textSymbol.borderLineSize || 1}px solid ${tool.textSymbol.borderLineColor}`
              : 'none',
            padding: '4px 8px',
            borderRadius: 4,
          }}
        >
          Sample text
        </div>
      )}
    </div>
  );
}

function MarkerShape({
  style,
  color,
  size,
  outline,
}: {
  style: EsriMarkerStyle;
  color: string;
  size: number;
  outline?: EsriOutline;
}) {
  const cx = 100, cy = 30;
  const r = size / 2;
  const strokeColor = outline?.color || 'none';
  const strokeWidth = outline?.width || 0;

  switch (style) {
    case 'esriSMSCircle':
      return <circle cx={cx} cy={cy} r={r} fill={color} stroke={strokeColor} strokeWidth={strokeWidth} />;
    case 'esriSMSSquare':
      return <rect x={cx - r} y={cy - r} width={size} height={size} fill={color} stroke={strokeColor} strokeWidth={strokeWidth} />;
    case 'esriSMSDiamond':
      return (
        <polygon
          points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
          fill={color}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    case 'esriSMSTriangle':
      return (
        <polygon
          points={`${cx},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}`}
          fill={color}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    case 'esriSMSCross':
      return (
        <g stroke={color} strokeWidth={Math.max(strokeWidth, 3)}>
          <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} />
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} />
        </g>
      );
    case 'esriSMSX':
      return (
        <g stroke={color} strokeWidth={Math.max(strokeWidth, 3)}>
          <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} />
          <line x1={cx + r} y1={cy - r} x2={cx - r} y2={cy + r} />
        </g>
      );
    default:
      return <circle cx={cx} cy={cy} r={r} fill={color} />;
  }
}

function getPreviewColor(tool: PaletteTool): string | undefined {
  if (tool.symbol && 'color' in tool.symbol) return tool.symbol.color;
  if (tool.textSymbol?.color) return tool.textSymbol.color;
  return undefined;
}

function getStrokeDash(symbol?: EsriLineSymbol): string | undefined {
  if (!symbol) return undefined;
  const style = symbol.style;
  if (Array.isArray(style)) return style.join(',');
  switch (style) {
    case 'esriSLSDash': return '8,4';
    case 'esriSLSDot': return '2,4';
    case 'esriSLSDashDot': return '8,4,2,4';
    case 'esriSLSDashDotDot': return '8,4,2,4,2,4';
    default: return undefined;
  }
}
