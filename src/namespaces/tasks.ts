import type { HttpClient } from "../http.js";
import type { AddMessageRequest } from "../openapi_client/models/AddMessageRequest.js";
import type { CreateTaskOptions } from "../types.js";

export class TasksNamespace {
  constructor(
    private readonly http: HttpClient,
    private readonly podId: () => string,
  ) {}

  list(options: {
    agentName?: string;
    agentId?: string;
    limit?: number;
    pageToken?: string;
    cursor?: string;
  } = {}) {
    return this.http.request("GET", `/pods/${this.podId()}/tasks`, {
      params: {
        agent_name: options.agentName,
        agent_id: options.agentId,
        limit: options.limit ?? 100,
        page_token: options.pageToken ?? options.cursor,
        cursor: options.cursor,
      },
    });
  }

  create(options: CreateTaskOptions) {
    if (!options.agentId && !options.agentName) {
      throw new Error("Either agentId or agentName is required.");
    }

    return this.http.request("POST", `/pods/${this.podId()}/tasks`, {
      body: {
        agent_id: options.agentId,
        agent_name: options.agentName ?? options.agentId,
        input_data: options.input,
        runtime_account_ids: options.runtimeAccountIds,
      },
    });
  }

  get(taskId: string) {
    return this.http.request("GET", `/pods/${this.podId()}/tasks/${taskId}`);
  }

  stop(taskId: string) {
    return this.http.request("PATCH", `/pods/${this.podId()}/tasks/${taskId}/stop`);
  }

  stream(taskId: string, options: { signal?: AbortSignal } = {}) {
    return this.http.stream(`/pods/${this.podId()}/tasks/${taskId}/stream`, {
      signal: options.signal,
      headers: {
        Accept: "text/event-stream",
      },
    });
  }

  readonly messages = {
    list: (taskId: string, options: { limit?: number; pageToken?: string; cursor?: string } = {}) =>
      this.http.request("GET", `/pods/${this.podId()}/tasks/${taskId}/messages`, {
        params: {
          limit: options.limit ?? 100,
          page_token: options.pageToken ?? options.cursor,
          cursor: options.cursor,
        },
      }),
    add: (taskId: string, content: string) => {
      const payload: AddMessageRequest = { content };
      return this.http.request("POST", `/pods/${this.podId()}/tasks/${taskId}/messages`, {
        body: payload,
      });
    },
  };
}
