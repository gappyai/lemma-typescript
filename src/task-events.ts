import type { Task, TaskMessage } from "./types.js";

interface ParsedRecord {
  [key: string]: unknown;
}

export interface ParsedTaskStreamEvent {
  message?: TaskMessage;
  status?: string;
  task?: Task;
}

function isRecord(value: unknown): value is ParsedRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeStatus(status: unknown): string | undefined {
  if (typeof status !== "string") return undefined;
  const normalized = status.trim().toUpperCase();
  return normalized.length > 0 ? normalized : undefined;
}

function toTaskMessage(value: unknown): TaskMessage | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.id !== "string") return undefined;
  if (typeof value.role !== "string") return undefined;
  if (!("content" in value)) return undefined;

  const content = value.content;

  const message: TaskMessage = {
    id: value.id,
    role: value.role,
    content: content as TaskMessage["content"],
    created_at: typeof value.created_at === "string" ? value.created_at : new Date().toISOString(),
    metadata: isRecord(value.metadata) ? value.metadata : null,
  };

  return message;
}

function toTask(value: unknown): Task | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.id !== "string") return undefined;

  const status = normalizeStatus(value.status);
  if (!status) return undefined;

  if (typeof value.agent_id !== "string") return undefined;
  if (typeof value.pod_id !== "string") return undefined;
  if (typeof value.user_id !== "string") return undefined;
  if (typeof value.created_at !== "string") return undefined;
  if (typeof value.updated_at !== "string") return undefined;

  return {
    id: value.id,
    agent_id: value.agent_id,
    pod_id: value.pod_id,
    user_id: value.user_id,
    input_data: isRecord(value.input_data) ? value.input_data : null,
    output_data: isRecord(value.output_data) ? value.output_data : null,
    error: typeof value.error === "string" ? value.error : null,
    status: status as Task["status"],
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

function extractPayload(record: ParsedRecord): unknown {
  if ("data" in record) return record.data;
  if ("payload" in record) return record.payload;
  return undefined;
}

function extractStatus(payload: unknown): string | undefined {
  if (isRecord(payload)) {
    return normalizeStatus(payload.status)
      ?? normalizeStatus(payload.task_status)
      ?? (isRecord(payload.task) ? normalizeStatus(payload.task.status) : undefined);
  }

  return normalizeStatus(payload);
}

export function parseTaskStreamEvent(value: unknown): ParsedTaskStreamEvent {
  const directMessage = toTaskMessage(value);
  if (directMessage) {
    return { message: directMessage };
  }

  if (!isRecord(value)) {
    return {};
  }

  const eventType = typeof value.type === "string" ? value.type.toLowerCase() : "";
  const payload = extractPayload(value);

  if (eventType === "message" || eventType === "message_added") {
    const message = toTaskMessage(payload);
    return message ? { message } : {};
  }

  if (
    eventType === "status"
    || eventType === "task_status"
    || eventType === "task"
    || eventType === "task_updated"
  ) {
    const task = toTask(payload) ?? (isRecord(payload) ? toTask(payload.task) : undefined);
    const status = extractStatus(payload);
    if (task || status) {
      return {
        task,
        status: status ?? task?.status,
      };
    }
  }

  return {};
}

export function upsertTaskMessage(messages: TaskMessage[], incoming: TaskMessage): TaskMessage[] {
  const next = [...messages];
  const index = next.findIndex((message) => message.id === incoming.id);

  if (index >= 0) {
    next[index] = incoming;
  } else {
    next.push(incoming);
  }

  next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return next;
}
