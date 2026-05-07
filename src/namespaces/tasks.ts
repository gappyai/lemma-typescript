import type { HttpClient } from "../http.js";
import type {
  AddMessageRequest,
  Conversation,
  ConversationMessage,
  CreateTaskRequest,
  TaskListResponse,
  TaskMessageListResponse,
  TaskResponse,
} from "../types.js";

function toTask(conversation: Conversation, inputData?: Record<string, unknown> | null): TaskResponse {
  return {
    id: conversation.id,
    agent_id: conversation.agent_id,
    pod_id: conversation.pod_id,
    user_id: conversation.user_id,
    input_data: inputData ?? null,
    output_data: null,
    error: null,
    status: (conversation.status?.toUpperCase() as TaskResponse["status"] | undefined) ?? "WAITING",
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    conversation,
  };
}

function normalizeConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    model: conversation.model ?? conversation.model_name ?? null,
    status: conversation.status ?? "waiting",
  };
}

function normalizeMessages(messages: ConversationMessage[]): ConversationMessage[] {
  return messages;
}

export class TasksNamespace {
  constructor(
    private readonly http: HttpClient,
    private readonly podId: () => string,
  ) {}

  list(options: {
    agent_name?: string;
    limit?: number;
    page_token?: string;
  } = {}): Promise<TaskListResponse> {
    return this.http.request<{
      items?: Conversation[];
      limit?: number;
      next_page_token?: string | null;
      total?: number;
    }>("GET", `/pods/${this.podId()}/conversations`, {
      params: {
        agent_name: options.agent_name,
        limit: options.limit ?? 100,
        page_token: options.page_token,
      },
    }).then((response) => {
      const conversations = (response.items ?? []).map(normalizeConversation);
      return {
        items: conversations.map((conversation) => toTask(conversation)),
        limit: response.limit ?? options.limit ?? 100,
        next_page_token: response.next_page_token ?? null,
        total: response.total,
      };
    });
  }

  create(payload: CreateTaskRequest): Promise<TaskResponse> {
    return this.http.request<Conversation>("POST", `/pods/${this.podId()}/conversations`, {
      body: {
        agent_name: payload.agent_name,
        title: payload.title ?? payload.content ?? payload.agent_name,
      },
    }).then((conversation) => toTask(normalizeConversation(conversation), payload.input_data));
  }

  get(taskId: string): Promise<TaskResponse> {
    return this.http.request<Conversation>("GET", `/pods/${this.podId()}/conversations/${taskId}`)
      .then((conversation) => toTask(normalizeConversation(conversation)));
  }

  stop(taskId: string): Promise<TaskResponse> {
    return this.http.request<Conversation>("POST", `/pods/${this.podId()}/conversations/${taskId}/stop`, {
      body: {},
    }).then((conversation) => toTask(normalizeConversation(conversation)));
  }

  stream(taskId: string, options: { signal?: AbortSignal } = {}) {
    return this.http.stream(`/pods/${this.podId()}/conversations/${taskId}/stream`, {
      signal: options.signal,
      headers: {
        Accept: "text/event-stream",
      },
    });
  }

  readonly messages = {
    list: (taskId: string, options: { limit?: number; page_token?: string } = {}): Promise<TaskMessageListResponse> =>
      this.http.request<TaskMessageListResponse>("GET", `/pods/${this.podId()}/conversations/${taskId}/messages`, {
        params: {
          limit: options.limit ?? 100,
          after_sequence: options.page_token,
        },
      }).then((response) => ({
        ...response,
        items: normalizeMessages(response.items ?? []),
      })),
    add: (taskId: string, payload: AddMessageRequest): Promise<TaskResponse> => {
      return this.http.request<unknown>("POST", `/pods/${this.podId()}/conversations/${taskId}/messages`, {
        body: payload,
      }).then(() => this.get(taskId));
    },
  };
}
