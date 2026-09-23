"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { DEFAULT_TAGS, getTagClassName } from "./func/tag";
import { getPlans } from "./func/plan";
import { DashboardView } from "../components/DashboardView";
import { TodayView } from "../components/TodayView";
import { KanbanView } from "../components/Kaborn";
import { CalendarView } from "../components/Callendar";
import { TableView } from "../components/Qick";
import { PlanView } from "../components/PlanView";
import { TrashView } from "../components/TrashView";
import { LoadingState } from "../components/LoadingState";
import { PlanHistoryView } from "../components/PlanHistoryView";
import { DailyCheckView } from "../components/DailyCheckView";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

// ============================================================================
// Supabase → Task 변환
// ============================================================================

export default function DiaryApp() {
  const [activeTab, setActiveTab] =
    useState<ActiveTab>("dashboard");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultPlanId, setDefaultPlanId] = useState<string>("");
  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [defaultStatus, setDefaultStatus] =
    useState<TaskStatus>("todo");

  const [selectedDate, setSelectedDate] =
    useState<string>(getTodayString());

  // ==========================================================================
  // 1. Supabase에서 Task 불러오기
  // ==========================================================================

  const loadData = async () => {
    const [taskData, planData] = await Promise.all([getTasks(), getPlans()]);
    setTasks(taskData);
    setPlans(planData);
    setIsLoaded(true);
  };

  useEffect(() => {
    void loadData();
  }, []);

  // ==========================================================================
  // 2. Task 상태 변경
  // ==========================================================================

  const moveTaskStatus = async (
  taskId: string,
  newStatus: TaskStatus
) => {
  const updatedTask = await updateTaskStatus(
    taskId,
    newStatus
  );

  if (!updatedTask) {
    alert("상태 변경에 실패했습니다.");
    return;
  }

  setTasks((prev) =>
    prev.map((task) =>
      task.id === taskId
        ? updatedTask
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
    date: string = getTodayString(),
    planId: string = ""
  ) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setSelectedDate(date);
    setDefaultPlanId(planId);
    setIsModalOpen(true);
  };

  // ==========================================================================
  // Task 수정 모달
  // ==========================================================================

  const handleOpenEditModal = (
    task: Task
  ) => {
    setDefaultPlanId(task.planId || "");
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
          {!isLoaded && <LoadingState label="할 일과 계획을 불러오는 중..." />}
          {/* ========================================================== */}
          {/* Dashboard */}
          {/* ========================================================== */}

          {isLoaded && activeTab === "dashboard" && (
            <DashboardView
              tasks={tasks}
              plans={plans}
              onManagePlan={() => handleTabChange("plans")}
              onCreatePlan={(description) => { localStorage.setItem("taskdiary-improvement", description); handleTabChange("plans"); }}
              onTaskClick={
                handleOpenEditModal
              }
            />
          )}

          {isLoaded && activeTab === "today" && (
            <div>
              <TodayView
                tasks={tasks}
                plans={plans}
                onManagePlan={() => handleTabChange("plans")}
                onEditTask={handleOpenEditModal}
                onAddTask={() => handleOpenAddModal("todo", getTodayString())}
              />
              <details className="workspace-disclosure">
                <summary><span>✅ 완료 여부 확인</span><small>선택 날짜의 완료·미완료와 하루 미루기</small></summary>
                <div className="workspace-disclosure-body">
                  <DailyCheckView tasks={tasks} plans={plans} embedded onTaskChanged={(changed) => setTasks((prev) => prev.map((task) => task.id === changed.id ? changed : task))} onEditTask={handleOpenEditModal} />
                </div>
              </details>
            </div>
          )}

          {/* ========================================================== */}
          {/* Kanban */}
          {/* ========================================================== */}
          {isLoaded && (activeTab === "kanban" || activeTab === "calendar" || activeTab === "table") && (
            <nav className="workspace-view-switcher" aria-label="할 일 보기 방식">
              <button className={activeTab === "kanban" ? "active" : ""} onClick={() => handleTabChange("kanban")}>📋 칸반 보드</button>
              <button className={activeTab === "table" ? "active" : ""} onClick={() => handleTabChange("table")}>📑 테이블 목록 관리</button>
              <button className={activeTab === "calendar" ? "active" : ""} onClick={() => handleTabChange("calendar")}>📅 캘린더</button>
            </nav>
          )}

          {isLoaded && activeTab === "kanban" && (
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

          {isLoaded && activeTab === "calendar" && (
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

          {isLoaded && activeTab === "table" && (
            <TableView
              tasks={tasks}
              plans={plans}
              onOpenAddModal={() =>
                handleOpenAddModal(
                  "todo",
                  getTodayString()
                )
              }
              onOpenEditModal={handleOpenEditModal}
              onDeleteTask={deleteTask}
              onTaskCompleted={(taskId) => setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, status: "done" } : task))}
            />
          )}

          {isLoaded && activeTab === "plans" && <div>
            <PlanView
              plans={plans}
              tasks={tasks}
              onPlansChanged={setPlans}
              onAddTask={(planId) => handleOpenAddModal("todo", getTodayString(), planId)}
              onEditTask={handleOpenEditModal}
              onDeleteTask={deleteTask}
            />
            <details className="workspace-disclosure">
              <summary><span>🕘 계획 수정 이력</span><small>언제 무엇이 어떻게 바뀌었는지 확인</small></summary>
              <div className="workspace-disclosure-body"><PlanHistoryView plans={plans} embedded /></div>
            </details>
          </div>}

          {isLoaded && activeTab === "trash" && <TrashView
            onRestored={(task) => setTasks((prev) => [task, ...prev])}
          />}

        </main>
      </div>

      {/* ================================================================ */}
      {/* Task Modal */}
      {/* ================================================================ */}

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          plans={plans}
          defaultPlanId={defaultPlanId}
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
  plans,
  defaultPlanId,
  onClose,
  onSave,
}: {
  task?: Task | null;
  defaultStartDate: string;
  defaultStatus: TaskStatus;
  plans: Plan[];
  defaultPlanId: string;
  onClose: () => void;
  onSave: (
    taskData: Omit<Task, "id"> & {
      id?: string;
    }
  ) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const savingLock = useRef(false);
  const initialPriority: Priority =
    task?.priority || "medium";

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(
    task?.description || ""
  );
  const initialPlan = !task && defaultPlanId
    ? plans.find((plan) => plan.id === defaultPlanId)
    : undefined;
  const [startDate, setStartDate] = useState(
    task?.startDate || initialPlan?.periodStart || defaultStartDate
  );
  const [endDate, setEndDate] = useState(
    task?.endDate || initialPlan?.periodEnd || defaultStartDate
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
  const [estimatedTimeEdited, setEstimatedTimeEdited] = useState(Boolean(task?.estimatedTime && task.estimatedTime > 0));
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState("");
  const [planId, setPlanId] = useState(task?.planId || defaultPlanId);
  const [subtasks, setSubtasks] = useState<Subtask[]>(
    task?.subtasks || []
  );
  const [newSubtaskTitle, setNewSubtaskTitle] =
    useState("");


  const addTag = (value: string) => {
    const normalized = value.trim().replace(/^#/, "");
    if (!normalized) return;

    if (tags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      setTagInput("");
      setTagError("");
      return;
    }
    if (tags.length >= 3) {
      setTagError("태그는 최대 3개까지 선택할 수 있습니다.");
      return;
    }

    setTags((prev) => [...prev, normalized]);
    setTagInput("");
    setTagError("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
    setTagError("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handlePriorityChange = (
    nextPriority: Priority
  ) => {
    setPriority(nextPriority);
    if (!estimatedTimeEdited) setEstimatedTime(DUMMY_ESTIMATED_TIME[nextPriority]);
  };

  const handlePlanChange = (nextPlanId: string) => {
    setPlanId(nextPlanId);
    const selectedPlan = plans.find((plan) => plan.id === nextPlanId);
    if (selectedPlan) {
      setStartDate(selectedPlan.periodStart);
      setEndDate(selectedPlan.periodEnd);
    }
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

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    if (savingLock.current) return;
    if (endDate < startDate) { alert("종료일은 시작일보다 빠를 수 없습니다."); return; }
    savingLock.current = true;
    setSaving(true);
    try { await onSave({
      id: task?.id,
      title: title.trim(),
      description,
      status,
      startDate,
      endDate,
      dueDate: endDate,
      priority,
      estimatedTime,
      tags,
      planId: planId || null,
      subtasks,
      deletedAt: task?.deletedAt || null,
      createdAt: task?.createdAt,
      updatedAt: task?.updatedAt,
    }); } finally { savingLock.current = false; setSaving(false); }
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => { if (!savingLock.current) onClose(); }}
    >
      <div
        className="modal-content"
        role="dialog" aria-modal="true" aria-label={task ? "할 일 수정" : "새 할 일 작성"}
        style={{
          width: "min(620px, calc(100vw - 32px))",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: "16px" }}>
          {task ? "✏️ 할 일 수정" : "✨ 새 할 일 작성"}
        </h3>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={saving} style={{ border: 0, padding: 0, minWidth: 0 }}>
          <div className="form-group">
            <label className="form-label">
              할 일 제목
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
            <label className="form-label" htmlFor="task-plan">소속 메인 계획</label>
            <select id="task-plan" className="form-select" value={planId} onChange={(e) => handlePlanChange(e.target.value)}>
              <option value="">계획을 선택하지 않음</option>
              {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}
            </select>
            <small className="form-help">메인 계획을 선택하면 계획 기간이 자동 입력됩니다. 시작일과 종료일은 아래에서 직접 변경할 수 있습니다.</small>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-description">
              상세설명
            </label>
            <textarea
              id="task-description"
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
              <label className="form-label" htmlFor="task-priority">
                우선순위
              </label>
              <select
                id="task-priority"
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


          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="task-start-date">
                시작일
              </label>
              <input
                id="task-start-date"
                className="form-input"
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-end-date">
                종료일 / 마감일
              </label>
              <input
                id="task-end-date"
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
            className="task-estimate-tag-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "12px",
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="task-estimated-time">
                예상 시간(분)
              </label>
              <input
                id="task-estimated-time"
                className="form-input"
                type="number"
                min="0"
                value={estimatedTime}
                onChange={(e) => { setEstimatedTimeEdited(true); setEstimatedTime(Math.max(0, Number(e.target.value) || 0)); }}
              />
              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                  color: "#94a3b8",
                  lineHeight: 1.4,
                }}
              >
                우선순위를 바꾸면 기본값이 제안되며, 필요한 시간으로 직접 수정할 수 있습니다.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">태그</label>
              <div className="tag-editor">
                <div className="tag-editor-heading"><span>빠른 선택</span><strong>{tags.length}/3</strong></div>
                <div className="tag-quick-select" aria-label="기본 태그 선택">
                  {DEFAULT_TAGS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={`${getTagClassName(tag)} ${tags.includes(tag) ? "selected" : ""}`}
                      aria-pressed={tags.includes(tag)}
                      disabled={!tags.includes(tag) && tags.length >= 3}
                      onClick={() => tags.includes(tag) ? removeTag(tag) : addTag(tag)}
                    >
                      {tags.includes(tag) ? "✓ " : "+ "}{tag}
                    </button>
                  ))}
                </div>
                <div className="tag-list" aria-label="선택한 태그">
                  {tags.map((tag) => (
                    <span className={`task-tag ${getTagClassName(tag)}`} key={tag}>
                      #{tag}
                      <button
                        type="button"
                        aria-label={`${tag} 태그 삭제`}
                        onClick={() => removeTag(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="tag-input-row">
                  <input
                    className="form-input"
                    type="text"
                    placeholder="태그 입력 후 Enter"
                    maxLength={20}
                    disabled={tags.length >= 3}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                  />
                  <button
                    type="button"
                    className="btn-mini"
                    disabled={tags.length >= 3 || !tagInput.trim()}
                    onClick={() => addTag(tagInput)}
                  >
                    + 추가
                  </button>
                </div>
                {tagError && <small className="tag-error" role="alert">{tagError}</small>}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              작은 체크리스트
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
                placeholder="체크리스트 항목 입력..."
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
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}

