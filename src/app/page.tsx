"use client";

import React, { useEffect, useState } from "react";
import {
  Task,
  TaskStatus,
  Subtask,
  ActiveTab,
  Priority,
  Plan,
} from "./types/task";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask as deleteTaskFromDB,
  updateTaskStatus,} from "./func/task"
import { getTodayString } from "./func/date";
import { getPlans } from "./func/plan";
import { DashboardView } from "../components/DashboardView";
import { KanbanView } from "../components/Kaborn";
import { CalendarView } from "../components/Callendar";
import { TableView } from "../components/Qick";
import { PlanView } from "../components/PlanView";
import { ReviewView } from "../components/ReviewView";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

// ============================================================================
// Supabase → Task 변환
// ============================================================================

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

  // ==========================================================================
  // 1. Supabase에서 Task 불러오기
  // ==========================================================================

  useEffect(() => {
    const load = async () => {
      const data = await getTasks();

      setTasks(data);
      setIsLoaded(true);
    };

    load();
  }, []);

  // ==========================================================================
  // 2. Task 상태 변경
  // ==========================================================================

  const moveTaskStatus = async (
  taskId: string,
  newStatus: TaskStatus
) => {
  const success = await updateTaskStatus(
    taskId,
    newStatus
  );

  if (!success) {
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

  const success =
    await deleteTaskFromDB(taskId);

  if (!success) {
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
    // 기존 Task 수정
    if (taskData.id) {
      const updatedTask = await updateTask(
        taskData.id,
        taskData
      );

      if (!updatedTask) {
        alert("저장에 실패했습니다.");
        return;
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === updatedTask.id
            ? updatedTask
            : task
        )
      );
    }

    // 새 Task 생성
    else {
      const newTask = await createTask(
        taskData
      );

      if (!newTask) {
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
      {/* ================================================================ */}
      {/* 사이드바 */}
      {/* ================================================================ */}

      <Sidebar
        activeTab={activeTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onTabChange={handleTabChange}
      />

      {/* ================================================================ */}
      {/* 메인 */}
      {/* ================================================================ */}

      <div className="main-wrapper">
        <Header
          activeTab={activeTab}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() =>
            setIsSidebarOpen((prev) => !prev)
          }
        />

        <main className="main-content">
          <div className="public-warning" role="note">
            지금은 로그인이 없어 링크를 아는 사람은 누구나 볼 수 있습니다. 남이 봐도 괜찮은 내용만 넣으세요
          </div>
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
              onOpenAddModal={() =>
                handleOpenAddModal(
                  "todo",
                  getTodayString()
                )
              }
              onOpenEditModal={handleOpenEditModal}
              onDeleteTask={deleteTask}
            />
          )}

          {activeTab === "plans" && <PlanView />}

          {activeTab === "review" && (
            <ReviewView
              tasks={tasks}
              onGoToPlans={() => setActiveTab("plans")}
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
// Task Modal
// ============================================================================

const DUMMY_ESTIMATED_TIME: Record<Priority, number> = {
  high: 120,
  medium: 60,
  low: 30,
};

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
    taskData: Omit<Task, "id"> & {
      id?: string;
    }
  ) => void;
}) {
  const initialPriority: Priority =
    task?.priority || "medium";

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(
    task?.description || ""
  );
  const [startDate, setStartDate] = useState(
    task?.startDate || defaultStartDate
  );
  const [endDate, setEndDate] = useState(
    task?.endDate || defaultStartDate
  );
  const [status, setStatus] = useState<TaskStatus>(
    task?.status || defaultStatus
  );
  const [priority, setPriority] =
    useState<Priority>(initialPriority);
  const [estimatedTime, setEstimatedTime] = useState(
    task?.estimatedTime && task.estimatedTime > 0
      ? task.estimatedTime
      : DUMMY_ESTIMATED_TIME[initialPriority]
  );
  const [tags, setTags] = useState(
    (task?.tags || []).join(", ")
  );
  const [planId, setPlanId] = useState(
    task?.planId || ""
  );
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>(
    task?.subtasks || []
  );
  const [newSubtaskTitle, setNewSubtaskTitle] =
    useState("");

  useEffect(() => {
    getPlans().then(setPlans);
  }, []);

  const handlePriorityChange = (
    nextPriority: Priority
  ) => {
    setPriority(nextPriority);
    setEstimatedTime(
      DUMMY_ESTIMATED_TIME[nextPriority]
    );
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) {
      return;
    }

    setSubtasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: newSubtaskTitle.trim(),
        isCompleted: false,
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
      dueDate: endDate,
      priority,
      estimatedTime,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      planId: planId || null,
      subtasks,
      deletedAt: task?.deletedAt || null,
      createdAt: task?.createdAt,
      updatedAt: task?.updatedAt,
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
          width: "560px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: "16px" }}>
          {task
            ? "✏️ 할 일 수정"
            : "✨ 새 할 일 작성"}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              제목
            </label>
            <input
              className="form-input"
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
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
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div className="form-group">
              <label className="form-label">
                상태
              </label>
              <select
                className="form-select"
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as TaskStatus
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

            <div className="form-group">
              <label className="form-label">
                우선순위
              </label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) =>
                  handlePriorityChange(
                    e.target.value as Priority
                  )
                }
              >
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              연결 계획
            </label>
            <select
              className="form-select"
              value={planId}
              onChange={(e) =>
                setPlanId(e.target.value)
              }
            >
              <option value="">
                계획 연결 안 함
              </option>
              {plans.map((plan) => (
                <option
                  key={plan.id}
                  value={plan.id}
                >
                  {plan.title}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
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
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                종료일 / 마감일
              </label>
              <input
                className="form-input"
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div className="form-group">
              <label className="form-label">
                예상 시간(분)
              </label>
              <input
                className="form-input"
                type="number"
                value={estimatedTime}
                readOnly
              />
              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                  color: "#94a3b8",
                  lineHeight: 1.4,
                }}
              >
                임시 기준: 높음 120분 · 보통 60분 · 낮음 30분
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">
                태그
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="공부, React, 운동"
                value={tags}
                onChange={(e) =>
                  setTags(e.target.value)
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
                display: "flex",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <input
                className="form-input"
                type="text"
                placeholder="하위 작업 항목 입력..."
                value={newSubtaskTitle}
                onChange={(e) =>
                  setNewSubtaskTitle(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
              />

              <button
                type="button"
                className="btn-primary"
                style={{ width: "auto" }}
                onClick={handleAddSubtask}
              >
                추가
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    background: "#f8fafc",
                    padding: "6px 10px",
                    borderRadius: "6px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={subtask.isCompleted}
                      onChange={() =>
                        setSubtasks((prev) =>
                          prev.map((item) =>
                            item.id === subtask.id
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
                      {subtask.title}
                    </span>
                  </label>

                  <button
                    type="button"
                    className="btn-mini"
                    style={{ color: "#e74c3c" }}
                    onClick={() =>
                      setSubtasks((prev) =>
                        prev.filter(
                          (item) =>
                            item.id !== subtask.id
                        )
                      )
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "20px",
            }}
          >
            <button
              type="button"
              className="btn-primary"
              style={{
                background: "#cbd5e1",
                color: "#475569",
              }}
              onClick={onClose}
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

