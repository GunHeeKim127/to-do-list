export type TaskStatus = "todo" | "in_progress" | "done";

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  subtasks?: Subtask[];
}