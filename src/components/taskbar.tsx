import { useDraggable } from "@dnd-kit/core";
import moment from "moment";
import React from "react";
import "../App.css";
export const Taskbar: React.FC<{ task: any }> = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const daySpan = moment(task.endDate).diff(moment(task.startDate), "days") + 1;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="absolute bottom-2 z-10 left-0 bg-blue-500 text-white text-xs rounded flex items-center"
      style={{
        ...style,
        height: "20px",
        width: `${daySpan * 100}px`,
      }}
    >
      <div className="flex items-center">
        <ResizeHandle taskId={task.id} side="left" />
        <div className="px-2">{task.name}</div>
        <ResizeHandle taskId={task.id} side="right" />
      </div>
    </div>
  );
};

function ResizeHandle({
  taskId,
  side,
}: {
  taskId: string;
  side: "left" | "right";
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `${taskId}-${side}`,
    data: { taskId, side },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`w-2 bg-gray-600 cursor-${
        side === "left" ? "cursor-w-resize" : "cursor-e-resize"
      }`}
    />
  );
}
