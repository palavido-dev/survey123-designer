/**
 * Report Canvas (Center Panel)
 *
 * TipTap-based WYSIWYG editor for building Survey123 Feature Report templates.
 * Supports tables, template tokens, rich text formatting, and import from .docx.
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TemplateToken } from './TemplateTokenExtension';
import { useReportStore } from '../../store/reportStore';
import { useSurveyStore } from '../../store/surveyStore';
import { ConditionalBuilderModal } from './ConditionalBuilderModal';
import { RepeatBuilderModal } from './RepeatBuilderModal';

// ============================================================
// Toolbar Icons
// ============================================================

const SvgIcon = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ============================================================
// Editor Toolbar
// ============================================================

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-1.5 rounded transition-fast ${
      active
        ? 'bg-[#007a62]/10 text-[#007a62]'
        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div
      className="flex flex-wrap items-center border-b border-gray-200 bg-[#fafafa] shrink-0"
      style={{ padding: '4px 8px', gap: 2 }}
    >
      {/* Text formatting */}
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))} title="Bold">
        <SvgIcon d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))} title="Italic">
        <SvgIcon d="M19 4h-9 M14 20H5 M15 4L9 20" />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))} title="Underline">
        <SvgIcon d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3 M4 21h16" />
      </button>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      {/* Alignment */}
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Align left">
        <SvgIcon d="M17 10H3 M21 6H3 M21 14H3 M17 18H3" />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Align center">
        <SvgIcon d="M18 10H6 M21 6H3 M21 14H3 M18 18H6" />
      </button>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      {/* Table controls */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className={`${btnClass(false)} text-[11px] font-semibold`}
        title="Insert table"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      </button>

      {editor.isActive('table') && (
        <>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className={btnClass(false)}
            title="Add column"
            style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px' }}
          >
            +Col
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className={btnClass(false)}
            title="Add row"
            style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px' }}
          >
            +Row
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className={`${btnClass(false)} text-red-400 hover:text-red-600`}
            title="Delete column"
            style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px' }}
          >
            -Col
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().deleteRow().run()}
            className={`${btnClass(false)} text-red-400 hover:text-red-600`}
            title="Delete row"
            style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px' }}
          >
            -Row
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().deleteTable().run()}
            className={`${btnClass(false)} text-red-400 hover:text-red-600`}
            title="Delete table"
            style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px' }}
          >
            Del Table
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().mergeCells().run()}
            className={btnClass(false)}
            title="Merge selected cells"
            style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px' }}
          >
            Merge
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().splitCell().run()}
            className={btnClass(false)}
            title="Split cell"
            style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px' }}
          >
            Split
          </button>
        </>
      )}

      <div className="w-px h-4 bg-gray-200 mx-1" />

      {/* Headings */}
      <button onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1"
        style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px' }}>
        H1
      </button>
      <button onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2"
        style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px' }}>
        H2
      </button>
      <button onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive('heading', { level: 3 }))} title="Heading 3"
        style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px' }}>
        H3
      </button>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      {/* Lists */}
      <button onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))} title="Bullet list">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </button>

      {/* Clear formatting */}
      <button onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        className={btnClass(false)} title="Clear formatting">
        <SvgIcon d="M16 18l6-6-6-6 M8 6l-6 6 6 6" />
      </button>
    </div>
  );
}

// ============================================================
// Main Report Canvas
// ============================================================

export function ReportCanvas() {
  const { reportHtml, setReportHtml, setSelectedToken } = useReportStore();
  const form = useSurveyStore((s) => s.form);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const [showConditionalBuilder, setShowConditionalBuilder] = useState(false);
  const [showRepeatBuilder, setShowRepeatBuilder] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'report-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      TemplateToken,
      Placeholder.configure({
        placeholder: 'Start building your report template here...\n\nDrag fields from the left panel, or import an existing .docx template.',
      }),
    ],
    content: reportHtml || '',
    editorProps: {
      attributes: {
        class: 'report-editor-content outline-none',
        style: 'min-height: 500px; padding: 32px 40px; font-size: 13px; line-height: 1.6;',
      },
    },
    onUpdate: ({ editor: ed }) => {
      setReportHtml(ed.getHTML());
    },
    onSelectionUpdate: ({ editor: ed }) => {
      // Check if a template token is selected
      const { from } = ed.state.selection;
      const node = ed.state.doc.nodeAt(from);
      if (node && node.type.name === 'templateToken') {
        setSelectedToken({
          expression: node.attrs.expression,
          tokenType: node.attrs.tokenType,
          pos: from,
        });
      } else {
        setSelectedToken(null);
      }
    },
  });

  // Store editor ref for external access
  useEffect(() => {
    (editorRef as React.MutableRefObject<typeof editor>).current = editor;
  }, [editor]);

  // Listen for insert-token events from the palette
  useEffect(() => {
    const handleInsert = (e: Event) => {
      const { expression, tokenType } = (e as CustomEvent).detail;
      if (editor) {
        editor.chain().focus().insertToken({ expression, tokenType }).run();
      }
    };

    const handleConditionalBuilder = () => setShowConditionalBuilder(true);
    const handleRepeatBuilder = () => setShowRepeatBuilder(true);

    window.addEventListener('report-insert-token', handleInsert);
    window.addEventListener('report-open-conditional-builder', handleConditionalBuilder);
    window.addEventListener('report-open-repeat-builder', handleRepeatBuilder);

    return () => {
      window.removeEventListener('report-insert-token', handleInsert);
      window.removeEventListener('report-open-conditional-builder', handleConditionalBuilder);
      window.removeEventListener('report-open-repeat-builder', handleRepeatBuilder);
    };
  }, [editor]);

  // Listen for token click events
  useEffect(() => {
    const handler = (e: Event) => {
      const { expression, tokenType, pos } = (e as CustomEvent).detail;
      setSelectedToken({ expression, tokenType, pos });
    };
    window.addEventListener('template-token-click', handler);
    return () => window.removeEventListener('template-token-click', handler);
  }, [setSelectedToken]);

  // Load imported HTML into editor
  useEffect(() => {
    if (editor && reportHtml && !editor.getHTML().includes('data-template-token')) {
      // Only set content if the editor doesn't already have template tokens
      // (avoids overwriting during normal editing)
      const currentContent = editor.getHTML();
      if (currentContent === '<p></p>' || currentContent === '') {
        editor.commands.setContent(reportHtml);
      }
    }
  }, [editor, reportHtml]);

  // Expose editor globally for import function
  useEffect(() => {
    (window as any).__reportEditor = editor;
    return () => { delete (window as any).__reportEditor; };
  }, [editor]);

  const handleInsertConditional = useCallback(
    (condition: string) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .insertToken({ expression: `if ${condition}`, tokenType: 'conditional_start' })
        .insertContent(' ')
        .insertToken({ expression: '/', tokenType: 'conditional_end' })
        .run();
      // Move cursor between the tokens
      const { from } = editor.state.selection;
      editor.commands.setTextSelection(from - 2);
      setShowConditionalBuilder(false);
    },
    [editor]
  );

  const handleInsertRepeat = useCallback(
    (repeatField: string) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .insertToken({ expression: `#${repeatField}`, tokenType: 'repeat_start' })
        .insertContent({ type: 'paragraph' })
        .insertToken({ expression: '/', tokenType: 'repeat_end' })
        .run();
      setShowRepeatBuilder(false);
    },
    [editor]
  );

  return (
    <div className="flex-1 overflow-y-auto canvas-bg flex flex-col">
      {/* Editor area */}
      <div className="flex justify-center flex-1">
        <div style={{ width: '100%', maxWidth: 820, padding: '20px 24px 32px' }}>
          {/* Report Template Card */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            {/* Header */}
            <div className="bg-[#5b21b6]" style={{ padding: '20px 32px' }}>
              <div className="flex items-center" style={{ gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span className="text-white font-bold text-[16px]">Report Template</span>
              </div>
              <p className="text-white/50 text-[11px] mt-1">
                {form.settings.form_title || 'No survey loaded'} — Feature Report
              </p>
            </div>

            {/* Toolbar */}
            <EditorToolbar editor={editor} />

            {/* Editor Content */}
            <EditorContent editor={editor} />

            {/* Footer */}
            <div className="border-t border-gray-100 text-center" style={{ padding: '12px 32px' }}>
              <p className="text-[10px] text-gray-400">
                Survey123 Feature Report Template
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showConditionalBuilder && (
        <ConditionalBuilderModal
          onInsert={handleInsertConditional}
          onClose={() => setShowConditionalBuilder(false)}
        />
      )}
      {showRepeatBuilder && (
        <RepeatBuilderModal
          onInsert={handleInsertRepeat}
          onClose={() => setShowRepeatBuilder(false)}
        />
      )}
    </div>
  );
}
