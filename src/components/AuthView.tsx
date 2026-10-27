"use client";

import { FormEvent, useState } from "react";
import { supabase } from "../app/lib/supabase";

export function AuthView() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setWorking(true); setMessage("");
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName.trim() || email.split("@")[0] } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setWorking(false);
    if (result.error) {
      setMessage(mode === "login" ? "이메일 또는 비밀번호를 확인해 주세요." : "가입할 수 없습니다. 입력값을 확인하거나 이미 가입한 이메일인지 확인해 주세요.");
      return;
    }
    setMessage(mode === "signup" && !result.data.session ? "확인 메일을 열어 가입을 완료해 주세요." : "");
  };

  return <main className="auth-page">
    <section className="glass-card auth-card" aria-labelledby="auth-title">
      <div className="auth-brand">TaskDiary</div>
      <h1 id="auth-title">{mode === "login" ? "로그인" : "계정 만들기"}</h1>
      <p>개인 자료와 초대받은 프로젝트는 로그인한 사용자만 볼 수 있습니다.</p>
      <form onSubmit={submit}>
        {mode === "signup" && <label>표시 이름<input className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></label>}
        <label>이메일<input className="form-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>비밀번호<input className="form-input" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="btn-primary" disabled={working}>{working ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}</button>
      </form>
      <button className="auth-mode-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>
        {mode === "login" ? "처음이신가요? 계정 만들기" : "이미 계정이 있나요? 로그인"}
      </button>
    </section>
  </main>;
}

