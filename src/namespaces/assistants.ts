import type { HttpClient } from "../http.js";
import type { AssistantListResponse } from "../openapi_client/models/AssistantListResponse.js";
import type { AssistantResponse } from "../openapi_client/models/AssistantResponse.js";
import type { ConversationListResponse } from "../openapi_client/models/ConversationListResponse.js";
import type { ConversationMessageListResponse } from "../openapi_client/models/ConversationMessageListResponse.js";
import type { ConversationResponse } from "../openapi_client/models/ConversationResponse.js";
import type { CreateAssistantRequest } from "../openapi_client/models/CreateAssistantRequest.js";
import type { CreateConversationRequest } from "../openapi_client/models/CreateConversationRequest.js";
import type { CreateMessageRequest } from "../openapi_client/models/CreateMessageRequest.js";
import type { UpdateAssistantRequest } from "../openapi_client/models/UpdateAssistantRequest.js";
import type { UpdateConversationRequest } from "../openapi_client/models/UpdateConversationRequest.js";

export class AssistantsNamespace {
  constructor(
    private readonly http: HttpClient,
    private readonly podId: () => string,
  ) {}

  list(options: { limit?: number; page_token?: string } = {}): Promise<AssistantListResponse> {
    return this.http.request<AssistantListResponse>("GET", `/pods/${this.podId()}/assistants`, {
      params: {
        limit: options.limit ?? 100,
        page_token: options.page_token,
      },
    });
  }

  create(payload: CreateAssistantRequest): Promise<AssistantResponse> {
    return this.http.request<AssistantResponse>("POST", `/pods/${this.podId()}/assistants`, { body: payload });
  }

  get(assistantName: string): Promise<AssistantResponse> {
    return this.http.request<AssistantResponse>("GET", `/pods/${this.podId()}/assistants/${assistantName}`);
  }

  update(assistantName: string, payload: UpdateAssistantRequest): Promise<AssistantResponse> {
    return this.http.request<AssistantResponse>("PATCH", `/pods/${this.podId()}/assistants/${assistantName}`, {
      body: payload,
    });
  }

  delete(assistantName: string): Promise<void> {
    return this.http.request<void>("DELETE", `/pods/${this.podId()}/assistants/${assistantName}`);
  }
}

export class ConversationsNamespace {
  constructor(
    private readonly http: HttpClient,
    private readonly podId: () => string,
  ) {}

  private resolvePodId(explicitPodId?: string | null): string | undefined {
    if (typeof explicitPodId === "string") {
      return explicitPodId;
    }

    try {
      return this.podId();
    } catch {
      return undefined;
    }
  }

  private requirePodId(explicitPodId?: string | null): string {
    const podId = this.resolvePodId(explicitPodId);
    if (!podId) {
      throw new Error("pod_id is required for this conversation operation.");
    }
    return podId;
  }

  list(options: {
    assistant_id?: string;
    pod_id?: string;
    organization_id?: string;
    limit?: number;
    page_token?: string;
  } = {}): Promise<ConversationListResponse> {
    return this.http.request<ConversationListResponse>("GET", "/conversations", {
      params: {
        assistant_id: options.assistant_id,
        pod_id: this.resolvePodId(options.pod_id),
        organization_id: options.organization_id,
        limit: options.limit ?? 20,
        page_token: options.page_token,
      },
    });
  }

  listByAssistant(
    assistantId: string,
    options: {
      pod_id?: string;
      organization_id?: string;
      limit?: number;
      page_token?: string;
    } = {},
  ): Promise<ConversationListResponse> {
    return this.list({ ...options, assistant_id: assistantId });
  }

  create(payload: CreateConversationRequest): Promise<ConversationResponse> {
    return this.http.request<ConversationResponse>("POST", "/conversations", {
      body: {
        ...payload,
        pod_id: this.resolvePodId(payload.pod_id),
      },
    });
  }

  createForAssistant(
    assistantId: string,
    payload: Omit<CreateConversationRequest, "assistant_id"> = {},
  ): Promise<ConversationResponse> {
    return this.create({
      ...payload,
      assistant_id: assistantId,
    });
  }

  get(conversationId: string, options: { pod_id?: string } = {}): Promise<ConversationResponse> {
    return this.http.request<ConversationResponse>("GET", `/conversations/${conversationId}`, {
      params: {
        pod_id: this.resolvePodId(options.pod_id),
      },
    });
  }

  update(
    conversationId: string,
    payload: UpdateConversationRequest,
    options: { pod_id?: string } = {},
  ): Promise<ConversationResponse> {
    return this.http.request<ConversationResponse>("PATCH", `/conversations/${conversationId}`, {
      params: {
        pod_id: this.resolvePodId(options.pod_id),
      },
      body: payload,
    });
  }

  delete(conversationId: string, options: { pod_id?: string } = {}): Promise<unknown> {
    const scopedPodId = this.requirePodId(options.pod_id);
    return this.http.request<unknown>("DELETE", `/pods/${scopedPodId}/conversations/${conversationId}`);
  }

  sendMessageStream(
    conversationId: string,
    payload: CreateMessageRequest,
    options: { pod_id?: string; signal?: AbortSignal } = {},
  ) {
    return this.http.stream(`/conversations/${conversationId}/messages`, {
      method: "POST",
      params: {
        pod_id: this.resolvePodId(options.pod_id),
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
    options: { pod_id?: string; signal?: AbortSignal } = {},
  ) {
    return this.http.stream(`/conversations/${conversationId}/stream`, {
      params: {
        pod_id: this.resolvePodId(options.pod_id),
      },
      signal: options.signal,
      headers: {
        Accept: "text/event-stream",
      },
    });
  }

  stopRun(conversationId: string, options: { pod_id?: string } = {}): Promise<unknown> {
    return this.http.request<unknown>("PATCH", `/conversations/${conversationId}/stop`, {
      params: {
        pod_id: this.resolvePodId(options.pod_id),
      },
      body: {},
    });
  }

  readonly messages = {
    list: (
      conversationId: string,
      options: {
        limit?: number;
        page_token?: string;
        pod_id?: string;
      } = {},
    ): Promise<ConversationMessageListResponse> =>
      this.http.request<ConversationMessageListResponse>("GET", `/conversations/${conversationId}/messages`, {
        params: {
          pod_id: this.resolvePodId(options.pod_id),
          limit: options.limit ?? 20,
          page_token: options.page_token,
        },
      }),

    send: (
      conversationId: string,
      payload: CreateMessageRequest,
      options: { pod_id?: string } = {},
    ): Promise<unknown> =>
      this.http.request<unknown>("POST", `/conversations/${conversationId}/messages`, {
        params: {
          pod_id: this.resolvePodId(options.pod_id),
        },
        body: payload,
      }),
  };
}
