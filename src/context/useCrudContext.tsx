import moment from "moment";
import React from "react";
import { toast } from "sonner";

export interface Task {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  time?: string;
  status: "To Do" | "In Progress" | "Review" | "Completed";
}
type PartialTask = Partial<Task>;

type InitialState = {
  tasks: Task[];
  searchTerm: string;
  createTask: (
    id: string,
    newRange: { start: string; end: string },
    taskInputs: PartialTask
  ) => void;
  updateTaskDate: (id: string, daysChange: number) => void;
  deleteTask: (id: string) => void;
  updateTasks: (data: Task) => void;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
};

const initial: InitialState = {
  createTask() {},
  updateTaskDate() {},
  deleteTask() {},
  updateTasks() {},
  setTasks: () => {},
  tasks: [],
  searchTerm: "",
  setSearchTerm: () => {},
};
const CurdContext = React.createContext({
  ...initial,
});

export const CurdContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = React.useState<Task[]>(
    () => JSON.parse(localStorage.getItem("tasks")!) ?? []
  );
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const createTask = (
    id: string,
    newRange: { start: string; end: string },
    taskInputs: PartialTask
  ) => {
    if (!newRange) {
      toast.error("Atleast select one date.");
      return;
    }
    setTasks((prev) => [
      ...prev,
      {
        id,
        name: taskInputs.name || "New task",
        startDate: newRange.start,
        endDate: newRange.end,
        status: taskInputs.status ?? "To Do",
      },
    ]);
    localStorage.setItem(
      "tasks",
      JSON.stringify([
        ...tasks,
        {
          id,
          name: taskInputs.name || "New task",
          startDate: newRange.start,
          endDate: newRange.end,
          status: taskInputs.status ?? "To Do",
        },
      ])
    );
    toast.success("Task Created Successfully.");
  };

  const updateTaskDate = (id: string, daysChange?: number) => {
    const bodyTask = tasks.find((t) => t.id === id);
    if (!bodyTask) {
      toast.error("Id is missing!");
      return;
    }
    const updatedTask = tasks.map((t) =>
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
    );
    setTasks(updatedTask);
    localStorage.setItem("tasks", JSON.stringify(updatedTask));
  };

  const updateTasks = (data: Task) => {
    const find = tasks.find((item) => item.id === data.id);
    if (find) {
      const updateT = tasks.map((item) =>
        item.id === find.id
          ? {
              ...item,
              ...data,
            }
          : item
      );
      setTasks(updateT);
      localStorage.setItem("tasks", JSON.stringify(updateT));
    }
  };

  const deleteTask = (id: string) => {
    if (!id) {
      toast.error("Id is missing");
      return;
    }

    const data = tasks.filter((item) => item.id !== id);

    setTasks(data);
    localStorage.setItem("tasks", JSON.stringify(data));
  };
  return (
    <CurdContext.Provider
      value={{
        createTask,
        deleteTask,
        tasks,
        updateTaskDate,
        setTasks,
        searchTerm,
        setSearchTerm,
        updateTasks,
      }}
    >
      {children}
    </CurdContext.Provider>
  );
};

export default CurdContext;
