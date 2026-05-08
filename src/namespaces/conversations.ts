import type { HttpClient } from "../http.js";
import { AgentModelName } from "../openapi_client/models/AgentModelName.js";
import type { ConversationListResponse } from "../openapi_client/models/ConversationListResponse.js";
import type { CreateConversationRequest } from "../openapi_client/models/CreateConversationRequest.js";
import type { SendMessageRequest } from "../openapi_client/models/SendMessageRequest.js";
import type { UpdateConversationRequest } from "../openapi_client/models/UpdateConversationRequest.js";
import type {
  AvailableModelInfo,
  Conversation,
  ConversationMessage,
  ConversationModel,
  CursorPage,
} from "../types.js";

type ConversationCreateInput = CreateConversationRequest & {
  agent_name?: string | null;
  model?: ConversationModel | null;
  pod_id?: string | null;
};

type ConversationUpdateInput = UpdateConversationRequest & {
  model?: ConversationModel | null;
};

function normalizeConversation<T extends Conversation | null>(conversation: T): T {
  if (!conversation) return conversation;
  const record = conversation as Conversation & { model_name?: ConversationModel | null };
  return {
    ...record,
    model: record.model ?? record.model_name ?? null,
    status: record.status ?? "waiting",
  } as T;
}

function normalizeConversationList(response: ConversationListResponse): CursorPage<Conversation> & ConversationListResponse {
  const items = (response.items ?? []).map((conversation) => normalizeConversation(conversation as Conversation));
  return {
    ...response,
    items,
  };
}

function normalizeMessage(message: ConversationMessage): ConversationMessage {
  return message;
}

function buildModelList(): AvailableModelInfo[] {
  return Object.values(AgentModelName).map((model) => ({
    id: model as ConversationModel,
    name: model,
  }));
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
    agent_name?: string | null;
    pod_id?: string | null;
    limit?: number;
    page_token?: string | null;
  } = {}): Promise<ConversationListResponse> {
    const podId = this.requirePodId(options.pod_id);
    return this.http.request<ConversationListResponse>("GET", `/pods/${podId}/conversations`, {
      params: {
        agent_name: options.agent_name,
        limit: options.limit ?? 20,
        page_token: options.page_token,
      },
    }).then(normalizeConversationList);
  }

  listByAgent(
    agentName: string,
    options: {
      pod_id?: string | null;
      limit?: number;
      page_token?: string | null;
    } = {},
  ): Promise<ConversationListResponse> {
    return this.list({ ...options, agent_name: agentName });
  }

  async listModels(): Promise<{ items: AvailableModelInfo[]; limit: number; next_page_token: null }> {
    const items = buildModelList();
    return {
      items,
      limit: items.length,
      next_page_token: null,
    };
  }

  create(payload: ConversationCreateInput = {}): Promise<Conversation> {
    const podId = this.requirePodId(payload.pod_id);
    const { agent_name, model, model_name, pod_id, ...requestBody } = payload;
    const body: CreateConversationRequest = {
      ...requestBody,
      agent_name: agent_name ?? undefined,
      model_name: model_name ?? (model as CreateConversationRequest["model_name"] | undefined),
    };

    void pod_id;

    return this.http.request<Conversation>("POST", `/pods/${podId}/conversations`, {
      body,
    }).then(normalizeConversation);
  }

  createForAgent(
    agentName: string,
    payload: Omit<ConversationCreateInput, "agent_name"> = {},
  ): Promise<Conversation> {
    return this.create({
      ...payload,
      agent_name: agentName,
    });
  }

  get(conversationId: string, options: { pod_id?: string | null } = {}): Promise<Conversation> {
    const podId = this.requirePodId(options.pod_id);
    return this.http.request<Conversation>("GET", `/pods/${podId}/conversations/${conversationId}`)
      .then(normalizeConversation);
  }

  update(
    conversationId: string,
    payload: ConversationUpdateInput,
    options: { pod_id?: string | null } = {},
  ): Promise<Conversation> {
    const podId = this.requirePodId(options.pod_id);
    const { model, model_name, ...requestBody } = payload;
    const body: UpdateConversationRequest = {
      ...requestBody,
      model_name: model_name ?? (model as UpdateConversationRequest["model_name"] | undefined),
    };

    return this.http.request<Conversation>("PATCH", `/pods/${podId}/conversations/${conversationId}`, {
      body,
    }).then(normalizeConversation);
  }

  sendMessageStream(
    conversationId: string,
    payload: SendMessageRequest,
    options: { pod_id?: string | null; signal?: AbortSignal } = {},
  ) {
    const podId = this.requirePodId(options.pod_id);
    return this.http.stream(`/pods/${podId}/conversations/${conversationId}/messages`, {
      method: "POST",
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
    options: { pod_id?: string | null; signal?: AbortSignal } = {},
  ) {
    const podId = this.requirePodId(options.pod_id);
    return this.http.stream(`/pods/${podId}/conversations/${conversationId}/stream`, {
      signal: options.signal,
      headers: {
        Accept: "text/event-stream",
      },
    });
  }

  stopRun(conversationId: string, options: { pod_id?: string | null } = {}): Promise<Conversation> {
    const podId = this.requirePodId(options.pod_id);
    return this.http.request<Conversation>("POST", `/pods/${podId}/conversations/${conversationId}/stop`, {
      body: {},
    }).then(normalizeConversation);
  }

  readonly messages = {
    list: (
      conversationId: string,
      options: {
        limit?: number;
        page_token?: string | null;
        after_sequence?: number | null;
        pod_id?: string | null;
      } = {},
    ): Promise<CursorPage<ConversationMessage>> => {
      const podId = this.requirePodId(options.pod_id);
      const parsedPageToken = typeof options.page_token === "string" && options.page_token.trim().length > 0
        ? Number(options.page_token)
        : null;
      return this.http.request<CursorPage<ConversationMessage>>(
        "GET",
        `/pods/${podId}/conversations/${conversationId}/messages`,
        {
          params: {
            after_sequence: options.after_sequence ?? (Number.isFinite(parsedPageToken) ? parsedPageToken : undefined),
            limit: options.limit ?? 100,
          },
        },
      ).then((response) => ({
        ...response,
        items: (response.items ?? []).map(normalizeMessage),
      }));
    },

    send: (
      conversationId: string,
      payload: SendMessageRequest,
      options: { pod_id?: string | null } = {},
    ): Promise<unknown> => {
      const podId = this.requirePodId(options.pod_id);
      return this.http.request<unknown>("POST", `/pods/${podId}/conversations/${conversationId}/messages`, {
        body: payload,
      });
    },
  };
}
