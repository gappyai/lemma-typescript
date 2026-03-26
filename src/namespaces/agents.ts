import type { GeneratedClientAdapter } from "../generated.js";
import { AgentsService } from "../openapi_client/services/AgentsService.js";
import type { CreateAgentRequest } from "../openapi_client/models/CreateAgentRequest.js";
import type { UpdateAgentRequest } from "../openapi_client/models/UpdateAgentRequest.js";

export class AgentsNamespace {
  constructor(private readonly client: GeneratedClientAdapter, private readonly podId: () => string) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.client.request(() => AgentsService.agentList(this.podId(), options.limit ?? 100, options.pageToken));
  }
  create(payload: CreateAgentRequest) {
    return this.client.request(() => AgentsService.agentCreate(this.podId(), payload));
  }
  get(agentName: string) {
    return this.client.request(() => AgentsService.agentGet(this.podId(), agentName));
  }
  update(agentName: string, payload: UpdateAgentRequest) {
    return this.client.request(() => AgentsService.agentUpdate(this.podId(), agentName, payload));
  }
  delete(agentName: string) {
    return this.client.request(() => AgentsService.agentDelete(this.podId(), agentName));
  }
}
