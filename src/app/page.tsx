"use client";

import React, { useState, useEffect } from "react";

// ============================================================================
// TypeScript 인터페이스 정의
// ============================================================================
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  subtasks?: Subtask[];
}

const STORAGE_KEY = "TASK_DIARY_TASKS_V1";

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    title: "프로젝트 기획서 작성",
    description: "요구사항 정의서 작성 및 메인 화면 와이어프레임 설계 진행",
    status: "done",
    startDate: "2026-09-14",
    endDate: "2026-09-14",
    subtasks: [
      { id: "s1", title: "와이어프레임 검토", isCompleted: true },
      { id: "s2", title: "팀원 공유", isCompleted: true },
    ],
  },
  {
    id: "2",
    title: "CSS3 UI 반응형 구현",
    description: "데스크톱 및 모바일 햄버거 메뉴 레이아웃 대응",
    status: "in_progress",
    startDate: "2026-09-14",
    endDate: "2026-09-16",
    subtasks: [
      { id: "s3", title: "사이드바 트랜지션 처리", isCompleted: true },
      { id: "s4", title: "미디어 쿼리 테스트", isCompleted: false },
    ],
  },
  {
    id: "3",
    title: "캘린더 타임라인 연동 테스트",
    description: "날짜 셀 클릭 시 이벤트 발동 및 타임라인 오버레이 검증",
    status: "todo",
    startDate: "2026-09-15",
    endDate: "2026-09-18",
    subtasks: [],
  },
];

type ActiveTab = "dashboard" | "kanban" | "calendar" | "table";

export default function DiaryApp() {
  // 📌 기본 최상위 탭을 dashboard로 설정
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 모달 상태 (칸반, 대시보드, 캘린더에서 세부 수정용)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [selectedDate, setSelectedDate] = useState<string>("2026-09-14");

  const tabNames: Record<ActiveTab, string> = {
    dashboard: "📊 전체 대시보드",
    kanban: "📋 투두 칸반 보드",
    calendar: "📅 캘린더 및 타임라인",
    table: "📑 테이블 상세 관리",
  };

  // 1. LocalStorage 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        setTasks(INITIAL_TASKS);
      }
    } else {
      setTasks(INITIAL_TASKS);
    }
    setIsLoaded(true);
  }, []);

  // 2. LocalStorage 저장
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const moveTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const saveTask = (taskData: Omit<Task, "id"> & { id?: string }) => {
    if (taskData.id) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskData.id ? ({ ...t, ...taskData } as Task) : t))
      );
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskData.title,
        description: taskData.description || "",
        status: taskData.status,
        startDate: taskData.startDate,
        endDate: taskData.endDate,
        subtasks: taskData.subtasks || [],
      };
      setTasks((prev) => [newTask, ...prev]);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleOpenAddModal = (status: TaskStatus = "todo", date: string = "2026-09-14") => {
    setEditingTask(null);
    setDefaultStatus(status);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  if (!isLoaded) return null;

  return (
    <div className="app-layout">
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* 📌 사이드바 메뉴: 대시보드를 최상위로 배치 */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div>
          <div className="sidebar-logo">
            📅 <span>TaskDiary</span>
          </div>
          <ul className="nav-menu">
            <li
              className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => handleTabChange("dashboard")}
            >
              📊 전체 대시보드
            </li>
            <li
              className={`nav-item ${activeTab === "kanban" ? "active" : ""}`}
              onClick={() => handleTabChange("kanban")}
            >
              📋 칸반 보드
            </li>
            <li
              className={`nav-item ${activeTab === "calendar" ? "active" : ""}`}
              onClick={() => handleTabChange("calendar")}
            >
              📅 캘린더
            </li>
            <li
              className={`nav-item ${activeTab === "table" ? "active" : ""}`}
              onClick={() => handleTabChange("table")}
            >
              📑 테이블 목록 관리
            </li>
          </ul>
        </div>
      </aside>

      {/* 🖥️ 메인 콘텐트 */}
      <div className="main-wrapper">
        <header className="app-header">
          <button
            className="hamburger-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="메뉴 열기"
          >
            ☰
          </button>
          <div className="current-page-title">{tabNames[activeTab]}</div>
        </header>

        <main className="main-content">
          {activeTab === "dashboard" && (
            <DashboardView tasks={tasks} onTaskClick={handleOpenEditModal} />
          )}

          {activeTab === "kanban" && (
            <KanbanView
              tasks={tasks}
              onMoveStatus={moveTaskStatus}
              onDeleteTask={deleteTask}
              onTaskClick={handleOpenEditModal}
              onOpenAddModal={(status) => handleOpenAddModal(status, "2026-09-14")}
              onQuickAdd={(title, status) => {
                saveTask({
                  title,
                  status,
                  startDate: "2026-09-14",
                  endDate: "2026-09-14",
                  description: "",
                  subtasks: [],
                });
              }}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarView
              tasks={tasks}
              onTaskClick={handleOpenEditModal}
              onSelectDate={(date) => handleOpenAddModal("todo", date)}
            />
          )}

          {activeTab === "table" && <TableView tasks={tasks} setTasks={setTasks} />}
        </main>
      </div>

      {/* ➕ 카드/캘린더/대시보드 뷰에서 세부사항 수정 시 사용되는 팝업 모달 */}
      {isModalOpen && (
        <TaskModal
          task={editingTask}
          defaultStartDate={selectedDate}
          defaultStatus={defaultStatus}
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
// 1. 대시보드 뷰 (최상위 배치)
// ============================================================================
function DashboardView({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (task: Task) => void }) {
  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const today = new Date("2026-09-14");
  const next5Days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">전체 대시보드</h1>
        <p className="page-subtitle">작업 진행률 및 앞으로 5일간의 일정을 종합 관리합니다.</p>
      </div>

      <div className="stat-widgets">
        <div className="stat-box">
          <div className="stat-label">전체 달성률</div>
          <div className="stat-value">{completionRate}%</div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">진행 중인 작업</div>
          <div className="stat-value" style={{ color: "var(--color-progress)" }}>{inProgressCount}건</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">대기 중인 작업</div>
          <div className="stat-value" style={{ color: "var(--color-todo)" }}>{todoCount}건</div>
        </div>
      </div>

      <div className="glass-card upcoming-section">
        <h3>📅 Upcoming 5 Days</h3>
        <div className="five-days-grid">
          {next5Days.map((dateStr, idx) => {
            const dayTasks = tasks.filter((t) => dateStr >= t.startDate && dateStr <= t.endDate);

            return (
              <div key={dateStr} className={`day-card ${idx === 0 ? "today" : ""}`}>
                <div className="day-header">
                  <div className="day-name">{idx === 0 ? "오늘" : `${idx}일 후`}</div>
                  <div className="day-number">{dateStr.slice(5)}</div>
                </div>
                <div className="day-tasks">
                  {dayTasks.length > 0 ? (
                    dayTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`mini-task-item ${t.status}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => onTaskClick(t)}
                      >
                        {t.title}
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#a0aec0" }}>일정 없음</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. 칸반보드 뷰
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
  onMoveStatus: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onOpenAddModal: (status: TaskStatus) => void;
  onQuickAdd: (title: string, status: TaskStatus) => void;
}) {
  const [quickInputs, setQuickInputs] = useState<Record<TaskStatus, string>>({
    todo: "",
    in_progress: "",
    done: "",
  });

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) onMoveStatus(taskId, status);
  };

  const handleQuickSubmit = (e: React.FormEvent, status: TaskStatus) => {
    e.preventDefault();
    const val = quickInputs[status].trim();
    if (!val) return;
    onQuickAdd(val, status);
    setQuickInputs((prev) => ({ ...prev, [status]: "" }));
  };

  const renderColumn = (title: string, status: TaskStatus, dotClass: string) => {
    const columnTasks = tasks.filter((t) => t.status === status);

    return (
      <div
        className="kanban-column"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        <div className="column-header">
          <div className="column-title-group">
            <span className={`status-dot ${dotClass}`} />
            <span className="column-title">{title}</span>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span className="task-count">{columnTasks.length}</span>
            <button className="btn-mini" title="상세 작성" onClick={() => onOpenAddModal(status)}>
              ➕
            </button>
          </div>
        </div>

        <form onSubmit={(e) => handleQuickSubmit(e, status)} style={{ marginBottom: "12px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="+ 빠른 등록 후 Enter"
            value={quickInputs[status]}
            onChange={(e) => setQuickInputs({ ...quickInputs, [status]: e.target.value })}
            style={{ fontSize: "0.8rem", padding: "8px 10px" }}
          />
        </form>

        <div className="kanban-tasks">
          {columnTasks.map((task) => {
            const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
            const totalSubtasks = task.subtasks?.length || 0;

            return (
              <div
                key={task.id}
                className="task-card"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
                onClick={() => onTaskClick(task)}
                style={{ cursor: "pointer" }}
              >
                <div className="task-card-header">
                  <div className="task-title">{task.title}</div>
                  <button
                    className="btn-mini"
                    style={{ color: "#e74c3c" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                  >
                    ✕
                  </button>
                </div>

                {task.description && (
                  <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "4px 0 8px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    📝 {task.description}
                  </p>
                )}

                <div className="task-meta">
                  <span>{task.startDate === task.endDate ? task.startDate : `${task.startDate} ~ ${task.endDate}`}</span>
                  {totalSubtasks > 0 && (
                    <span className="timeline-badge" style={{ background: "#e2e8f0", color: "#334155" }}>
                      ☑️ {completedSubtasks}/{totalSubtasks}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">투두 칸반 보드</h1>
        <p className="page-subtitle">드래그 앤 드롭으로 상태를 변경하거나 카드를 클릭하여 수정하세요.</p>
      </div>
      <div className="kanban-board">
        {renderColumn("진행해야 되는 일", "todo", "dot-todo")}
        {renderColumn("진행 중인 일", "in_progress", "dot-progress")}
        {renderColumn("완료한 일", "done", "dot-done")}
      </div>
    </div>
  );
}

// ============================================================================
// 3. 캘린더 뷰
// ============================================================================
function CalendarView({
  tasks,
  onTaskClick,
  onSelectDate,
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onSelectDate: (date: string) => void;
}) {
  const dates = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    return `2026-09-${day < 10 ? `0${day}` : day}`;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">캘린더 및 타임라인</h1>
        <p className="page-subtitle">날짜 셀을 클릭하여 새 할 일을 추가하고 일정을 모니터링하세요.</p>
      </div>

      <div className="calendar-container">
        <div className="calendar-header">
          <h2>2026년 9월</h2>
        </div>
        <div className="calendar-grid">
          {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
            <div key={w} className="weekday-header">{w}</div>
          ))}

          {dates.map((dateStr) => {
            const dayNum = parseInt(dateStr.split("-")[2]);
            const dayTasks = tasks.filter((t) => dateStr >= t.startDate && dateStr <= t.endDate);

            return (
              <div key={dateStr} className="calendar-cell" onClick={() => onSelectDate(dateStr)}>
                <div className={`cell-date ${dateStr === "2026-09-14" ? "today" : ""}`}>{dayNum}</div>
                <div className="cell-tasks">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="timeline-bar"
                      style={{
                        opacity: t.status === "done" ? 0.6 : 1,
                        textDecoration: t.status === "done" ? "line-through" : "none",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(t);
                      }}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. 테이블 뷰 (직접 수정 & 펼침 상세 관리)
// ============================================================================
function TableView({
  tasks,
  setTasks,
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<TaskStatus>("todo");
  const [newStartDate, setNewStartDate] = useState("2026-09-14");
  const [newEndDate, setNewEndDate] = useState("2026-09-14");

  const toggleExpand = (id: string) => {
    setExpandedTaskId((prev) => (prev === id ? null : id));
  };

  const deleteTask = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (expandedTaskId === id) setExpandedTaskId(null);
  };

  const updateTaskField = <K extends keyof Task>(id: string, field: K, value: Task[K]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: "",
      status: newStatus,
      startDate: newStartDate,
      endDate: newEndDate,
      subtasks: [],
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTitle("");
    setExpandedTaskId(newTask.id);
  };

  const addSubtask = (taskId: string, title: string) => {
    if (!title.trim()) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const subtasks = t.subtasks || [];
          return {
            ...t,
            subtasks: [...subtasks, { id: Date.now().toString(), title: title.trim(), isCompleted: false }],
          };
        }
        return t;
      })
    );
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const subtasks = (t.subtasks || []).map((s) =>
            s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
          );
          return { ...t, subtasks };
        }
        return t;
      })
    );
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId),
          };
        }
        return t;
      })
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">테이블 상세 관리</h1>
        <p className="page-subtitle">
          테이블 내에서 직관적으로 수정 및 삭제가 가능하며, 행을 클릭하면 하단에 세부사항과 하위 체크리스트가 열립니다.
        </p>
      </div>

      <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>
          ➕ 새 작업 빠른 등록
        </h2>
        <form onSubmit={handleAddTask} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "center" }}>
          <input
            className="form-input"
            type="text"
            placeholder="작업 제목 입력..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <select
            className="form-select"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
          >
            <option value="todo">⏳ 진행해야 되는 일</option>
            <option value="in_progress">🚀 진행 중인 일</option>
            <option value="done">✅ 완료한 일</option>
          </select>
          <input
            className="form-input"
            type="date"
            value={newStartDate}
            onChange={(e) => setNewStartDate(e.target.value)}
          />
          <input
            className="form-input"
            type="date"
            value={newEndDate}
            onChange={(e) => setNewEndDate(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0 24px", height: "42px" }}>
            등록
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: "20px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", height: "45px", color: "#64748b", fontSize: "0.9rem" }}>
              <th style={{ width: "40px", textAlign: "center" }}></th>
              <th>작업 제목 (클릭 시 상세 열기)</th>
              <th style={{ width: "160px" }}>상태</th>
              <th style={{ width: "135px" }}>시작일</th>
              <th style={{ width: "135px" }}>종료일</th>
              <th style={{ width: "100px" }}>하위 체크</th>
              <th style={{ width: "70px", textAlign: "center" }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const isExpanded = expandedTaskId === task.id;
              const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
              const totalSubtasks = task.subtasks?.length || 0;

              return (
                <React.Fragment key={task.id}>
                  <tr
                    style={{
                      borderBottom: isExpanded ? "none" : "1px solid #f1f5f9",
                      height: "55px",
                      background: isExpanded ? "#f8fafc" : "transparent",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleExpand(task.id)}
                  >
                    <td style={{ textAlign: "center", color: "#64748b" }}>
                      {isExpanded ? "▼" : "▶"}
                    </td>
                    <td style={{ fontWeight: 600, padding: "0 8px" }}>
                      <input
                        className="form-input"
                        style={{ border: "none", background: "transparent", fontWeight: 600, padding: "4px 8px" }}
                        value={task.title}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateTaskField(task.id, "title", e.target.value)}
                      />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        className="form-select"
                        style={{ padding: "4px 8px", fontSize: "0.85rem" }}
                        value={task.status}
                        onChange={(e) => updateTaskField(task.id, "status", e.target.value as TaskStatus)}
                      >
                        <option value="todo">⏳ 진행해야 되는 일</option>
                        <option value="in_progress">🚀 진행 중인 일</option>
                        <option value="done">✅ 완료한 일</option>
                      </select>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="date"
                        className="form-input"
                        style={{ padding: "4px 8px", fontSize: "0.85rem" }}
                        value={task.startDate}
                        onChange={(e) => updateTaskField(task.id, "startDate", e.target.value)}
                      />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="date"
                        className="form-input"
                        style={{ padding: "4px 8px", fontSize: "0.85rem" }}
                        value={task.endDate}
                        onChange={(e) => updateTaskField(task.id, "endDate", e.target.value)}
                      />
                    </td>
                    <td>
                      <span style={{ fontSize: "0.85rem", color: totalSubtasks > 0 ? "#2563eb" : "#94a3b8" }}>
                        ☑️ {completedSubtasks}/{totalSubtasks}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-mini"
                        style={{ color: "#ef4444", fontSize: "1rem" }}
                        onClick={() => deleteTask(task.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <td colSpan={7} style={{ padding: "16px 24px 24px 48px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                          <div>
                            <label className="form-label">📝 세부 상세설명 (Description / Memo)</label>
                            <textarea
                              className="form-input"
                              rows={5}
                              placeholder="상세 내용을 입력하세요..."
                              value={task.description || ""}
                              onChange={(e) => updateTaskField(task.id, "description", e.target.value)}
                              style={{ background: "#fff" }}
                            />
                          </div>

                          <div>
                            <label className="form-label">☑️ 하위 체크리스트 관리</label>
                            <SubtaskInlineManager
                              subtasks={task.subtasks || []}
                              onAdd={(title) => addSubtask(task.id, title)}
                              onToggle={(subtaskId) => toggleSubtask(task.id, subtaskId)}
                              onDelete={(subtaskId) => deleteSubtask(task.id, subtaskId)}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// SubtaskInlineManager
function SubtaskInlineManager({
  subtasks,
  onAdd,
  onToggle,
  onDelete,
}: {
  subtasks: Subtask[];
  onAdd: (title: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    onAdd(text);
    setText("");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input
          className="form-input"
          style={{ background: "#fff" }}
          type="text"
          placeholder="하위 작업 추가 후 Enter..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button type="button" className="btn-primary" style={{ width: "auto" }} onClick={handleAdd}>
          추가
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
        {subtasks.map((st) => (
          <div
            key={st.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fff",
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="checkbox" checked={st.isCompleted} onChange={() => onToggle(st.id)} />
              <span style={{ textDecoration: st.isCompleted ? "line-through" : "none", color: st.isCompleted ? "#94a3b8" : "inherit" }}>
                {st.title}
              </span>
            </label>
            <button type="button" className="btn-mini" style={{ color: "#ef4444" }} onClick={() => onDelete(st.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 팝업 모달 (칸반/캘린더/대시보드 뷰용)
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
  onSave: (taskData: Omit<Task, "id"> & { id?: string }) => void;
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [startDate, setStartDate] = useState(task?.startDate || defaultStartDate);
  const [endDate, setEndDate] = useState(task?.endDate || defaultStartDate);
  const [status, setStatus] = useState<TaskStatus>(task?.status || defaultStatus);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: Date.now().toString(), title: newSubtaskTitle.trim(), isCompleted: false },
    ]);
    setNewSubtaskTitle("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ id: task?.id, title, description, status, startDate, endDate, subtasks });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: "520px", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: "16px" }}>{task ? "✏️ 할 일 수정" : "✨ 새 할 일 작성"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">제목</label>
            <input className="form-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">상세설명</label>
            <textarea className="form-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">상태</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              <option value="todo">진행해야 되는 일</option>
              <option value="in_progress">진행 중인 일</option>
              <option value="done">완료한 일</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">시작일</label>
              <input className="form-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">종료일</label>
              <input className="form-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">하위 체크리스트</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input
                className="form-input"
                type="text"
                placeholder="하위 작업 항목 입력..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
              />
              <button type="button" className="btn-primary" style={{ width: "auto" }} onClick={handleAddSubtask}>
                추가
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {subtasks.map((st) => (
                <div key={st.id} style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "6px 10px", borderRadius: "6px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                    <input type="checkbox" checked={st.isCompleted} onChange={() => setSubtasks(subtasks.map((s) => s.id === st.id ? { ...s, isCompleted: !s.isCompleted } : s))} />
                    <span style={{ textDecoration: st.isCompleted ? "line-through" : "none" }}>{st.title}</span>
                  </label>
                  <button type="button" className="btn-mini" style={{ color: "#e74c3c" }} onClick={() => setSubtasks(subtasks.filter((s) => s.id !== st.id))}>✕</button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
            <button type="button" className="btn-primary" style={{ background: "#cbd5e1", color: "#475569" }} onClick={onClose}>취소</button>
            <button type="submit" className="btn-primary">저장하기</button>
          </div>
        </form>
      </div>
    </div>
  );
}