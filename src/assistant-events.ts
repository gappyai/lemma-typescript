import type { ConversationMessage } from "./types.js";

interface ParsedRecord {
  [key: string]: unknown;
}

export interface ParsedAssistantStreamEvent {
  message?: ConversationMessage;
  status?: string;
  token?: string;
}

function isRecord(value: unknown): value is ParsedRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeStatus(status: unknown): string | undefined {
  if (typeof status !== "string") return undefined;
  const normalized = status.trim().toUpperCase();
  return normalized.length > 0 ? normalized : undefined;
}

function toConversationMessage(value: unknown): ConversationMessage | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.id !== "string") return undefined;
  if (typeof value.role !== "string") return undefined;
  if (!("content" in value)) return undefined;

  const message: ConversationMessage = {
    id: value.id,
    role: value.role,
    content: value.content as ConversationMessage["content"],
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
      ?? normalizeStatus(payload.conversation_status)
      ?? normalizeStatus(payload.run_status)
      ?? (isRecord(payload.conversation) ? normalizeStatus(payload.conversation.status) : undefined);
  }

  return normalizeStatus(payload);
}

export function parseAssistantStreamEvent(value: unknown): ParsedAssistantStreamEvent {
  const directMessage = toConversationMessage(value);
  if (directMessage) {
    return { message: directMessage };
  }

  if (!isRecord(value)) {
    return {};
  }

  const eventType = typeof value.type === "string" ? value.type.toLowerCase() : "";
  const payload = extractPayload(value);

  if (eventType === "token" && typeof payload === "string") {
    return { token: payload };
  }

  if (eventType === "message" || eventType === "message_added") {
    const message = toConversationMessage(payload);
    return message ? { message } : {};
  }

  if (
    eventType === "status"
    || eventType === "conversation_status"
    || eventType === "conversation_updated"
    || eventType === "run_status"
  ) {
    const status = extractStatus(payload);
    return status ? { status } : {};
  }

  return {};
}

export function upsertConversationMessage(
  messages: ConversationMessage[],
  incoming: ConversationMessage,
): ConversationMessage[] {
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
