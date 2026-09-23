"use client";

import React, { useEffect, useRef, useState } from "react";
import { createExecutionLog, completeTaskIdempotent, getExecutionLogs } from "../app/func/execution";
import { ExecutionLog } from "../app/types/task";
import { LoadingState } from "./LoadingState";

function toInputValue(value: string) {
  const d = new Date(value); const pad = (n:number) => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ExecutionLogPanel({ taskId, onCompleted }: { taskId: string; onCompleted: () => void }) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [startedAt, setStartedAt] = useState(toInputValue(new Date().toISOString()));
  const [endedAt, setEndedAt] = useState(toInputValue(new Date().toISOString()));
  const [blockedReason, setBlockedReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const completionKey = useRef<string | null>(null);

  const load = async () => { setLoading(true); setLogs(await getExecutionLogs(taskId)); setLoading(false); };
  useEffect(() => { load(); }, [taskId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (saving) return; setSaving(true);
    const start = new Date(startedAt); const end = new Date(endedAt);
    const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    const result = await createExecutionLog({ taskId, startedAt: start.toISOString(), endedAt: end.toISOString(), actualMinutes: minutes, blockedReason: blockedReason.trim() || null, idempotencyKey: crypto.randomUUID() });
    setSaving(false);
    if (!result) { alert("실행 기록 저장에 실패했습니다."); return; }
    setBlockedReason(""); await load();
  };

  const complete = async () => {
    if (saving) return; setSaving(true);
    if (!completionKey.current) completionKey.current = `${taskId}:completion:${new Date().toISOString().slice(0,10)}`;
    const now = new Date().toISOString();
    const ok = await completeTaskIdempotent(taskId, completionKey.current, startedAt ? new Date(startedAt).toISOString() : now, now, blockedReason);
    setSaving(false);
    if (!ok) { alert("완료 기록 처리에 실패했습니다. DB 함수/제약조건을 확인하세요."); return; }
    await load(); onCompleted();
  };

  return <div className="execution-panel">
    <h4>⏱ 실제로 한 일 기록</h4>
    <form onSubmit={save} className="execution-form">
      <input className="form-input" type="datetime-local" value={startedAt} onChange={(e)=>setStartedAt(e.target.value)} required />
      <input className="form-input" type="datetime-local" value={endedAt} onChange={(e)=>setEndedAt(e.target.value)} required />
      <input className="form-input" placeholder="막힌 이유(선택)" value={blockedReason} onChange={(e)=>setBlockedReason(e.target.value)} />
      <div className="execution-form-actions">
        <button className="btn-primary" disabled={saving}>실행 기록 저장</button>
        <button type="button" className="btn-primary btn-complete" disabled={saving} onClick={complete}>완료 기록</button>
      </div>
    </form>
    {loading ? <LoadingState label="실행 기록을 불러오는 중..." compact /> : logs.map((l)=><div className="execution-row" key={l.id}><span>{new Date(l.startedAt).toLocaleString("ko-KR")} ~ {l.endedAt ? new Date(l.endedAt).toLocaleString("ko-KR") : "진행 중"}</span><b>{l.actualMinutes}분</b>{l.blockedReason && <em>막힘: {l.blockedReason}</em>}</div>)}
  </div>;
}
