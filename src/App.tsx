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

      // Determine insertion index
      if (over.id === 'canvas-drop-zone') {
        // Dropped on empty canvas or at the end
        addRow(questionType);
      } else {
        // Dropped on/near an existing row — insert after it
        const overIndex = form.survey.findIndex((r) => r.id === over.id);
        if (overIndex !== -1) {
          addRow(questionType, overIndex + 1);
        } else {
          addRow(questionType);
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
            <div className="bg-white border border-emerald-300 rounded-xl px-5 py-3
              shadow-[0_8px_32px_rgba(0,0,0,0.12)] text-[13px] text-emerald-700 font-semibold
              opacity-95 backdrop-blur-sm">
              Drop on canvas
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
