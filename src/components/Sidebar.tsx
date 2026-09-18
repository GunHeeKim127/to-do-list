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
                activeTab === "kanban" ? "active" : ""
              }`}
              onClick={() => handleTabClick("kanban")}
            >
              📋 칸반 보드
            </li>

            <li
              className={`nav-item ${
                activeTab === "calendar" ? "active" : ""
              }`}
              onClick={() => handleTabClick("calendar")}
            >
              📅 캘린더
            </li>

            <li
              className={`nav-item ${
                activeTab === "table" ? "active" : ""
              }`}
              onClick={() => handleTabClick("table")}
            >
              📑 테이블 목록 관리
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
