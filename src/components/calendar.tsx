import moment from "moment-timezone";
import React, { type ChangeEvent, type FormEvent, type JSX } from "react";
import { getMonthDays, isSelectedIndex } from "../utils/helper";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DataRef,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Inputs } from "./input";
import CurdContext from "../context/useCrudContext";
import { toast } from "sonner";
import { TaskDraggable } from "./taskbar";

export const Calendar: React.FC = () => {
  const today = moment();
  const days = getMonthDays(today.year(), today.month());
  moment.tz.setDefault("Asia/Kolkata");
  const {
    tasks,
    setTasks,
    updateTaskDate,
    createTask,
    searchTerm,
    updateTasks,
  } = React.useContext(CurdContext);
  const calendarRef = React.useRef<HTMLDivElement | null>(null);
  const headerRef = React.useRef<HTMLDivElement | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);

  const [cellWidth, setCellWidth] = React.useState<number>(120);
  const [cellHeight, setCellHeight] = React.useState<number>(100);
  const [headerHeight, setHeaderHeight] = React.useState<number>(50);

  const [isSelecting, setIsSelecting] = React.useState(false);
  const [selStartIndex, setSelStartIndex] = React.useState<number | null>(null);
  const [selEndIndex, setSelEndIndex] = React.useState<number | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [showModal, setShowModal] = React.useState<{
    edit: boolean;
    del: boolean;
    create: boolean;
  }>({
    del: false,
    edit: false,
    create: false,
  });
  const [newRange, setNewRange] = React.useState<{
    start: string;
    end: string;
  } | null>(null);
  const [taskInputs, setTaskInputs] = React.useState<{
    name: string;
    status: "To Do" | "In Progress" | "Review" | "Completed";
    startDate?: string;
    endDate?: string;
    time?: string;
    id?: string;
  }>({
    status: "To Do",
    name: "",
    startDate: "",
    endDate: "",
    time: "",
    id: "",
  });

  const handleModel = (modalName: "edit" | "del" | "create") => {
    setShowModal((preve) => ({
      ...preve,
      [modalName]: !preve[modalName],
    }));
  };

  // transient state for live feedback when resizing
  const [tempTaskRange, setTempTaskRange] = React.useState<
    Record<string, { start: string; end: string }>
  >({});

  const sensors = useSensors(useSensor(PointerSensor));

  React.useEffect(() => {
    function measure() {
      if (!gridRef.current) return;
      // pick first cell by data-index attribute
      const firstCell =
        gridRef.current.querySelector<HTMLElement>("[data-index]");
      if (firstCell) {
        const r = firstCell.getBoundingClientRect();
        setCellWidth(r.width);
        setCellHeight(r.height);
      }
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.getBoundingClientRect().height);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /** Drag start */
  function handleDragStart(event: DragStartEvent) {
    const data = (event.active?.data as DataRef<unknown>)?.current;
    setActiveId((data && data.taskId) || String(event.active.id));
  }

  /** Drag move - used for resizing live feedback */
  function handleDragMove(event: DragMoveEvent) {
    const data = event.active?.data?.current;
    if (!data) return;

    const { type, taskId } = data as { type?: string; taskId?: string };
    if (!type || !taskId) return;

    // only handle left/right resize live preview here
    if (type === "left" || type === "right") {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const dx = event.delta.x ?? event.delta.y;
      const daysChange = Math.round(dx / cellWidth);

      if (type === "left") {
        const newStart = moment(task.startDate).add(daysChange, "days");
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
    const data = event.active?.data.current;
    setActiveId(null);
    if (!data) return;

    const { type, taskId } = data as { type?: string; taskId?: string };
    if (!type || !taskId) return;

    if (type === "body") {
      const dx = event.delta.x;
      const daysChange = Math.round(dx / cellWidth);
      if (daysChange !== 0) {
        updateTaskDate(taskId, daysChange);
        toast.success("Task updated Successfully");
      }
      return;
    }

    // Left / Right handle: commit the temp range if present, or fallback to dx compute
    if (type === "right") {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const temp = tempTaskRange[taskId];
      if (temp) {
        const update = tasks.map((t) =>
          t.id === taskId
            ? { ...t, startDate: temp.start, endDate: temp.end }
            : t
        );
        setTasks(update);
        localStorage.setItem("tasks", JSON.stringify(update));
        toast.success("Task Updated Successfully.");
        setTempTaskRange((p) => {
          const copy = { ...p };
          delete copy[taskId];
          return copy;
        });
        return;
      }

      const dx = event.delta.x;
      const daysChange = Math.round(dx / cellWidth);
      if (type === "right") {
        const newEnd = moment.tz(task.endDate).add(daysChange, "days");
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
  const filteredTasks =
    tasks &&
    tasks?.filter((task) =>
      task.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  function renderTasks() {
    const rows: JSX.Element[] = [];

    filteredTasks?.forEach((task) => {
      const temp = tempTaskRange[task.id];
      const start = moment.tz(
        temp ? temp.start : task.startDate,
        "Asia/Kolkata"
      );
      const end = moment.tz(temp ? temp.end : task.endDate, "Asia/Kolkata");

      const absoluteStartIndex = days.findIndex((d) => d.isSame(start, "day"));
      const absoluteEndIndex = days.findIndex((d) => d.isSame(end, "day"));
      if (absoluteStartIndex === -1 || absoluteEndIndex === -1) return;

      const left = (absoluteStartIndex % 7) * cellWidth + 4;
      const top =
        headerHeight +
        Math.floor(absoluteStartIndex / 7) * (cellHeight + 2) +
        4;

      const width = (absoluteEndIndex - absoluteStartIndex + 1) * cellWidth - 8;

      rows.push(
        <TaskDraggable
          key={task.id}
          task={task}
          style={{ left, top, width }}
          active={activeId === task.id}
          onUpdateClick={handleUpdate}
        />
      );
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
    // setFinalRange(null);
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

    const startDate = days[startIdx].format("YYYY-MM-DD");
    const endDate = days[endIdx].format("YYYY-MM-DD");

    setNewRange({ start: startDate, end: endDate });
    handleModel("create");
    setIsSelecting(false);
  }

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

  const createTaskFromModal = () => {
    if (!newRange) return;
    const id = "t" + Date.now();

    createTask(id, newRange, taskInputs);

    setShowModal((pre) => ({
      ...pre,
      create: false,
    }));
    setTaskInputs({
      status: "To Do",
      name: "",
    });
  };

  function cancelCreate(params: "del" | "edit" | "create") {
    handleModel(params);
    setNewRange(null);
    setSelStartIndex(null);
    setSelEndIndex(null);
    setTaskInputs((pre) => ({
      ...pre,
      endDate: "",
      name: "",
      startDate: "",
      status: "To Do",
      time: "",
    }));
  }

  const handleUpdate = (id: string) => {
    const find = tasks.find((item) => item.id === id);

    if (!find) {
      toast.error("Task not found!");
      return;
    }

    setTaskInputs({
      name: find?.name,
      status: find?.status,
      startDate: find.startDate,
      endDate: find.endDate,
      id: find.id,
    });
    handleModel("edit");
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTaskInputs((preve) => ({
      ...preve,
      [name]: value,
    }));
  };

  const handleUpdateTask = (e: FormEvent) => {
    e.preventDefault();
    const data = {
      id: taskInputs.id ?? "",
      startDate: taskInputs.startDate ?? "",
      endDate: taskInputs.endDate ?? "",
      name: taskInputs.name ?? "",
      status: taskInputs.status ?? "",
    };
    updateTasks(data);
    toast.success("Updated");
    handleModel("edit");
  };

  return (
    <div className="relative w-full max-w-full select-none" ref={calendarRef}>
      <div
        ref={headerRef}
        className="grid grid-cols-7 gap-2 mb-4 text-center text-sm font-medium text-gray-600"
      >
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
        {days &&
          days.map((d, i) => {
            const isToday =
              d.isSame(moment(), "day") && d.month() === today.month();
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
                className={`min-h-[100px] relative bg-white border border-gray-200 ${
                  inCurrentMonth ? "" : "bg-gray-50 text-gray-400"
                }`}
              >
                <div
                  className={`w-full h-full p-2 ${
                    isToday ? "bg-red-400/50" : ""
                  } ${inCurrentMonth ? "bg-gray-100" : "bg-white"}`}
                >
                  {d.date()}
                </div>

                {/* simple highlight for selection */}
                {selected && (
                  <div className="absolute inset-0 top-10 rounded-full bg-blue-200/50 h-6" />
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
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: headerHeight,
          }}
        >
          {renderTasks()}
        </div>
      </DndContext>
      {/* Simple modal */}
      {showModal.create && newRange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded p-6 w-[420px]">
            <h3 className="text-lg font-semibold mb-2">Create task</h3>
            <p className="text-sm text-gray-600 mb-4">
              {newRange.start} → {newRange.end}
            </p>
            <form autoComplete="off" noValidate>
              <Inputs
                value={taskInputs.name}
                onChange={handleInputChange}
                placeholder="Task name"
                className="w-full border px-3 py-2 rounded mb-3"
                name="name"
                id="name"
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
                  onClick={() => cancelCreate("create")}
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

      {showModal.edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded p-6 w-[420px]">
            <h3 className="text-lg font-semibold mb-2">Update Task</h3>
            <p className="text-sm text-gray-600 mb-4">
              {taskInputs.startDate} → {taskInputs.endDate}
            </p>
            <form autoComplete="off" noValidate>
              <Inputs
                type="text"
                value={taskInputs.name}
                onChange={handleInputChange}
                placeholder="Task name"
                className="w-full border px-3 py-2 rounded mb-3"
                name="name"
                id="name"
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
                {["To Do", "In Progress", "Review", "Completed"].map((it) => (
                  <option value={it} key={it}>
                    {it}
                  </option>
                ))}
              </select>

              <Inputs
                value={taskInputs.time}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded mb-3"
                name="time"
                id="time"
                type="time"
              />
              <Inputs
                value={
                  taskInputs.startDate
                    ? moment(taskInputs.startDate).format("YYYY-MM-DD")
                    : ""
                }
                onChange={handleInputChange}
                placeholder="Task name"
                className="w-full border px-3 py-2 rounded mb-3"
                name="startDate"
                id="startDate"
                type="date"
                title="Start Date"
              />
              <Inputs
                value={
                  taskInputs.endDate
                    ? moment(taskInputs.endDate).format("YYYY-MM-DD")
                    : ""
                }
                onChange={handleInputChange}
                placeholder="End Date"
                className="w-full border px-3 py-2 rounded mb-3"
                name="endDate"
                id="endDate"
                type="date"
                title="End Date"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => cancelCreate("edit")}
                  className="px-3 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTask}
                  className="px-3 py-2 bg-blue-600 text-white rounded"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
