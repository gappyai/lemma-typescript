import type { HttpClient } from "../http.js";
import type { CreateAssistantRequest } from "../openapi_client/models/CreateAssistantRequest.js";
import type { UpdateAssistantRequest } from "../openapi_client/models/UpdateAssistantRequest.js";
import type { CreateConversationRequest } from "../openapi_client/models/CreateConversationRequest.js";
import type { CreateMessageRequest } from "../openapi_client/models/CreateMessageRequest.js";

export class AssistantsNamespace {
  constructor(
    private readonly http: HttpClient,
    private readonly podId: () => string,
  ) {}

  list(options: { limit?: number; pageToken?: string; cursor?: string } = {}) {
    return this.http.request("GET", `/pods/${this.podId()}/assistants`, {
      params: {
        limit: options.limit ?? 100,
        page_token: options.pageToken ?? options.cursor,
        cursor: options.cursor,
      },
    });
  }

  create(payload: CreateAssistantRequest | Record<string, unknown>) {
    return this.http.request("POST", `/pods/${this.podId()}/assistants`, { body: payload });
  }

  get(assistantName: string) {
    return this.http.request("GET", `/pods/${this.podId()}/assistants/${assistantName}`);
  }

  update(assistantName: string, payload: UpdateAssistantRequest | Record<string, unknown>) {
    return this.http.request("PATCH", `/pods/${this.podId()}/assistants/${assistantName}`, {
      body: payload,
    });
  }

  delete(assistantName: string) {
    return this.http.request("DELETE", `/pods/${this.podId()}/assistants/${assistantName}`);
  }
}

export class ConversationsNamespace {
  constructor(
    private readonly http: HttpClient,
    private readonly podId: () => string,
  ) {}

  list(options: {
    assistantId?: string;
    assistantName?: string;
    podId?: string;
    organizationId?: string;
    limit?: number;
    pageToken?: string;
    cursor?: string;
  } = {}) {
    return this.http.request("GET", "/conversations", {
      params: {
        assistant_id: options.assistantName ?? options.assistantId,
        pod_id: options.podId ?? this.podId(),
        organization_id: options.organizationId,
        limit: options.limit ?? 20,
        page_token: options.pageToken ?? options.cursor,
        cursor: options.cursor,
      },
    });
  }

  listByAssistant(
    assistantName: string,
    options: {
      podId?: string;
      organizationId?: string;
      limit?: number;
      pageToken?: string;
      cursor?: string;
    } = {},
  ) {
    return this.list({ ...options, assistantName });
  }

  create(
    payload: Omit<CreateConversationRequest, "pod_id"> & {
      pod_id?: string;
      assistant_name?: string | null;
    },
  ) {
    return this.http.request("POST", "/conversations", {
      body: {
        ...payload,
        assistant_id: payload.assistant_id ?? payload.assistant_name,
        pod_id: payload.pod_id ?? this.podId(),
      },
    });
  }

  createForAssistant(
    assistantName: string,
    payload: Omit<CreateConversationRequest, "pod_id" | "assistant_id"> & { pod_id?: string } = {},
  ) {
    return this.create({
      ...payload,
      assistant_name: assistantName,
      pod_id: payload.pod_id ?? this.podId(),
    });
  }

  get(conversationId: string, options: { podId?: string } = {}) {
    return this.http.request("GET", `/conversations/${conversationId}`, {
      params: {
        pod_id: options.podId ?? this.podId(),
      },
    });
  }

  update(
    conversationId: string,
    payload: Record<string, unknown>,
    options: { podId?: string } = {},
  ) {
    return this.http.request("PATCH", `/conversations/${conversationId}`, {
      params: {
        pod_id: options.podId ?? this.podId(),
      },
      body: payload,
    });
  }

  sendMessageStream(
    conversationId: string,
    payload: CreateMessageRequest,
    options: { podId?: string; signal?: AbortSignal } = {},
  ) {
    return this.http.stream(`/conversations/${conversationId}/messages`, {
      method: "POST",
      params: {
        pod_id: options.podId ?? this.podId(),
      },
      body: payload,
      signal: options.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
    });
  }

  resumeStream(
    conversationId: string,
    options: { podId?: string; signal?: AbortSignal } = {},
  ) {
    return this.http.stream(`/conversations/${conversationId}/stream`, {
      params: {
        pod_id: options.podId ?? this.podId(),
      },
      signal: options.signal,
      headers: {
        Accept: "text/event-stream",
      },
    });
  }

  stopRun(conversationId: string, options: { podId?: string } = {}) {
    return this.http.request("PATCH", `/conversations/${conversationId}/stop`, {
      params: {
        pod_id: options.podId ?? this.podId(),
      },
      body: {},
    });
  }

  readonly messages = {
    list: (
      conversationId: string,
      options: {
        limit?: number;
        pageToken?: string;
        cursor?: string;
        order?: "asc" | "desc" | string;
        podId?: string;
      } = {},
    ) =>
      this.http.request("GET", `/conversations/${conversationId}/messages`, {
        params: {
          pod_id: options.podId ?? this.podId(),
          limit: options.limit ?? 20,
          page_token: options.pageToken ?? options.cursor,
          cursor: options.cursor,
          order: options.order,
        },
      }),
    send: (
      conversationId: string,
      payload: CreateMessageRequest,
      options: { podId?: string } = {},
    ) =>
      this.http.request("POST", `/conversations/${conversationId}/messages`, {
        params: {
          pod_id: options.podId ?? this.podId(),
        },
        body: payload,
      }),
  };
}
