"use client";

import React, { useEffect, useState } from "react";
import { ExecutionLog, Task } from "../app/types/task";
import { getExecutionLogs } from "../app/func/execution";
import { getExportData } from "../app/func/export";
import { getKoreaTodayString } from "../app/func/date";
import { getReviewSummary, ReviewDetail, ReviewPeriod, statusLabels } from "../app/func/progress";

// 돌아보기의 기능을 대시보드 안에서 사용합니다.
export function ReviewSummary({ tasks, onCreatePlan, onTaskClick }: {
  tasks: Task[]; onCreatePlan: (description: string) => void; onTaskClick: (task: Task) => void;
}) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [detail, setDetail] = useState<ReviewDetail | null>(null);
  const [period, setPeriod] = useState<ReviewPeriod>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [improvement, setImprovement] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError("");
    getExecutionLogs(undefined, true).then((items) => { if (!cancelled) setLogs(items); })
      .catch(() => { if (!cancelled) setLoadError("실행 기록을 불러오지 못했습니다. 다시 시도해 주세요."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tasks, retry]);

  const summary = getReviewSummary(tasks, logs, period, getKoreaTodayString());
  const logUnavailable = loading || !!loadError;
  const cards: { label: string; key: ReviewDetail }[] = [
    { label: "계획 수(연결된 할 일 수)", key: "all" }, { label: "완료 수", key: "done" },
    { label: "지연 수", key: "delayed" }, { label: "막힘 수", key: "blocked" },
  ];
  const exportAll = async () => {
    if (exporting) return;
    setExporting(true); setExportError("");
    try {
      const payload = await getExportData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url; link.download = `taskdiary-export-${getKoreaTodayString()}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setExportError(error instanceof Error ? error.message : "내보내기에 실패했습니다."); }
    finally { setExporting(false); }
  };

  return <section aria-label="진행 현황과 실행 기록">
    <h2 className="section-title">진행 현황과 실행 기록</h2>
    <div className="glass-card review-period-card">
      <label htmlFor="review-period">집계 기간</label>
      <select id="review-period" className="form-select" value={period} onChange={(event) => { setPeriod(event.target.value as ReviewPeriod); setDetail(null); }}>
        <option value="all">전체</option><option value="week">최근 7일</option><option value="month">최근 30일</option>
      </select>
      <small>할 일의 마감일 기준(KST). 전체는 미래 마감도 포함합니다. 실제 시간은 대상 할 일에 연결된 실행 기록 합계입니다.</small>
    </div>
    {loading && <p role="status">실행 기록을 불러오는 중...</p>}
    {loadError && <p className="manager-error" role="alert">{loadError} <button className="btn-mini" onClick={() => setRetry((value) => value + 1)}>다시 시도</button></p>}
    <div className="review-grid">{cards.map(({ label, key }) => <button className="glass-card review-stat" key={key} disabled={key === "blocked" && logUnavailable} aria-pressed={detail === key} onClick={() => setDetail(key)}><span>{label}</span><strong>{key === "blocked" && logUnavailable ? "—" : summary.groups[key].length}</strong><small>클릭하여 근거 보기</small></button>)}</div>
    <div className="glass-card review-time-card"><div><span>총 예상 시간</span><strong>{summary.estimated}분</strong></div><div><span>총 실제 시간</span><strong>{logUnavailable ? "—" : `${summary.actual}분`}</strong></div><div><span>차이 (실제 − 예상)</span><strong>{logUnavailable ? "—" : `${summary.difference}분`}</strong></div></div>
    {detail && <div className="glass-card review-detail">
      <div className="review-detail-header"><h3>{cards.find((card) => card.key === detail)?.label} 근거 · {summary.groups[detail].length}개</h3><button className="btn-mini" onClick={() => setDetail(null)}>닫기</button></div>
      {summary.groups[detail].length === 0 ? <p>해당 데이터가 없습니다.</p> : summary.groups[detail].map((task) => <div key={task.id}>
        <div className="review-task-row"><button className="task-text-button" onClick={() => onTaskClick(task)}>{task.title}</button><span>{statusLabels[task.status]}</span><span>마감 {task.dueDate || task.endDate}</span><span>예상 {task.estimatedTime || 0}분</span></div>
        {!logUnavailable && <details className="review-log-details"><summary>실행 기록 {summary.logs.filter((log) => log.taskId === task.id).length}개</summary>{summary.logs.filter((log) => log.taskId === task.id).map((log) => <p key={log.id}>{new Date(log.startedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · {log.actualMinutes}분{log.blockedReason?.trim() && ` · 막힘: ${log.blockedReason}`}</p>)}</details>}
      </div>)}
    </div>}
    <div className="glass-card improvement-card"><h3 className="section-title">다음 계획에 반영하기</h3><p>돌아보며 정한 고칠 점 한 줄을 작성하면 새 메인 계획의 성공 기준으로 전달합니다.</p><label className="improvement-input-label" htmlFor="review-improvement">다음 계획에서 고칠 점</label><textarea id="review-improvement" className="form-input improvement-input" rows={2} value={improvement} onChange={(event) => setImprovement(event.target.value)} placeholder={`예: 실제 ${summary.actual}분, 예상 ${summary.estimated}분의 차이를 반영해 예상 시간을 조정한다.`} /><button className="btn-primary" disabled={logUnavailable || !summary.groups.all.length || !improvement.trim()} onClick={() => onCreatePlan(improvement.trim())}>작성한 한 줄을 새 계획으로</button></div>
    <div className="glass-card export-card"><div><h3 className="section-title">내 자료 내보내기</h3><p>메인·서브 계획, 삭제된 자료, 실행 기록과 기존 별도 계획·이력을 JSON 파일로 저장합니다.</p>{exportError && <p className="manager-error" role="alert">{exportError}</p>}</div><button className="btn-primary" disabled={exporting} onClick={() => void exportAll()}>{exporting ? "내보내는 중..." : "JSON 내보내기"}</button></div>
  </section>;
}
