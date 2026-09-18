import { supabase } from "../lib/supabase";
import {
  Task,
  TaskStatus,
  SupabaseTask,
} from "../types/task";

// ============================================================================
// Supabase → Task 변환
// ============================================================================

const convertSupabaseTask = (
  task: SupabaseTask
): Task => ({
  id: task.id,
  title: task.title,
  description: task.description || "",
  status: task.status,
  startDate: task.start_date,
  endDate: task.end_date,
  subtasks: task.subtasks || [],
});

// ============================================================================
// CREATE
// ============================================================================

export const createTask = async (
  task: Omit<Task, "id">
): Promise<Task | null> => {
  const id = crypto.randomUUID();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      id,
      title: task.title,
      description: task.description || "",
      status: task.status,
      start_date: task.startDate,
      end_date: task.endDate,
      subtasks: task.subtasks || [],
    })
    .select()
    .single();

  if (error) {
    console.error(
      "Task 생성 실패:",
      error
    );

    return null;
  }

  return convertSupabaseTask(
    data as SupabaseTask
  );
};

// ============================================================================
// READ - 전체 Task
// ============================================================================

export const getTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Task 불러오기 실패:",
      error
    );

    return [];
  }

  return (data || []).map((task) =>
    convertSupabaseTask(
      task as SupabaseTask
    )
  );
};

// ============================================================================
// READ - 특정 Task
// ============================================================================

export const getTask = async (
  taskId: string
): Promise<Task | null> => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (error) {
    console.error(
      "Task 조회 실패:",
      error
    );

    return null;
  }

  return convertSupabaseTask(
    data as SupabaseTask
  );
};

// ============================================================================
// UPDATE
// ============================================================================

export const updateTask = async (
  taskId: string,
  task: Omit<Task, "id">
): Promise<Task | null> => {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: task.title,
      description: task.description || "",
      status: task.status,
      start_date: task.startDate,
      end_date: task.endDate,
      subtasks: task.subtasks || [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    console.error(
      "Task 수정 실패:",
      error
    );

    return null;
  }

  return convertSupabaseTask(
    data as SupabaseTask
  );
};

// ============================================================================
// DELETE
// ============================================================================

export const deleteTask = async (
  taskId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error(
      "Task 삭제 실패:",
      error
    );

    return false;
  }

  return true;
};

// ============================================================================
// 상태 변경
// ============================================================================

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus
): Promise<boolean> => {
  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) {
    console.error(
      "Task 상태 변경 실패:",
      error
    );

    return false;
  }

  return true;
};