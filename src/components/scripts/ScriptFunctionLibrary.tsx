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
  {
    id: 'sequential_id',
    name: 'sequentialId',
    displayName: 'Sequential ID with Prefix',
    description: 'Creates an ID like "WO-0042" from a prefix and sequence number',
    category: 'ID Generation',
    params: [
      { name: 'prefix', label: 'Prefix', placeholder: 'WO' },
      { name: 'seq', label: 'Sequence number', placeholder: '42' },
      { name: 'digits', label: 'Digit padding', placeholder: '4' },
    ],
    code: `/**
 * Create a sequential ID with prefix and zero-padded number
 * @param {string} prefix - ID prefix
 * @param {number} seq - Sequence number
 * @param {number} digits - Total digit length
 * @returns {string} ID like "WO-0042"
 */
function sequentialId(prefix, seq, digits) {
  return prefix + '-' + String(seq).padStart(Number(digits), '0');
}`,
  },
  {
    id: 'hash_code',
    name: 'hashCode',
    displayName: 'Simple Hash Code',
    description: 'Generates a numeric hash from a string (useful for deterministic IDs)',
    category: 'ID Generation',
    params: [{ name: 'str', label: 'Input string', placeholder: 'some text' }],
    code: `/**
 * Generate a simple numeric hash from a string
 * @param {string} str - Input string
 * @returns {number} Hash code
 */
function hashCode(str) {
  var hash = 0;
  var s = String(str);
  for (var i = 0; i < s.length; i++) {
    var ch = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash = hash & hash;
  }
  return Math.abs(hash);
}`,
  },

  // ---- Validation ----
  {
    id: 'is_valid_email',
    name: 'isValidEmail',
    displayName: 'Validate Email',
    description: 'Returns "Yes" or "No" if the input is a valid email format',
    category: 'Validation',
    params: [{ name: 'email', label: 'Email address', placeholder: 'user@example.com' }],
    code: `/**
 * Check if an email address is valid
 * @param {string} email - Email to validate
 * @returns {string} "Yes" or "No"
 */
function isValidEmail(email) {
  var re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return re.test(String(email)) ? 'Yes' : 'No';
}`,
  },
  {
    id: 'is_valid_phone',
    name: 'isValidPhone',
    displayName: 'Validate Phone Number',
    description: 'Returns "Yes" or "No" for a valid 10-digit US phone number',
    category: 'Validation',
    params: [{ name: 'phone', label: 'Phone number', placeholder: '5551234567' }],
    code: `/**
 * Check if a phone number has 10 digits (US format)
 * @param {string} phone - Phone number
 * @returns {string} "Yes" or "No"
 */
function isValidPhone(phone) {
  var digits = String(phone).replace(/\\D/g, '');
  return (digits.length === 10 || (digits.length === 11 && digits[0] === '1')) ? 'Yes' : 'No';
}`,
  },
  {
    id: 'is_in_range',
    name: 'isInRange',
    displayName: 'Value in Range Check',
    description: 'Returns "Yes" or "No" if a value is between min and max',
    category: 'Validation',
    params: [
      { name: 'value', label: 'Value', placeholder: '50' },
      { name: 'min', label: 'Minimum', placeholder: '0' },
      { name: 'max', label: 'Maximum', placeholder: '100' },
    ],
    code: `/**
 * Check if a value falls within a range
 * @param {number} value - The value to check
 * @param {number} min - Minimum allowed
 * @param {number} max - Maximum allowed
 * @returns {string} "Yes" or "No"
 */
function isInRange(value, min, max) {
  var v = Number(value);
  return (v >= Number(min) && v <= Number(max)) ? 'Yes' : 'No';
}`,
  },
  {
    id: 'is_valid_ssn',
    name: 'isValidSSN',
    displayName: 'Validate SSN Format',
    description: 'Checks if input matches XXX-XX-XXXX pattern (does not verify identity)',
    category: 'Validation',
    params: [{ name: 'ssn', label: 'SSN', placeholder: '123-45-6789' }],
    code: `/**
 * Validate SSN format (XXX-XX-XXXX)
 * @param {string} ssn - Social Security Number
 * @returns {string} "Yes" or "No"
 */
function isValidSSN(ssn) {
  var re = /^\\d{3}-\\d{2}-\\d{4}$/;
  return re.test(String(ssn)) ? 'Yes' : 'No';
}`,
  },
  {
    id: 'is_valid_zip',
    name: 'isValidZip',
    displayName: 'Validate ZIP Code',
    description: 'Checks for valid US ZIP (5-digit or ZIP+4 format)',
    category: 'Validation',
    params: [{ name: 'zip', label: 'ZIP Code', placeholder: '90210' }],
    code: `/**
 * Validate US ZIP code (5-digit or ZIP+4)
 * @param {string} zip - ZIP code
 * @returns {string} "Yes" or "No"
 */
function isValidZip(zip) {
  var re = /^\\d{5}(-\\d{4})?$/;
  return re.test(String(zip).trim()) ? 'Yes' : 'No';
}`,
  },
  {
    id: 'luhn_check',
    name: 'luhnCheck',
    displayName: 'Luhn Check (ID Validation)',
    description: 'Validates an ID number using the Luhn algorithm (credit cards, IMEIs, etc.)',
    category: 'Validation',
    params: [{ name: 'num', label: 'Number to validate', placeholder: '4539578763621486' }],
    code: `/**
 * Validate a number using the Luhn algorithm
 * @param {string} num - Number string to validate
 * @returns {string} "Valid" or "Invalid"
 */
function luhnCheck(num) {
  var digits = String(num).replace(/\\D/g, '');
  var sum = 0;
  var alt = false;
  for (var i = digits.length - 1; i >= 0; i--) {
    var n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0 ? 'Valid' : 'Invalid';
}`,
  },

  // ---- Math & Statistics ----
  {
    id: 'round_to',
    name: 'roundTo',
    displayName: 'Round to N Decimals',
    description: 'Rounds a number to a specified number of decimal places',
    category: 'Math & Statistics',
    params: [
      { name: 'value', label: 'Number', placeholder: '3.14159' },
      { name: 'places', label: 'Decimal places', placeholder: '2' },
    ],
    code: `/**
 * Round a number to N decimal places
 * @param {number} value - Number to round
 * @param {number} places - Decimal places
 * @returns {number} Rounded number
 */
function roundTo(value, places) {
  var mult = Math.pow(10, Number(places));
  return Math.round(Number(value) * mult) / mult;
}`,
  },
  {
    id: 'clamp',
    name: 'clamp',
    displayName: 'Clamp Value',
    description: 'Constrains a value between a minimum and maximum',
    category: 'Math & Statistics',
    params: [
      { name: 'value', label: 'Value', placeholder: '150' },
      { name: 'min', label: 'Minimum', placeholder: '0' },
      { name: 'max', label: 'Maximum', placeholder: '100' },
    ],
    code: `/**
 * Clamp a value between min and max
 * @param {number} value - Input value
 * @param {number} min - Minimum allowed
 * @param {number} max - Maximum allowed
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.max(Number(min), Math.min(Number(max), Number(value)));
}`,
  },
  {
    id: 'percentage',
    name: 'percentage',
    displayName: 'Calculate Percentage',
    description: 'Calculates what percentage one number is of another',
    category: 'Math & Statistics',
    params: [
      { name: 'part', label: 'Part value', placeholder: '25' },
      { name: 'total', label: 'Total value', placeholder: '200' },
    ],
    code: `/**
 * Calculate percentage (part / total * 100)
 * @param {number} part - The partial value
 * @param {number} total - The total value
 * @returns {number} Percentage (0-100)
 */
function percentage(part, total) {
  var t = Number(total);
  if (t === 0) return 0;
  return Math.round(Number(part) / t * 10000) / 100;
}`,
  },
  {
    id: 'percent_change',
    name: 'percentChange',
    displayName: 'Percent Change',
    description: 'Calculates the percent change between an old and new value',
    category: 'Math & Statistics',
    params: [
      { name: 'oldVal', label: 'Old value', placeholder: '100' },
      { name: 'newVal', label: 'New value', placeholder: '125' },
    ],
    code: `/**
 * Calculate percent change between two values
 * @param {number} oldVal - Original value
 * @param {number} newVal - New value
 * @returns {number} Percent change (positive = increase)
 */
function percentChange(oldVal, newVal) {
  var o = Number(oldVal);
  if (o === 0) return 0;
  return Math.round((Number(newVal) - o) / Math.abs(o) * 10000) / 100;
}`,
  },
  {
    id: 'average',
    name: 'average',
    displayName: 'Average of Values',
    description: 'Calculates the average of up to 5 numeric values (ignores blanks)',
    category: 'Math & Statistics',
    params: [
      { name: 'a', label: 'Value 1', placeholder: '10' },
      { name: 'b', label: 'Value 2', placeholder: '20' },
      { name: 'c', label: 'Value 3', placeholder: '30' },
      { name: 'd', label: 'Value 4 (optional)', placeholder: '' },
      { name: 'e', label: 'Value 5 (optional)', placeholder: '' },
    ],
    code: `/**
 * Calculate average of up to 5 values (skips blanks/NaN)
 * @returns {number} Average value
 */
function average(a, b, c, d, e) {
  var vals = [a, b, c, d, e].map(Number).filter(function(v) { return !isNaN(v) && arguments[0] !== '' && arguments[0] !== undefined; });
  var nums = [];
  if (a !== '' && a !== undefined && !isNaN(Number(a))) nums.push(Number(a));
  if (b !== '' && b !== undefined && !isNaN(Number(b))) nums.push(Number(b));
  if (c !== '' && c !== undefined && !isNaN(Number(c))) nums.push(Number(c));
  if (d !== '' && d !== undefined && !isNaN(Number(d))) nums.push(Number(d));
  if (e !== '' && e !== undefined && !isNaN(Number(e))) nums.push(Number(e));
  if (nums.length === 0) return 0;
  var sum = 0;
  for (var i = 0; i < nums.length; i++) sum += nums[i];
  return Math.round(sum / nums.length * 100) / 100;
}`,
  },
  {
    id: 'std_deviation',
    name: 'stdDeviation',
    displayName: 'Standard Deviation',
    description: 'Calculates the standard deviation of up to 5 values',
    category: 'Math & Statistics',
    params: [
      { name: 'a', label: 'Value 1', placeholder: '10' },
      { name: 'b', label: 'Value 2', placeholder: '20' },
      { name: 'c', label: 'Value 3', placeholder: '30' },
      { name: 'd', label: 'Value 4 (optional)', placeholder: '' },
      { name: 'e', label: 'Value 5 (optional)', placeholder: '' },
    ],
    code: `/**
 * Calculate standard deviation of up to 5 values
 * @returns {number} Standard deviation
 */
function stdDeviation(a, b, c, d, e) {
  var nums = [];
  if (a !== '' && a !== undefined && !isNaN(Number(a))) nums.push(Number(a));
  if (b !== '' && b !== undefined && !isNaN(Number(b))) nums.push(Number(b));
  if (c !== '' && c !== undefined && !isNaN(Number(c))) nums.push(Number(c));
  if (d !== '' && d !== undefined && !isNaN(Number(d))) nums.push(Number(d));
  if (e !== '' && e !== undefined && !isNaN(Number(e))) nums.push(Number(e));
  if (nums.length < 2) return 0;
  var mean = 0;
  for (var i = 0; i < nums.length; i++) mean += nums[i];
  mean /= nums.length;
  var sqDiffs = 0;
  for (var j = 0; j < nums.length; j++) sqDiffs += Math.pow(nums[j] - mean, 2);
  return Math.round(Math.sqrt(sqDiffs / nums.length) * 100) / 100;
}`,
  },
  {
    id: 'linear_interpolation',
    name: 'lerp',
    displayName: 'Linear Interpolation',
    description: 'Linearly interpolates between two values by a factor (0-1)',
    category: 'Math & Statistics',
    params: [
      { name: 'a', label: 'Start value', placeholder: '0' },
      { name: 'b', label: 'End value', placeholder: '100' },
      { name: 't', label: 'Factor (0-1)', placeholder: '0.5' },
    ],
    code: `/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(a, b, t) {
  return Math.round((Number(a) + (Number(b) - Number(a)) * Number(t)) * 100) / 100;
}`,
  },

  // ---- Time & Duration ----
  {
    id: 'hours_between',
    name: 'hoursBetween',
    displayName: 'Hours Between Times',
    description: 'Calculates decimal hours between two date-time values',
    category: 'Time & Duration',
    params: [
      { name: 'start', label: 'Start date-time', placeholder: '2024-03-15T08:00' },
      { name: 'end', label: 'End date-time', placeholder: '2024-03-15T17:30' },
    ],
    code: `/**
 * Calculate decimal hours between two date-times
 * @param {string} start - Start datetime
 * @param {string} end - End datetime
 * @returns {number} Hours (decimal)
 */
function hoursBetween(start, end) {
  var diff = new Date(end) - new Date(start);
  return Math.round(diff / 3600000 * 100) / 100;
}`,
  },
  {
    id: 'minutes_between',
    name: 'minutesBetween',
    displayName: 'Minutes Between Times',
    description: 'Calculates total minutes between two date-time values',
    category: 'Time & Duration',
    params: [
      { name: 'start', label: 'Start date-time', placeholder: '2024-03-15T08:00' },
      { name: 'end', label: 'End date-time', placeholder: '2024-03-15T08:45' },
    ],
    code: `/**
 * Calculate total minutes between two date-times
 * @param {string} start - Start datetime
 * @param {string} end - End datetime
 * @returns {number} Total minutes
 */
function minutesBetween(start, end) {
  var diff = new Date(end) - new Date(start);
  return Math.round(diff / 60000);
}`,
  },
  {
    id: 'format_duration',
    name: 'formatDuration',
    displayName: 'Format Duration',
    description: 'Converts total minutes into "Xh Ym" format',
    category: 'Time & Duration',
    params: [{ name: 'minutes', label: 'Total minutes', placeholder: '135' }],
    code: `/**
 * Format minutes as "Xh Ym"
 * @param {number} minutes - Total minutes
 * @returns {string} Formatted duration
 */
function formatDuration(minutes) {
  var m = Math.round(Number(minutes));
  var h = Math.floor(m / 60);
  var rem = m % 60;
  if (h === 0) return rem + 'm';
  if (rem === 0) return h + 'h';
  return h + 'h ' + rem + 'm';
}`,
  },
  {
    id: 'work_hours',
    name: 'workHours',
    displayName: 'Work Hours (minus lunch)',
    description: 'Calculates work hours between start/end times, subtracting a lunch break',
    category: 'Time & Duration',
    params: [
      { name: 'start', label: 'Clock-in time', placeholder: '2024-03-15T07:30' },
      { name: 'end', label: 'Clock-out time', placeholder: '2024-03-15T16:00' },
      { name: 'lunchMins', label: 'Lunch break (minutes)', placeholder: '30' },
    ],
    code: `/**
 * Calculate work hours minus lunch break
 * @param {string} start - Clock-in datetime
 * @param {string} end - Clock-out datetime
 * @param {number} lunchMins - Lunch break in minutes
 * @returns {number} Net work hours (decimal)
 */
function workHours(start, end, lunchMins) {
  var diff = new Date(end) - new Date(start);
  var hours = diff / 3600000 - Number(lunchMins) / 60;
  return Math.round(Math.max(0, hours) * 100) / 100;
}`,
  },
  {
    id: 'day_of_week',
    name: 'dayOfWeek',
    displayName: 'Day of Week Name',
    description: 'Returns the day name (Monday, Tuesday, etc.) for a given date',
    category: 'Time & Duration',
    params: [{ name: 'dateStr', label: 'Date', placeholder: '2024-03-15' }],
    code: `/**
 * Get the day of week name for a date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Day name (e.g. "Friday")
 */
function dayOfWeek(dateStr) {
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateStr).getDay()];
}`,
  },
  {
    id: 'is_weekend',
    name: 'isWeekend',
    displayName: 'Is Weekend?',
    description: 'Returns "Yes" if the date falls on Saturday or Sunday',
    category: 'Time & Duration',
    params: [{ name: 'dateStr', label: 'Date', placeholder: '2024-03-16' }],
    code: `/**
 * Check if a date is a weekend
 * @param {string} dateStr - Date string
 * @returns {string} "Yes" or "No"
 */
function isWeekend(dateStr) {
  var day = new Date(dateStr).getDay();
  return (day === 0 || day === 6) ? 'Yes' : 'No';
}`,
  },
  {
    id: 'business_days',
    name: 'businessDays',
    displayName: 'Business Days Between',
    description: 'Counts weekdays (Mon–Fri) between two dates',
    category: 'Time & Duration',
    params: [
      { name: 'startDate', label: 'Start date', placeholder: '2024-03-01' },
      { name: 'endDate', label: 'End date', placeholder: '2024-03-31' },
    ],
    code: `/**
 * Count business days (Mon-Fri) between two dates
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {number} Number of weekdays
 */
function businessDays(startDate, endDate) {
  var start = new Date(startDate);
  var end = new Date(endDate);
  var count = 0;
  var cur = new Date(start);
  while (cur <= end) {
    var day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}`,
  },
  {
    id: 'add_days',
    name: 'addDays',
    displayName: 'Add Days to Date',
    description: 'Adds a number of days to a date and returns the result',
    category: 'Time & Duration',
    params: [
      { name: 'dateStr', label: 'Start date', placeholder: '2024-03-15' },
      { name: 'days', label: 'Days to add', placeholder: '30' },
    ],
    code: `/**
 * Add days to a date and return YYYY-MM-DD
 * @param {string} dateStr - Start date
 * @param {number} days - Days to add (negative to subtract)
 * @returns {string} New date in YYYY-MM-DD format
 */
function addDays(dateStr, days) {
  var d = new Date(dateStr);
  d.setDate(d.getDate() + Number(days));
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}`,
  },
  {
    id: 'months_between',
    name: 'monthsBetween',
    displayName: 'Months Between Dates',
    description: 'Calculates approximate months between two dates',
    category: 'Time & Duration',
    params: [
      { name: 'startDate', label: 'Start date', placeholder: '2023-01-15' },
      { name: 'endDate', label: 'End date', placeholder: '2024-07-15' },
    ],
    code: `/**
 * Calculate months between two dates
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {number} Months between (decimal)
 */
function monthsBetween(startDate, endDate) {
  var s = new Date(startDate);
  var e = new Date(endDate);
  var months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  var dayDiff = e.getDate() - s.getDate();
  return Math.round((months + dayDiff / 30) * 10) / 10;
}`,
  },
  {
    id: 'fiscal_quarter',
    name: 'fiscalQuarter',
    displayName: 'Fiscal Quarter',
    description: 'Returns the fiscal quarter (Q1-Q4) for a date. Assumes Oct 1 fiscal year start.',
    category: 'Time & Duration',
    params: [{ name: 'dateStr', label: 'Date', placeholder: '2024-03-15' }],
    code: `/**
 * Get fiscal quarter for a date (Oct 1 fiscal year)
 * @param {string} dateStr - Date string
 * @returns {string} Quarter label (e.g. "FY2024 Q2")
 */
function fiscalQuarter(dateStr) {
  var d = new Date(dateStr);
  var m = d.getMonth(); // 0-11
  var fy = m >= 9 ? d.getFullYear() + 1 : d.getFullYear();
  var q = m >= 9 ? 1 : m >= 6 ? 4 : m >= 3 ? 3 : 2;
  return 'FY' + fy + ' Q' + q;
}`,
  },

  // ---- Text Formatting (additional) ----
  {
    id: 'sentence_case',
    name: 'sentenceCase',
    displayName: 'Sentence Case',
    description: 'Capitalizes the first letter of each sentence',
    category: 'Text Formatting',
    params: [{ name: 'text', label: 'Text to convert', placeholder: 'hello world. how are you?' }],
    code: `/**
 * Convert text to sentence case
 * @param {string} text - Input text
 * @returns {string} Sentence-cased text
 */
function sentenceCase(text) {
  return String(text).toLowerCase().replace(/(^|[.!?]\\s+)([a-z])/g, function(m, p1, p2) {
    return p1 + p2.toUpperCase();
  });
}`,
  },
  {
    id: 'truncate',
    name: 'truncateText',
    displayName: 'Truncate Text',
    description: 'Truncates text to a maximum length with "..." suffix',
    category: 'Text Formatting',
    params: [
      { name: 'text', label: 'Text to truncate', placeholder: 'A very long piece of text here' },
      { name: 'maxLen', label: 'Max length', placeholder: '20' },
    ],
    code: `/**
 * Truncate text to a maximum length
 * @param {string} text - Input text
 * @param {number} maxLen - Maximum character length
 * @returns {string} Truncated text with "..." if needed
 */
function truncateText(text, maxLen) {
  var s = String(text);
  var max = Number(maxLen);
  return s.length > max ? s.substring(0, max - 3) + '...' : s;
}`,
  },
  {
    id: 'word_count',
    name: 'wordCount',
    displayName: 'Word Count',
    description: 'Counts the number of words in a text field',
    category: 'Text Formatting',
    params: [{ name: 'text', label: 'Text', placeholder: 'The quick brown fox' }],
    code: `/**
 * Count words in a text
 * @param {string} text - Input text
 * @returns {number} Word count
 */
function wordCount(text) {
  var s = String(text).trim();
  if (!s) return 0;
  return s.split(/\\s+/).length;
}`,
  },
  {
    id: 'mask_string',
    name: 'maskString',
    displayName: 'Mask Sensitive Text',
    description: 'Masks all but the last N characters (e.g. SSN → "***-**-6789")',
    category: 'Text Formatting',
    params: [
      { name: 'text', label: 'Text to mask', placeholder: '123-45-6789' },
      { name: 'showLast', label: 'Characters to show', placeholder: '4' },
    ],
    code: `/**
 * Mask a string showing only the last N characters
 * @param {string} text - Text to mask
 * @param {number} showLast - Number of trailing chars to show
 * @returns {string} Masked text
 */
function maskString(text, showLast) {
  var s = String(text);
  var n = Number(showLast);
  if (s.length <= n) return s;
  return s.slice(0, -n).replace(/[a-zA-Z0-9]/g, '*') + s.slice(-n);
}`,
  },
  {
    id: 'slug',
    name: 'toSlug',
    displayName: 'URL-Safe Slug',
    description: 'Converts text to a lowercase URL-safe slug (e.g. "My Report" → "my-report")',
    category: 'Text Formatting',
    params: [{ name: 'text', label: 'Text', placeholder: 'My Project Name' }],
    code: `/**
 * Convert text to a URL-safe slug
 * @param {string} text - Input text
 * @returns {string} URL-safe slug
 */
function toSlug(text) {
  return String(text).toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}`,
  },
  {
    id: 'format_currency',
    name: 'formatCurrency',
    displayName: 'Format as Currency',
    description: 'Formats a number as USD currency (e.g. 1234.5 → "$1,234.50")',
    category: 'Text Formatting',
    params: [{ name: 'amount', label: 'Amount', placeholder: '1234.50' }],
    code: `/**
 * Format a number as US currency
 * @param {number} amount - Dollar amount
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  var n = Number(amount);
  var fixed = Math.abs(n).toFixed(2);
  var parts = fixed.split('.');
  parts[0] = parts[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
  return (n < 0 ? '-' : '') + '$' + parts.join('.');
}`,
  },
  {
    id: 'format_number_commas',
    name: 'formatNumber',
    displayName: 'Format Number with Commas',
    description: 'Adds thousand separators to a number (e.g. 1234567 → "1,234,567")',
    category: 'Text Formatting',
    params: [{ name: 'num', label: 'Number', placeholder: '1234567' }],
    code: `/**
 * Add comma separators to a number
 * @param {number} num - Input number
 * @returns {string} Formatted number with commas
 */
function formatNumber(num) {
  var parts = String(Number(num)).split('.');
  parts[0] = parts[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
  return parts.join('.');
}`,
  },
  {
    id: 'ordinal_suffix',
    name: 'ordinal',
    displayName: 'Ordinal Number',
    description: 'Adds ordinal suffix to a number (e.g. 1 → "1st", 22 → "22nd")',
    category: 'Text Formatting',
    params: [{ name: 'num', label: 'Number', placeholder: '3' }],
    code: `/**
 * Add ordinal suffix to a number
 * @param {number} num - Input number
 * @returns {string} Number with ordinal suffix
 */
function ordinal(num) {
  var n = Number(num);
  var s = ['th', 'st', 'nd', 'rd'];
  var v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}`,
  },

  // ---- Unit Conversions (additional) ----
  {
    id: 'fahrenheit_celsius',
    name: 'fahrenheitToCelsius',
    displayName: 'Fahrenheit to Celsius',
    description: 'Converts Fahrenheit temperature to Celsius',
    category: 'Unit Conversions',
    params: [{ name: 'f', label: 'Temperature (°F)', placeholder: '72' }],
    code: `/**
 * Convert Fahrenheit to Celsius
 * @param {number} f - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius
 */
function fahrenheitToCelsius(f) {
  return Math.round((Number(f) - 32) * 5 / 9 * 100) / 100;
}`,
  },
  {
    id: 'miles_to_km',
    name: 'milesToKm',
    displayName: 'Miles to Kilometers',
    description: 'Converts miles to kilometers',
    category: 'Unit Conversions',
    params: [{ name: 'miles', label: 'Miles', placeholder: '10' }],
    code: `/**
 * Convert miles to kilometers
 * @param {number} miles - Distance in miles
 * @returns {number} Distance in kilometers
 */
function milesToKm(miles) {
  return Math.round(Number(miles) * 1.60934 * 100) / 100;
}`,
  },
  {
    id: 'km_to_miles',
    name: 'kmToMiles',
    displayName: 'Kilometers to Miles',
    description: 'Converts kilometers to miles',
    category: 'Unit Conversions',
    params: [{ name: 'km', label: 'Kilometers', placeholder: '16' }],
    code: `/**
 * Convert kilometers to miles
 * @param {number} km - Distance in kilometers
 * @returns {number} Distance in miles
 */
function kmToMiles(km) {
  return Math.round(Number(km) / 1.60934 * 100) / 100;
}`,
  },
  {
    id: 'sqft_to_acres',
    name: 'sqFtToAcres',
    displayName: 'Square Feet to Acres',
    description: 'Converts square feet to acres',
    category: 'Unit Conversions',
    params: [{ name: 'sqft', label: 'Square Feet', placeholder: '43560' }],
    code: `/**
 * Convert square feet to acres
 * @param {number} sqft - Area in square feet
 * @returns {number} Area in acres
 */
function sqFtToAcres(sqft) {
  return Math.round(Number(sqft) / 43560 * 10000) / 10000;
}`,
  },
  {
    id: 'sqft_to_sqm',
    name: 'sqFtToSqM',
    displayName: 'Square Feet to Square Meters',
    description: 'Converts square feet to square meters',
    category: 'Unit Conversions',
    params: [{ name: 'sqft', label: 'Square Feet', placeholder: '1000' }],
    code: `/**
 * Convert square feet to square meters
 * @param {number} sqft - Area in square feet
 * @returns {number} Area in square meters
 */
function sqFtToSqM(sqft) {
  return Math.round(Number(sqft) * 0.092903 * 100) / 100;
}`,
  },
  {
    id: 'gallons_to_liters',
    name: 'gallonsToLiters',
    displayName: 'Gallons to Liters',
    description: 'Converts US gallons to liters',
    category: 'Unit Conversions',
    params: [{ name: 'gallons', label: 'Gallons', placeholder: '5' }],
    code: `/**
 * Convert US gallons to liters
 * @param {number} gallons - Volume in gallons
 * @returns {number} Volume in liters
 */
function gallonsToLiters(gallons) {
  return Math.round(Number(gallons) * 3.78541 * 100) / 100;
}`,
  },
  {
    id: 'liters_to_gallons',
    name: 'litersToGallons',
    displayName: 'Liters to Gallons',
    description: 'Converts liters to US gallons',
    category: 'Unit Conversions',
    params: [{ name: 'liters', label: 'Liters', placeholder: '20' }],
    code: `/**
 * Convert liters to US gallons
 * @param {number} liters - Volume in liters
 * @returns {number} Volume in gallons
 */
function litersToGallons(liters) {
  return Math.round(Number(liters) / 3.78541 * 100) / 100;
}`,
  },
  {
    id: 'lbs_to_kg',
    name: 'lbsToKg',
    displayName: 'Pounds to Kilograms',
    description: 'Converts pounds to kilograms',
    category: 'Unit Conversions',
    params: [{ name: 'lbs', label: 'Pounds', placeholder: '150' }],
    code: `/**
 * Convert pounds to kilograms
 * @param {number} lbs - Weight in pounds
 * @returns {number} Weight in kilograms
 */
function lbsToKg(lbs) {
  return Math.round(Number(lbs) * 0.453592 * 100) / 100;
}`,
  },
  {
    id: 'kg_to_lbs',
    name: 'kgToLbs',
    displayName: 'Kilograms to Pounds',
    description: 'Converts kilograms to pounds',
    category: 'Unit Conversions',
    params: [{ name: 'kg', label: 'Kilograms', placeholder: '70' }],
    code: `/**
 * Convert kilograms to pounds
 * @param {number} kg - Weight in kilograms
 * @returns {number} Weight in pounds
 */
function kgToLbs(kg) {
  return Math.round(Number(kg) / 0.453592 * 100) / 100;
}`,
  },
  {
    id: 'inches_to_cm',
    name: 'inchesToCm',
    displayName: 'Inches to Centimeters',
    description: 'Converts inches to centimeters',
    category: 'Unit Conversions',
    params: [{ name: 'inches', label: 'Inches', placeholder: '12' }],
    code: `/**
 * Convert inches to centimeters
 * @param {number} inches - Length in inches
 * @returns {number} Length in centimeters
 */
function inchesToCm(inches) {
  return Math.round(Number(inches) * 2.54 * 100) / 100;
}`,
  },
  {
    id: 'degrees_to_radians',
    name: 'degreesToRadians',
    displayName: 'Degrees to Radians',
    description: 'Converts degrees to radians',
    category: 'Unit Conversions',
    params: [{ name: 'degrees', label: 'Degrees', placeholder: '90' }],
    code: `/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function degreesToRadians(degrees) {
  return Math.round(Number(degrees) * Math.PI / 180 * 100000) / 100000;
}`,
  },
  {
    id: 'cubic_yards_to_tons',
    name: 'cubicYardsToTons',
    displayName: 'Cubic Yards to Tons',
    description: 'Estimates weight in tons from cubic yards (configurable density factor)',
    category: 'Unit Conversions',
    params: [
      { name: 'cubicYards', label: 'Cubic Yards', placeholder: '10' },
      { name: 'density', label: 'Tons per CY (default 1.4)', placeholder: '1.4' },
    ],
    code: `/**
 * Convert cubic yards to tons with configurable density
 * @param {number} cubicYards - Volume in cubic yards
 * @param {number} density - Tons per cubic yard (soil ~1.4, gravel ~1.5, sand ~1.35)
 * @returns {number} Weight in tons
 */
function cubicYardsToTons(cubicYards, density) {
  var d = density ? Number(density) : 1.4;
  return Math.round(Number(cubicYards) * d * 100) / 100;
}`,
  },

  // ---- Scoring (additional) ----
  {
    id: 'grade_letter',
    name: 'gradeLetter',
    displayName: 'Score to Letter Grade',
    description: 'Converts a numeric score (0-100) to a letter grade (A, B, C, D, F)',
    category: 'Scoring',
    params: [{ name: 'score', label: 'Numeric score', placeholder: '85' }],
    code: `/**
 * Convert a numeric score to a letter grade
 * @param {number} score - Score (0-100)
 * @returns {string} Letter grade
 */
function gradeLetter(score) {
  var s = Number(score);
  if (s >= 93) return 'A';
  if (s >= 90) return 'A-';
  if (s >= 87) return 'B+';
  if (s >= 83) return 'B';
  if (s >= 80) return 'B-';
  if (s >= 77) return 'C+';
  if (s >= 73) return 'C';
  if (s >= 70) return 'C-';
  if (s >= 67) return 'D+';
  if (s >= 60) return 'D';
  return 'F';
}`,
  },
  {
    id: 'risk_level',
    name: 'riskLevel',
    displayName: 'Risk Level (Likelihood × Severity)',
    description: 'Calculates risk level from likelihood and severity ratings (1-5 each)',
    category: 'Scoring',
    params: [
      { name: 'likelihood', label: 'Likelihood (1-5)', placeholder: '3' },
      { name: 'severity', label: 'Severity (1-5)', placeholder: '4' },
    ],
    code: `/**
 * Calculate risk level from likelihood × severity
 * @param {number} likelihood - Likelihood rating (1-5)
 * @param {number} severity - Severity rating (1-5)
 * @returns {string} Risk level with score
 */
function riskLevel(likelihood, severity) {
  var score = Number(likelihood) * Number(severity);
  var level;
  if (score >= 20) level = 'Critical';
  else if (score >= 12) level = 'High';
  else if (score >= 6) level = 'Medium';
  else level = 'Low';
  return level + ' (' + score + ')';
}`,
  },
  {
    id: 'condition_rating',
    name: 'conditionRating',
    displayName: 'Asset Condition Rating',
    description: 'Maps a 1-5 numeric rating to a standard asset condition label',
    category: 'Scoring',
    params: [{ name: 'rating', label: 'Rating (1-5)', placeholder: '3' }],
    code: `/**
 * Map a 1-5 rating to an asset condition label
 * @param {number} rating - Numeric rating
 * @returns {string} Condition label
 */
function conditionRating(rating) {
  var labels = { 1: 'Failed', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Excellent' };
  return labels[Number(rating)] || 'Unknown';
}`,
  },
  {
    id: 'priority_level',
    name: 'priorityLevel',
    displayName: 'Priority Classification',
    description: 'Classifies urgency and importance into priority levels (Eisenhower matrix)',
    category: 'Scoring',
    params: [
      { name: 'urgent', label: 'Is urgent? (yes/no)', placeholder: 'yes' },
      { name: 'important', label: 'Is important? (yes/no)', placeholder: 'yes' },
    ],
    code: `/**
 * Classify priority using urgency and importance
 * @param {string} urgent - "yes" or "no"
 * @param {string} important - "yes" or "no"
 * @returns {string} Priority level
 */
function priorityLevel(urgent, important) {
  var u = String(urgent).toLowerCase() === 'yes';
  var i = String(important).toLowerCase() === 'yes';
  if (u && i) return 'P1 - Critical';
  if (!u && i) return 'P2 - Plan';
  if (u && !i) return 'P3 - Delegate';
  return 'P4 - Low Priority';
}`,
  },
  {
    id: 'completeness_score',
    name: 'completenessScore',
    displayName: 'Form Completeness %',
    description: 'Calculates percentage of non-empty fields out of total fields provided',
    category: 'Scoring',
    params: [
      { name: 'a', label: 'Field 1', placeholder: 'some value' },
      { name: 'b', label: 'Field 2', placeholder: '' },
      { name: 'c', label: 'Field 3', placeholder: 'filled' },
      { name: 'd', label: 'Field 4', placeholder: '' },
      { name: 'e', label: 'Field 5', placeholder: 'data' },
    ],
    code: `/**
 * Calculate form completeness percentage
 * @returns {number} Percentage of non-empty fields
 */
function completenessScore(a, b, c, d, e) {
  var fields = [a, b, c, d, e];
  var total = fields.length;
  var filled = 0;
  for (var i = 0; i < fields.length; i++) {
    if (fields[i] !== '' && fields[i] !== null && fields[i] !== undefined) filled++;
  }
  return Math.round(filled / total * 100);
}`,
  },

  // ---- GIS & Coordinates (additional) ----
  {
    id: 'utm_zone',
    name: 'utmZone',
    displayName: 'UTM Zone from Longitude',
    description: 'Determines the UTM zone number from a longitude value',
    category: 'GIS & Coordinates',
    params: [{ name: 'lng', label: 'Longitude', placeholder: '-77.0365' }],
    code: `/**
 * Determine UTM zone from longitude
 * @param {number} lng - Longitude in decimal degrees
 * @returns {number} UTM zone number (1-60)
 */
function utmZone(lng) {
  return Math.floor((Number(lng) + 180) / 6) + 1;
}`,
  },
  {
    id: 'bearing',
    name: 'bearing',
    displayName: 'Bearing Between Points',
    description: 'Calculates compass bearing (0-360°) from point A to point B',
    category: 'GIS & Coordinates',
    params: [
      { name: 'lat1', label: 'Point A Lat', placeholder: '38.8977' },
      { name: 'lng1', label: 'Point A Lng', placeholder: '-77.0365' },
      { name: 'lat2', label: 'Point B Lat', placeholder: '40.7128' },
      { name: 'lng2', label: 'Point B Lng', placeholder: '-74.0060' },
    ],
    code: `/**
 * Calculate compass bearing from point A to point B
 * @returns {number} Bearing in degrees (0-360)
 */
function bearing(lat1, lng1, lat2, lng2) {
  var dLng = (Number(lng2) - Number(lng1)) * Math.PI / 180;
  var la1 = Number(lat1) * Math.PI / 180;
  var la2 = Number(lat2) * Math.PI / 180;
  var y = Math.sin(dLng) * Math.cos(la2);
  var x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  var brng = Math.atan2(y, x) * 180 / Math.PI;
  return Math.round((brng + 360) % 360 * 100) / 100;
}`,
  },
  {
    id: 'compass_direction',
    name: 'compassDirection',
    displayName: 'Compass Direction Label',
    description: 'Converts a bearing (0-360) to a compass direction (N, NE, E, SE, etc.)',
    category: 'GIS & Coordinates',
    params: [{ name: 'degrees', label: 'Bearing (degrees)', placeholder: '225' }],
    code: `/**
 * Convert bearing to compass direction
 * @param {number} degrees - Bearing in degrees (0-360)
 * @returns {string} Compass direction (N, NE, E, SE, S, SW, W, NW)
 */
function compassDirection(degrees) {
  var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  var d = ((Number(degrees) % 360) + 360) % 360;
  var idx = Math.round(d / 45) % 8;
  return dirs[idx];
}`,
  },
  {
    id: 'midpoint',
    name: 'midpoint',
    displayName: 'Midpoint of Two Points',
    description: 'Calculates the geographic midpoint between two coordinates',
    category: 'GIS & Coordinates',
    params: [
      { name: 'lat1', label: 'Point 1 Lat', placeholder: '38.8977' },
      { name: 'lng1', label: 'Point 1 Lng', placeholder: '-77.0365' },
      { name: 'lat2', label: 'Point 2 Lat', placeholder: '40.7128' },
      { name: 'lng2', label: 'Point 2 Lng', placeholder: '-74.0060' },
    ],
    code: `/**
 * Calculate geographic midpoint between two coordinates
 * @returns {string} Midpoint as "lat, lng"
 */
function midpoint(lat1, lng1, lat2, lng2) {
  var la1 = Number(lat1) * Math.PI / 180;
  var la2 = Number(lat2) * Math.PI / 180;
  var lo1 = Number(lng1) * Math.PI / 180;
  var dLng = (Number(lng2) - Number(lng1)) * Math.PI / 180;
  var Bx = Math.cos(la2) * Math.cos(dLng);
  var By = Math.cos(la2) * Math.sin(dLng);
  var lat = Math.atan2(Math.sin(la1) + Math.sin(la2), Math.sqrt((Math.cos(la1) + Bx) * (Math.cos(la1) + Bx) + By * By));
  var lng = lo1 + Math.atan2(By, Math.cos(la1) + Bx);
  return (Math.round(lat * 180 / Math.PI * 100000) / 100000) + ', ' + (Math.round(lng * 180 / Math.PI * 100000) / 100000);
}`,
  },
  {
    id: 'distance_miles',
    name: 'distanceMiles',
    displayName: 'Distance in Miles',
    description: 'Calculates distance in miles between two lat/lng points',
    category: 'GIS & Coordinates',
    params: [
      { name: 'lat1', label: 'Point 1 Lat', placeholder: '38.8977' },
      { name: 'lng1', label: 'Point 1 Lng', placeholder: '-77.0365' },
      { name: 'lat2', label: 'Point 2 Lat', placeholder: '40.7128' },
      { name: 'lng2', label: 'Point 2 Lng', placeholder: '-74.0060' },
    ],
    code: `/**
 * Distance between two points in miles (Haversine)
 * @returns {number} Distance in miles
 */
function distanceMiles(lat1, lng1, lat2, lng2) {
  var R = 3958.8;
  var dLat = (Number(lat2) - Number(lat1)) * Math.PI / 180;
  var dLng = (Number(lng2) - Number(lng1)) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(Number(lat1) * Math.PI / 180) * Math.cos(Number(lat2) * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}`,
  },

  // ---- Environmental & Field Science ----
  {
    id: 'heat_index',
    name: 'heatIndex',
    displayName: 'Heat Index',
    description: 'Calculates heat index (feels-like temperature) from temp and humidity',
    category: 'Environmental',
    params: [
      { name: 'tempF', label: 'Temperature (°F)', placeholder: '95' },
      { name: 'humidity', label: 'Relative humidity (%)', placeholder: '50' },
    ],
    code: `/**
 * Calculate heat index (feels-like temperature)
 * Uses the Rothfusz regression equation
 * @param {number} tempF - Temperature in Fahrenheit
 * @param {number} humidity - Relative humidity (%)
 * @returns {number} Heat index in °F
 */
function heatIndex(tempF, humidity) {
  var T = Number(tempF), R = Number(humidity);
  if (T < 80) return T;
  var HI = -42.379 + 2.04901523*T + 10.14333127*R
    - 0.22475541*T*R - 0.00683783*T*T - 0.05481717*R*R
    + 0.00122874*T*T*R + 0.00085282*T*R*R - 0.00000199*T*T*R*R;
  return Math.round(HI * 10) / 10;
}`,
  },
  {
    id: 'wind_chill',
    name: 'windChill',
    displayName: 'Wind Chill',
    description: 'Calculates wind chill temperature from air temp and wind speed',
    category: 'Environmental',
    params: [
      { name: 'tempF', label: 'Temperature (°F)', placeholder: '20' },
      { name: 'windMph', label: 'Wind speed (mph)', placeholder: '15' },
    ],
    code: `/**
 * Calculate wind chill temperature (NWS formula)
 * @param {number} tempF - Air temperature in Fahrenheit
 * @param {number} windMph - Wind speed in mph
 * @returns {number} Wind chill in °F
 */
function windChill(tempF, windMph) {
  var T = Number(tempF), V = Number(windMph);
  if (T > 50 || V < 3) return T;
  var WC = 35.74 + 0.6215*T - 35.75*Math.pow(V, 0.16) + 0.4275*T*Math.pow(V, 0.16);
  return Math.round(WC * 10) / 10;
}`,
  },
  {
    id: 'dew_point',
    name: 'dewPoint',
    displayName: 'Dew Point',
    description: 'Calculates dew point temperature from air temp and relative humidity',
    category: 'Environmental',
    params: [
      { name: 'tempC', label: 'Temperature (°C)', placeholder: '25' },
      { name: 'humidity', label: 'Relative humidity (%)', placeholder: '60' },
    ],
    code: `/**
 * Calculate dew point temperature (Magnus formula)
 * @param {number} tempC - Temperature in Celsius
 * @param {number} humidity - Relative humidity (%)
 * @returns {number} Dew point in °C
 */
function dewPoint(tempC, humidity) {
  var T = Number(tempC), RH = Number(humidity);
  var a = 17.27, b = 237.7;
  var alpha = a * T / (b + T) + Math.log(RH / 100);
  var dp = b * alpha / (a - alpha);
  return Math.round(dp * 10) / 10;
}`,
  },
  {
    id: 'slope_percent',
    name: 'slopePercent',
    displayName: 'Slope Percentage',
    description: 'Calculates slope percentage from rise and run measurements',
    category: 'Environmental',
    params: [
      { name: 'rise', label: 'Rise (vertical)', placeholder: '10' },
      { name: 'run', label: 'Run (horizontal)', placeholder: '100' },
    ],
    code: `/**
 * Calculate slope as a percentage
 * @param {number} rise - Vertical rise
 * @param {number} run - Horizontal run
 * @returns {number} Slope percentage
 */
function slopePercent(rise, run) {
  var r = Number(run);
  if (r === 0) return 0;
  return Math.round(Number(rise) / r * 10000) / 100;
}`,
  },
  {
    id: 'slope_degrees',
    name: 'slopeDegrees',
    displayName: 'Slope in Degrees',
    description: 'Calculates slope angle in degrees from rise and run',
    category: 'Environmental',
    params: [
      { name: 'rise', label: 'Rise (vertical)', placeholder: '10' },
      { name: 'run', label: 'Run (horizontal)', placeholder: '100' },
    ],
    code: `/**
 * Calculate slope angle in degrees
 * @param {number} rise - Vertical rise
 * @param {number} run - Horizontal run
 * @returns {number} Slope in degrees
 */
function slopeDegrees(rise, run) {
  var r = Number(run);
  if (r === 0) return 90;
  return Math.round(Math.atan(Number(rise) / r) * 180 / Math.PI * 100) / 100;
}`,
  },
  {
    id: 'soil_volume',
    name: 'soilVolume',
    displayName: 'Soil Excavation Volume',
    description: 'Calculates excavation volume in cubic yards from length, width, depth (feet)',
    category: 'Environmental',
    params: [
      { name: 'lengthFt', label: 'Length (ft)', placeholder: '20' },
      { name: 'widthFt', label: 'Width (ft)', placeholder: '10' },
      { name: 'depthFt', label: 'Depth (ft)', placeholder: '3' },
    ],
    code: `/**
 * Calculate excavation volume in cubic yards
 * @param {number} lengthFt - Length in feet
 * @param {number} widthFt - Width in feet
 * @param {number} depthFt - Depth in feet
 * @returns {number} Volume in cubic yards
 */
function soilVolume(lengthFt, widthFt, depthFt) {
  var cuFt = Number(lengthFt) * Number(widthFt) * Number(depthFt);
  return Math.round(cuFt / 27 * 100) / 100;
}`,
  },
  {
    id: 'dbh_circumference',
    name: 'dbhFromCircumference',
    displayName: 'Tree DBH from Circumference',
    description: 'Calculates Diameter at Breast Height (DBH) from trunk circumference',
    category: 'Environmental',
    params: [{ name: 'circumference', label: 'Circumference (inches)', placeholder: '31.4' }],
    code: `/**
 * Calculate tree DBH from circumference
 * @param {number} circumference - Trunk circumference in inches
 * @returns {number} DBH in inches
 */
function dbhFromCircumference(circumference) {
  return Math.round(Number(circumference) / Math.PI * 10) / 10;
}`,
  },
  {
    id: 'tree_basal_area',
    name: 'basalArea',
    displayName: 'Tree Basal Area',
    description: 'Calculates basal area (sq ft) from DBH in inches',
    category: 'Environmental',
    params: [{ name: 'dbh', label: 'DBH (inches)', placeholder: '10' }],
    code: `/**
 * Calculate tree basal area from DBH
 * @param {number} dbh - Diameter at breast height (inches)
 * @returns {number} Basal area in square feet
 */
function basalArea(dbh) {
  var d = Number(dbh);
  return Math.round(0.005454 * d * d * 10000) / 10000;
}`,
  },
  {
    id: 'flow_rate',
    name: 'flowRate',
    displayName: 'Pipe Flow Rate (Q=VA)',
    description: 'Calculates volumetric flow rate from velocity and pipe diameter',
    category: 'Environmental',
    params: [
      { name: 'velocity', label: 'Velocity (ft/s)', placeholder: '5' },
      { name: 'diameter', label: 'Pipe diameter (inches)', placeholder: '8' },
    ],
    code: `/**
 * Calculate pipe flow rate (Q = V × A)
 * @param {number} velocity - Flow velocity (ft/s)
 * @param {number} diameter - Pipe inner diameter (inches)
 * @returns {number} Flow rate in gallons per minute (GPM)
 */
function flowRate(velocity, diameter) {
  var d = Number(diameter) / 12; // convert to feet
  var area = Math.PI * (d / 2) * (d / 2); // sq ft
  var cfs = Number(velocity) * area; // cubic ft/s
  var gpm = cfs * 448.831; // convert to GPM
  return Math.round(gpm * 100) / 100;
}`,
  },
  {
    id: 'noise_combined',
    name: 'combineDecibels',
    displayName: 'Combine Decibel Levels',
    description: 'Calculates the combined decibel level of two noise sources',
    category: 'Environmental',
    params: [
      { name: 'db1', label: 'Source 1 (dB)', placeholder: '70' },
      { name: 'db2', label: 'Source 2 (dB)', placeholder: '73' },
    ],
    code: `/**
 * Combine two decibel levels
 * @param {number} db1 - First decibel level
 * @param {number} db2 - Second decibel level
 * @returns {number} Combined decibel level
 */
function combineDecibels(db1, db2) {
  var a = Number(db1), b = Number(db2);
  return Math.round(10 * Math.log10(Math.pow(10, a/10) + Math.pow(10, b/10)) * 10) / 10;
}`,
  },

  // ---- Construction & Engineering ----
  {
    id: 'concrete_volume',
    name: 'concreteVolume',
    displayName: 'Concrete Volume (CY)',
    description: 'Calculates concrete needed in cubic yards for a slab (length × width × thickness)',
    category: 'Construction',
    params: [
      { name: 'lengthFt', label: 'Length (ft)', placeholder: '20' },
      { name: 'widthFt', label: 'Width (ft)', placeholder: '20' },
      { name: 'thickIn', label: 'Thickness (inches)', placeholder: '4' },
    ],
    code: `/**
 * Calculate concrete volume in cubic yards for a slab
 * @param {number} lengthFt - Slab length in feet
 * @param {number} widthFt - Slab width in feet
 * @param {number} thickIn - Slab thickness in inches
 * @returns {number} Cubic yards of concrete needed
 */
function concreteVolume(lengthFt, widthFt, thickIn) {
  var cuFt = Number(lengthFt) * Number(widthFt) * (Number(thickIn) / 12);
  return Math.round(cuFt / 27 * 100) / 100;
}`,
  },
  {
    id: 'asphalt_tonnage',
    name: 'asphaltTonnage',
    displayName: 'Asphalt Tonnage',
    description: 'Estimates tons of asphalt needed for paving (length × width × thickness)',
    category: 'Construction',
    params: [
      { name: 'lengthFt', label: 'Length (ft)', placeholder: '100' },
      { name: 'widthFt', label: 'Width (ft)', placeholder: '24' },
      { name: 'thickIn', label: 'Thickness (inches)', placeholder: '2' },
    ],
    code: `/**
 * Estimate asphalt tonnage for paving
 * Uses 145 lbs/cu ft (standard HMA density)
 * @param {number} lengthFt - Length in feet
 * @param {number} widthFt - Width in feet
 * @param {number} thickIn - Thickness in inches
 * @returns {number} Estimated tons of asphalt
 */
function asphaltTonnage(lengthFt, widthFt, thickIn) {
  var cuFt = Number(lengthFt) * Number(widthFt) * (Number(thickIn) / 12);
  var lbs = cuFt * 145;
  return Math.round(lbs / 2000 * 100) / 100;
}`,
  },
  {
    id: 'paint_coverage',
    name: 'paintCoverage',
    displayName: 'Paint Coverage (Gallons)',
    description: 'Estimates gallons of paint needed for a surface area (350 sq ft per gallon)',
    category: 'Construction',
    params: [
      { name: 'sqFt', label: 'Surface area (sq ft)', placeholder: '1200' },
      { name: 'coats', label: 'Number of coats', placeholder: '2' },
    ],
    code: `/**
 * Estimate gallons of paint needed
 * @param {number} sqFt - Surface area in square feet
 * @param {number} coats - Number of coats
 * @returns {number} Gallons of paint needed
 */
function paintCoverage(sqFt, coats) {
  var coverage = 350; // sq ft per gallon
  return Math.round(Number(sqFt) * Number(coats) / coverage * 10) / 10;
}`,
  },
  {
    id: 'pipe_length',
    name: 'pipeLength',
    displayName: 'Pipe/Trench Length',
    description: 'Calculates linear feet of pipe needed between two stations',
    category: 'Construction',
    params: [
      { name: 'stationStart', label: 'Start station (e.g. 10+50)', placeholder: '10+50' },
      { name: 'stationEnd', label: 'End station (e.g. 15+25)', placeholder: '15+25' },
    ],
    code: `/**
 * Calculate linear feet between two stations
 * @param {string} stationStart - Start station (e.g. "10+50")
 * @param {string} stationEnd - End station (e.g. "15+25")
 * @returns {number} Distance in linear feet
 */
function pipeLength(stationStart, stationEnd) {
  function toFeet(sta) {
    var parts = String(sta).split('+');
    return Number(parts[0]) * 100 + Number(parts[1] || 0);
  }
  return Math.abs(toFeet(stationEnd) - toFeet(stationStart));
}`,
  },
  {
    id: 'rebar_weight',
    name: 'rebarWeight',
    displayName: 'Rebar Weight',
    description: 'Calculates weight of rebar in pounds from bar size and total length',
    category: 'Construction',
    params: [
      { name: 'barSize', label: 'Bar size (#3-#18)', placeholder: '4' },
      { name: 'totalFeet', label: 'Total linear feet', placeholder: '100' },
    ],
    code: `/**
 * Calculate rebar weight from bar size and length
 * @param {number} barSize - Rebar bar size number (3-18)
 * @param {number} totalFeet - Total linear feet
 * @returns {number} Weight in pounds
 */
function rebarWeight(barSize, totalFeet) {
  // Weight per foot for standard rebar sizes (lbs/ft)
  var weights = {3:0.376, 4:0.668, 5:1.043, 6:1.502, 7:2.044, 8:2.670,
    9:3.400, 10:4.303, 11:5.313, 14:7.650, 18:13.600};
  var w = weights[Number(barSize)] || 0;
  return Math.round(w * Number(totalFeet) * 100) / 100;
}`,
  },
  {
    id: 'stair_riser',
    name: 'stairRiser',
    displayName: 'Stair Riser Count',
    description: 'Calculates the number of risers and riser height for a given total rise',
    category: 'Construction',
    params: [
      { name: 'totalRise', label: 'Total rise (inches)', placeholder: '108' },
      { name: 'idealRiser', label: 'Ideal riser height (inches)', placeholder: '7.5' },
    ],
    code: `/**
 * Calculate stair riser count and actual height
 * @param {number} totalRise - Total rise in inches
 * @param {number} idealRiser - Ideal riser height in inches
 * @returns {string} "N risers at X.XX inches each"
 */
function stairRiser(totalRise, idealRiser) {
  var rise = Number(totalRise);
  var ideal = Number(idealRiser) || 7.5;
  var count = Math.round(rise / ideal);
  var actual = Math.round(rise / count * 100) / 100;
  return count + ' risers at ' + actual + '" each';
}`,
  },

  // ---- Water & Wastewater ----
  {
    id: 'pipe_volume',
    name: 'pipeVolume',
    displayName: 'Pipe Volume (Gallons)',
    description: 'Calculates the volume of water in a pipe segment in gallons',
    category: 'Water & Utilities',
    params: [
      { name: 'diameterIn', label: 'Diameter (inches)', placeholder: '8' },
      { name: 'lengthFt', label: 'Length (feet)', placeholder: '100' },
    ],
    code: `/**
 * Calculate water volume in a pipe segment
 * @param {number} diameterIn - Pipe diameter in inches
 * @param {number} lengthFt - Pipe length in feet
 * @returns {number} Volume in gallons
 */
function pipeVolume(diameterIn, lengthFt) {
  var r = (Number(diameterIn) / 2) / 12; // radius in feet
  var vol = Math.PI * r * r * Number(lengthFt); // cubic feet
  return Math.round(vol * 7.48052 * 100) / 100; // gallons
}`,
  },
  {
    id: 'chlorine_dosage',
    name: 'chlorineDosage',
    displayName: 'Chlorine Dosage (lbs)',
    description: 'Calculates pounds of chlorine needed for a given volume and dose',
    category: 'Water & Utilities',
    params: [
      { name: 'gallons', label: 'Volume (gallons)', placeholder: '100000' },
      { name: 'doseMgL', label: 'Dose (mg/L)', placeholder: '2' },
    ],
    code: `/**
 * Calculate chlorine dosage in pounds
 * @param {number} gallons - Water volume in gallons
 * @param {number} doseMgL - Desired dose in mg/L (ppm)
 * @returns {number} Pounds of chlorine needed
 */
function chlorineDosage(gallons, doseMgL) {
  // lbs = gallons × dose(mg/L) × 8.34 / 1000000
  return Math.round(Number(gallons) * Number(doseMgL) * 8.34 / 1000000 * 10000) / 10000;
}`,
  },
  {
    id: 'detention_time',
    name: 'detentionTime',
    displayName: 'Detention Time',
    description: 'Calculates detention/retention time in hours from volume and flow',
    category: 'Water & Utilities',
    params: [
      { name: 'volumeGal', label: 'Tank volume (gallons)', placeholder: '50000' },
      { name: 'flowGpm', label: 'Flow rate (GPM)', placeholder: '200' },
    ],
    code: `/**
 * Calculate detention time in hours
 * @param {number} volumeGal - Tank volume in gallons
 * @param {number} flowGpm - Flow rate in gallons per minute
 * @returns {number} Detention time in hours
 */
function detentionTime(volumeGal, flowGpm) {
  var f = Number(flowGpm);
  if (f === 0) return 0;
  return Math.round(Number(volumeGal) / f / 60 * 100) / 100;
}`,
  },
  {
    id: 'manhole_depth',
    name: 'manholeDepth',
    displayName: 'Manhole Invert Depth',
    description: 'Calculates invert depth from rim elevation and invert elevation',
    category: 'Water & Utilities',
    params: [
      { name: 'rimElev', label: 'Rim elevation (ft)', placeholder: '520.5' },
      { name: 'invertElev', label: 'Invert elevation (ft)', placeholder: '512.3' },
    ],
    code: `/**
 * Calculate manhole depth from rim to invert
 * @param {number} rimElev - Rim elevation
 * @param {number} invertElev - Invert elevation
 * @returns {number} Depth in feet
 */
function manholeDepth(rimElev, invertElev) {
  return Math.round((Number(rimElev) - Number(invertElev)) * 100) / 100;
}`,
  },
  {
    id: 'pipe_slope',
    name: 'pipeSlope',
    displayName: 'Pipe Slope (%)',
    description: 'Calculates pipe slope from upstream/downstream invert elevations and length',
    category: 'Water & Utilities',
    params: [
      { name: 'upstreamElev', label: 'Upstream invert (ft)', placeholder: '515.2' },
      { name: 'downstreamElev', label: 'Downstream invert (ft)', placeholder: '514.0' },
      { name: 'lengthFt', label: 'Pipe length (ft)', placeholder: '300' },
    ],
    code: `/**
 * Calculate pipe slope percentage
 * @param {number} upstreamElev - Upstream invert elevation
 * @param {number} downstreamElev - Downstream invert elevation
 * @param {number} lengthFt - Pipe length in feet
 * @returns {number} Slope percentage
 */
function pipeSlope(upstreamElev, downstreamElev, lengthFt) {
  var len = Number(lengthFt);
  if (len === 0) return 0;
  var drop = Number(upstreamElev) - Number(downstreamElev);
  return Math.round(drop / len * 10000) / 100;
}`,
  },

  // ---- Inspection & Compliance ----
  {
    id: 'days_until_due',
    name: 'daysUntilDue',
    displayName: 'Days Until Due',
    description: 'Calculates days remaining until a due date (negative = overdue)',
    category: 'Inspection',
    params: [{ name: 'dueDate', label: 'Due date', placeholder: '2024-12-31' }],
    code: `/**
 * Calculate days remaining until a due date
 * @param {string} dueDate - Due date (YYYY-MM-DD)
 * @returns {number} Days remaining (negative = overdue)
 */
function daysUntilDue(dueDate) {
  var due = new Date(dueDate);
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}`,
  },
  {
    id: 'overdue_status',
    name: 'overdueStatus',
    displayName: 'Overdue Status Label',
    description: 'Returns status text based on how many days until/past due date',
    category: 'Inspection',
    params: [{ name: 'dueDate', label: 'Due date', placeholder: '2024-12-31' }],
    code: `/**
 * Get overdue status label
 * @param {string} dueDate - Due date
 * @returns {string} Status text
 */
function overdueStatus(dueDate) {
  var due = new Date(dueDate);
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  var days = Math.round((due - today) / 86400000);
  if (days < 0) return 'Overdue by ' + Math.abs(days) + ' days';
  if (days === 0) return 'Due today';
  if (days <= 7) return 'Due in ' + days + ' days';
  if (days <= 30) return 'Due in ' + Math.round(days / 7) + ' weeks';
  return 'Due in ' + Math.round(days / 30) + ' months';
}`,
  },
  {
    id: 'next_inspection_date',
    name: 'nextInspection',
    displayName: 'Next Inspection Date',
    description: 'Calculates the next inspection date based on frequency (days)',
    category: 'Inspection',
    params: [
      { name: 'lastDate', label: 'Last inspection date', placeholder: '2024-01-15' },
      { name: 'frequencyDays', label: 'Frequency (days)', placeholder: '90' },
    ],
    code: `/**
 * Calculate next inspection date
 * @param {string} lastDate - Last inspection date
 * @param {number} frequencyDays - Inspection frequency in days
 * @returns {string} Next inspection date (YYYY-MM-DD)
 */
function nextInspection(lastDate, frequencyDays) {
  var d = new Date(lastDate);
  d.setDate(d.getDate() + Number(frequencyDays));
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}`,
  },
  {
    id: 'compliance_status',
    name: 'complianceStatus',
    displayName: 'Compliance Status',
    description: 'Determines compliance status from a checklist of pass/fail items',
    category: 'Inspection',
    params: [
      { name: 'passed', label: 'Items passed', placeholder: '8' },
      { name: 'total', label: 'Total items', placeholder: '10' },
      { name: 'threshold', label: 'Required pass % (0-100)', placeholder: '80' },
    ],
    code: `/**
 * Determine compliance status from checklist results
 * @param {number} passed - Number of items passed
 * @param {number} total - Total number of items
 * @param {number} threshold - Required pass percentage
 * @returns {string} Compliance status
 */
function complianceStatus(passed, total, threshold) {
  var t = Number(total);
  if (t === 0) return 'N/A';
  var pct = Number(passed) / t * 100;
  var req = Number(threshold);
  if (pct >= req) return 'Compliant (' + Math.round(pct) + '%)';
  return 'Non-Compliant (' + Math.round(pct) + '%)';
}`,
  },
  {
    id: 'deficiency_count_summary',
    name: 'deficiencySummary',
    displayName: 'Deficiency Summary',
    description: 'Summarizes counts of critical, major, and minor deficiencies',
    category: 'Inspection',
    params: [
      { name: 'critical', label: 'Critical count', placeholder: '0' },
      { name: 'major', label: 'Major count', placeholder: '2' },
      { name: 'minor', label: 'Minor count', placeholder: '5' },
    ],
    code: `/**
 * Summarize deficiency counts and overall status
 * @param {number} critical - Critical deficiency count
 * @param {number} major - Major deficiency count
 * @param {number} minor - Minor deficiency count
 * @returns {string} Summary text
 */
function deficiencySummary(critical, major, minor) {
  var c = Number(critical) || 0, m = Number(major) || 0, n = Number(minor) || 0;
  var total = c + m + n;
  if (total === 0) return 'No deficiencies found';
  var parts = [];
  if (c > 0) parts.push(c + ' critical');
  if (m > 0) parts.push(m + ' major');
  if (n > 0) parts.push(n + ' minor');
  var status = c > 0 ? 'FAIL' : m > 2 ? 'CONDITIONAL' : 'PASS';
  return status + ': ' + total + ' total (' + parts.join(', ') + ')';
}`,
  },

  // ---- Area & Volume Geometry ----
  {
    id: 'circle_area',
    name: 'circleArea',
    displayName: 'Circle Area',
    description: 'Calculates the area of a circle from its radius',
    category: 'Geometry',
    params: [{ name: 'radius', label: 'Radius', placeholder: '10' }],
    code: `/**
 * Calculate area of a circle
 * @param {number} radius - Circle radius
 * @returns {number} Area
 */
function circleArea(radius) {
  return Math.round(Math.PI * Math.pow(Number(radius), 2) * 100) / 100;
}`,
  },
  {
    id: 'triangle_area',
    name: 'triangleArea',
    displayName: 'Triangle Area',
    description: 'Calculates the area of a triangle from base and height',
    category: 'Geometry',
    params: [
      { name: 'base', label: 'Base', placeholder: '10' },
      { name: 'height', label: 'Height', placeholder: '8' },
    ],
    code: `/**
 * Calculate area of a triangle
 * @param {number} base - Base length
 * @param {number} height - Height
 * @returns {number} Area
 */
function triangleArea(base, height) {
  return Math.round(Number(base) * Number(height) / 2 * 100) / 100;
}`,
  },
  {
    id: 'trapezoid_area',
    name: 'trapezoidArea',
    displayName: 'Trapezoid Area',
    description: 'Calculates area of a trapezoid from parallel sides and height',
    category: 'Geometry',
    params: [
      { name: 'a', label: 'Side A (top)', placeholder: '8' },
      { name: 'b', label: 'Side B (bottom)', placeholder: '12' },
      { name: 'h', label: 'Height', placeholder: '5' },
    ],
    code: `/**
 * Calculate area of a trapezoid
 * @param {number} a - Length of one parallel side
 * @param {number} b - Length of other parallel side
 * @param {number} h - Height between parallel sides
 * @returns {number} Area
 */
function trapezoidArea(a, b, h) {
  return Math.round((Number(a) + Number(b)) / 2 * Number(h) * 100) / 100;
}`,
  },
  {
    id: 'cylinder_volume',
    name: 'cylinderVolume',
    displayName: 'Cylinder Volume',
    description: 'Calculates the volume of a cylinder from radius and height',
    category: 'Geometry',
    params: [
      { name: 'radius', label: 'Radius', placeholder: '5' },
      { name: 'height', label: 'Height', placeholder: '10' },
    ],
    code: `/**
 * Calculate volume of a cylinder
 * @param {number} radius - Cylinder radius
 * @param {number} height - Cylinder height
 * @returns {number} Volume
 */
function cylinderVolume(radius, height) {
  return Math.round(Math.PI * Math.pow(Number(radius), 2) * Number(height) * 100) / 100;
}`,
  },
  {
    id: 'pythagorean',
    name: 'hypotenuse',
    displayName: 'Hypotenuse (Pythagorean)',
    description: 'Calculates the hypotenuse from two sides of a right triangle',
    category: 'Geometry',
    params: [
      { name: 'a', label: 'Side A', placeholder: '3' },
      { name: 'b', label: 'Side B', placeholder: '4' },
    ],
    code: `/**
 * Calculate hypotenuse of a right triangle
 * @param {number} a - Side A length
 * @param {number} b - Side B length
 * @returns {number} Hypotenuse length
 */
function hypotenuse(a, b) {
  return Math.round(Math.sqrt(Math.pow(Number(a), 2) + Math.pow(Number(b), 2)) * 100) / 100;
}`,
  },

  // ---- Health & Safety ----
  {
    id: 'bmi',
    name: 'bmi',
    displayName: 'Body Mass Index (BMI)',
    description: 'Calculates BMI from weight (lbs) and height (inches)',
    category: 'Health & Safety',
    params: [
      { name: 'weightLbs', label: 'Weight (lbs)', placeholder: '170' },
      { name: 'heightIn', label: 'Height (inches)', placeholder: '70' },
    ],
    code: `/**
 * Calculate Body Mass Index
 * @param {number} weightLbs - Weight in pounds
 * @param {number} heightIn - Height in inches
 * @returns {number} BMI value
 */
function bmi(weightLbs, heightIn) {
  var h = Number(heightIn);
  if (h === 0) return 0;
  return Math.round(Number(weightLbs) / (h * h) * 703 * 10) / 10;
}`,
  },
  {
    id: 'bmi_category',
    name: 'bmiCategory',
    displayName: 'BMI Category',
    description: 'Returns the BMI classification (Underweight, Normal, Overweight, Obese)',
    category: 'Health & Safety',
    params: [{ name: 'bmiVal', label: 'BMI value', placeholder: '24.5' }],
    code: `/**
 * Get BMI category label
 * @param {number} bmiVal - BMI value
 * @returns {string} Category label
 */
function bmiCategory(bmiVal) {
  var b = Number(bmiVal);
  if (b < 18.5) return 'Underweight';
  if (b < 25) return 'Normal';
  if (b < 30) return 'Overweight';
  return 'Obese';
}`,
  },
  {
    id: 'noise_exposure',
    name: 'noiseExposure',
    displayName: 'Noise Exposure Check',
    description: 'Checks if noise level exceeds OSHA limits for a given duration',
    category: 'Health & Safety',
    params: [
      { name: 'decibelLevel', label: 'Noise level (dBA)', placeholder: '90' },
      { name: 'hoursExposed', label: 'Duration (hours)', placeholder: '8' },
    ],
    code: `/**
 * Check noise exposure against OSHA limits
 * @param {number} decibelLevel - Noise level in dBA
 * @param {number} hoursExposed - Exposure duration in hours
 * @returns {string} Exposure assessment
 */
function noiseExposure(decibelLevel, hoursExposed) {
  var db = Number(decibelLevel);
  // OSHA permissible exposure: 8hr@90dB, halves every 5dB
  var allowedHours = 8 / Math.pow(2, (db - 90) / 5);
  var hours = Number(hoursExposed);
  if (hours <= allowedHours) return 'Within limits (' + Math.round(allowedHours * 10) / 10 + 'hr max)';
  return 'EXCEEDS LIMIT (' + Math.round(allowedHours * 10) / 10 + 'hr max at ' + db + 'dBA)';
}`,
  },
  {
    id: 'fall_distance',
    name: 'fallDistance',
    displayName: 'Fall Distance / Time',
    description: 'Calculates free-fall distance from height or fall time',
    category: 'Health & Safety',
    params: [
      { name: 'heightFt', label: 'Height (feet)', placeholder: '20' },
    ],
    code: `/**
 * Calculate free-fall time and impact speed
 * @param {number} heightFt - Fall height in feet
 * @returns {string} Fall time and impact speed
 */
function fallDistance(heightFt) {
  var h = Number(heightFt);
  var t = Math.sqrt(2 * h / 32.174); // time in seconds
  var v = 32.174 * t; // ft/s
  var mph = v * 0.6818;
  return Math.round(t * 100) / 100 + 's, ' + Math.round(mph * 10) / 10 + ' mph impact';
}`,
  },

  // ---- Lookup & Classification ----
  {
    id: 'us_state_name',
    name: 'stateName',
    displayName: 'US State Abbreviation → Name',
    description: 'Converts a 2-letter state abbreviation to the full state name',
    category: 'Lookup',
    params: [{ name: 'abbrev', label: 'State abbreviation', placeholder: 'CA' }],
    code: `/**
 * Convert US state abbreviation to full name
 * @param {string} abbrev - 2-letter state code
 * @returns {string} Full state name
 */
function stateName(abbrev) {
  var states = {AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
    CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
    HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',
    KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',
    MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',
    NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',
    NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
    OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
    SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
    VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
    DC:'District of Columbia'};
  return states[String(abbrev).toUpperCase()] || String(abbrev);
}`,
  },
  {
    id: 'classify_value',
    name: 'classify',
    displayName: 'Classify Value into Ranges',
    description: 'Classifies a numeric value into Low/Medium/High based on two thresholds',
    category: 'Lookup',
    params: [
      { name: 'value', label: 'Value', placeholder: '50' },
      { name: 'lowThreshold', label: 'Low/Medium cutoff', placeholder: '30' },
      { name: 'highThreshold', label: 'Medium/High cutoff', placeholder: '70' },
    ],
    code: `/**
 * Classify a value into Low, Medium, or High
 * @param {number} value - The value to classify
 * @param {number} lowThreshold - Below this = Low
 * @param {number} highThreshold - Above this = High
 * @returns {string} "Low", "Medium", or "High"
 */
function classify(value, lowThreshold, highThreshold) {
  var v = Number(value);
  if (v < Number(lowThreshold)) return 'Low';
  if (v > Number(highThreshold)) return 'High';
  return 'Medium';
}`,
  },
  {
    id: 'age_group',
    name: 'ageGroup',
    displayName: 'Age Group Classification',
    description: 'Classifies an age into standard demographic groups',
    category: 'Lookup',
    params: [{ name: 'age', label: 'Age', placeholder: '35' }],
    code: `/**
 * Classify age into demographic groups
 * @param {number} age - Age in years
 * @returns {string} Age group label
 */
function ageGroup(age) {
  var a = Number(age);
  if (a < 0) return 'Invalid';
  if (a < 2) return 'Infant';
  if (a < 13) return 'Child';
  if (a < 18) return 'Adolescent';
  if (a < 25) return 'Young Adult';
  if (a < 45) return 'Adult';
  if (a < 65) return 'Middle-Aged';
  return 'Senior';
}`,
  },
  {
    id: 'beaufort_scale',
    name: 'beaufortScale',
    displayName: 'Beaufort Wind Scale',
    description: 'Converts wind speed (mph) to Beaufort scale description',
    category: 'Lookup',
    params: [{ name: 'mph', label: 'Wind speed (mph)', placeholder: '25' }],
    code: `/**
 * Convert wind speed to Beaufort scale
 * @param {number} mph - Wind speed in mph
 * @returns {string} Beaufort description
 */
function beaufortScale(mph) {
  var v = Number(mph);
  if (v < 1) return '0 - Calm';
  if (v < 4) return '1 - Light Air';
  if (v < 8) return '2 - Light Breeze';
  if (v < 13) return '3 - Gentle Breeze';
  if (v < 19) return '4 - Moderate Breeze';
  if (v < 25) return '5 - Fresh Breeze';
  if (v < 32) return '6 - Strong Breeze';
  if (v < 39) return '7 - Near Gale';
  if (v < 47) return '8 - Gale';
  if (v < 55) return '9 - Strong Gale';
  if (v < 64) return '10 - Storm';
  if (v < 73) return '11 - Violent Storm';
  return '12 - Hurricane';
}`,
  },
  {
    id: 'soil_texture',
    name: 'soilTexture',
    displayName: 'Soil Texture Class',
    description: 'Estimates soil texture class from % sand and % clay',
    category: 'Lookup',
    params: [
      { name: 'sandPct', label: 'Sand %', placeholder: '40' },
      { name: 'clayPct', label: 'Clay %', placeholder: '20' },
    ],
    code: `/**
 * Estimate soil texture class from sand and clay percentages
 * Simplified USDA texture triangle
 * @param {number} sandPct - Percent sand
 * @param {number} clayPct - Percent clay
 * @returns {string} Soil texture class
 */
function soilTexture(sandPct, clayPct) {
  var sand = Number(sandPct), clay = Number(clayPct);
  var silt = 100 - sand - clay;
  if (clay >= 40) {
    if (sand >= 45) return 'Sandy Clay';
    if (silt >= 40) return 'Silty Clay';
    return 'Clay';
  }
  if (clay >= 27) {
    if (sand >= 20 && sand <= 45) return 'Clay Loam';
    if (sand < 20) return 'Silty Clay Loam';
    return 'Sandy Clay Loam';
  }
  if (silt >= 80) return 'Silt';
  if (silt >= 50) {
    if (clay < 12) return 'Silt Loam';
    return 'Silt Loam';
  }
  if (sand >= 85) return 'Sand';
  if (sand >= 70) return 'Loamy Sand';
  if (clay < 7 && silt < 50) return 'Sandy Loam';
  return 'Loam';
}`,
  },
  {
    id: 'ph_classification',
    name: 'phClassification',
    displayName: 'pH Classification',
    description: 'Classifies a pH reading (0-14) into an acidity/alkalinity label',
    category: 'Lookup',
    params: [{ name: 'ph', label: 'pH value', placeholder: '7.2' }],
    code: `/**
 * Classify pH into standard categories
 * @param {number} ph - pH value (0-14)
 * @returns {string} Classification
 */
function phClassification(ph) {
  var p = Number(ph);
  if (p < 0 || p > 14) return 'Invalid';
  if (p < 3) return 'Strongly Acidic';
  if (p < 5) return 'Moderately Acidic';
  if (p < 6.5) return 'Slightly Acidic';
  if (p <= 7.5) return 'Neutral';
  if (p < 9) return 'Slightly Alkaline';
  if (p < 11) return 'Moderately Alkaline';
  return 'Strongly Alkaline';
}`,
  },
  {
    id: 'water_hardness',
    name: 'waterHardness',
    displayName: 'Water Hardness Classification',
    description: 'Classifies water hardness from mg/L CaCO₃',
    category: 'Lookup',
    params: [{ name: 'mgPerL', label: 'Hardness (mg/L CaCO₃)', placeholder: '120' }],
    code: `/**
 * Classify water hardness (USGS scale)
 * @param {number} mgPerL - Hardness in mg/L as CaCO3
 * @returns {string} Hardness classification
 */
function waterHardness(mgPerL) {
  var h = Number(mgPerL);
  if (h < 60) return 'Soft';
  if (h < 120) return 'Moderately Hard';
  if (h < 180) return 'Hard';
  return 'Very Hard';
}`,
  },

  // ---- Financial & Estimation ----
  {
    id: 'sales_tax',
    name: 'salesTax',
    displayName: 'Sales Tax Calculator',
    description: 'Calculates total amount including sales tax',
    category: 'Financial',
    params: [
      { name: 'amount', label: 'Subtotal', placeholder: '100.00' },
      { name: 'taxRate', label: 'Tax rate (%)', placeholder: '8.25' },
    ],
    code: `/**
 * Calculate amount with sales tax
 * @param {number} amount - Subtotal
 * @param {number} taxRate - Tax rate as percentage
 * @returns {string} "Tax: $X.XX | Total: $Y.YY"
 */
function salesTax(amount, taxRate) {
  var a = Number(amount), r = Number(taxRate) / 100;
  var tax = Math.round(a * r * 100) / 100;
  var total = Math.round((a + tax) * 100) / 100;
  return 'Tax: $' + tax.toFixed(2) + ' | Total: $' + total.toFixed(2);
}`,
  },
  {
    id: 'unit_cost',
    name: 'unitCost',
    displayName: 'Unit Cost Calculation',
    description: 'Calculates total cost from quantity and unit price',
    category: 'Financial',
    params: [
      { name: 'quantity', label: 'Quantity', placeholder: '25' },
      { name: 'unitPrice', label: 'Unit price ($)', placeholder: '12.50' },
    ],
    code: `/**
 * Calculate total cost from quantity and unit price
 * @param {number} quantity - Number of units
 * @param {number} unitPrice - Price per unit
 * @returns {number} Total cost
 */
function unitCost(quantity, unitPrice) {
  return Math.round(Number(quantity) * Number(unitPrice) * 100) / 100;
}`,
  },
  {
    id: 'markup_price',
    name: 'markupPrice',
    displayName: 'Markup Calculator',
    description: 'Calculates selling price from cost and markup percentage',
    category: 'Financial',
    params: [
      { name: 'cost', label: 'Cost', placeholder: '100' },
      { name: 'markupPct', label: 'Markup (%)', placeholder: '25' },
    ],
    code: `/**
 * Calculate selling price with markup
 * @param {number} cost - Base cost
 * @param {number} markupPct - Markup percentage
 * @returns {number} Selling price
 */
function markupPrice(cost, markupPct) {
  return Math.round(Number(cost) * (1 + Number(markupPct) / 100) * 100) / 100;
}`,
  },
  {
    id: 'labor_cost',
    name: 'laborCost',
    displayName: 'Labor Cost Estimate',
    description: 'Calculates labor cost from hours, rate, and optional overtime',
    category: 'Financial',
    params: [
      { name: 'hours', label: 'Regular hours', placeholder: '40' },
      { name: 'rate', label: 'Hourly rate ($)', placeholder: '35' },
      { name: 'otHours', label: 'Overtime hours', placeholder: '5' },
    ],
    code: `/**
 * Calculate labor cost with overtime (1.5x)
 * @param {number} hours - Regular hours
 * @param {number} rate - Hourly rate
 * @param {number} otHours - Overtime hours (at 1.5x rate)
 * @returns {number} Total labor cost
 */
function laborCost(hours, rate, otHours) {
  var r = Number(rate);
  var regular = Number(hours) * r;
  var ot = Number(otHours) * r * 1.5;
  return Math.round((regular + ot) * 100) / 100;
}`,
  },
  {
    id: 'material_estimate',
    name: 'materialEstimate',
    displayName: 'Material Estimate with Waste',
    description: 'Adds a waste factor to a material quantity estimate',
    category: 'Financial',
    params: [
      { name: 'quantity', label: 'Calculated quantity', placeholder: '100' },
      { name: 'wastePct', label: 'Waste factor (%)', placeholder: '10' },
    ],
    code: `/**
 * Add waste factor to material quantity
 * @param {number} quantity - Calculated quantity needed
 * @param {number} wastePct - Waste factor percentage
 * @returns {number} Order quantity including waste
 */
function materialEstimate(quantity, wastePct) {
  return Math.ceil(Number(quantity) * (1 + Number(wastePct) / 100));
}`,
  },

  // ---- Survey Logic Helpers ----
  {
    id: 'coalesce',
    name: 'coalesce',
    displayName: 'Coalesce (First Non-Empty)',
    description: 'Returns the first non-empty value from up to 4 fields',
    category: 'Logic Helpers',
    params: [
      { name: 'a', label: 'Value 1', placeholder: '' },
      { name: 'b', label: 'Value 2', placeholder: '' },
      { name: 'c', label: 'Value 3', placeholder: 'fallback' },
      { name: 'd', label: 'Value 4 (optional)', placeholder: '' },
    ],
    code: `/**
 * Return the first non-empty value
 * @returns {string} First non-empty/non-null value
 */
function coalesce(a, b, c, d) {
  var args = [a, b, c, d];
  for (var i = 0; i < args.length; i++) {
    if (args[i] !== '' && args[i] !== null && args[i] !== undefined) return String(args[i]);
  }
  return '';
}`,
  },
  {
    id: 'if_then_else',
    name: 'ifThenElse',
    displayName: 'If-Then-Else',
    description: 'Returns one value if condition equals "yes", otherwise another',
    category: 'Logic Helpers',
    params: [
      { name: 'condition', label: 'Condition (yes/no)', placeholder: 'yes' },
      { name: 'thenVal', label: 'If yes', placeholder: 'Approved' },
      { name: 'elseVal', label: 'If no', placeholder: 'Rejected' },
    ],
    code: `/**
 * Simple if-then-else based on yes/no condition
 * @param {string} condition - "yes" or "no"
 * @param {string} thenVal - Value if yes
 * @param {string} elseVal - Value if no
 * @returns {string} Selected value
 */
function ifThenElse(condition, thenVal, elseVal) {
  return String(condition).toLowerCase() === 'yes' ? String(thenVal) : String(elseVal);
}`,
  },
  {
    id: 'count_selected',
    name: 'countItems',
    displayName: 'Count Selected Items',
    description: 'Counts comma or space-separated items in a string (for select_multiple)',
    category: 'Logic Helpers',
    params: [{ name: 'selected', label: 'Selected items string', placeholder: 'a b c d' }],
    code: `/**
 * Count items in a space or comma-separated string
 * Useful for counting selected items from select_multiple
 * @param {string} selected - Space or comma-separated values
 * @returns {number} Number of items
 */
function countItems(selected) {
  var s = String(selected).trim();
  if (!s) return 0;
  return s.split(/[,\\s]+/).filter(function(v) { return v.length > 0; }).length;
}`,
  },
  {
    id: 'contains_item',
    name: 'containsItem',
    displayName: 'Contains Item Check',
    description: 'Checks if a space-separated list contains a specific value',
    category: 'Logic Helpers',
    params: [
      { name: 'list', label: 'Space-separated list', placeholder: 'red green blue' },
      { name: 'item', label: 'Item to find', placeholder: 'green' },
    ],
    code: `/**
 * Check if a space-separated list contains an item
 * @param {string} list - Space-separated values
 * @param {string} item - Value to search for
 * @returns {string} "Yes" or "No"
 */
function containsItem(list, item) {
  var items = String(list).split(/\\s+/);
  return items.indexOf(String(item)) !== -1 ? 'Yes' : 'No';
}`,
  },
  {
    id: 'concat_with_sep',
    name: 'concatFields',
    displayName: 'Concatenate Fields',
    description: 'Joins up to 5 field values with a separator, skipping blanks',
    category: 'Logic Helpers',
    params: [
      { name: 'sep', label: 'Separator', placeholder: ' | ' },
      { name: 'a', label: 'Field 1', placeholder: 'value1' },
      { name: 'b', label: 'Field 2', placeholder: 'value2' },
      { name: 'c', label: 'Field 3', placeholder: '' },
      { name: 'd', label: 'Field 4', placeholder: 'value4' },
    ],
    code: `/**
 * Concatenate fields with a separator, skipping blanks
 * @param {string} sep - Separator string
 * @returns {string} Joined string
 */
function concatFields(sep, a, b, c, d) {
  var fields = [a, b, c, d];
  var parts = [];
  for (var i = 0; i < fields.length; i++) {
    if (fields[i] !== '' && fields[i] !== null && fields[i] !== undefined) {
      parts.push(String(fields[i]));
    }
  }
  return parts.join(String(sep));
}`,
  },
  {
    id: 'map_value',
    name: 'mapValue',
    displayName: 'Map Value (Lookup Table)',
    description: 'Maps a key to a value using a simple inline lookup table',
    category: 'Logic Helpers',
    params: [
      { name: 'key', label: 'Lookup key', placeholder: 'B' },
      { name: 'keys', label: 'Keys (comma-sep)', placeholder: 'A,B,C,D' },
      { name: 'values', label: 'Values (comma-sep)', placeholder: 'Alpha,Bravo,Charlie,Delta' },
    ],
    code: `/**
 * Map a key to a value using parallel lists
 * @param {string} key - The key to look up
 * @param {string} keys - Comma-separated keys
 * @param {string} values - Comma-separated values
 * @returns {string} Matched value or key if not found
 */
function mapValue(key, keys, values) {
  var k = String(keys).split(',').map(function(s) { return s.trim(); });
  var v = String(values).split(',').map(function(s) { return s.trim(); });
  var idx = k.indexOf(String(key).trim());
  return idx !== -1 && idx < v.length ? v[idx] : String(key);
}`,
  },
  {
    id: 'sum_selected',
    name: 'sumSelected',
    displayName: 'Sum Selected Choice Values',
    description: 'Sums numeric values from a select_multiple by looking up choice names',
    category: 'Logic Helpers',
    params: [
      { name: 'selected', label: 'Selected items (space-sep)', placeholder: 'item1 item3' },
      { name: 'names', label: 'All choice names (comma-sep)', placeholder: 'item1,item2,item3' },
      { name: 'values', label: 'Corresponding values (comma-sep)', placeholder: '10,20,30' },
    ],
    code: `/**
 * Sum numeric values for selected choices
 * @param {string} selected - Space-separated selected choice names
 * @param {string} names - Comma-separated choice names
 * @param {string} values - Comma-separated numeric values
 * @returns {number} Sum of selected values
 */
function sumSelected(selected, names, values) {
  var sel = String(selected).split(/\\s+/);
  var n = String(names).split(',').map(function(s) { return s.trim(); });
  var v = String(values).split(',').map(function(s) { return Number(s.trim()); });
  var sum = 0;
  for (var i = 0; i < sel.length; i++) {
    var idx = n.indexOf(sel[i]);
    if (idx !== -1) sum += v[idx];
  }
  return sum;
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
  'Validation': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  'Math & Statistics': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  ),
  'Time & Duration': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  'Environmental': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8c0-5-5-5-5-5s-5 0-5 5c0 3 5 9 5 9s5-6 5-9z" /><path d="M12 22v-5" />
    </svg>
  ),
  'Construction': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M12 12h.01" /><path d="M17 12h.01" /><path d="M7 12h.01" />
    </svg>
  ),
  'Water & Utilities': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  'Inspection': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  ),
  'Geometry': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 22 22 22" />
    </svg>
  ),
  'Health & Safety': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  'Lookup': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  'Financial': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  'Logic Helpers': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
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
