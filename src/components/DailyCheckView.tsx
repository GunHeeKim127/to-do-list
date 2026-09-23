"use client";

import { useState } from "react";
import { completeTaskIdempotent } from "../app/func/execution";
import { getKoreaTodayString } from "../app/func/date";
import { updateTask } from "../app/func/task";
import { Plan, Task } from "../app/types/task";
import { isTaskScheduledForDate } from "../app/func/progress";

const addOneDay = (date: string) => {
  const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + 1); return value.toISOString().slice(0, 10);
};

export function DailyCheckView({ tasks, plans, onTaskChanged, onEditTask, embedded = false }: {
  tasks: Task[]; plans: Plan[]; onTaskChanged: (task: Task) => void; onEditTask: (task: Task) => void; embedded?: boolean;
}) {
  const [date, setDate] = useState(getKoreaTodayString());
  const [workingId, setWorkingId] = useState<string | null>(null);
  const targetTasks = tasks.filter((task) => isTaskScheduledForDate(task, date));

  const complete = async (task: Task) => {
    setWorkingId(task.id);
    const now = new Date().toISOString();
    const ok = await completeTaskIdempotent(task.id, `${task.id}:completion:${date}`, now, now, "");
    setWorkingId(null);
    if (!ok) return alert("완료 처리에 실패했습니다. Supabase RPC 설치 여부를 확인하세요.");
    onTaskChanged({ ...task, status: "done" });
  };

  const postpone = async (task: Task) => {
    setWorkingId(task.id);
    const nextStart = addOneDay(task.startDate);
    const nextEnd = addOneDay(task.endDate);
    const updated = await updateTask(task.id, { ...task, status: task.status === "done" ? "in_progress" : task.status, startDate: nextStart, endDate: nextEnd, dueDate: addOneDay(task.dueDate || task.endDate) });
    setWorkingId(null);
    if (!updated) return alert("다음 날로 미루지 못했습니다.");
    onTaskChanged(updated);
  };

  return <div>
    {!embedded && <div className="page-header"><h1 className="page-title">✅ 완료 여부 확인</h1><p className="page-subtitle">선택한 날짜가 작업 기간에 포함된 할 일을 확인하고, 못 끝낸 일은 하루 뒤로 미룹니다.</p></div>}
    <div className="glass-card daily-check-toolbar"><label htmlFor="daily-check-date">확인 날짜</label><input id="daily-check-date" className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /><small>직접 지정한 날짜가 우선입니다. 미룬 뒤에도 수정 버튼에서 원하는 날짜로 다시 바꿀 수 있습니다.</small></div>
    {targetTasks.length === 0 ? <div className="glass-card daily-check-empty">이 날짜에 진행하도록 등록된 할 일이 없습니다.</div> : <div className="daily-check-list">{targetTasks.map((task) => {
      const plan = plans.find((item) => item.id === task.planId);
      return <article className="glass-card daily-check-card" key={task.id}><div><small>{plan?.title || "소속 계획 없음"}</small><h2>{task.title}</h2><p className="daily-check-description">{task.description || "작성된 상세 내용이 없습니다."}</p><p>작업 기간 {task.startDate} ~ {task.endDate} · 상태 {task.status === "done" ? "완료" : task.status === "in_progress" ? "진행 중" : "진행 예정"}</p></div><div className="daily-check-actions"><button className="btn-primary" disabled={!!workingId || task.status === "done"} onClick={() => void complete(task)}>{task.status === "done" ? "완료됨" : workingId === task.id ? "처리 중..." : "오늘 완료"}</button><button className="btn-mini" disabled={!!workingId} onClick={() => void postpone(task)}>미완료 · 하루 미루기</button><button className="btn-mini" disabled={!!workingId} onClick={() => onEditTask(task)}>날짜 직접 수정</button></div></article>;
    })}</div>}
  </div>;
}
