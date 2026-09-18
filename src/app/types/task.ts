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

export type ActiveTab =
  | "dashboard"
  | "kanban"
  | "calendar"
  | "table";

export type SupabaseTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  start_date: string;
  end_date: string;
  subtasks: Subtask[];
  created_at: string;
  updated_at: string;
};