import React, { useCallback, useEffect, useState } from "react";
import { getClient, DATASTORE, TABLE, type Todo } from "../lib/client.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Status = "todo" | "in_progress" | "done";
type Priority = "low" | "medium" | "high";

interface NewTodoForm {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchTodos(): Promise<Todo[]> {
  const client = getClient();
  const response = (await client.records.list(DATASTORE, TABLE, { limit: 100 })) as {
    items: Todo[];
  };
  return response.items;
}

async function createTodo(form: NewTodoForm): Promise<Todo> {
  const client = getClient();
  const response = (await client.records.create(DATASTORE, TABLE, {
    title: form.title,
    description: form.description || null,
    status: form.status,
    priority: form.priority,
  })) as { data: Todo };
  return response.data;
}

async function updateTodoStatus(id: string, status: Status): Promise<void> {
  const client = getClient();
  await client.records.update(DATASTORE, TABLE, id, { status });
}

async function deleteTodo(id: string): Promise<void> {
  const client = getClient();
  await client.records.delete(DATASTORE, TABLE, id);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Badge({ status }: { status: Status }) {
  const styles: Record<Status, React.CSSProperties> = {
    todo: { background: "#f3f4f6", color: "#374151" },
    in_progress: { background: "#fef9c3", color: "#854d0e" },
    done: { background: "#dcfce7", color: "#15803d" },
  };
  const labels: Record<Status, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
  };
  return (
    <span style={{
      ...styles[status],
      padding: "2px 8px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 500,
      display: "inline-block",
    }}>
      {labels[status]}
    </span>
  );
}

function PriorityDot({ priority }: { priority: Priority | null }) {
  if (!priority) return null;
  const colors: Record<Priority, string> = {
    low: "#6b7280",
    medium: "#f59e0b",
    high: "#ef4444",
  };
  return (
    <span title={priority} style={{
      display: "inline-block",
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: colors[priority],
      marginRight: "6px",
      verticalAlign: "middle",
    }} />
  );
}

function TodoCard({
  todo,
  onStatusChange,
  onDelete,
}: {
  todo: Todo;
  onStatusChange: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      padding: "16px",
      display: "flex",
      gap: "12px",
      alignItems: "flex-start",
    }}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={todo.status === "done"}
        onChange={(e) => onStatusChange(todo.id, e.target.checked ? "done" : "todo")}
        style={{ marginTop: "2px", cursor: "pointer", width: "16px", height: "16px", flexShrink: 0 }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <PriorityDot priority={todo.priority} />
          <span style={{
            fontWeight: 500,
            fontSize: "14px",
            textDecoration: todo.status === "done" ? "line-through" : "none",
            color: todo.status === "done" ? "#9ca3af" : "#111827",
          }}>
            {todo.title}
          </span>
          <Badge status={todo.status} />
        </div>

        {todo.description && (
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#6b7280", lineHeight: 1.4 }}>
            {todo.description}
          </p>
        )}

        {/* Status selector */}
        <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
          {(["todo", "in_progress", "done"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(todo.id, s)}
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                border: "1px solid",
                borderColor: todo.status === s ? "#6366f1" : "#e5e7eb",
                background: todo.status === s ? "#eef2ff" : "transparent",
                color: todo.status === s ? "#4f46e5" : "#6b7280",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {s === "todo" ? "To Do" : s === "in_progress" ? "In Progress" : "Done"}
            </button>
          ))}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(todo.id)}
        title="Delete"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#d1d5db",
          fontSize: "16px",
          padding: "0 4px",
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

function AddTodoForm({ onAdd }: { onAdd: (form: NewTodoForm) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<NewTodoForm>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await onAdd(form);
      setForm({ title: "", description: "", status: "todo", priority: "medium" });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: "12px",
          background: "#fff",
          border: "2px dashed #e5e7eb",
          borderRadius: "10px",
          color: "#9ca3af",
          fontSize: "14px",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        + Add a new task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: "#fff",
      border: "1px solid #6366f1",
      borderRadius: "10px",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      <input
        autoFocus
        placeholder="Task title *"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        required
        style={inputStyle}
      />
      <textarea
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={2}
        style={{ ...inputStyle, resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: "8px" }}>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
          style={{ ...inputStyle, flex: 1 }}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
          style={{ ...inputStyle, flex: 1 }}
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ ...btnStyle, background: "#f3f4f6", color: "#374151" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !form.title.trim()}
          style={{ ...btnStyle, background: "#4f46e5", color: "#fff", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Adding…" : "Add Task"}
        </button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
};

const btnStyle: React.CSSProperties = {
  padding: "7px 16px",
  border: "none",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type FilterStatus = "all" | Status;

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTodos();
      setTodos(data);
    } catch (e) {
      setError((e as Error).message || "Failed to load todos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async (form: NewTodoForm) => {
    const created = await createTodo(form);
    setTodos((prev) => [created, ...prev]);
  };

  const handleStatusChange = async (id: string, status: Status) => {
    // Optimistic update
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await updateTodoStatus(id, status);
    } catch {
      refresh(); // rollback on error
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic update
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTodo(id);
    } catch {
      refresh();
    }
  };

  const filtered = filter === "all" ? todos : todos.filter((t) => t.status === filter);
  const counts = {
    all: todos.length,
    todo: todos.filter((t) => t.status === "todo").length,
    in_progress: todos.filter((t) => t.status === "in_progress").length,
    done: todos.filter((t) => t.status === "done").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", padding: "0" }}>
      {/* Header */}
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "28px", height: "28px", background: "#111827",
            borderRadius: "6px", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700,
          }}>L</div>
          <span style={{ fontWeight: 600, fontSize: "16px" }}>Lemma Todo</span>
          <span style={{
            fontSize: "11px", padding: "2px 8px",
            background: "#f3f4f6", color: "#6b7280", borderRadius: "4px",
          }}>@lemma/client demo</span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          style={{ ...btnStyle, background: "#f3f4f6", color: "#374151", fontSize: "12px" }}
        >
          {loading ? "Loading…" : "↺ Refresh"}
        </button>
      </header>

      {/* Body */}
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: 700 }}>My Tasks</h1>
        <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#6b7280" }}>
          Live data from{" "}
          <code style={{ background: "#f3f4f6", padding: "1px 5px", borderRadius: "4px", fontSize: "12px" }}>
            pods/{getClient().podId}/datastores/default/tables/todos
          </code>
        </p>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {(["all", "todo", "in_progress", "done"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px",
                border: "1px solid",
                borderColor: filter === f ? "#4f46e5" : "#e5e7eb",
                background: filter === f ? "#eef2ff" : "#fff",
                color: filter === f ? "#4f46e5" : "#374151",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: filter === f ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {f === "all" ? "All" : f === "todo" ? "To Do" : f === "in_progress" ? "In Progress" : "Done"}
              <span style={{
                marginLeft: "6px",
                fontSize: "11px",
                background: filter === f ? "#c7d2fe" : "#f3f4f6",
                color: filter === f ? "#3730a3" : "#6b7280",
                borderRadius: "999px",
                padding: "0 5px",
              }}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
            padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px",
          }}>
            {error}
          </div>
        )}

        {/* Add form */}
        <AddTodoForm onAdd={handleAdd} />

        {/* List */}
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {loading && todos.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0", fontSize: "14px" }}>
              Loading tasks...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0", fontSize: "14px" }}>
              {filter === "all" ? "No tasks yet. Add your first task above." : `No ${filter.replace("_", " ")} tasks.`}
            </div>
          ) : (
            filtered.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Footer SDK info */}
        <div style={{
          marginTop: "40px",
          padding: "16px",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          fontSize: "12px",
          color: "#6b7280",
          lineHeight: 1.6,
        }}>
          <strong style={{ color: "#374151" }}>SDK info</strong>
          <div>Using <code>@lemma/client</code> TypeScript SDK via Vite path alias</div>
          <div>Auth: <code>?lemma_token=&lt;token&gt;</code> (Bearer) or session cookie</div>
          <div>Pod: <code>{getClient().podId}</code></div>
          <div>API: <code>{getClient().apiUrl}</code> (proxied via Vite)</div>
        </div>
      </main>
    </div>
  );
}
