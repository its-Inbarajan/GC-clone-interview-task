import moment from "moment-timezone";
import React, { type ChangeEvent, type JSX } from "react";
import { dayIndexOf, getMonthDays, isSelectedIndex } from "../utils/helper";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Inputs } from "./input";

interface Task {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export const Calendar: React.FC = () => {
  const today = moment();
  const days = getMonthDays(today.year(), today.month());
  moment.tz.setDefault("Asia/Kolkata");

  const calendarRef = React.useRef<HTMLDivElement | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const [cellWidth, setCellWidth] = React.useState<number>(120); // fallback, will measure

  // tasks state
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [selStartIndex, setSelStartIndex] = React.useState<number | null>(null);
  const [selEndIndex, setSelEndIndex] = React.useState<number | null>(null);

  // modal state
  const [showModal, setShowModal] = React.useState(false);
  const [newRange, setNewRange] = React.useState<{
    start: string;
    end: string;
  } | null>(null);
  const [taskInputs, setTaskInputs] = React.useState<{
    taskName: string;
    status: "To Do" | "In Progress" | "Review" | "Completed";
  }>({
    status: "To Do",
    taskName: "",
  });
  const [finalRange, setFinalRange] = React.useState<{
    start: number;
    end: number;
  } | null>(null);
  console.log(finalRange);
  // transient state for live feedback when resizing
  const [tempTaskRange, setTempTaskRange] = React.useState<
    Record<string, { start: string; end: string }>
  >({});

  const [activeId, setActiveId] = React.useState<string | null>(null);

  // sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // measure cell width on mount & when window resizes
  React.useEffect(() => {
    function measure() {
      if (!gridRef.current) return;
      const cell = gridRef.current.querySelector<HTMLElement>("#calendar-cell");
      if (cell) setCellWidth(cell.getBoundingClientRect().width);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /** Drag start */
  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  /** Drag move - used for resizing live feedback */
  function handleDragMove(event: DragMoveEvent) {
    const id = String(event.active.id);
    // handle left/right resize handles
    if (id.endsWith("-left") || id.endsWith("-right")) {
      const [taskId, side] = id.split("-");
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // initial index and current mouse delta
      // event.delta is cumulative delta since drag started
      const dx = event.delta.x;
      const daysChange = Math.round(dx / cellWidth);
      if (side === "left") {
        const newStart = moment(task.startDate).add(daysChange, "days");
        // constrain so start <= end
        const constrainedStart = moment.min(newStart, moment(task.endDate));
        setTempTaskRange((prev) => ({
          ...prev,
          [taskId]: {
            start: constrainedStart.format("YYYY-MM-DD"),
            end: task.endDate,
          },
        }));
      } else {
        const newEnd = moment(task.endDate).add(daysChange, "days");
        const constrainedEnd = moment.max(newEnd, moment(task.startDate));
        setTempTaskRange((prev) => ({
          ...prev,
          [taskId]: {
            start: task.startDate,
            end: constrainedEnd.format("YYYY-MM-DD"),
          },
        }));
      }
    }
  }

  /** Drag end - commit move or resize */
  function handleDragEnd(event: DragEndEvent) {
    const id = String(event.active.id);
    setActiveId(null);

    // Move whole task (id format: task-<id> or just <id>)
    // We used draggable id as just task.id for body drags
    const bodyTask = tasks.find((t) => t.id === id);
    if (bodyTask) {
      // event.delta.x gives how many px dragged
      const dx = event.delta.x;
      const daysChange = Math.round(dx / cellWidth);
      if (daysChange !== 0) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === bodyTask.id
              ? {
                  ...t,
                  startDate: moment(t.startDate)
                    .add(daysChange, "days")
                    .format("YYYY-MM-DD"),
                  endDate: moment(t.endDate)
                    .add(daysChange, "days")
                    .format("YYYY-MM-DD"),
                }
              : t
          )
        );
      }
      // done
      return;
    }

    // Resize handles: ids like "<taskId>-left" or "<taskId>-right"
    if (id.endsWith("-left") || id.endsWith("-right")) {
      const [taskId, side] = id.split("-");
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // If a temp range exists (from move), commit it; else compute from delta
      const temp = tempTaskRange[taskId];
      if (temp) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, startDate: temp.start, endDate: temp.end }
              : t
          )
        );
        setTempTaskRange((p) => {
          const copy = { ...p };
          delete copy[taskId];
          return copy;
        });
        return;
      }

      // fallback: compute using event.delta.x
      const dx = event.delta.x;
      const daysChange = Math.round(dx / cellWidth);
      if (side === "left") {
        const newStart = moment(task.startDate).add(daysChange, "days");
        const constrainedStart = moment.min(newStart, moment(task.endDate));
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, startDate: constrainedStart.format("YYYY-MM-DD") }
              : t
          )
        );
      } else {
        const newEnd = moment(task.endDate).add(daysChange, "days");
        const constrainedEnd = moment.max(newEnd, moment(task.startDate));
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, endDate: constrainedEnd.format("YYYY-MM-DD") }
              : t
          )
        );
      }
    }
  }

  function renderTasks() {
    const rows: JSX.Element[] = [];

    tasks.forEach((task) => {
      const temp = tempTaskRange[task.id];
      const start = moment.tz(
        temp ? temp.start : task.startDate,
        "Asia/Kolkata"
      );
      const end = moment.tz(temp ? temp.end : task.endDate, "Asia/Kolkata");

      let currentStart = moment(start);

      while (currentStart.isSameOrBefore(end, "day")) {
        const weekStart = moment(currentStart).startOf("week");
        const weekEnd = moment(weekStart).endOf("week");

        // Clamp the segment to stay inside the current week
        const segmentStart = moment.max(currentStart, weekStart);
        const segmentEnd = moment.min(end, weekEnd);

        const startIndex = dayIndexOf(days, segmentStart.format("YYYY-MM-DD"));
        const endIndex = dayIndexOf(days, segmentEnd.format("YYYY-MM-DD"));

        if (startIndex === -1 || endIndex === -1) break;

        const weekRow = Math.floor(startIndex / 7);
        const left = (startIndex % 7) * cellWidth + 4;
        const width = ((endIndex % 7) - (startIndex % 7) + 1) * cellWidth - 8;
        const top = weekRow * 100 + 4; // Adjust "100" if cell height changes

        rows.push(
          <TaskDraggable
            key={`${task.id}-${segmentStart.format("YYYY-MM-DD")}`}
            task={task}
            style={{ left, top, width }}
            active={activeId === task.id}
          />
        );

        currentStart = moment(segmentEnd).add(1, "day");
      }
    });

    return rows;
  }

  function handlePointerDown(idx: number, e?: React.PointerEvent) {
    setIsSelecting(true);
    setSelStartIndex(idx);
    setSelEndIndex(idx);
    // capture pointer to continue receiving events (if provided)
    if (e && (e.currentTarget as HTMLElement).setPointerCapture) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch (err) {
        console.log(err);
      }
    }
    // clear previous finalRange/newRange
    setFinalRange(null);
    setNewRange(null);
  }

  function handlePointerEnter(idx: number) {
    if (!isSelecting) return;
    setSelEndIndex(idx);
  }

  function handlePointerUp() {
    if (!isSelecting || selStartIndex === null || selEndIndex === null) return;

    const startIdx = Math.min(selStartIndex, selEndIndex);
    const endIdx = Math.max(selStartIndex, selEndIndex);

    // Map index → actual date from `days`
    const startDate = days[startIdx].format("YYYY-MM-DD");
    const endDate = days[endIdx].format("YYYY-MM-DD");

    setFinalRange({ start: startIdx, end: endIdx });
    setNewRange({ start: startDate, end: endDate });

    setShowModal(true);
    setIsSelecting(false);
    // setSelStartIndex(null);
    // setSelEndIndex(null);
  }

  // optional: cancel selection via Esc
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsSelecting(false);
        setSelStartIndex(null);
        setSelEndIndex(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // commit task from modal
  //   function createTaskFromModal() {
  //     if (!newRange) return;
  //     const id = "t" + Date.now();
  //     setTasks((prev) => [
  //       ...prev,
  //       {
  //         id,
  //         name: taskName || "New task",
  //         startDate: newRange.start,
  //         endDate: newRange.end,
  //       },
  //     ]);
  //     setShowModal(false);
  //     setNewRange(null);
  //     setSelStartIndex(null);
  //     setSelEndIndex(null);
  //   }
  const createTaskFromModal = () => {
    if (!newRange) return;
    const id = "t" + Date.now();
    setTasks((prev) => [
      ...prev,
      {
        id,
        name: taskInputs.taskName || "New task",
        startDate: newRange.start,
        endDate: newRange.end,
        status: taskInputs.status,
      },
    ]);
    setShowModal(false);
    setTaskInputs({
      status: "To Do",
      taskName: "",
    });
  };
  // simple cancel
  function cancelCreate() {
    setShowModal(false);
    setNewRange(null);
    setSelStartIndex(null);
    setSelEndIndex(null);
  }
  console.log(tasks);
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTaskInputs((preve) => ({
      ...preve,
      [name]: value,
    }));
  };
  return (
    <div className="relative w-full max-w-full select-none" ref={calendarRef}>
      <div className="grid grid-cols-7 gap-2 mb-4 text-center text-sm font-medium text-gray-600">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-center font-medium text-xs py-6 bg-transparent text-[#374151]"
          >
            {d}
          </div>
        ))}
      </div>

      <div ref={gridRef} className="grid grid-cols-7 w-full bg-[#d1d5db]">
        {days.map((d, i) => {
          //   const isToday =
          //     d.isSame(moment(), "day") && d.month() === today.month();
          const inCurrentMonth = d.month() === today.month();
          const selected = isSelectedIndex(selStartIndex, selEndIndex, i);
          return (
            <div
              key={i}
              data-index={i}
              //   pointer events:
              onPointerDown={() => handlePointerDown(i)}
              onPointerEnter={() => handlePointerEnter(i)}
              onPointerUp={handlePointerUp}
              className={`min-h-[100px] p-3 relative bg-white border border-gray-200 ${
                inCurrentMonth ? "" : "bg-gray-50 text-gray-400"
              }`}
            >
              <div className="text-xs text-gray-700">{d.date()}</div>

              {/* simple highlight for selection */}
              {selected && (
                <div className="absolute inset-0 bg-blue-200/50 pointer-events-none rounded-sm" />
              )}
            </div>
          );
        })}
      </div>

      {/* tasks layer overlay */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div className="absolute inset-0 top-1/6 pointer-events-none">
          {renderTasks()}
        </div>
      </DndContext>
      {/* Simple modal */}
      {showModal && newRange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded p-6 w-[420px]">
            <h3 className="text-lg font-semibold mb-2">Create task</h3>
            <p className="text-sm text-gray-600 mb-4">
              {newRange.start} → {newRange.end}
            </p>
            <form autoComplete="off" noValidate>
              <Inputs
                value={taskInputs.taskName}
                onChange={handleInputChange}
                placeholder="Task name"
                className="w-full border px-3 py-2 rounded mb-3"
                name="taskName"
                id="taskName"
              />

              <select
                className="w-full border px-3 py-2 rounded mb-3"
                value={taskInputs.status}
                name="status"
                id="status"
                onChange={handleInputChange}
              >
                <option value="" selected>
                  --Select Category--
                </option>
                {["To Do", "In Progress", " Review", " Completed"].map((it) => (
                  <option value={it} key={it}>
                    {it}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  onClick={cancelCreate}
                  className="px-3 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={createTaskFromModal}
                  className="px-3 py-2 bg-blue-600 text-white rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/** TaskDraggable component combines body + left/right handles as separate draggables */
function TaskDraggable({
  task,
  style,
  active,
}: {
  task: Task;
  style: { left: number; top: number; width: number };
  active?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { type: "body", taskId: task.id },
  });

  const {
    attributes: leftAttrs,
    listeners: leftListeners,
    setNodeRef: leftRef,
  } = useDraggable({
    id: `${task.id}-left`,
    data: { type: "left", taskId: task.id },
  });

  const {
    attributes: rightAttrs,
    listeners: rightListeners,
    setNodeRef: rightRef,
  } = useDraggable({
    id: `${task.id}-right`,
    data: { type: "right", taskId: task.id },
  });

  const transformStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`absolute h-6 bg-[#2563eb] text-white flex items-center rounded-sm text-sm cursor-grab pointer-events-auto select-none ${
        active ? "opacity-90 shadow-lg" : ""
      }`}
      style={{
        left: style.left,
        top: style.top,
        width: style.width,
        ...transformStyle,
      }}
    >
      {/* Left handle */}
      <div
        ref={leftRef}
        {...leftAttrs}
        {...leftListeners}
        className="h-full cursor-ew-resize bg-black/30 rounded-l-sm flex-shrink-0 w-[10px]"
        title="Drag left to change start date"
      />

      {/* Task name */}
      <div className="flex-1/2 px-2 truncate">{task.name}</div>

      {/* Right handle */}
      <div
        ref={rightRef}
        {...rightAttrs}
        {...rightListeners}
        className="h-full cursor-ew-resize bg-black/30 rounded-r-sm flex-shrink-0 w-[10px]"
        title="Drag right to change end date"
      />
    </div>
  );
}
