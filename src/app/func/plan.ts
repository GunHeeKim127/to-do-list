import { supabase } from "../lib/supabase";
import { Plan, PlanHistory } from "../types/task";

const toPlan = (p: any): Plan => ({
  id: p.id, title: p.title, periodStart: p.period_start, periodEnd: p.period_end,
  priority: p.priority, successCriteria: p.success_criteria, estimatedTime: Number(p.estimated_time || 0),
  createdAt: p.created_at, updatedAt: p.updated_at,
});

export async function getPlans(): Promise<Plan[]> {
  const { data, error } = await supabase.from("plans").select("*").order("created_at", { ascending: false });
  if (error) { console.error("계획 조회 실패:", error); return []; }
  return (data || []).map(toPlan);
}

export async function createPlan(plan: Omit<Plan, "id">): Promise<Plan | null> {
  const { data, error } = await supabase.from("plans").insert({
    title: plan.title, period_start: plan.periodStart, period_end: plan.periodEnd, priority: plan.priority,
    success_criteria: plan.successCriteria, estimated_time: plan.estimatedTime || 0,
  }).select().single();
  if (error) { console.error("계획 생성 실패:", error); return null; }
  return toPlan(data);
}

export async function updatePlan(planId: string, plan: Omit<Plan, "id">): Promise<Plan | null> {
  // DB trigger가 UPDATE 직전의 OLD 값을 plan_histories에 보존합니다.
  const { data, error } = await supabase.from("plans").update({
    title: plan.title, period_start: plan.periodStart, period_end: plan.periodEnd, priority: plan.priority,
    success_criteria: plan.successCriteria, estimated_time: plan.estimatedTime || 0, updated_at: new Date().toISOString(),
  }).eq("id", planId).select().single();
  if (error) { console.error("계획 수정 실패:", error); return null; }
  return toPlan(data);
}

export async function getPlanHistories(planId: string): Promise<PlanHistory[]> {
  const { data, error } = await supabase.from("plan_histories").select("*").eq("plan_id", planId).order("version", { ascending: false });
  if (error) { console.error("계획 이력 조회 실패:", error); return []; }
  return (data || []).map((h: any) => ({ ...toPlan(h), planId: h.plan_id, version: h.version, changedAt: h.changed_at }));
}
