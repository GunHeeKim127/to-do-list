"use client";

import React, { useState } from "react";
import { Task } from "../app/types/task";
import { formatDateLocal } from "../app/func/date";
// ============================================================================
// 1. Dashboard
// ============================================================================

export function DashboardView({
  tasks,
  onTaskClick,
}: {
  tasks: Task[];
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
            전체 달성률
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