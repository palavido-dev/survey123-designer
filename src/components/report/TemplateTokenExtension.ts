/**
 * TipTap Custom Node Extension — Template Token
 *
 * Renders Survey123 template expressions (${field}, ${if ...}, ${#repeat}, ${/})
 * as inline colored chips in the rich text editor.
 *
 * Token types:
 *   - field:             ${fieldname} or ${fieldname | filter}
 *   - conditional_start: ${if condition}
 *   - conditional_end:   ${/}
 *   - repeat_start:      ${#repeatfield}
 *   - repeat_end:        ${/}
 *   - keyword:           $date, $image, $map, etc.
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface TemplateTokenOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    templateToken: {
      insertToken: (attrs: { expression: string; tokenType: string }) => ReturnType;
    };
  }
}

export const TemplateToken = Node.create<TemplateTokenOptions>({
  name: 'templateToken',

  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      expression: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-expression'),
        renderHTML: (attrs) => ({ 'data-expression': attrs.expression }),
      },
      tokenType: {
        default: 'field',
        parseHTML: (el) => el.getAttribute('data-token-type') || 'field',
        renderHTML: (attrs) => ({ 'data-token-type': attrs.tokenType }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-template-token]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const expr = HTMLAttributes['data-expression'] || '';
    const tokenType = HTMLAttributes['data-token-type'] || 'field';

    // Build display text
    let displayText: string;
    if (tokenType === 'conditional_end' || tokenType === 'repeat_end') {
      displayText = '${/}';
    } else {
      displayText = `\${${expr}}`;
    }

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-template-token': '',
        contenteditable: 'false',
        class: `tpl-token tpl-token--${tokenType}`,
      }),
      displayText,
    ];
  },

  addCommands() {
    return {
      insertToken:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },

  addNodeView() {
    return ({ node, getPos }) => {
      const dom = document.createElement('span');
      dom.contentEditable = 'false';
      const tokenType = node.attrs.tokenType || 'field';
      dom.className = `tpl-token tpl-token--${tokenType}`;
      dom.dataset.templateToken = '';
      dom.dataset.expression = node.attrs.expression;
      dom.dataset.tokenType = tokenType;

      // Display text
      if (tokenType === 'conditional_end' || tokenType === 'repeat_end') {
        dom.textContent = '${/}';
      } else {
        dom.textContent = `\${${node.attrs.expression}}`;
      }

      // Click handler for selection
      dom.addEventListener('click', (e) => {
        e.stopPropagation();
        // Dispatch a custom event so React can pick it up
        const pos = typeof getPos === 'function' ? getPos() : 0;
        window.dispatchEvent(new CustomEvent('template-token-click', {
          detail: {
            expression: node.attrs.expression,
            tokenType: node.attrs.tokenType,
            pos,
          },
        }));
      });

      return { dom };
    };
  },
});

// ============================================================
// HTML Preprocessing: Convert ${...} text to TipTap-parseable spans
// ============================================================

/**
 * Pre-process HTML from mammoth to convert raw ${...} template expressions
 * into <span data-template-token> elements that TipTap can parse.
 */
export function preprocessTemplateHtml(html: string): string {
  // Match ${...} patterns and wrap in spans
  // Handle nested braces carefully — the expressions don't contain nested ${} in Survey123
  return html.replace(/\$\{([^}]+)\}/g, (_match, expression: string) => {
    const expr = expression.trim();
    let tokenType = 'field';

    if (expr.startsWith('if ')) {
      tokenType = 'conditional_start';
    } else if (expr.startsWith('#')) {
      tokenType = 'repeat_start';
    } else if (expr === '/') {
      tokenType = 'conditional_end'; // Could be either, but visually the same
    } else if (expr.startsWith('$')) {
      tokenType = 'keyword';
    } else if (expr.includes('|')) {
      tokenType = 'field_filtered';
    }

    // Escape HTML entities in the expression
    const safeExpr = expr
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `<span data-template-token="" data-expression="${safeExpr}" data-token-type="${tokenType}">\${${safeExpr}}</span>`;
  });
}

// ============================================================
// HTML Post-processing: Convert spans back to ${...} for export
// ============================================================

/**
 * Post-process TipTap HTML to convert <span data-template-token> elements
 * back to raw ${...} template expressions for .docx export.
 */
export function postprocessTemplateHtml(html: string): string {
  // Replace span elements with their text content
  return html.replace(
    /<span[^>]*data-template-token=""[^>]*>([^<]*)<\/span>/g,
    (_match, content: string) => {
      // The content is already in ${expr} format from renderHTML
      // Unescape HTML entities
      return content
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
    }
  );
}
