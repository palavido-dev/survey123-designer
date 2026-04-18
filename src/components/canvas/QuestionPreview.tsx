/**
 * Question Preview
 *
 * Shows a small visual preview of what each question type
 * looks like (text input, radio buttons, slider, etc.)
 */

import React from 'react';
import { SurveyRow } from '../../types/survey';

interface Props {
  row: SurveyRow;
}

export function QuestionPreview({ row }: Props) {
  switch (row.type) {
    case 'text':
    case 'email':
    case 'password':
      return (
        <div className="h-7 border border-gray-200 rounded bg-gray-50 px-2 flex items-center">
          <span className="text-xs text-gray-300">
            {row.type === 'email' ? 'email@example.com' :
             row.type === 'password' ? '••••••••' :
             row.appearance?.includes('multiline') ? 'Long text...' : 'Text input...'}
          </span>
        </div>
      );

    case 'integer':
    case 'decimal':
      return (
        <div className="h-7 border border-gray-200 rounded bg-gray-50 px-2 flex items-center">
          <span className="text-xs text-gray-300">
            {row.type === 'integer' ? '123' : '123.45'}
          </span>
        </div>
      );

    case 'range':
      return (
        <div className="flex items-center gap-1 h-7">
          <span className="text-xs text-gray-300">0</span>
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full relative">
            <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full" />
          </div>
          <span className="text-xs text-gray-300">10</span>
        </div>
      );

    case 'select_one':
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-500" />
            <span className="text-xs text-gray-400">Option 1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
            <span className="text-xs text-gray-300">Option 2</span>
          </div>
        </div>
      );

    case 'select_multiple':
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-blue-500 bg-blue-500 flex items-center justify-center">
              <span className="text-white text-[8px]">✓</span>
            </div>
            <span className="text-xs text-gray-400">Option 1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border border-gray-300" />
            <span className="text-xs text-gray-300">Option 2</span>
          </div>
        </div>
      );

    case 'date':
    case 'time':
    case 'datetime':
      return (
        <div className="h-7 border border-gray-200 rounded bg-gray-50 px-2 flex items-center justify-between">
          <span className="text-xs text-gray-300">
            {row.type === 'date' ? 'mm/dd/yyyy' :
             row.type === 'time' ? '--:-- --' : 'mm/dd/yyyy --:--'}
          </span>
          <span className="text-gray-300 text-xs">▼</span>
        </div>
      );

    case 'geopoint':
      return (
        <div className="h-7 bg-green-50 border border-green-200 rounded px-2 flex items-center">
          <span className="text-xs text-green-400">📍 Tap to capture location</span>
        </div>
      );

    case 'image':
      if (row.appearance?.includes('signature')) {
        return (
          <div className="h-7 border border-dashed border-gray-300 rounded px-2 flex items-center justify-center">
            <span className="text-xs text-gray-300">✍️ Signature</span>
          </div>
        );
      }
      return (
        <div className="h-7 bg-purple-50 border border-purple-200 rounded px-2 flex items-center justify-center">
          <span className="text-xs text-purple-400">📷 Take photo</span>
        </div>
      );

    case 'audio':
      return (
        <div className="h-7 bg-orange-50 border border-orange-200 rounded px-2 flex items-center justify-center">
          <span className="text-xs text-orange-400">🎤 Record audio</span>
        </div>
      );

    case 'barcode':
      return (
        <div className="h-7 bg-indigo-50 border border-indigo-200 rounded px-2 flex items-center justify-center">
          <span className="text-xs text-indigo-400">📱 Scan code</span>
        </div>
      );

    case 'file':
      return (
        <div className="h-7 border border-dashed border-gray-300 rounded px-2 flex items-center justify-center">
          <span className="text-xs text-gray-300">📎 Choose file</span>
        </div>
      );

    case 'note':
      return (
        <div className="px-2">
          <span className="text-xs text-gray-400 italic">Information note</span>
        </div>
      );

    case 'calculate':
    case 'hidden':
      return (
        <div className="px-2">
          <span className="text-xs text-gray-300 font-mono">
            {row.calculation ? `= ${row.calculation.substring(0, 20)}...` : 'fx'}
          </span>
        </div>
      );

    case 'rank':
      return (
        <div className="space-y-0.5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 w-3">{n}.</span>
              <div className="flex-1 h-4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}
