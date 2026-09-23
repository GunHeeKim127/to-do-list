"use client";

import React, { useEffect, useState } from "react";
import {
  createPlan,
  updatePlan,
} from "../app/func/plan";
import { Plan, Priority, Task } from "../app/types/task";
import { getTodayString } from "../app/func/date";

const emptyPlan = (): Omit<Plan, "id"> => ({
  title: "",
  periodStart: getTodayString(),
  periodEnd: getTodayString(),
  priority: "medium",
  successCriteria: "",
  estimatedTime: 0,
});

export function PlanView({ plans, tasks, onPlansChanged, onAddTask, onEditTask, onDeleteTask }: {
  plans: Plan[];
  tasks: Task[];
  onPlansChanged: (plans: Plan[]) => void;
  onAddTask: (planId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const [form, setForm] = useState<Omit<Plan, "id">>(emptyPlan());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 돌아보기에서 전달한 개선점을 다음 계획의 성공 기준으로 사용
    const improvement = localStorage.getItem("taskdiary-improvement");
    if (improvement) {
      setForm((prev) => ({ ...prev, successCriteria: improvement }));
      localStorage.removeItem("taskdiary-improvement");
    }
  }, []);

  const resetForm = () => {
    setForm(emptyPlan());
    setEditingId(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("계획 제목을 입력하세요.");
      return;
    }

    if (!form.successCriteria.trim()) {
      alert("성공 기준을 입력하세요.");
      return;
    }

    if (form.periodEnd < form.periodStart) {
      alert("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    setSaving(true);
    try {
      const result = editingId
        ? await updatePlan(editingId, {
            ...form,
            title: form.title.trim(),
            successCriteria: form.successCriteria.trim(),
          })
        : await createPlan({
            ...form,
            title: form.title.trim(),
            successCriteria: form.successCriteria.trim(),
          });

      if (!result) {
        alert(editingId
          ? "계획 수정에 실패했습니다. Supabase에 supabase/001_required_database_objects.sql을 적용했는지 확인하세요."
          : "계획 저장에 실패했습니다. Supabase plans 테이블을 확인하세요.");
        return;
      }

      const nextPlans = editingId
        ? plans.map((plan) => plan.id === result.id ? result : plan)
        : [result, ...plans];
      onPlansChanged(nextPlans);

      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const edit = (plan: Plan) => {
    setEditingId(plan.id);
    setForm({
      title: plan.title,
      periodStart: plan.periodStart,
      periodEnd: plan.periodEnd,
      priority: plan.priority,
      successCriteria: plan.successCriteria,
      estimatedTime: plan.estimatedTime,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🎯 계획 관리</h1>
        <p className="page-subtitle">
          큰 목표를 계획으로 등록하고, 할 일을 연결해서 실제 실행까지 관리합니다.
        </p>
        <p className="manager-hint">연결된 할 일은 별도의 메인 계획으로 만들어지지 않습니다. 오늘이 할 일 기간에 포함될 때 오늘 할 일 페이지에 표시됩니다.</p>
      </div>

      <div className="glass-card plan-form-card">
        <div style={{ marginBottom: "14px" }}>
          <h2 className="section-title" style={{ marginBottom: "4px" }}>
            {editingId ? "✏️ 계획 수정" : "✨ 새 계획 만들기"}
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
            메인 계획을 저장한 뒤 그 카드에서 할 일을 추가하면 소속 계획이 자동으로 연결됩니다.
          </p>
        </div>

        <form onSubmit={save} className="plan-form-grid">
          <input
            className="form-input"
            placeholder="계획 제목 (예: 정보처리기사 실기 합격 준비)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <div className="plan-date-row">
            <input
              className="form-input"
              type="date"
              value={form.periodStart}
              onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
              required
            />
            <span>~</span>
            <input
              className="form-input"
              type="date"
              value={form.periodEnd}
              min={form.periodStart}
              onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
              required
            />
          </div>

          <select
            className="form-select"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
          >
            <option value="high">높음</option>
            <option value="medium">보통</option>
            <option value="low">낮음</option>
          </select>

          <input
            className="form-input"
            type="number"
            min="0"
            placeholder="예상 시간(분)"
            value={form.estimatedTime}
            onChange={(e) => setForm({ ...form, estimatedTime: Number(e.target.value) || 0 })}
          />

          <textarea
            className="form-input plan-success-input"
            rows={4}
            placeholder="성공 기준 (예: 기출문제 3회분 풀이 및 오답 정리 완료)"
            value={form.successCriteria}
            onChange={(e) => setForm({ ...form, successCriteria: e.target.value })}
            required
          />

          <div className="plan-form-actions">
            {editingId && (
              <button type="button" className="btn-primary btn-secondary" onClick={resetForm}>
                취소
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "저장 중..." : editingId ? "수정 저장" : "계획 저장"}
            </button>
          </div>
        </form>
      </div>

      <div className="plan-list">
        {plans.length === 0 ? (
          <div className="glass-card" style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
            아직 등록된 계획이 없습니다.<br />
            위 입력창에서 첫 번째 계획을 만들어 주세요.
          </div>
        ) : (
          plans.map((plan) => {
            const linkedTasks = tasks.filter((task) => task.planId === plan.id);

            return (
              <div className="glass-card plan-card" key={plan.id}>
                <div className="plan-card-header">
                  <div>
                    <h3>{plan.title}</h3>
                    <span className={`priority-badge priority-${plan.priority}`}>
                      {plan.priority === "high" ? "높음" : plan.priority === "low" ? "낮음" : "보통"}
                    </span>
                  </div>
                  <div className="plan-card-actions">
                    <button className="btn-mini" onClick={() => edit(plan)}>수정</button>
                  </div>
                </div>

                <div className="plan-meta">
                  <span>📅 {plan.periodStart} ~ {plan.periodEnd}</span>
                  <span>⏱ {plan.estimatedTime}분</span>
                </div>

                <p>
                  <strong>성공 기준:</strong> {plan.successCriteria}
                </p>

                <div className="plan-linked-tasks">
                  <div className="plan-card-header">
                    <strong>연결된 할 일 {linkedTasks.length}개</strong>
                    <button className="btn-primary" style={{ width: "auto" }} onClick={() => onAddTask(plan.id)}>+ 할 일 추가</button>
                  </div>
                  {linkedTasks.length === 0 ? (
                    <p className="plan-linked-empty">
                      아직 연결된 할 일이 없습니다. 위 버튼으로 첫 할 일을 추가하세요.
                    </p>
                  ) : (
                    <div className="plan-linked-task-list">
                      {linkedTasks.map((task) => (
                        <div className="plan-linked-task" key={task.id}>
                          <span className={`status-dot ${task.status}`} />
                          <span>{task.title}</span>
                          <small>{task.dueDate || task.endDate}</small>
                          <button className="btn-mini" onClick={() => onEditTask(task)}>수정</button>
                          <button className="btn-mini danger-text" onClick={() => onDeleteTask(task.id)}>삭제</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
