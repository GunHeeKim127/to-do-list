"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getTodayString } from "../app/func/date";
import { createTask, deleteTask as deleteTaskDB, getDeletedTasks, restoreTask, updateTask, updateTaskSubtasks } from "../app/func/task";
import { getPlans } from "../app/func/plan";
import { Task, TaskStatus, Subtask, Priority, Plan } from "../app/types/task";
import { SubtaskInlineManager } from "./SupabaseClients";
import { ExecutionLogPanel } from "./ExecutionLogPanel";

export function TableView({ tasks, setTasks }: { tasks: Task[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>> }) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<TaskStatus>("todo");
  const [newStartDate, setNewStartDate] = useState(getTodayString());
  const [newEndDate, setNewEndDate] = useState(getTodayString());
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newTags, setNewTags] = useState("");
  const [newEstimated, setNewEstimated] = useState(0);
  const [newPlanId, setNewPlanId] = useState<string>("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [tagFilter, setTagFilter] = useState("");
  const [sortKey, setSortKey] = useState<"due" | "priority" | "created">("due");
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);

  useEffect(() => { getPlans().then(setPlans); }, []);

  const priorityValue = (p?: Priority) => p === "high" ? 3 : p === "medium" ? 2 : 1;

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((t) => {
      const q = search.trim().toLowerCase();
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && (t.priority || "medium") !== priorityFilter) return false;
      if (tagFilter.trim() && !(t.tags || []).some((tag) => tag.toLowerCase().includes(tagFilter.trim().toLowerCase()))) return false;
      return true;
    });
    return [...filtered].sort((a,b) => {
      if (sortKey === "priority") return priorityValue(b.priority) - priorityValue(a.priority) || a.title.localeCompare(b.title);
      if (sortKey === "created") return (b.createdAt || "").localeCompare(a.createdAt || "") || a.title.localeCompare(b.title);
      return (a.dueDate || a.endDate).localeCompare(b.dueDate || b.endDate) || priorityValue(b.priority) - priorityValue(a.priority) || a.title.localeCompare(b.title);
    });
  }, [tasks, search, statusFilter, priorityFilter, tagFilter, sortKey]);

  const loadDeleted = async () => setDeletedTasks(await getDeletedTasks());

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newTitle.trim()) return;
    const newTask = await createTask({
      title: newTitle.trim(), description: "", status: newStatus,
      startDate: newStartDate, endDate: newEndDate, dueDate: newEndDate,
      priority: newPriority, tags: newTags.split(",").map((v)=>v.trim()).filter(Boolean),
      estimatedTime: newEstimated, planId: newPlanId || null, subtasks: [],
    });
    if (!newTask) { alert("작업 등록에 실패했습니다."); return; }
    setTasks((prev) => [newTask, ...prev]); setNewTitle(""); setNewTags(""); setNewEstimated(0); setExpandedTaskId(newTask.id);
  };

  const saveTask = async (id: string, patch: Partial<Task>) => {
    const current = tasks.find((t) => t.id === id); if (!current) return;
    const updated = await updateTask(id, { ...current, ...patch });
    if (!updated) { alert("수정에 실패했습니다."); return; }
    setTasks((prev) => prev.map((t) => t.id === id ? updated : t));
  };

  const remove = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 삭제 후에도 복원할 수 있습니다.")) return;
    if (!(await deleteTaskDB(id))) { alert("삭제에 실패했습니다."); return; }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const restore = async (id: string) => {
    const restored = await restoreTask(id); if (!restored) { alert("복원에 실패했습니다."); return; }
    setTasks((prev) => [restored, ...prev]); setDeletedTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateSubtasks = async (taskId: string, subtasks: Subtask[]) => {
    if (!(await updateTaskSubtasks(taskId, subtasks))) { alert("체크리스트 변경에 실패했습니다."); return; }
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, subtasks } : t));
  };

  return <div>
    <div className="page-header">
      <h1 className="page-title">테이블 상세 관리</h1>
      <p className="page-subtitle">검색·필터·정렬 기준을 화면에 명시하고, 작업을 생성·수정·완료·복원·삭제합니다.</p>
    </div>

    <div className="glass-card task-control-card">
      <div className="task-filter-row">
        <input className="form-input" placeholder="제목 검색" value={search} onChange={(e)=>setSearch(e.target.value)} />
        <select className="form-select" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as any)}><option value="all">상태 전체</option><option value="todo">진행해야 되는 일</option><option value="in_progress">진행 중인 일</option><option value="done">완료한 일</option></select>
        <select className="form-select" value={priorityFilter} onChange={(e)=>setPriorityFilter(e.target.value as any)}><option value="all">우선순위 전체</option><option value="high">높음</option><option value="medium">보통</option><option value="low">낮음</option></select>
        <input className="form-input" placeholder="태그 필터" value={tagFilter} onChange={(e)=>setTagFilter(e.target.value)} />
        <select className="form-select" value={sortKey} onChange={(e)=>setSortKey(e.target.value as any)}><option value="due">정렬: 마감일순</option><option value="priority">정렬: 우선순위순</option><option value="created">정렬: 생성일순</option></select>
      </div>
      <div className="active-sort-label">현재 정렬 기준: <strong>{sortKey === "due" ? "마감일순 → 우선순위 → 제목" : sortKey === "priority" ? "우선순위순 → 제목" : "생성일순 → 제목"}</strong></div>
    </div>

    <div className="glass-card table-add-card">
      <h2 className="table-add-title">➕ 새 작업 빠른 등록</h2>
      <form onSubmit={handleAddTask} className="table-add-form extended-task-form">
        <input className="form-input" placeholder="작업 제목" value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} required />
        <select className="form-select" value={newStatus} onChange={(e)=>setNewStatus(e.target.value as TaskStatus)}><option value="todo">진행해야 되는 일</option><option value="in_progress">진행 중인 일</option><option value="done">완료한 일</option></select>
        <input className="form-input" type="date" value={newStartDate} onChange={(e)=>setNewStartDate(e.target.value)} />
        <input className="form-input" type="date" value={newEndDate} onChange={(e)=>setNewEndDate(e.target.value)} />
        <select className="form-select" value={newPriority} onChange={(e)=>setNewPriority(e.target.value as Priority)}><option value="high">우선순위 높음</option><option value="medium">우선순위 보통</option><option value="low">우선순위 낮음</option></select>
        <input className="form-input" type="number" min="0" placeholder="예상 분" value={newEstimated} onChange={(e)=>setNewEstimated(Number(e.target.value))} />
        <input className="form-input" placeholder="태그: 공부,React" value={newTags} onChange={(e)=>setNewTags(e.target.value)} />
        <select className="form-select" value={newPlanId} onChange={(e)=>setNewPlanId(e.target.value)}><option value="">계획 연결 안 함</option>{plans.map((p)=><option key={p.id} value={p.id}>{p.title}</option>)}</select>
        <button type="submit" className="btn-primary">등록</button>
      </form>
    </div>

    <div className="glass-card table-card">
      {visibleTasks.length === 0 ? <p>조건에 맞는 작업이 없습니다.</p> : visibleTasks.map((task) => {
        const expanded = expandedTaskId === task.id;
        const priority = task.priority || "medium";
        return <div className={`task-manager-row ${expanded ? "expanded" : ""}`} key={task.id}>
          <div className="task-manager-main" onClick={()=>setExpandedTaskId(expanded ? null : task.id)}>
            <span>{expanded ? "▼" : "▶"}</span><strong>{task.title}</strong><span className={`priority-badge priority-${priority}`}>{priority}</span><span>{task.status}</span><span>마감 {task.dueDate || task.endDate}</span><button className="btn-mini" onClick={(e)=>{e.stopPropagation(); remove(task.id)}}>삭제</button>
          </div>
          {expanded && <div className="task-manager-detail">
            <div className="task-edit-grid">
              <label>제목<input className="form-input" value={task.title} onChange={(e)=>saveTask(task.id,{title:e.target.value})}/></label>
              <label>상태<select className="form-select" value={task.status} onChange={(e)=>saveTask(task.id,{status:e.target.value as TaskStatus})}><option value="todo">진행해야 되는 일</option><option value="in_progress">진행 중인 일</option><option value="done">완료한 일</option></select></label>
              <label>마감일<input className="form-input" type="date" value={task.dueDate || task.endDate} onChange={(e)=>saveTask(task.id,{dueDate:e.target.value,endDate:e.target.value})}/></label>
              <label>우선순위<select className="form-select" value={priority} onChange={(e)=>saveTask(task.id,{priority:e.target.value as Priority})}><option value="high">높음</option><option value="medium">보통</option><option value="low">낮음</option></select></label>
              <label>예상 시간(분)<input className="form-input" type="number" min="0" value={task.estimatedTime || 0} onChange={(e)=>saveTask(task.id,{estimatedTime:Number(e.target.value)})}/></label>
              <label>태그<input className="form-input" value={(task.tags || []).join(", ")} onChange={(e)=>saveTask(task.id,{tags:e.target.value.split(",").map((v)=>v.trim()).filter(Boolean)})}/></label>
            </div>
            <label className="task-description-label">상세 설명<textarea className="form-input" value={task.description || ""} onChange={(e)=>saveTask(task.id,{description:e.target.value})}/></label>
            <div><label className="form-label">☑️ 하위 체크리스트</label><SubtaskInlineManager subtasks={task.subtasks || []} onAdd={(title)=>updateSubtasks(task.id,[...(task.subtasks || []),{id:crypto.randomUUID(),title,isCompleted:false}])} onToggle={(id)=>updateSubtasks(task.id,(task.subtasks || []).map((s)=>s.id===id?{...s,isCompleted:!s.isCompleted}:s))} onDelete={(id)=>updateSubtasks(task.id,(task.subtasks || []).filter((s)=>s.id!==id))}/></div>
            <ExecutionLogPanel taskId={task.id} onCompleted={()=>setTasks((prev)=>prev.map((t)=>t.id===task.id?{...t,status:"done"}:t))}/>
          </div>}
        </div>;
      })}
    </div>

    <div className="glass-card restore-card">
      <div><h2 className="section-title">삭제된 작업 복원</h2><p>삭제는 DB에서 즉시 지우지 않고 deleted_at을 남겨 복원할 수 있습니다.</p></div>
      <button className="btn-primary" onClick={async()=>{await loadDeleted();setShowDeleted(true)}}>삭제 목록 불러오기</button>
      {showDeleted && <div className="deleted-task-list">{deletedTasks.length===0?<p>삭제된 작업이 없습니다.</p>:deletedTasks.map((t)=><div className="deleted-task-row" key={t.id}><span>{t.title}</span><span>{t.deletedAt ? new Date(t.deletedAt).toLocaleString("ko-KR") : ""}</span><button className="btn-mini" onClick={()=>restore(t.id)}>복원</button></div>)}</div>}
    </div>
  </div>;
}
