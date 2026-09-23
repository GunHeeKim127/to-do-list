"use client";

import { useEffect, useState } from "react";
import { getAllPlanHistories } from "../app/func/plan";
import { Plan, PlanHistory } from "../app/types/task";
import { LoadingState } from "./LoadingState";

const priorityLabel = (priority: Plan["priority"]) => priority === "high" ? "높음" : priority === "low" ? "낮음" : "보통";

type ChangeItem = { label: string; before: string; after: string };

function getChanges(before: PlanHistory, after?: Plan): ChangeItem[] {
  if (!after) return [];
  const changes: ChangeItem[] = [];
  if (before.title !== after.title) changes.push({ label: "계획 제목", before: before.title, after: after.title });
  const beforePeriod = `${before.periodStart} ~ ${before.periodEnd}`;
  const afterPeriod = `${after.periodStart} ~ ${after.periodEnd}`;
  if (beforePeriod !== afterPeriod) changes.push({ label: "기간", before: beforePeriod, after: afterPeriod });
  if (before.priority !== after.priority) changes.push({ label: "우선순위", before: priorityLabel(before.priority), after: priorityLabel(after.priority) });
  if (before.successCriteria !== after.successCriteria) changes.push({ label: "성공 기준", before: before.successCriteria, after: after.successCriteria });
  if (before.estimatedTime !== after.estimatedTime) changes.push({ label: "예상 시간", before: `${before.estimatedTime}분`, after: `${after.estimatedTime}분` });
  return changes;
}

export function PlanHistoryView({ plans, embedded = false }: { plans: Plan[]; embedded?: boolean }) {
  const [histories, setHistories] = useState<PlanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { setHistories(await getAllPlanHistories()); }
    catch { setError("계획 수정 이력을 불러오지 못했습니다. plan_histories 테이블과 읽기 정책을 확인하세요."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  return <div>
    {!embedded && <div className="page-header"><h1 className="page-title">🕘 계획 수정 이력</h1><p className="page-subtitle">계획을 수정하기 전 값이 버전별로 보관됩니다.</p></div>}
    {loading ? <LoadingState label="계획 수정 이력을 불러오는 중..." /> : error ? <div className="glass-card manager-error" role="alert">{error} <button className="btn-mini" onClick={() => void load()}>다시 시도</button></div> : histories.length === 0 ?
      <div className="glass-card history-page-empty">아직 계획 수정 이력이 없습니다. 계획을 한 번 수정한 뒤 다시 확인하세요.</div> :
      <div className="history-page-list">{histories.map((history) => {
        const current = plans.find((plan) => plan.id === history.planId);
        const nextVersion = histories
          .filter((item) => item.planId === history.planId && item.version > history.version)
          .sort((a, b) => a.version - b.version)[0];
        const changedTo = nextVersion || current;
        const changes = getChanges(history, changedTo);
        return <article className="glass-card history-page-card" key={`${history.planId}-${history.version}`}>
          <div className="history-page-title"><div><span>v{history.version}</span><h2>{history.title}</h2></div><time>{new Date(history.changedAt).toLocaleString("ko-KR")} 변경</time></div>
          <p><strong>현재 계획:</strong> {current?.title || "삭제되었거나 불러올 수 없음"}</p>
          <section className="history-change-section" aria-label={`버전 ${history.version} 변경 내용`}>
            <h3>변경 내용</h3>
            {changes.length > 0 ? <ul>{changes.map((change) => <li key={change.label}>
              <strong>{change.label}</strong>
              <div><del>{change.before}</del><span aria-hidden="true">→</span><ins>{change.after}</ins></div>
            </li>)}</ul> : <p>저장된 계획 항목의 값은 동일합니다.</p>}
          </section>
          <details className="history-snapshot">
            <summary>수정 전 전체 내용 보기</summary>
          <dl><div><dt>기간</dt><dd>{history.periodStart} ~ {history.periodEnd}</dd></div><div><dt>우선순위</dt><dd>{history.priority}</dd></div><div><dt>예상 시간</dt><dd>{history.estimatedTime}분</dd></div><div><dt>성공 기준</dt><dd>{history.successCriteria}</dd></div></dl>
          </details>
        </article>;
      })}</div>}
  </div>;
}
