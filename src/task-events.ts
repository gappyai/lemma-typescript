import type { TaskMessage } from "./types.js";

interface ParsedRecord {
  [key: string]: unknown;
}

export interface ParsedTaskStreamEvent {
  message?: TaskMessage;
  status?: string;
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
    const status = extractStatus(payload);
    return status ? { status } : {};
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
