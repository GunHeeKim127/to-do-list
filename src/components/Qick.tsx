"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  getDeletedTasks,
  restoreTask,
  updateTaskSubtasks,
} from "../app/func/task";
import { getPlans } from "../app/func/plan";
import {
  Task,
  TaskStatus,
  Priority,
  Plan,
} from "../app/types/task";
import { SubtaskInlineManager } from "./SupabaseClients";
import { ExecutionLogPanel } from "./ExecutionLogPanel";

interface TableViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onOpenAddModal: () => void;
  onOpenEditModal: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TableView({
  tasks,
  setTasks,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteTask,
}: TableViewProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] =
    useState<"all" | Priority>("all");
  const [tagFilter, setTagFilter] = useState("");
  const [sortKey, setSortKey] =
    useState<"due" | "priority" | "created">("due");

  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);

  useEffect(() => {
    getPlans().then(setPlans);
  }, []);

  const priorityValue = (priority?: Priority) => {
    if (priority === "high") return 3;
    if (priority === "medium") return 2;
    return 1;
  };

  const priorityLabel = (priority?: Priority) => {
    if (priority === "high") return "높음";
    if (priority === "low") return "낮음";
    return "보통";
  };

  const statusLabel = (status: TaskStatus) => {
    if (status === "done") return "완료";
    if (status === "in_progress") return "진행 중";
    return "진행 예정";
  };

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const query = search.trim().toLowerCase();

      if (
        query &&
        !task.title.toLowerCase().includes(query)
      ) {
        return false;
      }

      if (
        statusFilter !== "all" &&
        task.status !== statusFilter
      ) {
        return false;
      }

      if (
        priorityFilter !== "all" &&
        (task.priority || "medium") !== priorityFilter
      ) {
        return false;
      }

      if (
        tagFilter.trim() &&
        !(task.tags || []).some((tag) =>
          tag
            .toLowerCase()
            .includes(tagFilter.trim().toLowerCase())
        )
      ) {
        return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortKey === "priority") {
        return (
          priorityValue(b.priority) - priorityValue(a.priority) ||
          a.title.localeCompare(b.title)
        );
      }

      if (sortKey === "created") {
        return (
          (b.createdAt || "").localeCompare(a.createdAt || "") ||
          a.title.localeCompare(b.title)
        );
      }

      return (
        (a.dueDate || a.endDate).localeCompare(
          b.dueDate || b.endDate
        ) ||
        priorityValue(b.priority) - priorityValue(a.priority) ||
        a.title.localeCompare(b.title)
      );
    });
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    tagFilter,
    sortKey,
  ]);

  const loadDeleted = async () => {
    setDeletedTasks(await getDeletedTasks());
  };

  const restore = async (taskId: string) => {
    const restored = await restoreTask(taskId);

    if (!restored) {
      alert("작업 복원에 실패했습니다.");
      return;
    }

    setTasks((prev) => [restored, ...prev]);
    setDeletedTasks((prev) =>
      prev.filter((task) => task.id !== taskId)
    );
  };

  const updateSubtasks = async (
    taskId: string,
    subtasks: Task["subtasks"]
  ) => {
    const success = await updateTaskSubtasks(
      taskId,
      subtasks || []
    );

    if (!success) {
      alert("하위 작업 변경에 실패했습니다.");
      return;
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: subtasks || [] }
          : task
      )
    );
  };

  const getPlanTitle = (planId?: string | null) => {
    if (!planId) return "연결된 계획 없음";

    return (
      plans.find((plan) => plan.id === planId)?.title ||
      "연결된 계획 확인 필요"
    );
  };

  return (
    <div className="table-view">
      <div className="glass-card task-control-card">
        <div className="task-filter-row">
          <input
            className="form-input"
            placeholder="제목으로 할 일 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | TaskStatus
              )
            }
          >
            <option value="all">상태 전체</option>
            <option value="todo">진행해야 되는 일</option>
            <option value="in_progress">진행 중인 일</option>
            <option value="done">완료한 일</option>
          </select>

          <select
            className="form-select"
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(
                e.target.value as "all" | Priority
              )
            }
          >
            <option value="all">우선순위 전체</option>
            <option value="high">높음</option>
            <option value="medium">보통</option>
            <option value="low">낮음</option>
          </select>

          <input
            className="form-input"
            placeholder="태그 필터"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          />

          <select
            className="form-select"
            value={sortKey}
            onChange={(e) =>
              setSortKey(
                e.target.value as
                  | "due"
                  | "priority"
                  | "created"
              )
            }
          >
            <option value="due">정렬: 마감일순</option>
            <option value="priority">정렬: 우선순위순</option>
            <option value="created">정렬: 생성일순</option>
          </select>

          <button
            type="button"
            className="btn-primary table-add-button"
            onClick={onOpenAddModal}
          >
            ＋ 할 일 추가
          </button>
        </div>

        <div className="active-sort-label">
          검색 결과 <strong>{visibleTasks.length}건</strong>
          {" · "}
          현재 정렬 기준: {" "}
          <strong>
            {sortKey === "due"
              ? "마감일순 → 우선순위 → 제목"
              : sortKey === "priority"
                ? "우선순위순 → 제목"
                : "생성일순 → 제목"}
          </strong>
        </div>
      </div>

      <div className="glass-card table-card">
        {visibleTasks.length === 0 ? (
          <p>조건에 맞는 작업이 없습니다.</p>
        ) : (
          visibleTasks.map((task) => {
            const expanded = expandedTaskId === task.id;
            const priority = task.priority || "medium";

            return (
              <div
                className={`task-manager-row ${
                  expanded ? "expanded" : ""
                }`}
                key={task.id}
              >
                <div
                  className="task-manager-main"
                  onClick={() =>
                    setExpandedTaskId(
                      expanded ? null : task.id
                    )
                  }
                >
                  <span>{expanded ? "▼" : "▶"}</span>
                  <strong>{task.title}</strong>

                  <span
                    className={`priority-badge priority-${priority}`}
                  >
                    {priorityLabel(priority)}
                  </span>

                  <span>{statusLabel(task.status)}</span>
                  <span>
                    마감 {task.dueDate || task.endDate}
                  </span>

                  <button
                    type="button"
                    className="btn-mini"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditModal(task);
                    }}
                  >
                    수정
                  </button>

                  <button
                    type="button"
                    className="btn-mini"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                  >
                    삭제
                  </button>
                </div>

                {expanded && (
                  <div className="task-manager-detail">
                    <div className="task-detail-summary">
                      <div>
                        <span>계획</span>
                        <strong>
                          {getPlanTitle(task.planId)}
                        </strong>
                      </div>
                      <div>
                        <span>예상 시간</span>
                        <strong>
                          {task.estimatedTime || 0}분
                        </strong>
                      </div>
                      <div>
                        <span>기간</span>
                        <strong>
                          {task.startDate} ~ {task.endDate}
                        </strong>
                      </div>
                      <div>
                        <span>태그</span>
                        <strong>
                          {(task.tags || []).length > 0
                            ? (task.tags || []).join(", ")
                            : "없음"}
                        </strong>
                      </div>
                    </div>

                    {task.description && (
                      <div className="task-description-preview">
                        <span>상세 설명</span>
                        <p>{task.description}</p>
                      </div>
                    )}

                    <div>
                      <label className="form-label">
                        ☑️ 하위 체크리스트
                      </label>

                      <SubtaskInlineManager
                        subtasks={task.subtasks || []}
                        onAdd={(title) =>
                          updateSubtasks(task.id, [
                            ...(task.subtasks || []),
                            {
                              id: crypto.randomUUID(),
                              title,
                              isCompleted: false,
                            },
                          ])
                        }
                        onToggle={(id) =>
                          updateSubtasks(
                            task.id,
                            (task.subtasks || []).map(
                              (subtask) =>
                                subtask.id === id
                                  ? {
                                      ...subtask,
                                      isCompleted:
                                        !subtask.isCompleted,
                                    }
                                  : subtask
                            )
                          )
                        }
                        onDelete={(id) =>
                          updateSubtasks(
                            task.id,
                            (task.subtasks || []).filter(
                              (subtask) =>
                                subtask.id !== id
                            )
                          )
                        }
                      />
                    </div>

                    <ExecutionLogPanel
                      taskId={task.id}
                      onCompleted={() =>
                        setTasks((prev) =>
                          prev.map((item) =>
                            item.id === task.id
                              ? { ...item, status: "done" }
                              : item
                          )
                        )
                      }
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="glass-card restore-card">
        <div>
          <h2 className="section-title">
            삭제된 작업 복원
          </h2>
          <p>
            삭제는 DB에서 즉시 지우지 않고 deleted_at을
            남겨 복원할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={async () => {
            await loadDeleted();
            setShowDeleted(true);
          }}
        >
          삭제 목록 불러오기
        </button>

        {showDeleted && (
          <div className="deleted-task-list">
            {deletedTasks.length === 0 ? (
              <p>삭제된 작업이 없습니다.</p>
            ) : (
              deletedTasks.map((task) => (
                <div
                  className="deleted-task-row"
                  key={task.id}
                >
                  <span>{task.title}</span>
                  <span>
                    {task.deletedAt
                      ? new Date(
                          task.deletedAt
                        ).toLocaleString("ko-KR")
                      : ""}
                  </span>
                  <button
                    type="button"
                    className="btn-mini"
                    onClick={() => restore(task.id)}
                  >
                    복원
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
