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
import { QuestionType } from './types/survey';
import { Toolbar } from './components/toolbar/Toolbar';
import { QuestionPalette } from './components/sidebar/QuestionPalette';
import { FormCanvas } from './components/canvas/FormCanvas';
import { PropertiesPanel } from './components/properties/PropertiesPanel';

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

export default function App() {
  const { form, addRow, moveRow, setDragging } = useSurveyStore();
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
        // Dropped on/near an existing row — insert after it
        const overIndex = form.survey.findIndex((r) => r.id === over.id);
        if (overIndex !== -1) {
          addRow(questionType, overIndex + 1, appearance);
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
        <Toolbar />
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
      </div>
    </ErrorBoundary>
  );
}
