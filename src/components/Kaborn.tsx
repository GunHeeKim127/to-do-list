"use client"

import React, { useState } from "react";
import { Task, TaskStatus } from "../app/types/task";

// ============================================================================
// 2. Kanban
// ============================================================================

export function KanbanView({
  tasks,
  onMoveStatus,
  onDeleteTask,
  onTaskClick,
  onOpenAddModal,
  onQuickAdd,
}: {
  tasks: Task[];
  onMoveStatus: (
    id: string,
    status: TaskStatus
  ) => void;
  onDeleteTask: (
    id: string
  ) => void;
  onTaskClick: (
    task: Task
  ) => void;
  onOpenAddModal: (
    status: TaskStatus
  ) => void;
  onQuickAdd: (
    title: string,
    status: TaskStatus
  ) => void;
}) {
  const [
    quickInputs,
    setQuickInputs,
  ] = useState<
    Record<TaskStatus, string>
  >({
    todo: "",
    in_progress: "",
    done: "",
  });

  const handleDragOver = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
  };

  const handleDrop = (
    e: React.DragEvent,
    status: TaskStatus
  ) => {
    const taskId =
      e.dataTransfer.getData(
        "taskId"
      );

    if (taskId) {
      onMoveStatus(
        taskId,
        status
      );
    }
  };

  const handleQuickSubmit = (
    e: React.FormEvent,
    status: TaskStatus
  ) => {
    e.preventDefault();

    const value =
      quickInputs[status].trim();

    if (!value) return;

    onQuickAdd(
      value,
      status
    );

    setQuickInputs((prev) => ({
      ...prev,
      [status]: "",
    }));
  };

  const renderColumn = (
    title: string,
    status: TaskStatus,
    dotClass: string
  ) => {
    const columnTasks =
      tasks.filter(
        (task) =>
          task.status === status
      );

    return (
      <div
        className="kanban-column"
        onDragOver={
          handleDragOver
        }
        onDrop={(e) =>
          handleDrop(
            e,
            status
          )
        }
      >
        <div className="column-header">
          <div className="column-title-group">
            <span
              className={`status-dot ${dotClass}`}
            />

            <span className="column-title">
              {title}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "6px",
              alignItems:
                "center",
            }}
          >
            <span className="task-count">
              {
                columnTasks.length
              }
            </span>

            <button
              className="btn-mini"
              title="상세 작성"
              onClick={() =>
                onOpenAddModal(
                  status
                )
              }
            >
              ➕
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) =>
            handleQuickSubmit(
              e,
              status
            )
          }
          style={{
            marginBottom:
              "12px",
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="+ 빠른 등록 후 Enter"
            value={
              quickInputs[
                status
              ]
            }
            onChange={(e) =>
              setQuickInputs(
                (prev) => ({
                  ...prev,
                  [status]:
                    e.target
                      .value,
                })
              )
            }
            style={{
              fontSize:
                "0.8rem",
              padding:
                "8px 10px",
            }}
          />
        </form>

        <div className="kanban-tasks">
          {columnTasks.map(
            (task) => {
              const completedSubtasks =
                task.subtasks?.filter(
                  (s) =>
                    s.isCompleted
                ).length ||
                0;

              const totalSubtasks =
                task.subtasks
                  ?.length || 0;

              return (
                <div
                  key={task.id}
                  className="task-card"
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData(
                      "taskId",
                      task.id
                    )
                  }
                  onClick={() =>
                    onTaskClick(
                      task
                    )
                  }
                  style={{
                    cursor:
                      "pointer",
                  }}
                >
                  <div className="task-card-header">
                    <div className="task-title">
                      {task.title}
                    </div>

                    <button
                      className="btn-mini"
                      style={{
                        color:
                          "#e74c3c",
                      }}
                      onClick={(
                        e
                      ) => {
                        e.stopPropagation();

                        onDeleteTask(
                          task.id
                        );
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {task.description && (
                    <p
                      className="task-card-description"
                      style={{
                        fontSize:
                          "0.75rem",
                        color:
                          "#64748b",
                        margin:
                          "4px 0 8px 0",
                      }}
                    >
                      📝{" "}
                      {
                        task.description
                      }
                    </p>
                  )}

                  <div className="task-meta">
                    <span>
                      {task.startDate ===
                      task.endDate
                        ? task.startDate
                        : `${task.startDate} ~ ${task.endDate}`}
                    </span>

                    {totalSubtasks >
                      0 && (
                      <span
                        className="timeline-badge"
                        style={{
                          background:
                            "#e2e8f0",
                          color:
                            "#334155",
                        }}
                      >
                        ☑️{" "}
                        {
                          completedSubtasks
                        }
                        /
                        {
                          totalSubtasks
                        }
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          투두 칸반 보드
        </h1>

        <p className="page-subtitle">
          드래그 앤 드롭으로
          상태를 변경하거나
          카드를 클릭하여
          수정하세요.
        </p>
      </div>

      <div className="kanban-board">
        {renderColumn(
          "진행해야 되는 일",
          "todo",
          "dot-todo"
        )}

        {renderColumn(
          "진행 중인 일",
          "in_progress",
          "dot-progress"
        )}

        {renderColumn(
          "완료한 일",
          "done",
          "dot-done"
        )}
      </div>
    </div>
  );
}
