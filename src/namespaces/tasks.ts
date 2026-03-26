import type { GeneratedClientAdapter } from "../generated.js";
import type { AddMessageRequest } from "../openapi_client/models/AddMessageRequest.js";
import type { CreateTaskRequest } from "../openapi_client/models/CreateTaskRequest.js";
import { TasksService } from "../openapi_client/services/TasksService.js";
import type { CreateTaskOptions } from "../types.js";

export class TasksNamespace {
  constructor(private readonly client: GeneratedClientAdapter, private readonly podId: () => string) {}

  list(options: { agentName?: string; limit?: number; pageToken?: string } = {}) {
    return this.client.request(() => TasksService.taskList(this.podId(), options.agentName, options.limit ?? 100, options.pageToken));
  }
  create(options: CreateTaskOptions) {
    const payload: CreateTaskRequest = { agent_name: options.agentName, input_data: options.input };
    return this.client.request(() => TasksService.taskCreate(this.podId(), payload));
  }
  get(taskId: string) {
    return this.client.request(() => TasksService.taskGet(this.podId(), taskId));
  }
  stop(taskId: string) {
    return this.client.request(() => TasksService.taskStop(this.podId(), taskId));
  }

  readonly messages = {
    list: (taskId: string, options: { limit?: number; pageToken?: string } = {}) =>
      this.client.request(() => TasksService.taskMessageList(this.podId(), taskId, options.limit ?? 100, options.pageToken)),
    add: (taskId: string, content: string) => {
      const payload: AddMessageRequest = { content };
      return this.client.request(() => TasksService.taskMessageAdd(this.podId(), taskId, payload));
    },
  };
}
