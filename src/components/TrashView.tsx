"use client";

import { useCallback, useEffect, useState } from "react";
import { getDeletedTasks, restoreTask } from "../app/func/task";
import { Task } from "../app/types/task";
import { LoadingState } from "./LoadingState";
import { getTagClassName } from "../app/func/tag";

export function TrashView({ onRestored }: { onRestored: (task: Task) => void }) {
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadDeleted = useCallback(async () => {
    setLoading(true);
    setDeletedTasks(await getDeletedTasks());
    setLoading(false);
  }, []);

  useEffect(() => { void loadDeleted(); }, [loadDeleted]);

  const restore = async (taskId: string) => {
    setRestoringId(taskId);
    const restored = await restoreTask(taskId);
    setRestoringId(null);
    if (!restored) return alert("작업 복원에 실패했습니다.");
    setDeletedTasks((prev) => prev.filter((task) => task.id !== taskId));
    onRestored(restored);
  };

  return <div className="trash-view">
    <div className="page-header trash-page-header">
      <div><h1 className="page-title">🗑️ 삭제된 작업</h1><p className="page-subtitle">삭제한 할 일을 확인하고 다시 현재 목록으로 복원합니다.</p></div>
      <button type="button" className="btn-mini" onClick={() => void loadDeleted()} disabled={loading}>새로고침</button>
    </div>

    {loading ? <LoadingState label="삭제된 작업을 불러오는 중..." /> : deletedTasks.length === 0 ?
      <div className="glass-card trash-empty"><strong>삭제된 작업이 없습니다.</strong><p>할 일을 삭제하면 이 페이지에서 다시 복원할 수 있습니다.</p></div> :
      <div className="trash-card-grid">{deletedTasks.map((task) =>
        <article className="trash-task-card" key={task.id}>
          <div><div className="task-list-tags">{(task.tags || []).map((tag) => <span className={getTagClassName(tag)} key={tag}>#{tag}</span>)}</div><h2>{task.title}</h2><p>{task.startDate} ~ {task.endDate}</p><small>삭제한 시각 {task.deletedAt ? new Date(task.deletedAt).toLocaleString("ko-KR") : "확인할 수 없음"}</small></div>
          <button type="button" className="btn-primary" disabled={!!restoringId} onClick={() => void restore(task.id)}>{restoringId === task.id ? "복원 중..." : "복원"}</button>
        </article>)}</div>}
  </div>;
}
