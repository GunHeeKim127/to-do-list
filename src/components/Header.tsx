"use client";

import { ActiveTab } from "../app/types/task";

interface HeaderProps {
  activeTab: ActiveTab;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const tabNames: Record<ActiveTab, string> = {
    dashboard: "📊 전체 대시보드",
    today: "☀️ 오늘 할 일",
    kanban: "📋 할 일 관리 · 칸반",
    calendar: "📋 할 일 관리 · 캘린더",
    table: "📋 할 일 관리 · 목록",
    plans: "🎯 메인 계획과 할 일 관리",
    trash: "🗑️ 삭제된 작업"
};

export function Header({
  activeTab,
  isSidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  return (
    <header className="app-header">
      <button
        type="button"
        className={`hamburger-btn ${
          isSidebarOpen ? "is-open" : ""
        }`}
        onClick={onToggleSidebar}
        aria-label={isSidebarOpen ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={isSidebarOpen}
        aria-controls="task-diary-sidebar"
      >
        <span className="hamburger-line line-top" />
        <span className="hamburger-line line-middle" />
        <span className="hamburger-line line-bottom" />
      </button>

      <div className="current-page-title">
        {tabNames[activeTab]}
      </div>
      <div className="header-context-slot" aria-label="현재 작업공간">
        <span className="workspace-chip">개인 작업공간</span>
      </div>
    </header>
  );
}
