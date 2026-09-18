import { useState } from "react";
import { Subtask } from "../app/types/task";

// Subtask Inline Manager
export function SubtaskInlineManager({
  subtasks,
  onAdd,
  onToggle,
  onDelete,
}: {
  subtasks: Subtask[];
  onAdd: (title: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input
          className="form-input"
          style={{ background: "#fff", flex: 1 }}
          type="text"
          placeholder="하위 작업 추가 후 Enter..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />

        <button
          type="button"
          className="btn-primary"
          style={{ width: "auto", padding: "6px 12px" }}
          onClick={handleAdd}
        >
          추가
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          maxHeight: "150px",
          overflowY: "auto",
        }}
      >
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fff",
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={subtask.isCompleted}
                onChange={() => onToggle(subtask.id)}
              />

              <span
                style={{
                  textDecoration: subtask.isCompleted ? "line-through" : "none",
                  color: subtask.isCompleted ? "#94a3b8" : "inherit",
                }}
              >
                {subtask.title}
              </span>
            </label>

            <button
              type="button"
              className="btn-mini"
              style={{ color: "#ef4444" }}
              onClick={() => onDelete(subtask.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}