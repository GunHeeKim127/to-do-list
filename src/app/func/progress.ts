import type { ExecutionLog, Plan, Task } from "../types/task";

export const statusLabels = { todo: "예정", in_progress: "진행 중", done: "완료" };

// tasks.subtasks는 할 일 안의 작은 체크리스트입니다.
export function getTaskProgress(task: Task) {
  const total = task.subtasks?.length || 0;
  const completed = task.subtasks?.filter((item) => item.isCompleted).length || 0;
  // 사용자가 완료로 확정한 할 일은 체크리스트 유무와 관계없이 완료입니다.
  // 완료 전에는 체크리스트가 있으면 실제 체크 비율을, 없으면 상태값을 사용합니다.
  const percent = task.status === "done" ? 100
    : total ? Math.round(completed / total * 100)
    : task.status === "in_progress" ? 50 : 0;
  return { total, completed, percent };
}

export function getPlanProgress(plan: Pick<Plan, "id" | "status">, tasks: Task[]) {
  const linked = tasks.filter((task) => !task.deletedAt && task.planId === plan.id);
  const completed = linked.filter((task) => task.status === "done").length;
  const progressTotal = linked.reduce((sum, task) => sum + getTaskProgress(task).percent, 0);
  const ownPercent = plan.status === "done" ? 100 : plan.status === "in_progress" ? 50 : 0;
  return { total: linked.length, completed, percent: linked.length ? Math.round(progressTotal / linked.length) : ownPercent };
}

export type ReviewPeriod = "all" | "week" | "month";
export type ReviewDetail = "all" | "done" | "delayed" | "blocked";

export function isTaskScheduledForDate(task: Task, date: string) {
  return !task.deletedAt && task.startDate <= date && task.endDate >= date;
}

export function getReviewSummary(tasks: Task[], logs: ExecutionLog[], period: ReviewPeriod, today: string) {
  const boundary = new Date(`${today}T00:00:00Z`);
  boundary.setUTCDate(boundary.getUTCDate() - (period === "week" ? 6 : 29));
  const start = boundary.toISOString().slice(0, 10);
  const selected = tasks.filter((task) => !task.deletedAt && (period === "all" ||
    ((task.dueDate || task.endDate) >= start && (task.dueDate || task.endDate) <= today)));
  const ids = new Set(selected.map((task) => task.id));
  // 기간은 메인 계획의 마감일 기준. 선택된 계획에 딸린 모든 실행 기록을 합산합니다.
  const selectedLogs = logs.filter((log) => ids.has(log.taskId));
  const blockedIds = new Set(selectedLogs.filter((log) => log.blockedReason?.trim()).map((log) => log.taskId));
  const groups = {
    all: selected,
    done: selected.filter((task) => task.status === "done"),
    delayed: selected.filter((task) => task.status !== "done" && (task.dueDate || task.endDate) < today),
    blocked: selected.filter((task) => blockedIds.has(task.id)),
  };
  const estimated = selected.reduce((sum, task) => sum + Number(task.estimatedTime || 0), 0);
  const actual = selectedLogs.reduce((sum, log) => sum + Number(log.actualMinutes || 0), 0);
  return { groups, logs: selectedLogs, estimated, actual, difference: actual - estimated };
}
