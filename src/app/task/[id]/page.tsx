"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// Task 인터페이스 정의
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

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 폼 입력 state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // 1. LocalStorage에서 해당 Task 가져오기
  useEffect(() => {
    if (!taskId) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const tasks: Task[] = JSON.parse(saved);
        const targetTask = tasks.find((t) => t.id === taskId);
        if (targetTask) {
          setTask(targetTask);
          setTitle(targetTask.title);
          setDescription(targetTask.description || "");
          setStatus(targetTask.status);
          setStartDate(targetTask.startDate);
          setEndDate(targetTask.endDate);
          setSubtasks(targetTask.subtasks || []);
        }
      } catch (e) {
        console.error("데이터 로드 중 오류 발생:", e);
      }
    }
    setIsLoaded(true);
  }, [taskId]);

  // 2. 전체 Task 리스트에 변경사항 업데이트 및 저장
  const handleSave = (updatedSubtasks = subtasks) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || !taskId) return;

    try {
      const tasks: Task[] = JSON.parse(saved);
      const updatedTasks = tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            title,
            description,
            status,
            startDate,
            endDate,
            subtasks: updatedSubtasks,
          };
        }
        return t;
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
      alert("성공적으로 저장되었습니다.");
    } catch (e) {
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  // 삭제 처리
  const handleDelete = () => {
    if (!confirm("정말 이 할 일을 삭제하시겠습니까?")) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const tasks: Task[] = JSON.parse(saved);
      const filtered = tasks.filter((t) => t.id !== taskId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      router.push("/");
    }
  };

  // 체크리스트 추가
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const nextSubtasks = [
      ...subtasks,
      { id: Date.now().toString(), title: newSubtaskTitle.trim(), isCompleted: false },
    ];
    setSubtasks(nextSubtasks);
    setNewSubtaskTitle("");
  };

  // 체크리스트 토글
  const handleToggleSubtask = (id: string) => {
    const nextSubtasks = subtasks.map((st) =>
      st.id === id ? { ...st, isCompleted: !st.isCompleted } : st
    );
    setSubtasks(nextSubtasks);
  };

  // 체크리스트 삭제
  const handleDeleteSubtask = (id: string) => {
    const nextSubtasks = subtasks.filter((st) => st.id !== id);
    setSubtasks(nextSubtasks);
  };

  if (!isLoaded) return <div style={{ padding: "40px" }}>로딩 중...</div>;

  if (!task) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>해당 작업을 찾을 수 없습니다.</h2>
        <button
          className="btn-primary"
          style={{ width: "auto", marginTop: "16px" }}
          onClick={() => router.push("/")}
        >
          메인 화면으로 돌아가기
        </button>
      </div>
    );
  }

  const completedCount = subtasks.filter((s) => s.isCompleted).length;
  const progressPercent =
    subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      {/* 상단 네비게이션 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <button
          className="btn-primary"
          style={{ background: "#cbd5e1", color: "#334155", width: "auto" }}
          onClick={() => router.push("/")}
        >
          ← 메인 목록으로 돌아가기
        </button>
        <button
          className="btn-primary"
          style={{ background: "#ef4444", width: "auto" }}
          onClick={handleDelete}
        >
          🗑️ 삭제하기
        </button>
      </div>

      {/* 상세 컨텐츠 영역 (Glassmorphism 카드) */}
      <div className="glass-card" style={{ padding: "32px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
          <span className={`status-dot dot-${status === "in_progress" ? "progress" : status}`} />
          <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>
            {status === "todo" ? "진행해야 되는 일" : status === "in_progress" ? "진행 중인 일" : "완료한 일"}
          </span>
        </div>

        {/* 제목 수정 */}
        <div className="form-group">
          <label className="form-label">작업 제목</label>
          <input
            className="form-input"
            style={{ fontSize: "1.25rem", fontWeight: 700 }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 날짜 및 상태 설정 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
          <div className="form-group">
            <label className="form-label">상태</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="todo">진행해야 되는 일</option>
              <option value="in_progress">진행 중인 일</option>
              <option value="done">완료한 일</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">시작일</label>
            <input
              className="form-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">종료일</label>
            <input
              className="form-input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* 상세설명 / 메모 */}
        <div className="form-group">
          <label className="form-label">세부 상세설명 (Description / Memo)</label>
          <textarea
            className="form-input"
            rows={5}
            placeholder="상세한 작업 내용, 관련 링크, 참고사항을 작성하세요..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: "vertical", lineHeight: 1.6 }}
          />
        </div>

        {/* 하위 체크리스트 영역 */}
        <div className="form-group" style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label className="form-label" style={{ margin: 0 }}>
              하위 체크리스트 ({completedCount}/{subtasks.length})
            </label>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>달성률 {progressPercent}%</span>
          </div>

          <div className="progress-bar-bg" style={{ marginBottom: "16px" }}>
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input
              className="form-input"
              type="text"
              placeholder="새로운 세부 작업 항목 입력 후 Enter..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
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
              style={{ width: "auto", padding: "0 20px" }}
              onClick={handleAddSubtask}
            >
              추가
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {subtasks.map((st) => (
              <div
                key={st.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f8fafc",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.95rem", cursor: "pointer", flex: 1 }}>
                  <input
                    type="checkbox"
                    style={{ width: "18px", height: "18px" }}
                    checked={st.isCompleted}
                    onChange={() => handleToggleSubtask(st.id)}
                  />
                  <span style={{ textDecoration: st.isCompleted ? "line-through" : "none", color: st.isCompleted ? "#94a3b8" : "#1e293b" }}>
                    {st.title}
                  </span>
                </label>
                <button
                  type="button"
                  className="btn-mini"
                  style={{ color: "#ef4444", fontSize: "1rem" }}
                  onClick={() => handleDeleteSubtask(st.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 저장 버튼 */}
        <div style={{ marginTop: "32px", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn-primary"
            style={{ width: "200px", padding: "12px 0", fontSize: "1rem" }}
            onClick={() => handleSave()}
          >
            💾 변경사항 저장하기
          </button>
        </div>
      </div>
    </div>
  );
}