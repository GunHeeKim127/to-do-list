import { supabase } from "../lib/supabase";
import { Task, TaskStatus, SupabaseTask } from "../types/task";

const convertSupabaseTask = (task: SupabaseTask): Task => ({
  id: task.id,
  title: task.title,
  description: task.description || "",
  status: task.status,
  startDate: task.start_date,
  endDate: task.end_date,
  subtasks: task.subtasks || [],
  planId: task.plan_id,
  dueDate: task.due_date || task.end_date,
  priority: task.priority || "medium",
  tags: task.tags || [],
  estimatedTime: Number(task.estimated_time || 0),
  deletedAt: task.deleted_at,
  createdAt: task.created_at,
  updatedAt: task.updated_at,
});

export const createTask = async (task: Omit<Task, "id">): Promise<Task | null> => {
  const id = crypto.randomUUID();
  const { data, error } = await supabase.from("tasks").insert({
    id, title: task.title, description: task.description || "", status: task.status,
    start_date: task.startDate, end_date: task.endDate, subtasks: task.subtasks || [],
    plan_id: task.planId || null, due_date: task.dueDate || task.endDate,
    priority: task.priority || "medium", tags: task.tags || [],
    estimated_time: task.estimatedTime || 0, deleted_at: task.deletedAt || null,
  }).select().single();
  if (error) { console.error("Task 생성 실패:", error); return null; }
  return convertSupabaseTask(data as SupabaseTask);
};

export const getTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase.from("tasks").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  if (error) { console.error("Task 불러오기 실패:", error); return []; }
  return (data || []).map((task) => convertSupabaseTask(task as SupabaseTask));
};

export const getTask = async (taskId: string): Promise<Task | null> => {
  const { data, error } = await supabase.from("tasks").select("*").eq("id", taskId).is("deleted_at", null).single();
  if (error) { console.error("Task 조회 실패:", error); return null; }
  return convertSupabaseTask(data as SupabaseTask);
};

export const updateTask = async (taskId: string, task: Omit<Task, "id">): Promise<Task | null> => {
  const { data, error } = await supabase.from("tasks").update({
    title: task.title, description: task.description || "", status: task.status,
    start_date: task.startDate, end_date: task.endDate, subtasks: task.subtasks || [],
    plan_id: task.planId || null, due_date: task.dueDate || task.endDate,
    priority: task.priority || "medium", tags: task.tags || [],
    estimated_time: task.estimatedTime || 0, deleted_at: task.deletedAt || null,
    updated_at: new Date().toISOString(),
  }).eq("id", taskId).select().single();
  if (error) { console.error("Task 수정 실패:", error); return null; }
  return convertSupabaseTask(data as SupabaseTask);
};

export const deleteTask = async (taskId: string): Promise<boolean> => {
  const { error } = await supabase.from("tasks").update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", taskId);
  if (error) { console.error("Task 삭제 실패:", error); return false; }
  return true;
};

export const restoreTask = async (taskId: string): Promise<Task | null> => {
  const { data, error } = await supabase.from("tasks").update({ deleted_at: null, updated_at: new Date().toISOString() }).eq("id", taskId).select().single();
  if (error) { console.error("Task 복원 실패:", error); return null; }
  return convertSupabaseTask(data as SupabaseTask);
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<Task | null> => {
  const { data, error } = await supabase.from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select()
    .single();
  if (error) { console.error("Task 상태 변경 실패:", error); return null; }
  return convertSupabaseTask(data as SupabaseTask);
};

export const updateTaskSubtasks = async (taskId: string, subtasks: Task["subtasks"]): Promise<boolean> => {
  const { error } = await supabase.from("tasks").update({ subtasks: subtasks || [], updated_at: new Date().toISOString() }).eq("id", taskId);
  if (error) { console.error("하위 작업 변경 실패:", error); return false; }
  return true;
};

export const getDeletedTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) {
    console.error("삭제된 Task 조회 실패:", error);
    return [];
  }
  return (data || []).map((task) => convertSupabaseTask(task as SupabaseTask));
};
