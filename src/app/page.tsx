"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  Task,
  TaskStatus,
  Subtask,
} from "./types/task";

// ============================================================================
// Supabase → Task 변환
// ============================================================================

type SupabaseTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  start_date: string;
  end_date: string;
  subtasks: Subtask[];
  created_at: string;
  updated_at: string;
};

const convertSupabaseTask = (task: SupabaseTask): Task => ({
  id: task.id,
  title: task.title,
  description: task.description || "",
  status: task.status,
  startDate: task.start_date,
  endDate: task.end_date,
  subtasks: task.subtasks || [],
});

// ============================================================================
// 날짜 관련 함수
// ============================================================================

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayString() {
  return formatDateLocal(new Date());
}

type ActiveTab =
  | "dashboard"
  | "kanban"
  | "calendar"
  | "table";

export default function DiaryApp() {
  const [activeTab, setActiveTab] =
    useState<ActiveTab>("dashboard");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [defaultStatus, setDefaultStatus] =
    useState<TaskStatus>("todo");

  const [selectedDate, setSelectedDate] =
    useState<string>(getTodayString());

  const tabNames: Record<ActiveTab, string> = {
    dashboard: "📊 전체 대시보드",
    kanban: "📋 투두 칸반 보드",
    calendar: "📅 캘린더 및 타임라인",
    table: "📑 테이블 상세 관리",
  };

  // ==========================================================================
  // 1. Supabase에서 Task 불러오기
  // ==========================================================================

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Task 불러오기 실패:", error);
        alert("작업 데이터를 불러오지 못했습니다.");
        return;
      }

      const formattedTasks = (data || []).map(
        (task) =>
          convertSupabaseTask(
            task as SupabaseTask
          )
      );

      setTasks(formattedTasks);
    } catch (error) {
      console.error(
        "Task 불러오는 중 오류:",
        error
      );
    } finally {
      setIsLoaded(true);
    }
  };

  // ==========================================================================
  // 2. Task 상태 변경
  // ==========================================================================

  const moveTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus
  ) => {
    const { error } = await supabase
      .from("tasks")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) {
      console.error(
        "Task 상태 변경 실패:",
        error
      );

      alert("상태 변경에 실패했습니다.");
      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
            }
          : task
      )
    );
  };

  // ==========================================================================
  // 3. Task 삭제
  // ==========================================================================

  const deleteTask = async (taskId: string) => {
    if (
      !confirm(
        "정말 이 할 일을 삭제하시겠습니까?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      console.error("Task 삭제 실패:", error);
      alert("작업 삭제에 실패했습니다.");
      return;
    }

    setTasks((prev) =>
      prev.filter(
        (task) => task.id !== taskId
      )
    );
  };

  // ==========================================================================
  // 4. Task 저장 / 수정
  // ==========================================================================

  const saveTask = async (
    taskData: Omit<Task, "id"> & {
      id?: string;
    }
  ) => {
    try {
      // ----------------------------------------------------------------------
      // 기존 Task 수정
      // ----------------------------------------------------------------------

      if (taskData.id) {
        const { error } = await supabase
          .from("tasks")
          .update({
            title: taskData.title,
            description:
              taskData.description || "",
            status: taskData.status,
            start_date: taskData.startDate,
            end_date: taskData.endDate,
            subtasks: taskData.subtasks || [],
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", taskData.id);

        if (error) {
          console.error(
            "Task 수정 실패:",
            error
          );

          alert("저장에 실패했습니다.");
          return;
        }

        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskData.id
              ? {
                  ...task,
                  title: taskData.title,
                  description:
                    taskData.description || "",
                  status: taskData.status,
                  startDate:
                    taskData.startDate,
                  endDate:
                    taskData.endDate,
                  subtasks:
                    taskData.subtasks || [],
                }
              : task
          )
        );
      }

      // ----------------------------------------------------------------------
      // 새 Task 생성
      // ----------------------------------------------------------------------

      else {
        const newTask: Task = {
          id: crypto.randomUUID(),
          title: taskData.title,
          description:
            taskData.description || "",
          status: taskData.status,
          startDate: taskData.startDate,
          endDate: taskData.endDate,
          subtasks:
            taskData.subtasks || [],
        };

        const { error } = await supabase
          .from("tasks")
          .insert({
            id: newTask.id,
            title: newTask.title,
            description:
              newTask.description || "",
            status: newTask.status,
            start_date: newTask.startDate,
            end_date: newTask.endDate,
            subtasks:
              newTask.subtasks || [],
          });

        if (error) {
          console.error(
            "Task 생성 실패:",
            error
          );

          alert("작업 등록에 실패했습니다.");
          return;
        }

        setTasks((prev) => [
          newTask,
          ...prev,
        ]);
      }

      setIsModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error(
        "Task 저장 중 오류:",
        error
      );

      alert("저장 중 오류가 발생했습니다.");
    }
  };

  // ==========================================================================
  // 새 Task 추가 모달
  // ==========================================================================

  const handleOpenAddModal = (
    status: TaskStatus = "todo",
    date: string = getTodayString()
  ) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // ==========================================================================
  // Task 수정 모달
  // ==========================================================================

  const handleOpenEditModal = (
    task: Task
  ) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // ==========================================================================
  // 탭 변경
  // ==========================================================================

  const handleTabChange = (
    tab: ActiveTab
  ) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  if (!isLoaded) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
        }}
      >
        데이터를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="app-layout">
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setIsSidebarOpen(false)
          }
        />
      )}

      {/* ================================================================ */}
      {/* 사이드바 */}
      {/* ================================================================ */}

      <aside
        className={`sidebar ${
          isSidebarOpen ? "open" : ""
        }`}
      >
        <div>
          <div className="sidebar-logo">
            📅 <span>TaskDiary</span>
          </div>

          <ul className="nav-menu">
            <li
              className={`nav-item ${
                activeTab === "dashboard"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleTabChange(
                  "dashboard"
                )
              }
            >
              📊 전체 대시보드
            </li>

            <li
              className={`nav-item ${
                activeTab === "kanban"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleTabChange("kanban")
              }
            >
              📋 칸반 보드
            </li>

            <li
              className={`nav-item ${
                activeTab === "calendar"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleTabChange(
                  "calendar"
                )
              }
            >
              📅 캘린더
            </li>

            <li
              className={`nav-item ${
                activeTab === "table"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleTabChange("table")
              }
            >
              📑 테이블 목록 관리
            </li>
          </ul>
        </div>
      </aside>

      {/* ================================================================ */}
      {/* 메인 */}
      {/* ================================================================ */}

      <div className="main-wrapper">
        <header className="app-header">
          <button
            type="button"
            className={`hamburger-btn ${
              isSidebarOpen ? "is-open" : ""
            }`}
            onClick={() =>
              setIsSidebarOpen(
                (prev) => !prev
              )
            }
            aria-label={
              isSidebarOpen
                ? "메뉴 닫기"
                : "메뉴 열기"
            }
            aria-expanded={isSidebarOpen}
          >
            <span className="hamburger-line line-top" />
            <span className="hamburger-line line-middle" />
            <span className="hamburger-line line-bottom" />
          </button>

          <div className="current-page-title">
            {tabNames[activeTab]}
          </div>
        </header>

        <main className="main-content">
          {/* ========================================================== */}
          {/* Dashboard */}
          {/* ========================================================== */}

          {activeTab === "dashboard" && (
            <DashboardView
              tasks={tasks}
              onTaskClick={
                handleOpenEditModal
              }
            />
          )}

          {/* ========================================================== */}
          {/* Kanban */}
          {/* ========================================================== */}

          {activeTab === "kanban" && (
            <KanbanView
              tasks={tasks}
              onMoveStatus={
                moveTaskStatus
              }
              onDeleteTask={
                deleteTask
              }
              onTaskClick={
                handleOpenEditModal
              }
              onOpenAddModal={(status) =>
                handleOpenAddModal(
                  status,
                  getTodayString()
                )
              }
              onQuickAdd={(
                title,
                status
              ) => {
                saveTask({
                  title,
                  status,
                  startDate:
                    getTodayString(),
                  endDate:
                    getTodayString(),
                  description: "",
                  subtasks: [],
                });
              }}
            />
          )}

          {/* ========================================================== */}
          {/* Calendar */}
          {/* ========================================================== */}

          {activeTab === "calendar" && (
            <CalendarView
              tasks={tasks}
              onTaskClick={
                handleOpenEditModal
              }
              onSelectDate={(date) =>
                handleOpenAddModal(
                  "todo",
                  date
                )
              }
            />
          )}

          {/* ========================================================== */}
          {/* Table */}
          {/* ========================================================== */}

          {activeTab === "table" && (
            <TableView
              tasks={tasks}
              setTasks={setTasks}
            />
          )}
        </main>
      </div>

      {/* ================================================================ */}
      {/* Task Modal */}
      {/* ================================================================ */}

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          defaultStartDate={
            selectedDate
          }
          defaultStatus={
            defaultStatus
          }
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onSave={saveTask}
        />
      )}
    </div>
  );
}

// ============================================================================
// 1. Dashboard
// ============================================================================

function DashboardView({
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

// ============================================================================
// 2. Kanban
// ============================================================================

function KanbanView({
  tasks,
  onMoveStatus,
  onDeleteTask,
  onTaskClick,
  onOpenAddModal,
  onQuickAdd,
}: {
  tasks: Task[];
  onMoveStatus: (
    id: string,
    status: TaskStatus
  ) => void;
  onDeleteTask: (
    id: string
  ) => void;
  onTaskClick: (
    task: Task
  ) => void;
  onOpenAddModal: (
    status: TaskStatus
  ) => void;
  onQuickAdd: (
    title: string,
    status: TaskStatus
  ) => void;
}) {
  const [
    quickInputs,
    setQuickInputs,
  ] = useState<
    Record<TaskStatus, string>
  >({
    todo: "",
    in_progress: "",
    done: "",
  });

  const handleDragOver = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent,
    status: TaskStatus
  ) => {
    const taskId =
      e.dataTransfer.getData(
        "taskId"
      );

    if (taskId) {
      onMoveStatus(
        taskId,
        status
      );
    }
  };

  const handleQuickSubmit = (
    e: React.FormEvent,
    status: TaskStatus
  ) => {
    e.preventDefault();

    const value =
      quickInputs[status].trim();

    if (!value) return;

    onQuickAdd(
      value,
      status
    );

    setQuickInputs((prev) => ({
      ...prev,
      [status]: "",
    }));
  };

  const renderColumn = (
    title: string,
    status: TaskStatus,
    dotClass: string
  ) => {
    const columnTasks =
      tasks.filter(
        (task) =>
          task.status === status
      );

    return (
      <div
        className="kanban-column"
        onDragOver={
          handleDragOver
        }
        onDrop={(e) =>
          handleDrop(
            e,
            status
          )
        }
      >
        <div className="column-header">
          <div className="column-title-group">
            <span
              className={`status-dot ${dotClass}`}
            />

            <span className="column-title">
              {title}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "6px",
              alignItems:
                "center",
            }}
          >
            <span className="task-count">
              {
                columnTasks.length
              }
            </span>

            <button
              className="btn-mini"
              title="상세 작성"
              onClick={() =>
                onOpenAddModal(
                  status
                )
              }
            >
              ➕
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) =>
            handleQuickSubmit(
              e,
              status
            )
          }
          style={{
            marginBottom:
              "12px",
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="+ 빠른 등록 후 Enter"
            value={
              quickInputs[
                status
              ]
            }
            onChange={(e) =>
              setQuickInputs(
                (prev) => ({
                  ...prev,
                  [status]:
                    e.target
                      .value,
                })
              )
            }
            style={{
              fontSize:
                "0.8rem",
              padding:
                "8px 10px",
            }}
          />
        </form>

        <div className="kanban-tasks">
          {columnTasks.map(
            (task) => {
              const completedSubtasks =
                task.subtasks?.filter(
                  (s) =>
                    s.isCompleted
                ).length ||
                0;

              const totalSubtasks =
                task.subtasks
                  ?.length || 0;

              return (
                <div
                  key={task.id}
                  className="task-card"
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData(
                      "taskId",
                      task.id
                    )
                  }
                  onClick={() =>
                    onTaskClick(
                      task
                    )
                  }
                  style={{
                    cursor:
                      "pointer",
                  }}
                >
                  <div className="task-card-header">
                    <div className="task-title">
                      {task.title}
                    </div>

                    <button
                      className="btn-mini"
                      style={{
                        color:
                          "#e74c3c",
                      }}
                      onClick={(
                        e
                      ) => {
                        e.stopPropagation();

                        onDeleteTask(
                          task.id
                        );
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {task.description && (
                    <p
                      style={{
                        fontSize:
                          "0.75rem",
                        color:
                          "#64748b",
                        margin:
                          "4px 0 8px 0",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      📝{" "}
                      {
                        task.description
                      }
                    </p>
                  )}

                  <div className="task-meta">
                    <span>
                      {task.startDate ===
                      task.endDate
                        ? task.startDate
                        : `${task.startDate} ~ ${task.endDate}`}
                    </span>

                    {totalSubtasks >
                      0 && (
                      <span
                        className="timeline-badge"
                        style={{
                          background:
                            "#e2e8f0",
                          color:
                            "#334155",
                        }}
                      >
                        ☑️{" "}
                        {
                          completedSubtasks
                        }
                        /
                        {
                          totalSubtasks
                        }
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          투두 칸반 보드
        </h1>

        <p className="page-subtitle">
          드래그 앤 드롭으로
          상태를 변경하거나
          카드를 클릭하여
          수정하세요.
        </p>
      </div>

      <div className="kanban-board">
        {renderColumn(
          "진행해야 되는 일",
          "todo",
          "dot-todo"
        )}

        {renderColumn(
          "진행 중인 일",
          "in_progress",
          "dot-progress"
        )}

        {renderColumn(
          "완료한 일",
          "done",
          "dot-done"
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. Calendar
// ============================================================================

function CalendarView({
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

// ============================================================================
// 4. Table
// ============================================================================

function TableView({
  tasks,
  setTasks,
}: {
  tasks: Task[];
  setTasks: React.Dispatch<
    React.SetStateAction<
      Task[]
    >
  >;
}) {
  const [
    expandedTaskId,
    setExpandedTaskId,
  ] = useState<
    string | null
  >(null);

  const [newTitle, setNewTitle] =
    useState("");

  const [newStatus, setNewStatus] =
    useState<TaskStatus>("todo");

  const [
    newStartDate,
    setNewStartDate,
  ] = useState(getTodayString());

  const [
    newEndDate,
    setNewEndDate,
  ] = useState(getTodayString());

  const toggleExpand = (
    id: string
  ) => {
    setExpandedTaskId(
      (prev) =>
        prev === id
          ? null
          : id
    );
  };

  // --------------------------------------------------------------------------
  // Task 삭제
  // --------------------------------------------------------------------------

  const deleteTask = async (
    id: string
  ) => {
    if (
      !confirm(
        "정말 삭제하시겠습니까?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "Task 삭제 실패:",
        error
      );

      alert(
        "삭제에 실패했습니다."
      );

      return;
    }

    setTasks((prev) =>
      prev.filter(
        (task) =>
          task.id !== id
      )
    );

    if (
      expandedTaskId === id
    ) {
      setExpandedTaskId(
        null
      );
    }
  };

  // --------------------------------------------------------------------------
  // Task 필드 수정
  // --------------------------------------------------------------------------

  const updateTaskField = async <
    K extends keyof Task
  >(
    id: string,
    field: K,
    value: Task[K]
  ) => {
    const currentTask =
      tasks.find(
        (task) =>
          task.id === id
      );

    if (!currentTask) {
      return;
    }

    const updatedTask: Task = {
      ...currentTask,
      [field]: value,
    };

    const { error } =
      await supabase
        .from("tasks")
        .update({
          title:
            updatedTask.title,
          description:
            updatedTask.description ||
            "",
          status:
            updatedTask.status,
          start_date:
            updatedTask.startDate,
          end_date:
            updatedTask.endDate,
          subtasks:
            updatedTask.subtasks ||
            [],
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
      console.error(
        "Task 수정 실패:",
        error
      );

      alert(
        "수정에 실패했습니다."
      );

      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? updatedTask
          : task
      )
    );
  };

  // --------------------------------------------------------------------------
  // 새 Task 추가
  // --------------------------------------------------------------------------

  const handleAddTask = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      description: "",
      status: newStatus,
      startDate: newStartDate,
      endDate: newEndDate,
      subtasks: [],
    };

    const { error } =
      await supabase
        .from("tasks")
        .insert({
          id: newTask.id,
          title: newTask.title,
          description: "",
          status: newTask.status,
          start_date:
            newTask.startDate,
          end_date:
            newTask.endDate,
          subtasks: [],
        });

    if (error) {
      console.error(
        "Task 등록 실패:",
        error
      );

      alert(
        "작업 등록에 실패했습니다."
      );

      return;
    }

    setTasks((prev) => [
      newTask,
      ...prev,
    ]);

    setNewTitle("");

    setExpandedTaskId(
      newTask.id
    );
  };

  // --------------------------------------------------------------------------
  // Subtask 추가
  // --------------------------------------------------------------------------

  const addSubtask = async (
    taskId: string,
    title: string
  ) => {
    if (!title.trim()) {
      return;
    }

    const task = tasks.find(
      (t) => t.id === taskId
    );

    if (!task) return;

    const subtasks: Subtask[] = [
      ...(task.subtasks || []),
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        isCompleted: false,
      },
    ];

    const { error } =
      await supabase
        .from("tasks")
        .update({
          subtasks,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", taskId);

    if (error) {
      console.error(
        "하위 작업 추가 실패:",
        error
      );

      alert(
        "하위 작업 추가에 실패했습니다."
      );

      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks,
            }
          : task
      )
    );
  };

  // --------------------------------------------------------------------------
  // Subtask 체크
  // --------------------------------------------------------------------------

  const toggleSubtask = async (
    taskId: string,
    subtaskId: string
  ) => {
    const task = tasks.find(
      (t) => t.id === taskId
    );

    if (!task) return;

    const subtasks =
      (task.subtasks || []).map(
        (subtask) =>
          subtask.id ===
          subtaskId
            ? {
                ...subtask,
                isCompleted:
                  !subtask.isCompleted,
              }
            : subtask
      );

    const { error } =
      await supabase
        .from("tasks")
        .update({
          subtasks,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", taskId);

    if (error) {
      console.error(
        "체크리스트 변경 실패:",
        error
      );

      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks,
            }
          : task
      )
    );
  };

  // --------------------------------------------------------------------------
  // Subtask 삭제
  // --------------------------------------------------------------------------

  const deleteSubtask = async (
    taskId: string,
    subtaskId: string
  ) => {
    const task = tasks.find(
      (t) => t.id === taskId
    );

    if (!task) return;

    const subtasks =
      (task.subtasks || []).filter(
        (subtask) =>
          subtask.id !==
          subtaskId
      );

    const { error } =
      await supabase
        .from("tasks")
        .update({
          subtasks,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", taskId);

    if (error) {
      console.error(
        "체크리스트 삭제 실패:",
        error
      );

      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks,
            }
          : task
      )
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          테이블 상세 관리
        </h1>

        <p className="page-subtitle">
          테이블 내에서
          직관적으로 수정 및
          삭제가 가능하며,
          행을 클릭하면 하단에
          세부사항과 하위
          체크리스트가 열립니다.
        </p>
      </div>

      {/* ================================================================ */}
      {/* 새 작업 등록 */}
      {/* ================================================================ */}

      <div
        className="glass-card"
        style={{
          padding: "24px",
          marginBottom:
            "24px",
        }}
      >
        <h2
          style={{
            fontSize:
              "1.1rem",
            fontWeight: 700,
            marginBottom:
              "16px",
          }}
        >
          ➕ 새 작업 빠른 등록
        </h2>

        <form
          onSubmit={
            handleAddTask
          }
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "2fr 1fr 1fr 1fr auto",
            gap: "12px",
            alignItems:
              "center",
          }}
        >
          <input
            className="form-input"
            type="text"
            placeholder="작업 제목 입력..."
            value={newTitle}
            onChange={(e) =>
              setNewTitle(
                e.target
                  .value
              )
            }
            required
          />

          <select
            className="form-select"
            value={newStatus}
            onChange={(e) =>
              setNewStatus(
                e.target
                  .value as TaskStatus
              )
            }
          >
            <option value="todo">
              ⏳ 진행해야 되는 일
            </option>

            <option value="in_progress">
              🚀 진행 중인 일
            </option>

            <option value="done">
              ✅ 완료한 일
            </option>
          </select>

          <input
            className="form-input"
            type="date"
            value={
              newStartDate
            }
            onChange={(e) =>
              setNewStartDate(
                e.target
                  .value
              )
            }
          />

          <input
            className="form-input"
            type="date"
            value={
              newEndDate
            }
            onChange={(e) =>
              setNewEndDate(
                e.target
                  .value
              )
            }
          />

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: "auto",
              padding:
                "0 24px",
              height:
                "42px",
            }}
          >
            등록
          </button>
        </form>
      </div>

      {/* ================================================================ */}
      {/* Task 테이블 */}
      {/* ================================================================ */}

      <div
        className="glass-card"
        style={{
          padding: "20px",
          overflowX:
            "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
            textAlign:
              "left",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom:
                  "2px solid #e2e8f0",
                height: "45px",
                color:
                  "#64748b",
                fontSize:
                  "0.9rem",
              }}
            >
              <th
                style={{
                  width:
                    "40px",
                  textAlign:
                    "center",
                }}
              />

              <th>
                작업 제목
                (클릭 시 상세 열기)
              </th>

              <th
                style={{
                  width:
                    "160px",
                }}
              >
                상태
              </th>

              <th
                style={{
                  width:
                    "135px",
                }}
              >
                시작일
              </th>

              <th
                style={{
                  width:
                    "135px",
                }}
              >
                종료일
              </th>

              <th
                style={{
                  width:
                    "100px",
                }}
              >
                하위 체크
              </th>

              <th
                style={{
                  width:
                    "70px",
                  textAlign:
                    "center",
                }}
              >
                관리
              </th>
            </tr>
          </thead>

          <tbody>
            {tasks.map(
              (task) => {
                const isExpanded =
                  expandedTaskId ===
                  task.id;

                const completedSubtasks =
                  task.subtasks?.filter(
                    (s) =>
                      s.isCompleted
                  ).length ||
                  0;

                const totalSubtasks =
                  task.subtasks
                    ?.length ||
                  0;

                return (
                  <React.Fragment
                    key={
                      task.id
                    }
                  >
                    <tr
                      style={{
                        borderBottom:
                          isExpanded
                            ? "none"
                            : "1px solid #f1f5f9",
                        height:
                          "55px",
                        background:
                          isExpanded
                            ? "#f8fafc"
                            : "transparent",
                        cursor:
                          "pointer",
                      }}
                      onClick={() =>
                        toggleExpand(
                          task.id
                        )
                      }
                    >
                      <td
                        style={{
                          textAlign:
                            "center",
                          color:
                            "#64748b",
                        }}
                      >
                        {isExpanded
                          ? "▼"
                          : "▶"}
                      </td>

                      <td
                        style={{
                          fontWeight:
                            600,
                          padding:
                            "0 8px",
                        }}
                      >
                        <input
                          className="form-input"
                          style={{
                            border:
                              "none",
                            background:
                              "transparent",
                            fontWeight:
                              600,
                            padding:
                              "4px 8px",
                          }}
                          value={
                            task.title
                          }
                          onClick={(
                            e
                          ) =>
                            e.stopPropagation()
                          }
                          onChange={(
                            e
                          ) =>
                            updateTaskField(
                              task.id,
                              "title",
                              e
                                .target
                                .value
                            )
                          }
                        />
                      </td>

                      <td
                        onClick={(
                          e
                        ) =>
                          e.stopPropagation()
                        }
                      >
                        <select
                          className="form-select"
                          style={{
                            padding:
                              "4px 8px",
                            fontSize:
                              "0.85rem",
                          }}
                          value={
                            task.status
                          }
                          onChange={(
                            e
                          ) =>
                            updateTaskField(
                              task.id,
                              "status",
                              e
                                .target
                                .value as TaskStatus
                            )
                          }
                        >
                          <option value="todo">
                            ⏳ 진행해야 되는 일
                          </option>

                          <option value="in_progress">
                            🚀 진행 중인 일
                          </option>

                          <option value="done">
                            ✅ 완료한 일
                          </option>
                        </select>
                      </td>

                      <td
                        onClick={(
                          e
                        ) =>
                          e.stopPropagation()
                        }
                      >
                        <input
                          type="date"
                          className="form-input"
                          style={{
                            padding:
                              "4px 8px",
                            fontSize:
                              "0.85rem",
                          }}
                          value={
                            task.startDate
                          }
                          onChange={(
                            e
                          ) =>
                            updateTaskField(
                              task.id,
                              "startDate",
                              e
                                .target
                                .value
                            )
                          }
                        />
                      </td>

                      <td
                        onClick={(
                          e
                        ) =>
                          e.stopPropagation()
                        }
                      >
                        <input
                          type="date"
                          className="form-input"
                          style={{
                            padding:
                              "4px 8px",
                            fontSize:
                              "0.85rem",
                          }}
                          value={
                            task.endDate
                          }
                          onChange={(
                            e
                          ) =>
                            updateTaskField(
                              task.id,
                              "endDate",
                              e
                                .target
                                .value
                            )
                          }
                        />
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize:
                              "0.85rem",
                            color:
                              totalSubtasks >
                              0
                                ? "#2563eb"
                                : "#94a3b8",
                          }}
                        >
                          ☑️{" "}
                          {
                            completedSubtasks
                          }
                          /
                          {
                            totalSubtasks
                          }
                        </span>
                      </td>

                      <td
                        style={{
                          textAlign:
                            "center",
                        }}
                        onClick={(
                          e
                        ) =>
                          e.stopPropagation()
                        }
                      >
                        <button
                          className="btn-mini"
                          style={{
                            color:
                              "#ef4444",
                            fontSize:
                              "1rem",
                          }}
                          onClick={() =>
                            deleteTask(
                              task.id
                            )
                          }
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr
                        style={{
                          background:
                            "#f8fafc",
                          borderBottom:
                            "2px solid #e2e8f0",
                        }}
                      >
                        <td
                          colSpan={
                            7
                          }
                          style={{
                            padding:
                              "16px 24px 24px 48px",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "1fr 1fr",
                              gap:
                                "24px",
                            }}
                          >
                            <div>
                              <label className="form-label">
                                📝 세부 상세설명
                              </label>

                              <textarea
                                className="form-input"
                                rows={
                                  5
                                }
                                placeholder="상세 내용을 입력하세요..."
                                value={
                                  task.description ||
                                  ""
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateTaskField(
                                    task.id,
                                    "description",
                                    e
                                      .target
                                      .value
                                  )
                                }
                                style={{
                                  background:
                                    "#fff",
                                }}
                              />
                            </div>

                            <div>
                              <label className="form-label">
                                ☑️ 하위 체크리스트 관리
                              </label>

                              <SubtaskInlineManager
                                subtasks={
                                  task.subtasks ||
                                  []
                                }
                                onAdd={(
                                  title
                                ) =>
                                  addSubtask(
                                    task.id,
                                    title
                                  )
                                }
                                onToggle={(
                                  subtaskId
                                ) =>
                                  toggleSubtask(
                                    task.id,
                                    subtaskId
                                  )
                                }
                                onDelete={(
                                  subtaskId
                                ) =>
                                  deleteSubtask(
                                    task.id,
                                    subtaskId
                                  )
                                }
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// Subtask Inline Manager
// ============================================================================

function SubtaskInlineManager({
  subtasks,
  onAdd,
  onToggle,
  onDelete,
}: {
  subtasks: Subtask[];
  onAdd: (
    title: string
  ) => void;
  onToggle: (
    id: string
  ) => void;
  onDelete: (
    id: string
  ) => void;
}) {
  const [text, setText] =
    useState("");

  const handleAdd = () => {
    if (!text.trim()) {
      return;
    }

    onAdd(text);
    setText("");
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom:
            "8px",
        }}
      >
        <input
          className="form-input"
          style={{
            background:
              "#fff",
          }}
          type="text"
          placeholder="하위 작업 추가 후 Enter..."
          value={text}
          onChange={(e) =>
            setText(
              e.target.value
            )
          }
          onKeyDown={(e) => {
            if (
              e.key ===
              "Enter"
            ) {
              e.preventDefault();
              handleAdd();
            }
          }}
        />

        <button
          type="button"
          className="btn-primary"
          style={{
            width: "auto",
          }}
          onClick={
            handleAdd
          }
        >
          추가
        </button>
      </div>

      <div
        style={{
          display:
            "flex",
          flexDirection:
            "column",
          gap: "6px",
          maxHeight:
            "150px",
          overflowY:
            "auto",
        }}
      >
        {subtasks.map(
          (subtask) => (
            <div
              key={
                subtask.id
              }
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                background:
                  "#fff",
                padding:
                  "6px 10px",
                borderRadius:
                  "6px",
                border:
                  "1px solid #e2e8f0",
              }}
            >
              <label
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "8px",
                  fontSize:
                    "0.85rem",
                  cursor:
                    "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    subtask.isCompleted
                  }
                  onChange={() =>
                    onToggle(
                      subtask.id
                    )
                  }
                />

                <span
                  style={{
                    textDecoration:
                      subtask.isCompleted
                        ? "line-through"
                        : "none",
                    color:
                      subtask.isCompleted
                        ? "#94a3b8"
                        : "inherit",
                  }}
                >
                  {
                    subtask.title
                  }
                </span>
              </label>

              <button
                type="button"
                className="btn-mini"
                style={{
                  color:
                    "#ef4444",
                }}
                onClick={() =>
                  onDelete(
                    subtask.id
                  )
                }
              >
                ✕
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Task Modal
// ============================================================================

function TaskModal({
  task,
  defaultStartDate,
  defaultStatus,
  onClose,
  onSave,
}: {
  task?: Task | null;
  defaultStartDate: string;
  defaultStatus: TaskStatus;
  onClose: () => void;
  onSave: (
    taskData: Omit<
      Task,
      "id"
    > & {
      id?: string;
    }
  ) => void;
}) {
  const [title, setTitle] =
    useState(
      task?.title || ""
    );

  const [
    description,
    setDescription,
  ] = useState(
    task?.description || ""
  );

  const [
    startDate,
    setStartDate,
  ] = useState(
    task?.startDate ||
      defaultStartDate
  );

  const [endDate, setEndDate] =
    useState(
      task?.endDate ||
        defaultStartDate
    );

  const [status, setStatus] =
    useState<TaskStatus>(
      task?.status ||
        defaultStatus
    );

  const [
    subtasks,
    setSubtasks,
  ] = useState<Subtask[]>(
    task?.subtasks || []
  );

  const [
    newSubtaskTitle,
    setNewSubtaskTitle,
  ] = useState("");

  const handleAddSubtask =
    () => {
      if (
        !newSubtaskTitle.trim()
      ) {
        return;
      }

      setSubtasks((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          title:
            newSubtaskTitle.trim(),
          isCompleted:
            false,
        },
      ]);

      setNewSubtaskTitle("");
    };

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    onSave({
      id: task?.id,
      title: title.trim(),
      description,
      status,
      startDate,
      endDate,
      subtasks,
    });
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: "520px",
          maxHeight:
            "90vh",
          overflowY:
            "auto",
        }}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <h3
          style={{
            marginBottom:
              "16px",
          }}
        >
          {task
            ? "✏️ 할 일 수정"
            : "✨ 새 할 일 작성"}
        </h3>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="form-group">
            <label className="form-label">
              제목
            </label>

            <input
              className="form-input"
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target
                    .value
                )
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              상세설명
            </label>

            <textarea
              className="form-input"
              rows={3}
              value={
                description
              }
              onChange={(e) =>
                setDescription(
                  e.target
                    .value
                )
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              상태
            </label>

            <select
              className="form-select"
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target
                    .value as TaskStatus
                )
              }
            >
              <option value="todo">
                진행해야 되는 일
              </option>

              <option value="in_progress">
                진행 중인 일
              </option>

              <option value="done">
                완료한 일
              </option>
            </select>
          </div>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "12px",
            }}
          >
            <div className="form-group">
              <label className="form-label">
                시작일
              </label>

              <input
                className="form-input"
                type="date"
                value={
                  startDate
                }
                onChange={(e) =>
                  setStartDate(
                    e.target
                      .value
                  )
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                종료일
              </label>

              <input
                className="form-input"
                type="date"
                value={
                  endDate
                }
                onChange={(e) =>
                  setEndDate(
                    e.target
                      .value
                  )
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              하위 체크리스트
            </label>

            <div
              style={{
                display:
                  "flex",
                gap: "8px",
                marginBottom:
                  "8px",
              }}
            >
              <input
                className="form-input"
                type="text"
                placeholder="하위 작업 항목 입력..."
                value={
                  newSubtaskTitle
                }
                onChange={(e) =>
                  setNewSubtaskTitle(
                    e.target
                      .value
                  )
                }
                onKeyDown={(
                  e
                ) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
              />

              <button
                type="button"
                className="btn-primary"
                style={{
                  width: "auto",
                }}
                onClick={
                  handleAddSubtask
                }
              >
                추가
              </button>
            </div>

            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap: "6px",
              }}
            >
              {subtasks.map(
                (subtask) => (
                  <div
                    key={
                      subtask.id
                    }
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      background:
                        "#f8fafc",
                      padding:
                        "6px 10px",
                      borderRadius:
                        "6px",
                    }}
                  >
                    <label
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "8px",
                        fontSize:
                          "0.85rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          subtask.isCompleted
                        }
                        onChange={() =>
                          setSubtasks(
                            (prev) =>
                              prev.map(
                                (
                                  item
                                ) =>
                                  item.id ===
                                  subtask.id
                                    ? {
                                        ...item,
                                        isCompleted:
                                          !item.isCompleted,
                                      }
                                    : item
                              )
                          )
                        }
                      />

                      <span
                        style={{
                          textDecoration:
                            subtask.isCompleted
                              ? "line-through"
                              : "none",
                        }}
                      >
                        {
                          subtask.title
                        }
                      </span>
                    </label>

                    <button
                      type="button"
                      className="btn-mini"
                      style={{
                        color:
                          "#e74c3c",
                      }}
                      onClick={() =>
                        setSubtasks(
                          (prev) =>
                            prev.filter(
                              (
                                item
                              ) =>
                                item.id !==
                                subtask.id
                            )
                        )
                      }
                    >
                      ✕
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          <div
            style={{
              display:
                "flex",
              gap: "8px",
              marginTop:
                "20px",
            }}
          >
            <button
              type="button"
              className="btn-primary"
              style={{
                background:
                  "#cbd5e1",
                color:
                  "#475569",
              }}
              onClick={
                onClose
              }
            >
              취소
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}