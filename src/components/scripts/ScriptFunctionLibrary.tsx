/**
 * Script Function Library — Visual, configurable Survey123-specific function templates
 *
 * Pre-built functions organized by category that users can add to their form
 * with visual parameter configuration (no coding required).
 * "View Source" toggle reveals the Monaco editor for power users.
 */

import React, { useState, useMemo } from 'react';
import { useSurveyStore } from '../../store/surveyStore';
import { ScriptFile, ParsedFunction } from '../../types/survey';
import { parseJavaScriptFunctions, generatePulldataExpression } from '../../utils/scriptParser';
import { Plus, Search, Eye, X, Trash2 } from '../../utils/icons';
import { v4 as uuid } from 'uuid';

// ============================================================
// Pre-built function templates for Survey123
// ============================================================

export interface FunctionTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  params: { name: string; label: string; placeholder: string }[];
  code: string;
}

const FUNCTION_TEMPLATES: FunctionTemplate[] = [
  // ---- Text Formatting ----
  {
    id: 'format_phone',
    name: 'formatPhone',
    displayName: 'Format Phone Number',
    description: 'Formats a 10-digit number as (XXX) XXX-XXXX',
    category: 'Text Formatting',
    params: [{ name: 'phone', label: 'Phone number field', placeholder: 'e.g. 5551234567' }],
    code: `/**
 * Format a 10-digit phone number as (XXX) XXX-XXXX
 * @param {string} phone - Raw phone number digits
 * @returns {string} Formatted phone number
 */
function formatPhone(phone) {
  var digits = String(phone).replace(/\\D/g, '');
  if (digits.length === 10) {
    return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);
  }
  if (digits.length === 11 && digits[0] === '1') {
    return '(' + digits.slice(1, 4) + ') ' + digits.slice(4, 7) + '-' + digits.slice(7);
  }
  return String(phone);
}`,
  },
  {
    id: 'format_address',
    name: 'formatAddress',
    displayName: 'Format Full Address',
    description: 'Combines address parts into a single formatted string',
    category: 'Text Formatting',
    params: [
      { name: 'street', label: 'Street', placeholder: '123 Main St' },
      { name: 'city', label: 'City', placeholder: 'Springfield' },
      { name: 'state', label: 'State', placeholder: 'IL' },
      { name: 'zip', label: 'Zip Code', placeholder: '62701' },
    ],
    code: `/**
 * Format address components into a single line
 * @param {string} street - Street address
 * @param {string} city - City name
 * @param {string} state - State abbreviation
 * @param {string} zip - ZIP code
 * @returns {string} Formatted address
 */
function formatAddress(street, city, state, zip) {
  var parts = [];
  if (street) parts.push(street);
  if (city) parts.push(city);
  if (state && zip) parts.push(state + ' ' + zip);
  else if (state) parts.push(state);
  else if (zip) parts.push(zip);
  return parts.join(', ');
}`,
  },
  {
    id: 'title_case',
    name: 'titleCase',
    displayName: 'Title Case',
    description: 'Converts text to Title Case (capitalizes first letter of each word)',
    category: 'Text Formatting',
    params: [{ name: 'text', label: 'Text to convert', placeholder: 'john doe' }],
    code: `/**
 * Convert text to Title Case
 * @param {string} text - Input text
 * @returns {string} Title-cased text
 */
function titleCase(text) {
  return String(text).replace(/\\w\\S*/g, function(word) {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
  });
}`,
  },
  {
    id: 'extract_initials',
    name: 'extractInitials',
    displayName: 'Extract Initials',
    description: 'Gets the first letter of each word (e.g. "John Doe" → "JD")',
    category: 'Text Formatting',
    params: [{ name: 'name', label: 'Full name', placeholder: 'John Doe' }],
    code: `/**
 * Extract initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials (e.g. "JD")
 */
function extractInitials(name) {
  return String(name).split(/\\s+/).map(function(w) {
    return w.charAt(0).toUpperCase();
  }).join('');
}`,
  },

  // ---- Date & Age ----
  {
    id: 'calculate_age',
    name: 'calculateAge',
    displayName: 'Calculate Age',
    description: 'Calculates age in years from a date of birth',
    category: 'Date & Age',
    params: [{ name: 'dob', label: 'Date of birth', placeholder: '1990-05-15' }],
    code: `/**
 * Calculate age in years from a date of birth
 * @param {string} dob - Date of birth (YYYY-MM-DD)
 * @returns {number} Age in whole years
 */
function calculateAge(dob) {
  var birth = new Date(dob);
  var today = new Date();
  var age = today.getFullYear() - birth.getFullYear();
  var m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}`,
  },
  {
    id: 'days_between',
    name: 'daysBetween',
    displayName: 'Days Between Dates',
    description: 'Calculates the number of days between two dates',
    category: 'Date & Age',
    params: [
      { name: 'startDate', label: 'Start date', placeholder: '2024-01-01' },
      { name: 'endDate', label: 'End date', placeholder: '2024-12-31' },
    ],
    code: `/**
 * Calculate number of days between two dates
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {number} Number of days
 */
function daysBetween(startDate, endDate) {
  var start = new Date(startDate);
  var end = new Date(endDate);
  var diff = Math.abs(end - start);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}`,
  },
  {
    id: 'format_date',
    name: 'formatDate',
    displayName: 'Format Date',
    description: 'Formats a date as MM/DD/YYYY',
    category: 'Date & Age',
    params: [{ name: 'dateStr', label: 'Date value', placeholder: '2024-03-15' }],
    code: `/**
 * Format a date as MM/DD/YYYY
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  var d = new Date(dateStr);
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  var yyyy = d.getFullYear();
  return mm + '/' + dd + '/' + yyyy;
}`,
  },

  // ---- Unit Conversions ----
  {
    id: 'feet_to_meters',
    name: 'feetToMeters',
    displayName: 'Feet to Meters',
    description: 'Converts feet to meters',
    category: 'Unit Conversions',
    params: [{ name: 'feet', label: 'Value in feet', placeholder: '100' }],
    code: `/**
 * Convert feet to meters
 * @param {number} feet - Value in feet
 * @returns {number} Value in meters (2 decimal places)
 */
function feetToMeters(feet) {
  return Math.round(Number(feet) * 0.3048 * 100) / 100;
}`,
  },
  {
    id: 'meters_to_feet',
    name: 'metersToFeet',
    displayName: 'Meters to Feet',
    description: 'Converts meters to feet',
    category: 'Unit Conversions',
    params: [{ name: 'meters', label: 'Value in meters', placeholder: '30' }],
    code: `/**
 * Convert meters to feet
 * @param {number} meters - Value in meters
 * @returns {number} Value in feet (2 decimal places)
 */
function metersToFeet(meters) {
  return Math.round(Number(meters) / 0.3048 * 100) / 100;
}`,
  },
  {
    id: 'acres_to_sqft',
    name: 'acresToSqFt',
    displayName: 'Acres to Square Feet',
    description: 'Converts acres to square feet',
    category: 'Unit Conversions',
    params: [{ name: 'acres', label: 'Value in acres', placeholder: '1.5' }],
    code: `/**
 * Convert acres to square feet
 * @param {number} acres - Value in acres
 * @returns {number} Value in square feet
 */
function acresToSqFt(acres) {
  return Math.round(Number(acres) * 43560 * 100) / 100;
}`,
  },
  {
    id: 'celsius_fahrenheit',
    name: 'celsiusToFahrenheit',
    displayName: 'Celsius to Fahrenheit',
    description: 'Converts Celsius temperature to Fahrenheit',
    category: 'Unit Conversions',
    params: [{ name: 'celsius', label: 'Temperature (°C)', placeholder: '20' }],
    code: `/**
 * Convert Celsius to Fahrenheit
 * @param {number} celsius - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
function celsiusToFahrenheit(celsius) {
  return Math.round((Number(celsius) * 9 / 5 + 32) * 100) / 100;
}`,
  },

  // ---- Scoring & Calculations ----
  {
    id: 'weighted_score',
    name: 'weightedScore',
    displayName: 'Weighted Score',
    description: 'Calculates a weighted average of two values',
    category: 'Scoring',
    params: [
      { name: 'val1', label: 'Value 1', placeholder: '80' },
      { name: 'weight1', label: 'Weight 1', placeholder: '0.6' },
      { name: 'val2', label: 'Value 2', placeholder: '90' },
      { name: 'weight2', label: 'Weight 2', placeholder: '0.4' },
    ],
    code: `/**
 * Calculate weighted average of two values
 * @param {number} val1 - First value
 * @param {number} weight1 - Weight for first value
 * @param {number} val2 - Second value
 * @param {number} weight2 - Weight for second value
 * @returns {number} Weighted average
 */
function weightedScore(val1, weight1, val2, weight2) {
  return Math.round((Number(val1) * Number(weight1) + Number(val2) * Number(weight2)) * 100) / 100;
}`,
  },
  {
    id: 'rating_label',
    name: 'ratingLabel',
    displayName: 'Score to Rating Label',
    description: 'Converts a numeric score to a text rating (Poor/Fair/Good/Excellent)',
    category: 'Scoring',
    params: [{ name: 'score', label: 'Numeric score', placeholder: '75' }],
    code: `/**
 * Convert a numeric score (0-100) to a rating label
 * @param {number} score - Numeric score
 * @returns {string} Rating label
 */
function ratingLabel(score) {
  var s = Number(score);
  if (s >= 90) return 'Excellent';
  if (s >= 70) return 'Good';
  if (s >= 50) return 'Fair';
  return 'Poor';
}`,
  },
  {
    id: 'pass_fail',
    name: 'passFail',
    displayName: 'Pass / Fail Check',
    description: 'Returns "Pass" or "Fail" based on a threshold',
    category: 'Scoring',
    params: [
      { name: 'value', label: 'Score value', placeholder: '75' },
      { name: 'threshold', label: 'Passing threshold', placeholder: '70' },
    ],
    code: `/**
 * Determine pass or fail based on a threshold
 * @param {number} value - The score value
 * @param {number} threshold - The minimum passing value
 * @returns {string} "Pass" or "Fail"
 */
function passFail(value, threshold) {
  return Number(value) >= Number(threshold) ? 'Pass' : 'Fail';
}`,
  },

  // ---- GIS & Coordinates ----
  {
    id: 'dd_to_dms',
    name: 'ddToDms',
    displayName: 'Decimal Degrees → DMS',
    description: 'Converts decimal degrees to degrees/minutes/seconds string',
    category: 'GIS & Coordinates',
    params: [
      { name: 'lat', label: 'Latitude', placeholder: '38.8977' },
      { name: 'lng', label: 'Longitude', placeholder: '-77.0365' },
    ],
    code: `/**
 * Convert decimal degrees to DMS (degrees, minutes, seconds) string
 * @param {number} lat - Latitude in decimal degrees
 * @param {number} lng - Longitude in decimal degrees
 * @returns {string} DMS formatted coordinates
 */
function ddToDms(lat, lng) {
  function toDms(dd, isLng) {
    var d = Math.abs(Number(dd));
    var deg = Math.floor(d);
    var min = Math.floor((d - deg) * 60);
    var sec = Math.round(((d - deg) * 60 - min) * 60 * 100) / 100;
    var dir = Number(dd) >= 0 ? (isLng ? 'E' : 'N') : (isLng ? 'W' : 'S');
    return deg + '° ' + min + "' " + sec + '" ' + dir;
  }
  return toDms(lat, false) + ', ' + toDms(lng, true);
}`,
  },
  {
    id: 'haversine_distance',
    name: 'haversineDistance',
    displayName: 'Distance Between Points',
    description: 'Calculates distance (km) between two lat/lng points using Haversine formula',
    category: 'GIS & Coordinates',
    params: [
      { name: 'lat1', label: 'Point 1 Latitude', placeholder: '38.8977' },
      { name: 'lng1', label: 'Point 1 Longitude', placeholder: '-77.0365' },
      { name: 'lat2', label: 'Point 2 Latitude', placeholder: '40.7128' },
      { name: 'lng2', label: 'Point 2 Longitude', placeholder: '-74.0060' },
    ],
    code: `/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Point 1 latitude
 * @param {number} lng1 - Point 1 longitude
 * @param {number} lat2 - Point 2 latitude
 * @param {number} lng2 - Point 2 longitude
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  var R = 6371;
  var dLat = (Number(lat2) - Number(lat1)) * Math.PI / 180;
  var dLng = (Number(lng2) - Number(lng1)) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(Number(lat1) * Math.PI / 180) * Math.cos(Number(lat2) * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}`,
  },

  // ---- ID & Code Generation ----
  {
    id: 'generate_id',
    name: 'generateId',
    displayName: 'Generate Survey ID',
    description: 'Creates a unique ID from a prefix and the current date/time',
    category: 'ID Generation',
    params: [{ name: 'prefix', label: 'ID Prefix', placeholder: 'INS' }],
    code: `/**
 * Generate a unique ID with a prefix and timestamp
 * @param {string} prefix - ID prefix (e.g. "INS", "WO")
 * @returns {string} Unique ID like "INS-20240315-1423"
 */
function generateId(prefix) {
  var now = new Date();
  var y = now.getFullYear();
  var m = String(now.getMonth() + 1).padStart(2, '0');
  var d = String(now.getDate()).padStart(2, '0');
  var h = String(now.getHours()).padStart(2, '0');
  var min = String(now.getMinutes()).padStart(2, '0');
  return prefix + '-' + y + m + d + '-' + h + min;
}`,
  },
  {
    id: 'pad_number',
    name: 'padNumber',
    displayName: 'Pad Number with Zeros',
    description: 'Pads a number to a fixed length (e.g. 5 → "005")',
    category: 'ID Generation',
    params: [
      { name: 'num', label: 'Number', placeholder: '5' },
      { name: 'length', label: 'Total length', placeholder: '3' },
    ],
    code: `/**
 * Pad a number with leading zeros
 * @param {number} num - The number to pad
 * @param {number} length - Desired total string length
 * @returns {string} Zero-padded number
 */
function padNumber(num, length) {
  return String(num).padStart(Number(length), '0');
}`,
  },
];

// Group templates by category
const TEMPLATE_CATEGORIES = Array.from(
  new Set(FUNCTION_TEMPLATES.map((t) => t.category))
);

// Category icons (SVG inline)
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Text Formatting': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  'Date & Age': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  'Unit Conversions': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" />
    </svg>
  ),
  'Scoring': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
    </svg>
  ),
  'GIS & Coordinates': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  'ID Generation': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
      <line x1="9" y1="9" x2="9" y2="15" /><line x1="15" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

// ============================================================
// Component
// ============================================================

interface Props {
  onOpenSourceEditor?: () => void;
}

export function ScriptFunctionLibrary({ onOpenSourceEditor }: Props) {
  const { form, addScriptFile, updateScriptFile, removeScriptFile, pushUndo } = useSurveyStore();
  const scriptFiles = form.scriptFiles || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addedFunctions, setAddedFunctions] = useState<Set<string>>(new Set());

  // Find which templates are already in the script files
  const existingFunctions = useMemo(() => {
    const names = new Set<string>();
    for (const file of scriptFiles) {
      const parsed = parseJavaScriptFunctions(file.content, file.fileName);
      parsed.forEach((f) => names.add(f.name));
    }
    return names;
  }, [scriptFiles]);

  // All parsed functions from existing scripts
  const allParsedFunctions = useMemo(() => {
    const funcs: ParsedFunction[] = [];
    for (const file of scriptFiles) {
      funcs.push(...parseJavaScriptFunctions(file.content, file.fileName));
    }
    return funcs;
  }, [scriptFiles]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let list = FUNCTION_TEMPLATES;
    if (selectedCategory) {
      list = list.filter((t) => t.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.displayName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  const getOrCreateMainFile = (): string => {
    if (scriptFiles.length > 0) return scriptFiles[0].id;
    const newFile: ScriptFile = {
      id: uuid(),
      fileName: 'functions.js',
      content: `/**\n * Survey123 JavaScript Functions\n * Auto-generated by Survey123 Designer\n */\n`,
    };
    addScriptFile(newFile);
    return newFile.id;
  };

  const handleAddFunction = (template: FunctionTemplate) => {
    pushUndo();
    const fileId = getOrCreateMainFile();
    const file = useSurveyStore.getState().form.scriptFiles.find((f) => f.id === fileId);
    if (!file) return;

    const newContent = file.content + '\n' + template.code + '\n';
    updateScriptFile(fileId, { content: newContent });
    setAddedFunctions((prev) => new Set([...prev, template.id]));
  };

  const handleRemoveFunction = (funcName: string) => {
    pushUndo();
    // Find and remove the function from whatever file it's in
    for (const file of scriptFiles) {
      const parsed = parseJavaScriptFunctions(file.content, file.fileName);
      const func = parsed.find((f) => f.name === funcName);
      if (!func) continue;

      // Simple removal: find the function block and remove it
      const lines = file.content.split('\n');
      let startLine = func.line - 1;
      // Look backwards for JSDoc comment
      while (startLine > 0 && (lines[startLine - 1].trim().startsWith('*') || lines[startLine - 1].trim().startsWith('/**'))) {
        startLine--;
      }
      // Find end of function (look for closing brace at column 0)
      let endLine = func.line;
      let braceDepth = 0;
      let foundOpen = false;
      for (let i = func.line - 1; i < lines.length; i++) {
        for (const ch of lines[i]) {
          if (ch === '{') { braceDepth++; foundOpen = true; }
          if (ch === '}') braceDepth--;
        }
        if (foundOpen && braceDepth === 0) {
          endLine = i + 1;
          break;
        }
      }

      const newLines = [...lines.slice(0, startLine), ...lines.slice(endLine)];
      // Remove consecutive blank lines
      const cleaned = newLines.join('\n').replace(/\n{3,}/g, '\n\n');
      updateScriptFile(file.id, { content: cleaned });
      break;
    }
  };

  const scriptCount = scriptFiles.length;
  const funcCount = allParsedFunctions.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-[#fafafa]"
        style={{ padding: '10px 14px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div>
            <h3 className="text-[13px] font-semibold text-gray-800">JavaScript Functions</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {funcCount} function{funcCount !== 1 ? 's' : ''} in {scriptCount} file{scriptCount !== 1 ? 's' : ''}
            </p>
          </div>
          {onOpenSourceEditor && (
            <button
              onClick={onOpenSourceEditor}
              className="flex items-center gap-1 text-[10px] font-medium text-gray-500 hover:text-gray-700
                bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              style={{ padding: '3px 8px' }}
              title="Open code editor"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m10 13-2 2 2 2" /><path d="m14 17 2-2-2-2" />
              </svg>
              View Source
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search functions..."
            className="w-full text-[11px] pl-7 pr-2 py-1.5 border border-gray-200 rounded-md
              focus:border-[#007a62] focus:ring-1 focus:ring-[#007a62] outline-none bg-white"
          />
        </div>
      </div>

      {/* Category filter pills */}
      <div className="shrink-0 flex flex-wrap gap-1 border-b border-gray-100"
        style={{ padding: '6px 14px' }}>
        <button
          onClick={() => setSelectedCategory(null)}
          className={`text-[10px] font-medium rounded-full transition-colors ${
            !selectedCategory
              ? 'bg-[#007a62] text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          style={{ padding: '2px 8px' }}
        >
          All
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={`text-[10px] font-medium rounded-full transition-colors ${
              selectedCategory === cat
                ? 'bg-[#007a62] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            style={{ padding: '2px 8px' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Functions */}
      {allParsedFunctions.length > 0 && !searchQuery && !selectedCategory && (
        <div className="shrink-0 border-b border-gray-200" style={{ padding: '8px 14px' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400"
            style={{ marginBottom: 6 }}>
            Active Functions
          </div>
          <div className="space-y-1">
            {allParsedFunctions.map((func, idx) => (
              <div
                key={`${func.fileName}-${func.name}-${idx}`}
                className="flex items-center justify-between bg-[#f0faf7] rounded-md group"
                style={{ padding: '5px 8px' }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] text-[#007a62] font-mono font-bold shrink-0">ƒ</span>
                  <span className="text-[11px] text-gray-700 font-mono truncate">{func.name}</span>
                  <span className="text-[9px] text-gray-400 font-mono truncate">
                    ({func.params.join(', ')})
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFunction(func.name)}
                  className="p-0.5 text-gray-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Remove function"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Function template list */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '8px 14px' }}>
        {!searchQuery && !selectedCategory && (
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400"
            style={{ marginBottom: 6 }}>
            Function Library
          </div>
        )}

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-6 text-gray-300">
            <p className="text-[12px] text-gray-400">No matching functions</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredTemplates.map((template) => {
              const isAdded = existingFunctions.has(template.name) || addedFunctions.has(template.id);
              return (
                <FunctionTemplateCard
                  key={template.id}
                  template={template}
                  isAdded={isAdded}
                  onAdd={() => handleAddFunction(template)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Function Template Card
// ============================================================

function FunctionTemplateCard({
  template,
  isAdded,
  onAdd,
}: {
  template: FunctionTemplate;
  isAdded: boolean;
  onAdd: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-lg transition-colors ${
      isAdded ? 'border-[#007a62]/30 bg-[#f0faf7]' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <div
        className="flex items-start gap-2 cursor-pointer"
        style={{ padding: '8px 10px' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="shrink-0 mt-0.5 text-gray-400">
          {CATEGORY_ICONS[template.category] || null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-gray-800">{template.displayName}</span>
            {isAdded && (
              <span className="text-[9px] font-bold text-[#007a62] bg-[#d0ebe3] rounded px-1.5 py-0.5">
                ADDED
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{template.description}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[9px] text-gray-300 font-mono">
              ƒ {template.name}({template.params.map((p) => p.name).join(', ')})
            </span>
          </div>
        </div>
        {!isAdded && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            className="shrink-0 flex items-center gap-1 text-[10px] font-medium text-white
              bg-[#007a62] rounded-md hover:bg-[#006652] transition-colors"
            style={{ padding: '3px 8px' }}
            title="Add to form"
          >
            <Plus size={10} />
            Add
          </button>
        )}
      </div>

      {/* Expanded: show code preview */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50" style={{ padding: '8px 10px' }}>
          <div className="text-[10px] font-semibold text-gray-500 mb-1">Parameters:</div>
          <div className="space-y-1 mb-2">
            {template.params.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <code className="text-[10px] font-mono text-[#007a62] bg-white border border-gray-200 rounded px-1.5 py-0.5">{p.name}</code>
                <span className="text-[10px] text-gray-500">{p.label}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] font-semibold text-gray-500 mb-1">XLSForm Usage:</div>
          <code className="block text-[10px] font-mono text-amber-700 bg-white border border-gray-200 rounded px-2 py-1.5 break-all">
            pulldata("@javascript", "functions.js", "{template.name}"{template.params.map((p) => `, \${${p.name}}`).join('')})
          </code>
        </div>
      )}
    </div>
  );
}

export { FUNCTION_TEMPLATES, TEMPLATE_CATEGORIES };
