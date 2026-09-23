"use client";

import { ActiveTab } from "../app/types/task";

interface SidebarProps {
  activeTab: ActiveTab;
  isOpen: boolean;
  onClose: () => void;
  onTabChange: (tab: ActiveTab) => void;
}

export function Sidebar({
  activeTab,
  isOpen,
  onClose,
  onTabChange,
}: SidebarProps) {
  const taskWorkspaceActive = activeTab === "kanban" || activeTab === "calendar" || activeTab === "table";
  const handleTabClick = (tab: ActiveTab) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="task-diary-sidebar"
        className={`sidebar ${isOpen ? "open" : ""}`}
        aria-label="주 메뉴"
      >
        <div>
          <div className="sidebar-logo">
            📅 <span>TaskDiary</span>
          </div>

          <ul className="nav-menu">
            <li
              className={`nav-item ${
                activeTab === "dashboard" ? "active" : ""
              }`}
              onClick={() => handleTabClick("dashboard")}
            >
              📊 전체 대시보드
            </li>

            <li
              className={`nav-item ${
                activeTab === "today" ? "active" : ""
              }`}
              onClick={() => handleTabClick("today")}
            >
              ☀️ 오늘 할 일
            </li>

            <li
              className={`nav-item ${taskWorkspaceActive ? "active" : ""}`}
              onClick={() => handleTabClick("kanban")}
            >
              📋 할 일 관리
            </li>

            <li
              className={`nav-item ${
                activeTab === "plans" ? "active" : ""
              }`}
              onClick={() => handleTabClick("plans")}
            >
              🎯 계획 관리
            </li>

          </ul>
          <details className="sidebar-more" open={activeTab === "trash"}>
            <summary>••• 더보기</summary>
            <button
              type="button"
              className={`nav-item ${activeTab === "trash" ? "active" : ""}`}
              onClick={() => handleTabClick("trash")}
            >
              🗑️ 삭제된 작업
            </button>
          </details>
        </div>
      </aside>
    </>
  );
}
