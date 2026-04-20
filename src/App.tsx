/**
 * Main Application Component
 *
 * Wires together the DnD context, sidebar, canvas, properties panel,
 * and toolbar into the full form builder layout.
 */

import React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useSurveyStore } from './store/surveyStore';
import { useReportStore } from './store/reportStore';
import { QuestionType } from './types/survey';
import { Toolbar } from './components/toolbar/Toolbar';
import { ValidationPanel } from './components/toolbar/ValidationPanel';
import { SurveyOptimizer } from './components/optimizer/SurveyOptimizer';
import { QuestionPalette } from './components/sidebar/QuestionPalette';
import { FormCanvas } from './components/canvas/FormCanvas';
import { PropertiesPanel } from './components/properties/PropertiesPanel';
import { ReportFieldPalette } from './components/report/ReportFieldPalette';
import { ReportCanvas } from './components/report/ReportCanvas';
import { ReportPropertiesPanel } from './components/report/ReportPropertiesPanel';

// ============================================================
// Error Boundary — prevents blank white screen on React crashes
// ============================================================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ color: '#dc2626', marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: 16 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, fontSize: 12, overflow: 'auto', maxHeight: 200, color: '#333' }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 16, padding: '8px 20px', background: '#007a62',
              color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            }}
          >
            Try to recover
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// Recovery Banner — shown when auto-saved form is restored
// ============================================================

function RecoveryBanner() {
  const hasRecoveredForm = useSurveyStore((s) => s.hasRecoveredForm);
  const lastSavedAt = useSurveyStore((s) => s.lastSavedAt);
  const dismissRecovery = useSurveyStore((s) => s.dismissRecovery);
  const discardRecoveredForm = useSurveyStore((s) => s.discardRecoveredForm);
  const formTitle = useSurveyStore((s) => s.form.settings.form_title);
  const rowCount = useSurveyStore((s) => s.form.survey.length);

  if (!hasRecoveredForm) return null;

  const timeAgo = lastSavedAt ? getTimeAgo(lastSavedAt) : '';

  return (
    <div className="bg-[#007a62] text-white px-4 py-2.5 flex items-center justify-between text-sm shadow-md z-50">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>
          <strong>Recovered:</strong> &ldquo;{formTitle}&rdquo; ({rowCount} questions){timeAgo ? ` \u2014 saved ${timeAgo}` : ''}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={dismissRecovery}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
        >
          Keep working
        </button>
        <button
          onClick={discardRecoveredForm}
          className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-medium transition-colors"
        >
          Discard &amp; start fresh
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ============================================================
// Auto-save Indicator
// ============================================================

function AutoSaveIndicator() {
  const lastSavedAt = useSurveyStore((s) => s.lastSavedAt);
  const rowCount = useSurveyStore((s) => s.form.survey.length);
  const [, forceUpdate] = React.useState(0);

  // Re-render every 30s to update the time display
  React.useEffect(() => {
    const interval = setInterval(() => forceUpdate((n) => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!lastSavedAt || rowCount === 0) return null;

  return (
    <div className="fixed bottom-3 right-3 bg-gray-800/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm z-40 flex items-center gap-1.5">
      <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      Saved {getTimeAgo(lastSavedAt)}
    </div>
  );
}

export default function App() {
  const { form, addRow, moveRow, setDragging } = useSurveyStore();
  const mode = useReportStore((s) => s.mode);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDragging(false);

    if (!over) return;

    const activeData = active.data.current;

    // Dropping from palette onto canvas
    if (activeData?.fromPalette) {
      const questionType = activeData.type as QuestionType;
      const appearance = activeData.defaultAppearance as string | undefined;

      // Determine insertion index
      if (over.id === 'canvas-drop-zone') {
        // Dropped on empty canvas or at the end
        addRow(questionType, undefined, appearance);
      } else {
        const overIndex = form.survey.findIndex((r) => r.id === over.id);
        if (overIndex !== -1) {
          const targetRow = form.survey[overIndex];
          // If dropping onto a group/repeat header, insert inside it (after the header)
          if (targetRow.type === 'begin_group' || targetRow.type === 'begin_repeat') {
            addRow(questionType, overIndex + 1, appearance);
          } else {
            addRow(questionType, overIndex + 1, appearance);
          }
        } else {
          addRow(questionType, undefined, appearance);
        }
      }
      return;
    }

    // Reordering within the canvas
    if (active.id !== over.id) {
      const oldIndex = form.survey.findIndex((r) => r.id === active.id);
      const newIndex = form.survey.findIndex((r) => r.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveRow(oldIndex, newIndex);
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gray-100">
        <RecoveryBanner />
        <Toolbar />
        <ValidationPanel />
        <SurveyOptimizer />

        {mode === 'form' ? (
          /* ===== Form Builder Mode ===== */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 flex overflow-hidden">
              <QuestionPalette />
              <FormCanvas />
              <PropertiesPanel />
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeId ? (
                <div className="bg-white border border-[#00856a] rounded-lg px-4 py-2.5
                  shadow-[0_4px_20px_rgba(0,0,0,0.12)] text-[13px] text-[#007a62] font-medium">
                  Drop on canvas
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          /* ===== Report Template Builder Mode ===== */
          <div className="flex-1 flex overflow-hidden">
            <ReportFieldPalette />
            <ReportCanvas />
            <ReportPropertiesPanel />
          </div>
        )}

        <AutoSaveIndicator />
      </div>
    </ErrorBoundary>
  );
}
