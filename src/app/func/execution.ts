import { supabase } from "../lib/supabase";
import { ExecutionLog } from "../types/task";

const toLog = (l: any): ExecutionLog => ({
  id: l.id, taskId: l.task_id, startedAt: l.started_at, endedAt: l.ended_at,
  actualMinutes: Number(l.actual_minutes || 0), blockedReason: l.blocked_reason,
  idempotencyKey: l.idempotency_key, createdAt: l.created_at,
});

export async function getExecutionLogs(taskId?: string): Promise<ExecutionLog[]> {
  let q = supabase.from("execution_logs").select("*").order("started_at", { ascending: false });
  if (taskId) q = q.eq("task_id", taskId);
  const { data, error } = await q;
  if (error) { console.error("실행 기록 조회 실패:", error); return []; }
  return (data || []).map(toLog);
}

export async function createExecutionLog(input: Omit<ExecutionLog, "id" | "createdAt">): Promise<ExecutionLog | null> {
  const { data, error } = await supabase.from("execution_logs").insert({
    task_id: input.taskId, started_at: input.startedAt, ended_at: input.endedAt,
    actual_minutes: input.actualMinutes, blocked_reason: input.blockedReason || null,
    idempotency_key: input.idempotencyKey,
  }).select().single();
  if (error) { console.error("실행 기록 저장 실패:", error); return null; }
  return toLog(data);
}

export async function completeTaskIdempotent(taskId: string, idempotencyKey: string, startedAt: string, endedAt: string, blockedReason = ""): Promise<boolean> {
  const { error } = await supabase.rpc("complete_task_idempotent", {
    p_task_id: taskId, p_idempotency_key: idempotencyKey, p_started_at: startedAt, p_ended_at: endedAt, p_blocked_reason: blockedReason || null,
  });
  if (error) { console.error("완료 기록 처리 실패:", error); return false; }
  return true;
}
