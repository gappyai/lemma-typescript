import type { HttpClient } from "../http.js";

export class AgentsNamespace {
  constructor(private readonly http: HttpClient, private readonly podId: () => string) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.http.request("GET", `/pods/${this.podId()}/agents`, { params: options });
  }
  create(payload: Record<string, unknown>) {
    return this.http.request("POST", `/pods/${this.podId()}/agents`, { body: payload });
  }
  get(agentId: string) {
    return this.http.request("GET", `/pods/${this.podId()}/agents/${agentId}`);
  }
  update(agentId: string, payload: Record<string, unknown>) {
    return this.http.request("PATCH", `/pods/${this.podId()}/agents/${agentId}`, { body: payload });
  }
  delete(agentId: string) {
    return this.http.request("DELETE", `/pods/${this.podId()}/agents/${agentId}`);
  }
}
