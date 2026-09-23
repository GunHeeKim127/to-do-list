"use client";

import type { Plan, Task } from "../app/types/task";
import { getKoreaTodayString } from "../app/func/date";
import { getTaskProgress, isTaskScheduledForDate, statusLabels } from "../app/func/progress";

export function TodayView({ tasks, plans, onManagePlan, onEditTask, onAddTask }: {
  tasks: Task[];
  plans: Plan[];
  onManagePlan: (plan: Plan) => void;
  onEditTask: (task: Task) => void;
  onAddTask: () => void;
}) {
  const today = getKoreaTodayString();
  const todayTasks = tasks
    .filter((task) => isTaskScheduledForDate(task, today))
    .sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (a.status !== "done" && b.status === "done") return -1;
      return (a.endDate || "").localeCompare(b.endDate || "") || a.title.localeCompare(b.title, "ko");
    });
  const completed = todayTasks.filter((task) => task.status === "done").length;
  const averageProgress = todayTasks.length
    ? Math.round(todayTasks.reduce((sum, task) => sum + getTaskProgress(task).percent, 0) / todayTasks.length)
    : 0;

  return <div>
    <div className="page-header manager-heading">
      <div>
        <h1 className="page-title">☀️ 오늘 할 일</h1>
        <p className="page-subtitle">{today} · 오늘이 작업 기간에 포함된 할 일과 소속 메인 계획입니다.</p>
      </div>
      <button className="btn-primary today-add-button" onClick={onAddTask}>+ 할 일 작성</button>
    </div>

    <div className="today-summary" aria-label="오늘 진행 요약">
      <div className="glass-card"><span>오늘 할 일</span><strong>{todayTasks.length}개</strong></div>
      <div className="glass-card"><span>완료한 할 일</span><strong>{completed}개</strong></div>
      <div className="glass-card"><span>평균 진행률</span><strong>{averageProgress}%</strong></div>
    </div>

    {todayTasks.length === 0 ? <div className="glass-card today-empty">
      <h2>오늘 일정에 포함된 할 일이 없습니다</h2>
      <p>할 일을 만들 때 시작일과 종료일에 오늘을 포함하면 이 화면에 표시됩니다.</p>
      <button className="btn-primary" onClick={onAddTask}>+ 오늘 할 일 작성</button>
    </div> : <div className="today-plan-list">
      {todayTasks.map((task) => {
        const progress = getTaskProgress(task);
        const subtasks = task.subtasks || [];
        const plan = plans.find((item) => item.id === task.planId);
        return <article className="glass-card today-plan-card" key={task.id}>
          <div className="today-plan-header">
            <div>
              <span className={`today-status ${task.status}`}>{statusLabels[task.status]}</span>
              <p className="manager-eyebrow">메인 계획: {plan?.title || "연결되지 않음"}</p>
              <h2>{task.title}</h2>
              <p className="today-task-description">{task.description || "작성된 상세 내용이 없습니다."}</p>
              <p>{task.startDate} ~ {task.endDate}</p>
            </div>
            <div className="today-plan-actions">
              <button className="btn-mini" onClick={() => onEditTask(task)}>할 일 수정</button>
              {plan && <button className="btn-primary" onClick={() => onManagePlan(plan)}>메인 계획 보기</button>}
            </div>
          </div>

          <div className="today-progress-label"><strong>현재 진행도 {progress.percent}%</strong><span>{progress.total ? `체크리스트 ${progress.completed}/${progress.total} 완료` : `상태: ${statusLabels[task.status]}`}</span></div>
          <div className="progress-bar-bg" role="progressbar" aria-label={`${task.title} 진행도`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><div className="progress-bar-fill" style={{ width: `${progress.percent}%` }} /></div>

          {subtasks.length > 0 ? <ul className="today-subtask-list">
            {subtasks.map((subtask) => <li key={subtask.id} className={subtask.isCompleted ? "completed" : ""}>
              <span aria-hidden="true">{subtask.isCompleted ? "✓" : "○"}</span><span>{subtask.title}</span><small>{subtask.isCompleted ? "완료" : "예정"}</small>
            </li>)}
          </ul> : <p className="today-no-subtask">작은 체크리스트가 없습니다. 할 일 수정에서 추가할 수 있습니다.</p>}
        </article>;
      })}
    </div>}
  </div>;
}
