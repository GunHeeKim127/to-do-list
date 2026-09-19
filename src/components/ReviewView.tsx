"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ExecutionLog, Task, Plan, PlanHistory } from "../app/types/task";
import { getExecutionLogs } from "../app/func/execution";
import { getDeletedTasks } from "../app/func/task";
import { getPlanHistories, getPlans } from "../app/func/plan";
import { getKoreaTodayString, getKoreaDateOffsetString } from "../app/func/date";

export function ReviewView({ tasks, onGoToPlans }: { tasks: Task[]; onGoToPlans: () => void }) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [histories, setHistories] = useState<PlanHistory[]>([]);
  const [detail, setDetail] = useState<"all" | "done" | "delayed" | "blocked" | null>(null);
  const [period, setPeriod] = useState<"all" | "week" | "month">("week");
  const [xssTest, setXssTest] = useState("");

  useEffect(() => {
    getExecutionLogs().then(setLogs);
    getPlans().then(async (items) => {
      setPlans(items);
      const all = await Promise.all(items.map((p) => getPlanHistories(p.id)));
      setHistories(all.flat());
    });
  }, [tasks]);

  const today = getKoreaTodayString();
  const startBoundary = period === "all" ? "0000-01-01" : getKoreaDateOffsetString(period === "week" ? -6 : -29);
  const periodTasks = tasks.filter((t) => (t.dueDate || t.endDate) >= startBoundary && (t.dueDate || t.endDate) <= today);
  const periodTaskIds = new Set(periodTasks.map((t) => t.id));
  const periodLogs = logs.filter((l) => periodTaskIds.has(l.taskId));
  const done = periodTasks.filter((t) => t.status === "done");
  const delayed = periodTasks.filter((t) => t.status !== "done" && (t.dueDate || t.endDate) < today);
  const blockedTaskIds = new Set(periodLogs.filter((l) => !!l.blockedReason?.trim()).map((l) => l.taskId));
  const blocked = periodTasks.filter((t) => blockedTaskIds.has(t.id));
  const estimated = periodTasks.reduce((sum, t) => sum + Number(t.estimatedTime || 0), 0);
  const actual = periodLogs.reduce((sum, l) => sum + Number(l.actualMinutes || 0), 0);

  const shown = useMemo(() => {
    if (!detail || detail === "all") return tasks;
    if (detail === "done") return done;
    if (detail === "delayed") return delayed;
    return blocked;
  }, [detail, tasks, done, delayed, blocked]);

  const exportAll = () => {
    getDeletedTasks().then((deletedTasks) => {
      const payload = { exportedAt: new Date().toISOString(), timezone: "Asia/Seoul", plans, planHistories: histories, tasks, deletedTasks, executionLogs: logs };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = `taskdiary-export-${today}.json`; a.click(); URL.revokeObjectURL(url);
    });
  };

  const cards: [
    string,
    number,
    "all" | "done" | "delayed" | "blocked"
  ][] = [
      ["계획 수", tasks.length, "all"],
      ["완료 수", done.length, "done"],
      ["지연 수", delayed.length, "delayed"],
      ["막힘 수", blocked.length, "blocked"],
    ];

  return <div>
    <div className="page-header">
      <h1 className="page-title">돌아보기</h1>
      <p className="page-subtitle">서울 시간(KST) 기준으로 지연을 계산하고, 수치를 누르면 근거 작업을 확인합니다.</p>
    </div>

    <div className="glass-card review-period-card">
      <span>집계 기간</span>
      <select className="form-select" value={period} onChange={(e) => { setPeriod(e.target.value as "all" | "week" | "month"); setDetail(null); }}>
        <option value="week">최근 7일</option>
        <option value="month">최근 30일</option>
        <option value="all">전체</option>
      </select>
      <small>지연 기준: 미완료 AND 마감일 &lt; 서울 시간 오늘</small>
    </div>

    <div className="review-grid">
      {cards.map(([label, value, key]) => <button className="glass-card review-stat" key={label} onClick={() => setDetail(key)}><span>{label}</span><strong>{value}</strong><small>클릭하여 근거 보기</small></button>)}
    </div>

    <div className="glass-card review-time-card">
      <div><span>총 예상 시간</span><strong>{estimated}분</strong></div>
      <div><span>총 실제 시간</span><strong>{actual}분</strong></div>
      <div><span>차이값 (실제 - 예상)</span><strong>{actual - estimated}분</strong></div>
    </div>

    <div className="glass-card improvement-card">
      <h2 className="section-title">다음 계획으로 넘길 개선점</h2>
      <p>예상 시간과 실제 시간의 차이를 확인한 뒤 개선점을 다음 계획의 성공 기준 기본값으로 넘길 수 있습니다.</p>
      <button className="btn-primary" onClick={() => { localStorage.setItem("taskdiary-improvement", `실제 ${actual}분 - 예상 ${estimated}분 = ${actual - estimated}분. 다음 계획에서 예상 시간을 보정합니다.`); alert("개선점을 저장했습니다. 새 계획 작성 화면으로 이동합니다."); onGoToPlans(); }}>개선점을 새 계획으로 이관</button>
      <span className="improvement-hint">저장 후 「계획 세우기」에서 새 계획을 작성할 때 참고할 수 있습니다.</span>
    </div>

    {detail && <div className="glass-card review-detail">
      <div className="review-detail-header"><h2>근거 데이터</h2><button className="btn-mini" onClick={() => setDetail(null)}>닫기</button></div>
      {shown.length === 0 ? <p>해당 데이터가 없습니다.</p> : shown.map((task) => <div className="review-task-row" key={task.id}><b>{task.title}</b><span>{task.status}</span><span>마감 {task.dueDate || task.endDate}</span><span>예상 {task.estimatedTime || 0}분</span></div>)}
    </div>}

    <div className="glass-card security-card">
      <h2 className="section-title">보안/XSS 확인</h2>
      <p>React의 텍스트 렌더링은 입력값을 HTML로 해석하지 않습니다. 아래에 테스트 문자열을 입력해 실행되지 않고 글자로 보이는지 확인하세요.</p>
      <input className="form-input" value={xssTest} onChange={(e) => setXssTest(e.target.value)} placeholder="&lt;script&gt;alert(1)&lt;/script&gt;" />
      <div className="xss-output">렌더링 결과: {xssTest}</div>
      <small>Service Role Key는 클라이언트 코드에 사용하지 않고 NEXT_PUBLIC_ANON_KEY만 사용해야 합니다.</small>
    </div>

    <div className="glass-card export-card"><div><h2 className="section-title">내 자료 내보내기</h2><p>현재 Task와 실행 기록을 단일 JSON 파일로 저장합니다.</p></div><button className="btn-primary" onClick={exportAll}>JSON Export</button></div>
  </div>;
}
