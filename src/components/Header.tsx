"use client";

import { ActiveTab } from "../app/types/task";

interface HeaderProps {
  activeTab: ActiveTab;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const tabNames: Record<ActiveTab, string> = {
    dashboard: "📊 전체 대시보드",
    kanban: "📋 투두 칸반 보드",
    calendar: "📅 캘린더 및 타임라인",
    table: "📑 테이블 상세 관리",
    plans: "",
    review: ""
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
    </header>
  );
}
