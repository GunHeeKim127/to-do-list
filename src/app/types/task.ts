export type TaskStatus = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high";

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
  planId?: string | null;
  dueDate?: string;
  priority?: Priority;
  tags?: string[];
  estimatedTime?: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Plan {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  priority: Priority;
  successCriteria: string;
  estimatedTime: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanHistory extends Plan {
  version: number;
  planId: string;
  changedAt: string;
}

export interface ExecutionLog {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  actualMinutes: number;
  blockedReason: string | null;
  idempotencyKey: string;
  createdAt?: string;
}

export type ActiveTab =
  | "dashboard"
  | "kanban"
  | "calendar"
  | "table"
  | "plans"
  | "review";

export type SupabaseTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  start_date: string;
  end_date: string;
  subtasks: Subtask[];
  plan_id: string | null;
  due_date: string | null;
  priority: Priority;
  tags: string[];
  estimated_time: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};
