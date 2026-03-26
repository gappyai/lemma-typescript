import type { HttpClient } from "../http.js";
import type { CreateTaskOptions } from "../types.js";

export class TasksNamespace {
  constructor(private readonly http: HttpClient, private readonly podId: () => string) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.http.request("GET", `/pods/${this.podId()}/tasks`, { params: options });
  }
  create(options: CreateTaskOptions) {
    return this.http.request("POST", `/pods/${this.podId()}/tasks`, {
      body: { agent_id: options.agentId, input_data: options.input, runtime_account_ids: options.runtimeAccounts },
    });
  }
  get(taskId: string) {
    return this.http.request("GET", `/pods/${this.podId()}/tasks/${taskId}`);
  }
  stop(taskId: string) {
    return this.http.request("POST", `/pods/${this.podId()}/tasks/${taskId}/stop`);
  }

  readonly messages = {
    list: (taskId: string, options: { limit?: number; pageToken?: string } = {}) =>
      this.http.request("GET", `/pods/${this.podId()}/tasks/${taskId}/messages`, { params: options }),
    add: (taskId: string, content: string) =>
      this.http.request("POST", `/pods/${this.podId()}/tasks/${taskId}/messages`, { body: { content } }),
  };
}
