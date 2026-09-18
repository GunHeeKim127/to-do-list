"use client";

import React, { useEffect, useState } from "react";
import { createPlan, getPlanHistories, getPlans, updatePlan } from "../app/func/plan";
import { Plan, PlanHistory, Priority } from "../app/types/task";
import { getTodayString } from "../app/func/date";

const emptyPlan = (): Omit<Plan, "id"> => ({
  title: "",
  periodStart: getTodayString(),
  periodEnd: getTodayString(),
  priority: "medium",
  successCriteria: "",
  estimatedTime: 0,
});

export function PlanView() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState(emptyPlan());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [histories, setHistories] = useState<Record<string, PlanHistory[]>>({});

  const load = async () => setPlans(await getPlans());
  useEffect(() => {
    load();
    const improvement = localStorage.getItem("taskdiary-improvement");
    if (improvement) {
      setForm((prev) => ({ ...prev, successCriteria: improvement }));
      localStorage.removeItem("taskdiary-improvement");
    }
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.successCriteria.trim()) return;
    const result = editingId
      ? await updatePlan(editingId, form)
      : await createPlan(form);
    if (!result) { alert("계획 저장에 실패했습니다. DB 스키마를 확인하세요."); return; }
    await load();
    if (editingId) {
      const h = await getPlanHistories(editingId);
      setHistories((prev) => ({ ...prev, [editingId]: h }));
    }
    setForm(emptyPlan());
    setEditingId(null);
  };

  const edit = (plan: Plan) => {
    setEditingId(plan.id);
    setForm({
      title: plan.title, periodStart: plan.periodStart, periodEnd: plan.periodEnd,
      priority: plan.priority, successCriteria: plan.successCriteria, estimatedTime: plan.estimatedTime,
    });
  };

  const showHistory = async (id: string) => {
    const h = await getPlanHistories(id);
    setHistories((prev) => ({ ...prev, [id]: h }));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">계획 세우기</h1>
        <p className="page-subtitle">기간·우선순위·성공 기준·예상 시간을 저장하고 수정 전 계획을 History로 보존합니다.</p>
      </div>

      <div className="glass-card plan-form-card">
        <h2 className="section-title">{editingId ? "✏️ 계획 수정" : "✨ 실제 계획 등록"}</h2>
        <form onSubmit={save} className="plan-form-grid">
          <input className="form-input" placeholder="계획 제목" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className="plan-date-row">
            <input className="form-input" type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} required />
            <span>~</span>
            <input className="form-input" type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} required />
          </div>
          <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
            <option value="high">높음</option><option value="medium">보통</option><option value="low">낮음</option>
          </select>
          <input className="form-input" type="number" min="0" placeholder="예상 시간(분)" value={form.estimatedTime} onChange={(e) => setForm({ ...form, estimatedTime: Number(e.target.value) })} />
          <textarea className="form-input plan-success-input" placeholder="성공 기준" value={form.successCriteria} onChange={(e) => setForm({ ...form, successCriteria: e.target.value })} required />
          <div className="plan-form-actions">
            {editingId && <button type="button" className="btn-primary btn-secondary" onClick={() => { setEditingId(null); setForm(emptyPlan()); }}>취소</button>}
            <button type="submit" className="btn-primary">{editingId ? "수정 저장" : "계획 저장"}</button>
          </div>
        </form>
      </div>

      <div className="plan-list">
        {plans.map((plan) => (
          <div className="glass-card plan-card" key={plan.id}>
            <div className="plan-card-header">
              <div><h3>{plan.title}</h3><span className={`priority-badge priority-${plan.priority}`}>{plan.priority}</span></div>
              <div className="plan-card-actions"><button className="btn-mini" onClick={() => edit(plan)}>수정</button><button className="btn-mini" onClick={() => showHistory(plan.id)}>History</button></div>
            </div>
            <div className="plan-meta"><span>📅 {plan.periodStart} ~ {plan.periodEnd}</span><span>⏱ {plan.estimatedTime}분</span></div>
            <p><strong>성공 기준:</strong> {plan.successCriteria}</p>
            {histories[plan.id] && (
              <div className="history-list">
                <strong>수정 전 계획 History</strong>
                {histories[plan.id].length === 0 ? <p>아직 수정 이력이 없습니다.</p> : histories[plan.id].map((h) => (
                  <div className="history-item" key={`${h.planId}-${h.version}`}>
                    <b>v{h.version}</b> · {h.changedAt ? new Date(h.changedAt).toLocaleString("ko-KR") : ""}<br />
                    {h.title} · {h.periodStart} ~ {h.periodEnd} · {h.priority} · {h.estimatedTime}분<br />
                    성공 기준: {h.successCriteria}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
