import type { HttpClient } from "../http.js";
import type { AddMessageRequest } from "../openapi_client/models/AddMessageRequest.js";
import type { CreateTaskRequest } from "../openapi_client/models/CreateTaskRequest.js";
import type { TaskListResponse } from "../openapi_client/models/TaskListResponse.js";
import type { TaskMessageListResponse } from "../openapi_client/models/TaskMessageListResponse.js";
import type { TaskResponse } from "../openapi_client/models/TaskResponse.js";

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
    return this.http.request<TaskListResponse>("GET", `/pods/${this.podId()}/tasks`, {
      params: {
        agent_name: options.agent_name,
        limit: options.limit ?? 100,
        page_token: options.page_token,
      },
    });
  }

  create(payload: CreateTaskRequest): Promise<TaskResponse> {
    return this.http.request<TaskResponse>("POST", `/pods/${this.podId()}/tasks`, {
      body: payload,
    });
  }

  get(taskId: string): Promise<TaskResponse> {
    return this.http.request<TaskResponse>("GET", `/pods/${this.podId()}/tasks/${taskId}`);
  }

  stop(taskId: string): Promise<TaskResponse> {
    return this.http.request<TaskResponse>("PATCH", `/pods/${this.podId()}/tasks/${taskId}/stop`);
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
    list: (taskId: string, options: { limit?: number; page_token?: string } = {}): Promise<TaskMessageListResponse> =>
      this.http.request<TaskMessageListResponse>("GET", `/pods/${this.podId()}/tasks/${taskId}/messages`, {
        params: {
          limit: options.limit ?? 100,
          page_token: options.page_token,
        },
      }),
    add: (taskId: string, payload: AddMessageRequest): Promise<TaskResponse> => {
      return this.http.request<TaskResponse>("POST", `/pods/${this.podId()}/tasks/${taskId}/messages`, {
        body: payload,
      });
    },
  };
}
