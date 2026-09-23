"use client";

import React from "react";
import { ReviewSummary } from "./ReviewView";
import { getPlanProgress } from "../app/func/progress";
import { Plan, Task } from "../app/types/task";
import { formatDateLocal } from "../app/func/date";
// ============================================================================
// 1. Dashboard
// ============================================================================

export function DashboardView({
  tasks,
  plans,
  onTaskClick,
  onManagePlan,
  onCreatePlan,
}: {
  tasks: Task[];
  plans: Plan[];
  onManagePlan: (plan: Plan) => void;
  onCreatePlan: (description: string) => void;
  onTaskClick: (
    task: Task
  ) => void;
}) {
  const total = tasks.length;

  const doneCount = tasks.filter(
    (t) => t.status === "done"
  ).length;

  const inProgressCount =
    tasks.filter(
      (t) =>
        t.status === "in_progress"
    ).length;

  const todoCount = tasks.filter(
    (t) => t.status === "todo"
  ).length;

  const completionRate =
    total > 0
      ? Math.round(
          (doneCount / total) * 100
        )
      : 0;

  const today = new Date();

  const next5Days = Array.from(
    { length: 5 },
    (_, i) => {
      const d = new Date(today);

      d.setDate(
        today.getDate() + i
      );

      return formatDateLocal(d);
    }
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          전체 대시보드
        </h1>

        <p className="page-subtitle">
          작업 진행률 및 앞으로
          5일간의 일정을 종합
          관리합니다.
        </p>
      </div>

      <div className="stat-widgets">
        <div className="stat-box">
          <div className="stat-label">
            할 일 완료율
          </div>

          <div className="stat-value">
            {completionRate}%
          </div>

          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                width: `${completionRate}%`,
              }}
            />
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">
            진행 중인 작업
          </div>

          <div
            className="stat-value"
            style={{
              color:
                "var(--color-progress)",
            }}
          >
            {inProgressCount}건
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">
            대기 중인 작업
          </div>

          <div
            className="stat-value"
            style={{
              color:
                "var(--color-todo)",
            }}
          >
            {todoCount}건
          </div>
        </div>
      </div>

      <section className="glass-card task-progress-section" aria-label="메인 계획별 진행률">
        <h2 className="section-title">메인 계획별 진행률</h2>
        <p className="manager-hint">각 계획에 연결된 할 일 중 완료 상태인 항목의 비율입니다.</p>
        {plans.length === 0 ? <p>아직 메인 계획이 없습니다. 계획 관리에서 첫 계획을 작성하세요.</p> :
          <div className="dashboard-plan-grid">{plans.map((plan) => {
            const progress = getPlanProgress(plan.id, tasks);
            return <button className="dashboard-plan-card" key={plan.id} onClick={() => onManagePlan(plan)}>
              <strong>{plan.title}</strong><span>{progress.percent}%</span>
              <span className="progress-bar-bg"><span className="progress-bar-fill" style={{ width: `${progress.percent}%` }} /></span>
              <small>{progress.total ? `할 일 ${progress.completed} / ${progress.total} 완료` : "연결된 할 일 없음"} · 눌러서 관리</small>
            </button>;
          })}</div>}
      </section>
      <ReviewSummary tasks={tasks} onCreatePlan={onCreatePlan} onTaskClick={onTaskClick} />
      <div className="glass-card upcoming-section">
        <h3>
          📅 Upcoming 5 Days
        </h3>

        <div className="five-days-grid">
          {next5Days.map(
            (dateStr, idx) => {
              const dayTasks =
                tasks.filter(
                  (t) =>
                    dateStr >=
                      t.startDate &&
                    dateStr <=
                      t.endDate
                );

              return (
                <div
                  key={dateStr}
                  className={`day-card ${
                    idx === 0
                      ? "today"
                      : ""
                  }`}
                >
                  <div className="day-header">
                    <div className="day-name">
                      {idx === 0
                        ? "오늘"
                        : `${idx}일 후`}
                    </div>

                    <div className="day-number">
                      {dateStr.slice(
                        5
                      )}
                    </div>
                  </div>

                  <div className="day-tasks">
                    {dayTasks.length >
                    0 ? (
                      dayTasks.map(
                        (task) => (
                          <div
                            key={
                              task.id
                            }
                            className={`mini-task-item ${task.status}`}
                            style={{
                              cursor:
                                "pointer",
                            }}
                            onClick={() =>
                              onTaskClick(
                                task
                              )
                            }
                          >
                            {
                              task.title
                            }
                          </div>
                        )
                      )
                    ) : (
                      <span
                        style={{
                          fontSize:
                            "0.75rem",
                          color:
                            "#a0aec0",
                        }}
                      >
                        일정 없음
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
