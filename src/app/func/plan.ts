import { supabase } from "../lib/supabase";
import { Plan, PlanHistory } from "../types/task";

const toPlan = (p: any): Plan => ({
  id: p.id, title: p.title, periodStart: p.period_start, periodEnd: p.period_end,
  priority: p.priority, successCriteria: p.success_criteria, estimatedTime: Number(p.estimated_time || 0),
  createdAt: p.created_at, updatedAt: p.updated_at,
});

export async function getPlans(): Promise<Plan[]> {
  const result = await getPlansResult();
  return result.plans;
}

export async function getPlansResult(): Promise<{ plans: Plan[]; error: string | null }> {
  const { data, error } = await supabase.from("plans").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("계획 조회 실패:", error);
    return { plans: [], error: "계획 데이터를 불러오지 못했습니다. plans 테이블과 RLS 읽기 정책을 확인하세요." };
  }
  return { plans: (data || []).map(toPlan), error: null };
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
  // 수정 전 값 보존과 현재 계획 갱신을 DB의 한 트랜잭션에서 처리합니다.
  const { data, error } = await supabase.rpc("update_plan_with_history", {
    p_plan_id: planId,
    p_title: plan.title,
    p_period_start: plan.periodStart,
    p_period_end: plan.periodEnd,
    p_priority: plan.priority,
    p_success_criteria: plan.successCriteria,
    p_estimated_time: plan.estimatedTime || 0,
  });
  if (error) { console.error("계획 수정 실패:", error); return null; }
  return toPlan(data);
}

export async function getPlanHistories(planId: string): Promise<PlanHistory[]> {
  const { data, error } = await supabase.from("plan_histories").select("*").eq("plan_id", planId).order("version", { ascending: false });
  if (error) { console.error("계획 이력 조회 실패:", error); return []; }
  return (data || []).map((h: any) => ({ ...toPlan(h), planId: h.plan_id, version: h.version, changedAt: h.changed_at }));
}

export async function getAllPlanHistories(): Promise<PlanHistory[]> {
  const { data, error } = await supabase.from("plan_histories").select("*").order("changed_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((h: any) => ({ ...toPlan(h), planId: h.plan_id, version: h.version, changedAt: h.changed_at }));
}
