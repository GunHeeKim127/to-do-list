"use client"

import React, { useState } from "react";
import { Task } from "../app/types/task";
import { formatDateLocal, getTodayString } from "../app/func/date";

// ============================================================================
// 3. Calendar
// ============================================================================
export function CalendarView({
  tasks,
  onTaskClick,
  onSelectDate,
}: {
  tasks: Task[];
  onTaskClick: (
    task: Task
  ) => void;
  onSelectDate: (
    date: string
  ) => void;
}) {
  const today = new Date();

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const daysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentYear,
    currentMonth,
    1
  ).getDay();

  const dates = Array.from(
    { length: firstDayOfMonth + daysInMonth },
    (_, i) => {
      if (i < firstDayOfMonth) {
        return null;
      }

      const day = i - firstDayOfMonth + 1;

      return formatDateLocal(
        new Date(
          currentYear,
          currentMonth,
          day
        )
      );
    }
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          캘린더 및 타임라인
        </h1>

        <p className="page-subtitle">
          날짜 셀을 클릭하여
          새 할 일을 추가하고
          일정을 모니터링하세요.
        </p>
      </div>

      <div className="calendar-container">
        <div className="calendar-header">
          <h2>
            {currentYear}년 {currentMonth + 1}월
          </h2>
        </div>

        <div className="calendar-grid">
          {[
            "일",
            "월",
            "화",
            "수",
            "목",
            "금",
            "토",
          ].map((weekday) => (
            <div
              key={weekday}
              className="weekday-header"
            >
              {weekday}
            </div>
          ))}

          {dates.map(
            (dateStr, index) => {
              if (!dateStr) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="calendar-cell"
                    style={{
                      cursor: "default",
                      background: "transparent",
                    }}
                  />
                );
              }

              const dayNum =
                parseInt(
                  dateStr.split(
                    "-"
                  )[2]
                );

              const dayTasks =
                tasks.filter(
                  (task) =>
                    dateStr >=
                      task.startDate &&
                    dateStr <=
                      task.endDate
                );

              return (
                <div
                  key={dateStr}
                  className="calendar-cell"
                  onClick={() =>
                    onSelectDate(
                      dateStr
                    )
                  }
                >
                  <div
                    className={`cell-date ${
                      dateStr ===
                      getTodayString()
                        ? "today"
                        : ""
                    }`}
                  >
                    {dayNum}
                  </div>

                  <div className="cell-tasks">
                    {dayTasks.map(
                      (task) => (
                        <div
                          key={
                            task.id
                          }
                          className="timeline-bar"
                          style={{
                            opacity:
                              task.status ===
                              "done"
                                ? 0.6
                                : 1,
                            textDecoration:
                              task.status ===
                              "done"
                                ? "line-through"
                                : "none",
                            cursor:
                              "pointer",
                          }}
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            onTaskClick(
                              task
                            );
                          }}
                        >
                          {
                            task.title
                          }
                        </div>
                      )
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