/**
 * Rich Text Editor — TipTap-based WYSIWYG editor for HTML content
 * Used for note labels and other fields that support Survey123 HTML formatting.
 * Supports: bold, italic, underline, text color, alignment, links, font size.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';

// ============================================================
// Toolbar Icons (inline SVGs for zero dependencies)
// ============================================================

const Icon = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const BoldIcon = () => <Icon d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />;
const ItalicIcon = () => <Icon d="M19 4h-9 M14 20H5 M15 4L9 20" />;
const UnderlineIcon = () => <Icon d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3 M4 21h16" />;
const LinkIcon = () => <Icon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />;
const AlignLeftIcon = () => <Icon d="M17 10H3 M21 6H3 M21 14H3 M17 18H3" />;
const AlignCenterIcon = () => <Icon d="M18 10H6 M21 6H3 M21 14H3 M18 18H6" />;
const AlignRightIcon = () => <Icon d="M21 10H7 M21 6H3 M21 14H3 M21 18H7" />;
const CodeIcon = () => <Icon d="M16 18l6-6-6-6 M8 6l-6 6 6 6" />;

// ============================================================
// Color picker presets (Survey123-compatible)
// ============================================================

const COLOR_PRESETS = [
  '#000000', '#333333', '#666666', '#999999',
  '#dc2626', '#ea580c', '#d97706', '#65a30d',
  '#059669', '#0891b2', '#2563eb', '#7c3aed',
  '#db2777', '#ffffff',
];

// ============================================================
// Toolbar Button
// ============================================================

function ToolbarBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
      onClick={onClick}
      title={title}
      style={{ padding: '3px 5px', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      className={`transition-fast ${
        active
          ? 'bg-[#007a62]/10 text-[#007a62]'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

// ============================================================
// Toolbar
// ============================================================

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('URL', prev);
    if (url === null) return; // canceled
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50"
      style={{ padding: '4px 6px' }}
    >
      <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
        <BoldIcon />
      </ToolbarBtn>
      <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
        <ItalicIcon />
      </ToolbarBtn>
      <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
        <UnderlineIcon />
      </ToolbarBtn>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      {/* Color picker */}
      <div className="relative" ref={colorRef}>
        <ToolbarBtn
          active={showColorPicker}
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Text color"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>A</span>
            <div style={{
              width: 12, height: 3, borderRadius: 1,
              backgroundColor: editor.getAttributes('textStyle').color || '#000',
            }} />
          </div>
        </ToolbarBtn>
        {showColorPicker && (
          <div
            className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
            style={{ padding: 8, width: 160 }}
          >
            <div className="grid grid-cols-7 gap-1">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().setColor(c).run();
                    setShowColorPicker(false);
                  }}
                  style={{
                    width: 18, height: 18, borderRadius: 3,
                    backgroundColor: c,
                    border: c === '#ffffff' ? '1px solid #e5e7eb' : '1px solid transparent',
                  }}
                  className="hover:ring-2 hover:ring-[#007a62]/40 transition-fast"
                  title={c}
                />
              ))}
            </div>
            <div style={{ marginTop: 6, borderTop: '1px solid #f3f4f6', paddingTop: 6 }}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColorPicker(false);
                }}
                className="text-[11px] text-gray-500 hover:text-gray-700"
              >
                Reset color
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <ToolbarBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align left">
        <AlignLeftIcon />
      </ToolbarBtn>
      <ToolbarBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align center">
        <AlignCenterIcon />
      </ToolbarBtn>
      <ToolbarBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align right">
        <AlignRightIcon />
      </ToolbarBtn>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <ToolbarBtn active={editor.isActive('link')} onClick={setLink} title="Link">
        <LinkIcon />
      </ToolbarBtn>

      <ToolbarBtn active={false} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting">
        <CodeIcon />
      </ToolbarBtn>
    </div>
  );
}

// ============================================================
// Main RichTextEditor Component
// ============================================================

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Label above the editor (properties panel) */
  label?: string;
  /** Compact mode for inline canvas editing */
  compact?: boolean;
  /** Auto-focus when mounted */
  autoFocus?: boolean;
  /** Callback when user clicks away / presses Escape */
  onBlur?: () => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  label,
  compact = false,
  autoFocus = false,
  onBlur,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need
        blockquote: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
    ],
    content: value || '',
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: 'outline-none',
        style: compact
          ? 'font-size: 13px; line-height: 1.5; min-height: 40px; padding: 6px 8px;'
          : 'font-size: 13px; line-height: 1.6; min-height: 80px; padding: 8px 12px;',
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Escape' && onBlur) {
          onBlur();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      // TipTap wraps content in <p> tags. For Survey123 compatibility,
      // if the content is a single paragraph, unwrap it.
      const cleaned = cleanHtmlForSurvey123(html);
      onChange(cleaned);
    },
  });

  // Update content when value changes externally
  const prevValue = useRef(value);
  useEffect(() => {
    if (editor && value !== prevValue.current) {
      const curContent = cleanHtmlForSurvey123(editor.getHTML());
      if (curContent !== value) {
        editor.commands.setContent(value || '');
      }
      prevValue.current = value;
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div style={{ marginBottom: label ? 14 : 0 }}>
      {label && (
        <label className="block text-gray-500" style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div
        className={`border rounded-lg overflow-hidden transition-fast ${
          editor.isFocused ? 'border-[#00856a] ring-1 ring-[#00856a]/20' : 'border-gray-200'
        }`}
      >
        <Toolbar editor={editor} />
        <EditorContent
          editor={editor}
          onBlur={() => {
            // Small delay so toolbar clicks don't trigger blur
            setTimeout(() => {
              if (!editor.isFocused && onBlur) onBlur();
            }, 200);
          }}
        />
      </div>
      {!compact && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-400">
            Supports HTML formatting for Survey123
          </span>
          <button
            type="button"
            onClick={() => {
              // Toggle source view — simple approach: show the raw HTML in an alert
              const html = cleanHtmlForSurvey123(editor.getHTML());
              const raw = window.prompt('Edit raw HTML:', html);
              if (raw !== null && raw !== html) {
                editor.commands.setContent(raw);
                onChange(raw);
              }
            }}
            className="text-[10px] text-gray-400 hover:text-[#007a62] transition-fast"
          >
            Edit HTML
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HTML Cleanup for Survey123
// ============================================================

/**
 * Clean TipTap HTML output for Survey123 compatibility.
 * - Unwrap single <p> tags
 * - Convert TipTap's style attributes to Survey123 HTML tags
 */
function cleanHtmlForSurvey123(html: string): string {
  if (!html || html === '<p></p>') return '';

  // Convert TipTap's <p style="text-align: X"> to Survey123-compatible wrappers
  // This must happen BEFORE unwrapping single paragraphs
  let result = html
    .replace(/<p style="text-align: center">(.*?)<\/p>/gs, '<center>$1</center>')
    .replace(/<p style="text-align: right">(.*?)<\/p>/gs, '<div style="text-align: right">$1</div>')
    .replace(/<p style="text-align: left">(.*?)<\/p>/gs, '$1');

  // If content is just a single plain paragraph (no attributes), unwrap it
  const singlePlainParagraph = result.match(/^<p>(.+?)<\/p>$/s);
  if (singlePlainParagraph) {
    return singlePlainParagraph[1];
  }

  // If the conversion already handled everything (no <p> tags left), return as-is
  if (!result.includes('<p>') && !result.includes('<p ')) {
    return result;
  }

  // Convert remaining <p> to line breaks for multi-paragraph content
  return result
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '<br/>')
    .replace(/<br\/>$/, '') // Remove trailing break
    .trim();
}

// ============================================================
// HTML Preview renderer — safely renders HTML in note labels
// ============================================================

/**
 * Sanitize HTML for safe rendering in the canvas.
 * Allows only Survey123-safe tags: font, center, small, em, strong, b, i, u, a, br, span, p, div
 */
export function sanitizeHtml(html: string): string {
  // Allow common Survey123 formatting tags
  const ALLOWED_TAGS = new Set([
    'font', 'center', 'small', 'big', 'em', 'strong', 'b', 'i', 'u', 's',
    'a', 'br', 'span', 'p', 'div', 'sub', 'sup', 'h1', 'h2', 'h3', 'h4',
    'table', 'tr', 'td', 'th', 'thead', 'tbody', 'ul', 'ol', 'li', 'hr',
    'img',
  ]);

  const ALLOWED_ATTRS = new Set([
    'color', 'size', 'face', 'href', 'target', 'style', 'align',
    'class', 'src', 'alt', 'width', 'height', 'border', 'cellpadding', 'cellspacing',
    'colspan', 'rowspan',
  ]);

  // Simple tag-based sanitizer using DOMParser
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    sanitizeNode(doc.body, ALLOWED_TAGS, ALLOWED_ATTRS);
    return doc.body.innerHTML;
  } catch {
    // Fallback: strip all HTML
    return html.replace(/<[^>]*>/g, '');
  }
}

function sanitizeNode(node: Node, allowedTags: Set<string>, allowedAttrs: Set<string>): void {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      if (!allowedTags.has(tag)) {
        // Remove script, style, etc. but keep text content
        if (tag === 'script' || tag === 'style') {
          el.remove();
        } else {
          // Replace with its children
          while (el.firstChild) {
            node.insertBefore(el.firstChild, el);
          }
          el.remove();
        }
      } else {
        // Remove disallowed attributes
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          if (!allowedAttrs.has(attr.name.toLowerCase())) {
            el.removeAttribute(attr.name);
          }
          // Block javascript: URLs
          if ((attr.name === 'href' || attr.name === 'src') &&
            attr.value.trim().toLowerCase().startsWith('javascript:')) {
            el.removeAttribute(attr.name);
          }
        }
        sanitizeNode(el, allowedTags, allowedAttrs);
      }
    }
  }
}

// ============================================================
// Detect if a string contains HTML tags
// ============================================================

export function containsHtml(str: string): boolean {
  if (!str) return false;
  return /<[a-z][^>]*>/i.test(str);
}
