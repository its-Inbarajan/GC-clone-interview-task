import React from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Task } from "../context/useCrudContext";

interface TaskBarProps {
  task: Task;
  style: { left: number; top: number; width: number };
  active?: boolean;
  onUpdateClick?: (params: string) => void;
}

export const TaskDraggable: React.FC<TaskBarProps> = ({
  task,
  style,
  active,
  onUpdateClick,
}) => {
  // Draggable for the main body
  const {
    attributes: bodyAttrs,
    listeners: bodyListeners,
    setNodeRef: bodyRef,
    transform,
  } = useDraggable({
    id: task.id,
    data: { type: "body", taskId: task.id },
  });

  // Left handle draggable
  const {
    attributes: leftAttrs,
    listeners: leftListeners,
    setNodeRef: leftRef,
  } = useDraggable({
    id: `${task.id}-left`,
    data: { type: "left", taskId: task.id },
  });

  // Right handle draggable
  const {
    attributes: rightAttrs,
    listeners: rightListeners,
    setNodeRef: rightRef,
  } = useDraggable({
    id: `${task.id}-right`,
    data: { type: "right", taskId: task.id },
  });

  const handleUpdateId = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id: string
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (onUpdateClick) {
      onUpdateClick(id);
    }
  };

  const statusColors: Record<Task["status"], string> = {
    "To Do": "bg-green-500",
    "In Progress": "bg-yellow-500",
    Completed: "bg-red-500 line-through",
    Review: "bg-blue-500",
  };
  const transformStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={bodyRef}
      {...bodyAttrs}
      className={`absolute h-8 ${
        statusColors[task.status]
      } text-white rounded-sm py-3 flex group items-center pointer-events-auto select-none ${
        active ? "ring-2 ring-yellow-400" : ""
      }`}
      style={{ ...style, ...transformStyle }}
    >
      {/* Left resize handle */}
      <div
        ref={leftRef}
        {...leftAttrs}
        {...leftListeners}
        className="w-2 h-8 cursor-ew-resize bg-black/50 rounded-l-sm"
        title="Resize start date"
      />
      <div className="flex-1 px-2 cursor-grab" {...bodyListeners}>
        {task.name}
      </div>

      <button
        className="mr-1 bg-green-500 text-black invisible opacity-0 group-hover:visible transition-all ease-in-out duration-500 group-hover:opacity-100 text-xs px-2 py-0.5 rounded-sm"
        onClick={(e) => handleUpdateId(e, task.id)}
      >
        <svg
          className="w-5 h-6 text-white"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.779 17.779 4.36 19.918 6.5 13.5m4.279 4.279 8.364-8.643a3.027 3.027 0 0 0-2.14-5.165 3.03 3.03 0 0 0-2.14.886L6.5 13.5m4.279 4.279L6.499 13.5m2.14 2.14 6.213-6.504M12.75 7.04 17 11.28"
          />
        </svg>
      </button>

      {/* Right resize handle */}
      <div
        ref={rightRef}
        {...rightAttrs}
        {...rightListeners}
        className="w-2 h-8 cursor-ew-resize bg-black/50 rounded-r-sm"
        title="Resize end date"
      />
    </div>
  );
};
