/**
 * Script Editor Modal — Full-featured JavaScript editor for Survey123 scripts
 *
 * Uses Monaco Editor (VS Code engine) with:
 * - Multi-file tabs
 * - Syntax highlighting & error detection
 * - Function list sidebar
 * - Test/output panel
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useSurveyStore } from '../../store/surveyStore';
import { ScriptFile, ParsedFunction } from '../../types/survey';
import { parseJavaScriptFunctions } from '../../utils/scriptParser';
import { X, Plus, Trash2 } from '../../utils/icons';
import { v4 as uuid } from 'uuid';

interface Props {
  onClose: () => void;
}

const DEFAULT_SCRIPT = `/**
 * Survey123 JavaScript Functions
 *
 * Functions defined here can be called from XLSForm expressions using:
 *   pulldata("@javascript", "fileName.js", "functionName", param1, param2, ...)
 *
 * Restrictions:
 *   - No DOM access
 *   - No async/await
 *   - No external frameworks
 *   - No local file access
 */

/**
 * Example: concatenate first and last name
 * @param {string} first - First name
 * @param {string} last - Last name
 * @returns {string} Full name
 */
function fullName(first, last) {
  return first + " " + last;
}
`;

export function ScriptEditorModal({ onClose }: Props) {
  const { form, addScriptFile, removeScriptFile, updateScriptFile } = useSurveyStore();
  const scriptFiles = form.scriptFiles || [];

  const [activeFileId, setActiveFileId] = useState<string | null>(
    scriptFiles.length > 0 ? scriptFiles[0].id : null
  );
  const [showFunctions, setShowFunctions] = useState(true);
  const [testOutput, setTestOutput] = useState<string>('');
  const [showTestPanel, setShowTestPanel] = useState(false);

  const editorRef = useRef<any>(null);

  const activeFile = activeFileId
    ? scriptFiles.find((f) => f.id === activeFileId)
    : null;

  // Parse all functions from all script files
  const allFunctions = useMemo(() => {
    const funcs: ParsedFunction[] = [];
    for (const file of scriptFiles) {
      funcs.push(...parseJavaScriptFunctions(file.content, file.fileName));
    }
    return funcs;
  }, [scriptFiles]);

  // Functions in the active file
  const activeFunctions = useMemo(() => {
    if (!activeFile) return [];
    return parseJavaScriptFunctions(activeFile.content, activeFile.fileName);
  }, [activeFile]);

  const handleCreateFile = () => {
    const existingNames = new Set(scriptFiles.map((f) => f.fileName));
    let name = 'functions.js';
    let counter = 1;
    while (existingNames.has(name)) {
      name = `functions${counter}.js`;
      counter++;
    }

    const newFile: ScriptFile = {
      id: uuid(),
      fileName: name,
      content: DEFAULT_SCRIPT,
    };
    addScriptFile(newFile);
    setActiveFileId(newFile.id);
  };

  const handleDeleteFile = (fileId: string) => {
    const file = scriptFiles.find((f) => f.id === fileId);
    if (!file) return;
    if (!confirm(`Delete "${file.fileName}"? This cannot be undone (but you can undo with Ctrl+Z).`)) return;
    removeScriptFile(fileId);
    if (activeFileId === fileId) {
      const remaining = scriptFiles.filter((f) => f.id !== fileId);
      setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleRenameFile = (fileId: string) => {
    const file = scriptFiles.find((f) => f.id === fileId);
    if (!file) return;
    const newName = prompt('Rename script file:', file.fileName);
    if (!newName || newName === file.fileName) return;
    // Ensure .js extension
    const finalName = newName.endsWith('.js') ? newName : `${newName}.js`;
    updateScriptFile(fileId, { fileName: finalName });
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!activeFileId || value === undefined) return;
    updateScriptFile(activeFileId, { content: value });
  }, [activeFileId, updateScriptFile]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleGoToFunction = (func: ParsedFunction) => {
    // Switch to the file if needed
    const file = scriptFiles.find((f) => f.fileName === func.fileName);
    if (file && file.id !== activeFileId) {
      setActiveFileId(file.id);
    }
    // Navigate to line after a short delay (for file switch)
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(func.line);
        editorRef.current.setPosition({ lineNumber: func.line, column: 1 });
        editorRef.current.focus();
      }
    }, 100);
  };

  const handleTestFunction = (func: ParsedFunction) => {
    setShowTestPanel(true);
    // Find the source file
    const file = scriptFiles.find((f) => f.fileName === func.fileName);
    if (!file) {
      setTestOutput(`Error: File "${func.fileName}" not found`);
      return;
    }

    // Prompt for test parameters
    const testParams: string[] = [];
    for (const param of func.params) {
      const val = prompt(`Enter test value for "${param}":`, '');
      if (val === null) return; // cancelled
      testParams.push(val);
    }

    try {
      // Create a sandboxed function evaluation
      const wrappedCode = `
        ${file.content}
        ;return ${func.name}(${testParams.map((p) => JSON.stringify(p)).join(', ')});
      `;
      const result = new Function(wrappedCode)();
      setTestOutput(
        `✓ ${func.name}(${testParams.map((p) => `"${p}"`).join(', ')})\n` +
        `→ ${JSON.stringify(result, null, 2)}\n` +
        `  (type: ${typeof result})`
      );
    } catch (err: any) {
      setTestOutput(`✗ Error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}>
      <div className="bg-[#1e1e1e] rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 'min(1100px, 92vw)', height: 'min(720px, 88vh)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#2d2d2d] border-b border-[#404040]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0db4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
                <path d="m9 17 3-3 3 3" /><path d="M12 14v8" />
              </svg>
              <span className="text-[14px] font-bold text-gray-200">Script Editor</span>
            </div>
            <span className="text-[11px] text-gray-500">
              {allFunctions.length} function{allFunctions.length !== 1 ? 's' : ''} across {scriptFiles.length} file{scriptFiles.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFunctions(!showFunctions)}
              className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                showFunctions ? 'bg-[#007a62] text-white' : 'bg-[#404040] text-gray-400 hover:text-gray-200'
              }`}
            >
              Functions
            </button>
            <button
              onClick={() => setShowTestPanel(!showTestPanel)}
              className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                showTestPanel ? 'bg-[#007a62] text-white' : 'bg-[#404040] text-gray-400 hover:text-gray-200'
              }`}
            >
              Output
            </button>
            <button onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-[#404040] rounded transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex items-center bg-[#252526] border-b border-[#404040] px-1 overflow-x-auto"
          style={{ minHeight: 36 }}>
          {scriptFiles.map((file) => (
            <div
              key={file.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] cursor-pointer border-b-2 transition-colors group ${
                file.id === activeFileId
                  ? 'text-white bg-[#1e1e1e] border-[#007a62]'
                  : 'text-gray-400 hover:text-gray-200 border-transparent hover:bg-[#2d2d2d]'
              }`}
              onClick={() => setActiveFileId(file.id)}
              onDoubleClick={() => handleRenameFile(file.id)}
              title="Double-click to rename"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f0db4f" strokeWidth="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
              <span>{file.fileName}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[#404040] text-gray-500 hover:text-red-400 transition-all"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={handleCreateFile}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-gray-500 hover:text-gray-300 hover:bg-[#2d2d2d] rounded transition-colors"
            title="New script file"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Functions Sidebar */}
          {showFunctions && (
            <div className="bg-[#252526] border-r border-[#404040] flex flex-col"
              style={{ width: 220 }}>
              <div className="px-3 py-2 border-b border-[#404040]">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Functions
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {allFunctions.length === 0 ? (
                  <div className="px-3 py-4 text-[11px] text-gray-600 text-center">
                    No functions defined yet.
                    <br />Create a file and add functions.
                  </div>
                ) : (
                  <div className="py-1">
                    {allFunctions.map((func, idx) => (
                      <div key={`${func.fileName}-${func.name}-${idx}`}
                        className="px-3 py-1.5 hover:bg-[#2d2d2d] cursor-pointer group"
                        onClick={() => handleGoToFunction(func)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-purple-400 font-mono">ƒ</span>
                            <span className="text-[12px] text-[#dcdcaa] font-mono">{func.name}</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTestFunction(func); }}
                            className="opacity-0 group-hover:opacity-100 text-[9px] px-1.5 py-0.5 bg-[#007a62] text-white rounded transition-all"
                            title="Test function"
                          >
                            Run
                          </button>
                        </div>
                        <div className="text-[10px] text-gray-600 font-mono ml-4">
                          ({func.params.join(', ')})
                        </div>
                        {func.description && (
                          <div className="text-[10px] text-gray-500 ml-4 mt-0.5 truncate">
                            {func.description}
                          </div>
                        )}
                        <div className="text-[9px] text-gray-600 ml-4">
                          {func.fileName}:{func.line}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeFile ? (
              <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={activeFile.content}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                options={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  renderLineHighlight: 'line',
                  tabSize: 2,
                  automaticLayout: true,
                  suggest: {
                    showKeywords: true,
                    showSnippets: true,
                  },
                  padding: { top: 10, bottom: 10 },
                }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-gray-700">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="m10 13-2 2 2 2" /><path d="m14 17 2-2-2-2" />
                </svg>
                <p className="text-[13px] font-medium mb-1">No script files yet</p>
                <p className="text-[11px] text-gray-700 mb-4 text-center" style={{ maxWidth: 280 }}>
                  JavaScript functions let you extend Survey123 forms with custom logic
                  beyond what XLSForm expressions offer.
                </p>
                <button
                  onClick={handleCreateFile}
                  className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-white bg-[#007a62] rounded-lg hover:bg-[#006652] transition-colors"
                >
                  <Plus size={14} />
                  Create Script File
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Test Output Panel */}
        {showTestPanel && (
          <div className="bg-[#1e1e1e] border-t border-[#404040]" style={{ height: 120 }}>
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#404040]">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Output</span>
              <button onClick={() => setTestOutput('')}
                className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
                Clear
              </button>
            </div>
            <pre className="px-3 py-2 text-[12px] font-mono text-green-400 overflow-auto h-full"
              style={{ whiteSpace: 'pre-wrap' }}>
              {testOutput || 'Click "Run" on a function to test it here.'}
            </pre>
          </div>
        )}

        {/* Status Bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-[#007a62] text-white text-[10px]">
          <div className="flex items-center gap-3">
            <span>JavaScript</span>
            {activeFile && <span>{activeFile.fileName}</span>}
          </div>
          <div className="flex items-center gap-3">
            <span>{allFunctions.length} function{allFunctions.length !== 1 ? 's' : ''}</span>
            <span>
              pulldata("@javascript", "file.js", "func", params...)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
