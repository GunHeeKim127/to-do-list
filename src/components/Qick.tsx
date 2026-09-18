"use client"

import react, { useState } from "react";
import { Task, TaskStatus, Subtask } from "../app/types/task";
import { getTodayString } from "../app/func/date";
import { supabase } from "../app/lib/supabase";
import React from "react";
import {SubtaskInlineManager} from "./SupabaseClients"

// ============================================================================
// 4. Table
// ============================================================================
export function TableView({
  tasks,
  setTasks,
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<TaskStatus>("todo");
  const [newStartDate, setNewStartDate] = useState(getTodayString());
  const [newEndDate, setNewEndDate] = useState(getTodayString());

  const toggleExpand = (id: string) => {
    setExpandedTaskId((prev) => (prev === id ? null : id));
  };

  const deleteTask = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      console.error("Task 삭제 실패:", error);
      alert("삭제에 실패했습니다.");
      return;
    }

    setTasks((prev) => prev.filter((task) => task.id !== id));
    if (expandedTaskId === id) setExpandedTaskId(null);
  };

  const updateTaskField = async <K extends keyof Task>(
    id: string,
    field: K,
    value: Task[K]
  ) => {
    const currentTask = tasks.find((task) => task.id === id);
    if (!currentTask) return;

    const updatedTask: Task = { ...currentTask, [field]: value };

    const { error } = await supabase
      .from("tasks")
      .update({
        title: updatedTask.title,
        description: updatedTask.description || "",
        status: updatedTask.status,
        start_date: updatedTask.startDate,
        end_date: updatedTask.endDate,
        subtasks: updatedTask.subtasks || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Task 수정 실패:", error);
      alert("수정에 실패했습니다.");
      return;
    }

    setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      description: "",
      status: newStatus,
      startDate: newStartDate,
      endDate: newEndDate,
      subtasks: [],
    };

    const { error } = await supabase.from("tasks").insert({
      id: newTask.id,
      title: newTask.title,
      description: "",
      status: newTask.status,
      start_date: newTask.startDate,
      end_date: newTask.endDate,
      subtasks: [],
    });

    if (error) {
      console.error("Task 등록 실패:", error);
      alert("작업 등록에 실패했습니다.");
      return;
    }

    setTasks((prev) => [newTask, ...prev]);
    setNewTitle("");
    setExpandedTaskId(newTask.id);
  };

  const addSubtask = async (taskId: string, title: string) => {
    if (!title.trim()) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const subtasks: Subtask[] = [
      ...(task.subtasks || []),
      { id: crypto.randomUUID(), title: title.trim(), isCompleted: false },
    ];

    const { error } = await supabase
      .from("tasks")
      .update({ subtasks, updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) {
      console.error("하위 작업 추가 실패:", error);
      alert("하위 작업 추가에 실패했습니다.");
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, subtasks } : t)));
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const subtasks = (task.subtasks || []).map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, isCompleted: !subtask.isCompleted } : subtask
    );

    const { error } = await supabase
      .from("tasks")
      .update({ subtasks, updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) {
      console.error("체크리스트 변경 실패:", error);
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, subtasks } : t)));
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const subtasks = (task.subtasks || []).filter((subtask) => subtask.id !== subtaskId);

    const { error } = await supabase
      .from("tasks")
      .update({ subtasks, updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) {
      console.error("체크리스트 삭제 실패:", error);
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, subtasks } : t)));
  };

  return (
    <div>
      {/* CSS 미디어 쿼리 정의 (인라인 Style 태그로 분리) */}
      <style>{`
        /* 데스크톱 (1250px 초과): 테이블 표시, 카드는 숨김 */
        .desktop-table-container { display: block; }
        .mobile-card-container { display: none; }

        /* 1250px 이하: 테이블 숨김, 카드 리스트 표시 */
        @media (max-width: 1250px) {
          .desktop-table-container { display: none !important; }
          .mobile-card-container { display: flex !important; flex-direction: column; gap: 12px; }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">테이블 상세 관리</h1>
        <p className="page-subtitle">
          테이블 및 카드 뷰를 통해 직관적으로 작업을 관리할 수 있으며, 클릭 시 하단에 세부사항과 체크리스트가 열립니다.
        </p>
      </div>

      {/* 새 작업 빠른 등록 폼 */}
      <div className="glass-card table-add-card">
        <h2 className="table-add-title">➕ 새 작업 빠른 등록</h2>
        <form onSubmit={handleAddTask} className="table-add-form">
          <input
            className="form-input table-add-input"
            type="text"
            placeholder="작업 제목 입력..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <select
            className="form-select table-add-select"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
          >
            <option value="todo">⏳ 진행해야 되는 일</option>
            <option value="in_progress">🚀 진행 중인 일</option>
            <option value="done">✅ 완료한 일</option>
          </select>

          <input
            className="form-input table-add-date"
            type="date"
            value={newStartDate}
            onChange={(e) => setNewStartDate(e.target.value)}
          />

          <input
            className="form-input table-add-date"
            type="date"
            value={newEndDate}
            onChange={(e) => setNewEndDate(e.target.value)}
          />

          <button type="submit" className="btn-primary table-add-btn">
            등록
          </button>
        </form>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 💻 1. 데스크톱 뷰 (1250px 초과 시 표출) */}
      {/* ------------------------------------------------------------------ */}
      <div className="glass-card table-card desktop-table-container" style={{ padding: "12px" }}>
        <table className="custom-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr className="table-header-row" style={{ borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ width: "36px", textAlign: "center" }} />
              <th style={{ minWidth: "200px", textAlign: "left", padding: "10px" }}>작업 제목</th>
              <th style={{ width: "200px", textAlign: "left", padding: "10px" }}>상태</th>
              <th style={{ width: "180px", textAlign: "left", padding: "10px" }}>기간 (시작 ~ 종료)</th>
              <th style={{ width: "90px", textAlign: "center", padding: "10px" }}>하위 체크</th>
              <th style={{ width: "60px", textAlign: "center", padding: "10px" }}>관리</th>
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
                    className={`table-body-row ${isExpanded ? "expanded" : ""}`}
                    onClick={() => toggleExpand(task.id)}
                    style={{ cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ textAlign: "center", color: "#64748b" }}>
                      {isExpanded ? "▼" : "▶"}
                    </td>

                    <td style={{ padding: "8px", minWidth: "200px" }} onClick={(e) => e.stopPropagation()}>
                      <input
                        className="form-input table-title-input"
                        style={{ width: "100%" }}
                        value={task.title}
                        onChange={(e) => updateTaskField(task.id, "title", e.target.value)}
                      />
                    </td>

                    <td style={{ padding: "8px", width: "200px" }} onClick={(e) => e.stopPropagation()}>
                      <select
                        className="form-select"
                        style={{ width: "100%", padding: "6px 8px", fontSize: "0.85rem" }}
                        value={task.status}
                        onChange={(e) =>
                          updateTaskField(task.id, "status", e.target.value as TaskStatus)
                        }
                      >
                        <option value="todo">⏳ 진행해야 되는 일</option>
                        <option value="in_progress">🚀 진행 중인 일</option>
                        <option value="done">✅ 완료한 일</option>
                      </select>
                    </td>

                    <td style={{ padding: "8px" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", width: "24px" }}>시작</span>
                          <input
                            type="date"
                            className="form-input"
                            style={{ padding: "2px 4px", fontSize: "0.75rem", width: "100%" }}
                            value={task.startDate}
                            onChange={(e) => updateTaskField(task.id, "startDate", e.target.value)}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", width: "24px" }}>종료</span>
                          <input
                            type="date"
                            className="form-input"
                            style={{ padding: "2px 4px", fontSize: "0.75rem", width: "100%" }}
                            value={task.endDate}
                            onChange={(e) => updateTaskField(task.id, "endDate", e.target.value)}
                          />
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: totalSubtasks > 0 ? "#2563eb" : "#94a3b8",
                          fontWeight: 600,
                        }}
                      >
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
                      <td colSpan={6} style={{ padding: "16px 20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                          <div>
                            <label className="form-label" style={{ fontWeight: 600, marginBottom: "6px", display: "block" }}>📝 세부 상세설명</label>
                            <textarea
                              className="form-input"
                              rows={4}
                              placeholder="상세 내용을 입력하세요..."
                              value={task.description || ""}
                              onChange={(e) =>
                                updateTaskField(task.id, "description", e.target.value)
                              }
                              style={{ width: "100%", background: "#fff" }}
                            />
                          </div>

                          <div>
                            <label className="form-label" style={{ fontWeight: 600, marginBottom: "6px", display: "block" }}>☑️ 하위 체크리스트 관리</label>
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

      {/* ------------------------------------------------------------------ */}
      {/* 📱 2. 모바일/태블릿 카드 뷰 (1250px 이하 시 자동 전환) */}
      {/* ------------------------------------------------------------------ */}
      <div className="mobile-card-container">
        {tasks.map((task) => {
          const isExpanded = expandedTaskId === task.id;
          const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
          const totalSubtasks = task.subtasks?.length || 0;

          return (
            <div
              key={task.id}
              className="glass-card"
              style={{
                padding: "16px",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* 카드 상단: 제목 & 삭제 버튼 */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                <input
                  className="form-input"
                  style={{ flex: 1, fontWeight: 600, fontSize: "0.95rem" }}
                  value={task.title}
                  onChange={(e) => updateTaskField(task.id, "title", e.target.value)}
                  placeholder="작업 제목"
                />
                <button
                  className="btn-mini"
                  style={{ color: "#ef4444", fontSize: "1.1rem", padding: "4px 8px" }}
                  onClick={() => deleteTask(task.id)}
                >
                  🗑️
                </button>
              </div>

              {/* 카드 중단: 상태 & 기간 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginBottom: "4px" }}>상태</span>
                  <select
                    className="form-select"
                    style={{ width: "100%", padding: "6px 8px", fontSize: "0.85rem" }}
                    value={task.status}
                    onChange={(e) => updateTaskField(task.id, "status", e.target.value as TaskStatus)}
                  >
                    <option value="todo">⏳ 진행해야 되는 일</option>
                    <option value="in_progress">🚀 진행 중인 일</option>
                    <option value="done">✅ 완료한 일</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>기간</span>
                  <input
                    type="date"
                    className="form-input"
                    style={{ padding: "4px 6px", fontSize: "0.75rem" }}
                    value={task.startDate}
                    onChange={(e) => updateTaskField(task.id, "startDate", e.target.value)}
                  />
                  <input
                    type="date"
                    className="form-input"
                    style={{ padding: "4px 6px", fontSize: "0.75rem" }}
                    value={task.endDate}
                    onChange={(e) => updateTaskField(task.id, "endDate", e.target.value)}
                  />
                </div>
              </div>

              {/* 카드 하단: 펼침 토글 버튼 */}
              <button
                onClick={() => toggleExpand(task.id)}
                style={{
                  width: "100%",
                  padding: "8px",
                  fontSize: "0.85rem",
                  color: "#3b82f6",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span>{isExpanded ? "▼ 상세내용 닫기" : "▶ 상세내용 & 체크리스트 열기"}</span>
                <span style={{ fontSize: "0.8rem", color: "#2563eb" }}>
                  (☑️ {completedSubtasks}/{totalSubtasks})
                </span>
              </button>

              {/* 모바일 세부 상세 펼침 영역 */}
              {isExpanded && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ marginBottom: "12px" }}>
                    <label className="form-label" style={{ fontWeight: 600, marginBottom: "6px", display: "block" }}>📝 세부 상세설명</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="상세 내용을 입력하세요..."
                      value={task.description || ""}
                      onChange={(e) => updateTaskField(task.id, "description", e.target.value)}
                      style={{ width: "100%", background: "#fff" }}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 600, marginBottom: "6px", display: "block" }}>☑️ 하위 체크리스트</label>
                    <SubtaskInlineManager
                      subtasks={task.subtasks || []}
                      onAdd={(title) => addSubtask(task.id, title)}
                      onToggle={(subtaskId) => toggleSubtask(task.id, subtaskId)}
                      onDelete={(subtaskId) => deleteSubtask(task.id, subtaskId)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
