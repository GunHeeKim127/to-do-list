"use client";

import React, {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "../../lib/supabase";

import {
  Task,
  TaskStatus,
  Subtask,
} from "../../types/task";

type SupabaseTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  start_date: string;
  end_date: string;
  subtasks: Subtask[];
  created_at: string;
  updated_at: string;
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();

  const taskId =
    params?.id as string;

  const [task, setTask] =
    useState<Task | null>(
      null
    );

  const [isLoaded, setIsLoaded] =
    useState(false);

  // ==========================================================================
  // 폼 state
  // ==========================================================================

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [status, setStatus] =
    useState<TaskStatus>(
      "todo"
    );

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [endDate, setEndDate] =
    useState("");

  const [
    subtasks,
    setSubtasks,
  ] = useState<Subtask[]>(
    []
  );

  const [
    newSubtaskTitle,
    setNewSubtaskTitle,
  ] = useState("");

  // ==========================================================================
  // Task 불러오기
  // ==========================================================================

  useEffect(() => {
    if (!taskId) return;

    const loadTask =
      async () => {
        try {
          const {
            data,
            error,
          } = await supabase
            .from("tasks")
            .select("*")
            .eq(
              "id",
              taskId
            )
            .single();

          if (error) {
            console.error(
              "Task 로드 실패:",
              error
            );

            return;
          }

          if (data) {
            const supabaseTask =
              data as SupabaseTask;

            const targetTask: Task =
              {
                id: supabaseTask.id,
                title:
                  supabaseTask.title,
                description:
                  supabaseTask.description ||
                  "",
                status:
                  supabaseTask.status,
                startDate:
                  supabaseTask.start_date,
                endDate:
                  supabaseTask.end_date,
                subtasks:
                  supabaseTask.subtasks ||
                  [],
              };

            setTask(
              targetTask
            );

            setTitle(
              targetTask.title
            );

            setDescription(
              targetTask.description ||
                ""
            );

            setStatus(
              targetTask.status
            );

            setStartDate(
              targetTask.startDate
            );

            setEndDate(
              targetTask.endDate
            );

            setSubtasks(
              targetTask.subtasks ||
                []
            );
          }
        } catch (error) {
          console.error(
            "데이터 로드 중 오류:",
            error
          );
        } finally {
          setIsLoaded(true);
        }
      };

    loadTask();
  }, [taskId]);

  // ==========================================================================
  // Task 저장
  // ==========================================================================

  const handleSave = async (
    updatedSubtasks = subtasks
  ) => {
    if (!taskId) return;

    const { error } =
      await supabase
        .from("tasks")
        .update({
          title,
          description,
          status,
          start_date:
            startDate,
          end_date:
            endDate,
          subtasks:
            updatedSubtasks,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          taskId
        );

    if (error) {
      console.error(
        "Task 저장 실패:",
        error
      );

      alert(
        "저장 중 오류가 발생했습니다."
      );

      return;
    }

    setTask((prev) =>
      prev
        ? {
            ...prev,
            title,
            description,
            status,
            startDate,
            endDate,
            subtasks:
              updatedSubtasks,
          }
        : prev
    );

    setSubtasks(
      updatedSubtasks
    );

    alert(
      "성공적으로 저장되었습니다."
    );
  };

  // ==========================================================================
  // Task 삭제
  // ==========================================================================

  const handleDelete =
    async () => {
      if (
        !confirm(
          "정말 이 할 일을 삭제하시겠습니까?"
        )
      ) {
        return;
      }

      const { error } =
        await supabase
          .from("tasks")
          .delete()
          .eq(
            "id",
            taskId
          );

      if (error) {
        console.error(
          "Task 삭제 실패:",
          error
        );

        alert(
          "삭제 중 오류가 발생했습니다."
        );

        return;
      }

      router.push("/");
    };

  // ==========================================================================
  // Subtask 추가
  // ==========================================================================

  const handleAddSubtask =
    async () => {
      if (
        !newSubtaskTitle.trim() ||
        !taskId
      ) {
        return;
      }

      const nextSubtasks: Subtask[] =
        [
          ...subtasks,
          {
            id: crypto.randomUUID(),
            title:
              newSubtaskTitle.trim(),
            isCompleted:
              false,
          },
        ];

      const { error } =
        await supabase
          .from("tasks")
          .update({
            subtasks:
              nextSubtasks,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            taskId
          );

      if (error) {
        console.error(
          "하위 작업 추가 실패:",
          error
        );

        alert(
          "하위 작업 추가에 실패했습니다."
        );

        return;
      }

      setSubtasks(
        nextSubtasks
      );

      setNewSubtaskTitle("");
    };

  // ==========================================================================
  // Subtask 체크
  // ==========================================================================

  const handleToggleSubtask =
    async (
      id: string
    ) => {
      if (!taskId) return;

      const nextSubtasks =
        subtasks.map(
          (subtask) =>
            subtask.id === id
              ? {
                  ...subtask,
                  isCompleted:
                    !subtask.isCompleted,
                }
              : subtask
        );

      const { error } =
        await supabase
          .from("tasks")
          .update({
            subtasks:
              nextSubtasks,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            taskId
          );

      if (error) {
        console.error(
          "체크리스트 변경 실패:",
          error
        );

        return;
      }

      setSubtasks(
        nextSubtasks
      );
    };

  // ==========================================================================
  // Subtask 삭제
  // ==========================================================================

  const handleDeleteSubtask =
    async (
      id: string
    ) => {
      if (!taskId) return;

      const nextSubtasks =
        subtasks.filter(
          (subtask) =>
            subtask.id !== id
        );

      const { error } =
        await supabase
          .from("tasks")
          .update({
            subtasks:
              nextSubtasks,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            taskId
          );

      if (error) {
        console.error(
          "체크리스트 삭제 실패:",
          error
        );

        return;
      }

      setSubtasks(
        nextSubtasks
      );
    };

  // ==========================================================================
  // 로딩
  // ==========================================================================

  if (!isLoaded) {
    return (
      <div
        style={{
          padding:
            "40px",
        }}
      >
        로딩 중...
      </div>
    );
  }

  // ==========================================================================
  // Task 없음
  // ==========================================================================

  if (!task) {
    return (
      <div
        style={{
          padding:
            "40px",
          textAlign:
            "center",
        }}
      >
        <h2>
          해당 작업을
          찾을 수 없습니다.
        </h2>

        <button
          className="btn-primary"
          style={{
            width: "auto",
            marginTop:
              "16px",
          }}
          onClick={() =>
            router.push("/")
          }
        >
          메인 화면으로
          돌아가기
        </button>
      </div>
    );
  }

  // ==========================================================================
  // 진행률
  // ==========================================================================

  const completedCount =
    subtasks.filter(
      (subtask) =>
        subtask.isCompleted
    ).length;

  const progressPercent =
    subtasks.length > 0
      ? Math.round(
          (completedCount /
            subtasks.length) *
            100
        )
      : 0;

  // ==========================================================================
  // 화면
  // ==========================================================================

  return (
    <div
      style={{
        maxWidth:
          "800px",
        margin:
          "40px auto",
        padding:
          "0 20px",
      }}
    >
      {/* ================================================================ */}
      {/* 상단 네비게이션 */}
      {/* ================================================================ */}

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          marginBottom:
            "24px",
        }}
      >
        <button
          className="btn-primary"
          style={{
            background:
              "#cbd5e1",
            color:
              "#334155",
            width:
              "auto",
          }}
          onClick={() =>
            router.push("/")
          }
        >
          ← 메인 목록으로
          돌아가기
        </button>

        <button
          className="btn-primary"
          style={{
            background:
              "#ef4444",
            width:
              "auto",
          }}
          onClick={
            handleDelete
          }
        >
          🗑️ 삭제하기
        </button>
      </div>

      {/* ================================================================ */}
      {/* 상세 카드 */}
      {/* ================================================================ */}

      <div
        className="glass-card"
        style={{
          padding:
            "32px",
        }}
      >
        {/* 상태 */}
        <div
          style={{
            display:
              "flex",
            gap: "12px",
            alignItems:
              "center",
            marginBottom:
              "16px",
          }}
        >
          <span
            className={`status-dot dot-${
              status ===
              "in_progress"
                ? "progress"
                : status
            }`}
          />

          <span
            style={{
              fontSize:
                "0.9rem",
              color:
                "#64748b",
              fontWeight:
                600,
            }}
          >
            {status ===
            "todo"
              ? "진행해야 되는 일"
              : status ===
                "in_progress"
              ? "진행 중인 일"
              : "완료한 일"}
          </span>
        </div>

        {/* ============================================================ */}
        {/* 제목 */}
        {/* ============================================================ */}

        <div className="form-group">
          <label className="form-label">
            작업 제목
          </label>

          <input
            className="form-input"
            style={{
              fontSize:
                "1.25rem",
              fontWeight: 700,
            }}
            value={title}
            onChange={(e) =>
              setTitle(
                e.target
                  .value
              )
            }
          />
        </div>

        {/* ============================================================ */}
        {/* 날짜 / 상태 */}
        {/* ============================================================ */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "1fr 1fr 1fr",
            gap: "16px",
            marginBottom:
              "20px",
          }}
        >
          <div className="form-group">
            <label className="form-label">
              상태
            </label>

            <select
              className="form-select"
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target
                    .value as TaskStatus
                )
              }
            >
              <option value="todo">
                진행해야 되는 일
              </option>

              <option value="in_progress">
                진행 중인 일
              </option>

              <option value="done">
                완료한 일
              </option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              시작일
            </label>

            <input
              className="form-input"
              type="date"
              value={
                startDate
              }
              onChange={(e) =>
                setStartDate(
                  e.target
                    .value
                )
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              종료일
            </label>

            <input
              className="form-input"
              type="date"
              value={
                endDate
              }
              onChange={(e) =>
                setEndDate(
                  e.target
                    .value
                )
              }
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* 상세 설명 */}
        {/* ============================================================ */}

        <div className="form-group">
          <label className="form-label">
            세부 상세설명
            (Description /
            Memo)
          </label>

          <textarea
            className="form-input"
            rows={5}
            placeholder="상세한 작업 내용, 관련 링크, 참고사항을 작성하세요..."
            value={
              description
            }
            onChange={(e) =>
              setDescription(
                e.target
                  .value
              )
            }
            style={{
              resize:
                "vertical",
              lineHeight:
                1.6,
            }}
          />
        </div>

        {/* ============================================================ */}
        {/* 체크리스트 */}
        {/* ============================================================ */}

        <div
          className="form-group"
          style={{
            marginTop:
              "24px",
          }}
        >
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              marginBottom:
                "8px",
            }}
          >
            <label
              className="form-label"
              style={{
                margin: 0,
              }}
            >
              하위 체크리스트
              (
              {
                completedCount
              }
              /
              {
                subtasks.length
              }
              )
            </label>

            <span
              style={{
                fontSize:
                  "0.85rem",
                color:
                  "#64748b",
              }}
            >
              달성률{" "}
              {
                progressPercent
              }
              %
            </span>
          </div>

          <div
            className="progress-bar-bg"
            style={{
              marginBottom:
                "16px",
            }}
          >
            <div
              className="progress-bar-fill"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>

          {/* 추가 */}
          <div
            style={{
              display:
                "flex",
              gap: "8px",
              marginBottom:
                "12px",
            }}
          >
            <input
              className="form-input"
              type="text"
              placeholder="새로운 세부 작업 항목 입력 후 Enter..."
              value={
                newSubtaskTitle
              }
              onChange={(e) =>
                setNewSubtaskTitle(
                  e.target
                    .value
                )
              }
              onKeyDown={(
                e
              ) => {
                if (
                  e.key ===
                  "Enter"
                ) {
                  e.preventDefault();

                  handleAddSubtask();
                }
              }}
            />

            <button
              type="button"
              className="btn-primary"
              style={{
                width:
                  "auto",
                padding:
                  "0 20px",
              }}
              onClick={
                handleAddSubtask
              }
            >
              추가
            </button>
          </div>

          {/* 목록 */}
          <div
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap: "8px",
            }}
          >
            {subtasks.map(
              (subtask) => (
                <div
                  key={
                    subtask.id
                  }
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    background:
                      "#f8fafc",
                    padding:
                      "10px 14px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #e2e8f0",
                  }}
                >
                  <label
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "12px",
                      fontSize:
                        "0.95rem",
                      cursor:
                        "pointer",
                      flex: 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{
                        width:
                          "18px",
                        height:
                          "18px",
                      }}
                      checked={
                        subtask.isCompleted
                      }
                      onChange={() =>
                        handleToggleSubtask(
                          subtask.id
                        )
                      }
                    />

                    <span
                      style={{
                        textDecoration:
                          subtask.isCompleted
                            ? "line-through"
                            : "none",
                        color:
                          subtask.isCompleted
                            ? "#94a3b8"
                            : "#1e293b",
                      }}
                    >
                      {
                        subtask.title
                      }
                    </span>
                  </label>

                  <button
                    type="button"
                    className="btn-mini"
                    style={{
                      color:
                        "#ef4444",
                      fontSize:
                        "1rem",
                    }}
                    onClick={() =>
                      handleDeleteSubtask(
                        subtask.id
                      )
                    }
                  >
                    ✕
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 저장 */}
        {/* ============================================================ */}

        <div
          style={{
            marginTop:
              "32px",
            display:
              "flex",
            justifyContent:
              "flex-end",
          }}
        >
          <button
            type="button"
            className="btn-primary"
            style={{
              width:
                "200px",
              padding:
                "12px 0",
              fontSize:
                "1rem",
            }}
            onClick={() =>
              handleSave()
            }
          >
            💾 변경사항
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}