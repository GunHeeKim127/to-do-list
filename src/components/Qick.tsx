"use client";

import React, { useMemo, useState } from "react";
import { getTaskProgress } from "../app/func/progress";
import { Plan, Priority, Task, TaskStatus } from "../app/types/task";
import { DEFAULT_TAGS, getTagClassName, isDefaultTag, TagCategory } from "../app/func/tag";
import { ExecutionLogPanel } from "./ExecutionLogPanel";

interface Props {
  tasks: Task[];
  plans: Plan[];
  onOpenAddModal: () => void;
  onOpenEditModal: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskCompleted: (taskId: string) => void;
}

const statusLabel = (status: TaskStatus) => status === "done" ? "완료" : status === "in_progress" ? "진행 중" : "진행 예정";
const priorityLabel = (priority?: Priority) => priority === "high" ? "높음" : priority === "low" ? "낮음" : "보통";
const priorityValue = (priority?: Priority) => priority === "high" ? 3 : priority === "medium" ? 2 : 1;

export function TableView({ tasks, plans, onOpenAddModal, onOpenEditModal, onDeleteTask, onTaskCompleted }: Props) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [tagFilter, setTagFilter] = useState<"all" | TagCategory>("all");
  const [sortKey, setSortKey] = useState<"due" | "priority" | "created">("due");

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = tasks.filter((task) =>
      (!query || task.title.toLowerCase().includes(query) || (task.description || "").toLowerCase().includes(query)) &&
      (statusFilter === "all" || task.status === statusFilter) &&
      (priorityFilter === "all" || (task.priority || "medium") === priorityFilter) &&
      (tagFilter === "all" || (tagFilter === "기타"
        ? (task.tags || []).some((tag) => !isDefaultTag(tag))
        : (task.tags || []).includes(tagFilter)))
    );
    return [...filtered].sort((a, b) => {
      if (sortKey === "priority") return priorityValue(b.priority) - priorityValue(a.priority) || a.title.localeCompare(b.title);
      if (sortKey === "created") return (b.createdAt || "").localeCompare(a.createdAt || "") || a.title.localeCompare(b.title);
      return (a.dueDate || a.endDate).localeCompare(b.dueDate || b.endDate) || priorityValue(b.priority) - priorityValue(a.priority) || a.title.localeCompare(b.title);
    });
  }, [tasks, search, statusFilter, priorityFilter, tagFilter, sortKey]);

  const selectedPlan = selectedTask?.planId ? plans.find((plan) => plan.id === selectedTask.planId) : undefined;
  const progress = selectedTask ? getTaskProgress(selectedTask) : null;

  return <div className="table-view">
    <div className="glass-card task-control-card">
      <div className="task-filter-row">
        <input className="form-input" placeholder="제목 또는 내용으로 할 일 검색" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | TaskStatus)}>
          <option value="all">상태 전체</option><option value="todo">진행해야 되는 일</option><option value="in_progress">진행 중인 일</option><option value="done">완료한 일</option>
        </select>
        <select className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as "all" | Priority)}>
          <option value="all">우선순위 전체</option><option value="high">높음</option><option value="medium">보통</option><option value="low">낮음</option>
        </select>
        <select className="form-select" aria-label="태그 분류" value={tagFilter} onChange={(e) => setTagFilter(e.target.value as "all" | TagCategory)}>
          <option value="all">태그 전체</option>{DEFAULT_TAGS.map((tag) => <option key={tag} value={tag}>{tag}</option>)}<option value="기타">기타</option>
        </select>
        <select className="form-select" value={sortKey} onChange={(e) => setSortKey(e.target.value as "due" | "priority" | "created")}>
          <option value="due">정렬: 마감일순</option><option value="priority">정렬: 우선순위순</option><option value="created">정렬: 생성일순</option>
        </select>
        <button type="button" className="btn-primary table-add-button" onClick={onOpenAddModal}>＋ 할 일 추가</button>
      </div>
      <div className="active-sort-label">검색 결과 <strong>{visibleTasks.length}건</strong> · 현재 정렬 기준: <strong>{sortKey === "due" ? "마감일순 → 우선순위 → 제목" : sortKey === "priority" ? "우선순위순 → 제목" : "생성일순 → 제목"}</strong></div>
    </div>

    {visibleTasks.length === 0 ? <div className="glass-card table-empty">조건에 맞는 작업이 없습니다.</div> :
      <div className="task-card-grid">{visibleTasks.map((task) =>
        <button type="button" className="task-list-card" key={task.id} onClick={() => setSelectedTask(task)} aria-label={`${task.title} 상세 보기`}>
          <div className="task-list-tags">{(task.tags || []).length ? task.tags!.map((tag) => <span className={getTagClassName(tag)} key={tag}>#{tag}</span>) : <span className="empty-tag">태그 없음</span>}</div>
          <h2>{task.title}</h2>
          <div className="task-list-card-bottom"><span className={`task-status task-status-${task.status}`}>{statusLabel(task.status)}</span><span>{task.startDate} ~ {task.endDate}</span></div>
        </button>)}</div>}

    {selectedTask && <div className="modal-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedTask(null); }}>
      <section className="task-read-modal" role="dialog" aria-modal="true" aria-labelledby="task-read-title">
        <div className="task-read-header"><div><span className={`task-status task-status-${selectedTask.status}`}>{statusLabel(selectedTask.status)}</span><h2 id="task-read-title">{selectedTask.title}</h2></div><button type="button" className="modal-close" aria-label="상세 닫기" onClick={() => setSelectedTask(null)}>×</button></div>
        <div className="task-read-body">
          <dl className="task-read-summary">
            <div><dt>메인 계획</dt><dd>{selectedPlan?.title || "연결 없음"}</dd></div><div><dt>기간</dt><dd>{selectedTask.startDate} ~ {selectedTask.endDate}</dd></div>
            <div><dt>마감일</dt><dd>{selectedTask.dueDate || selectedTask.endDate}</dd></div><div><dt>우선순위</dt><dd>{priorityLabel(selectedTask.priority)}</dd></div>
            <div><dt>예상 시간</dt><dd>{selectedTask.estimatedTime || 0}분</dd></div><div><dt>진행률</dt><dd>{progress?.percent || 0}%{progress && progress.total > 0 ? ` (${progress.completed}/${progress.total})` : ""}</dd></div>
          </dl>
          <div className="task-read-section"><h3>태그</h3><div className="task-list-tags">{(selectedTask.tags || []).length ? selectedTask.tags!.map((tag) => <span className={getTagClassName(tag)} key={tag}>#{tag}</span>) : <span className="empty-tag">태그 없음</span>}</div></div>
          <div className="task-read-section"><h3>상세 내용</h3><p>{selectedTask.description || "작성된 상세 내용이 없습니다."}</p></div>
          <div className="task-read-section"><h3>체크리스트</h3>{(selectedTask.subtasks || []).length ? <ul className="task-read-checklist">{selectedTask.subtasks!.map((item) => <li key={item.id} className={item.isCompleted ? "completed" : ""}>{item.isCompleted ? "✓" : "○"} {item.title}</li>)}</ul> : <p>등록된 체크리스트가 없습니다.</p>}</div>
          <ExecutionLogPanel taskId={selectedTask.id} onCompleted={() => { onTaskCompleted(selectedTask.id); setSelectedTask((current) => current ? { ...current, status: "done" } : current); }} />
        </div>
        <div className="task-read-actions"><button type="button" className="btn-mini" onClick={() => { const task = selectedTask; setSelectedTask(null); onOpenEditModal(task); }}>수정</button><button type="button" className="btn-mini danger" onClick={() => { const id = selectedTask.id; setSelectedTask(null); onDeleteTask(id); }}>삭제</button><button type="button" className="btn-primary" onClick={() => setSelectedTask(null)}>닫기</button></div>
      </section>
    </div>}
  </div>;
}
