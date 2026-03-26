import type { HttpClient } from "../http.js";
import type { WorkflowRunInputs } from "../types.js";

export class WorkflowsNamespace {
  constructor(private readonly http: HttpClient, private readonly podId: () => string) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.http.request("GET", `/pods/${this.podId()}/flows`, { params: options });
  }
  create(payload: Record<string, unknown>) {
    return this.http.request("POST", `/pods/${this.podId()}/flows`, { body: payload });
  }
  get(flowId: string) {
    return this.http.request("GET", `/pods/${this.podId()}/flows/${flowId}`);
  }
  update(flowId: string, payload: Record<string, unknown>) {
    return this.http.request("PATCH", `/pods/${this.podId()}/flows/${flowId}`, { body: payload });
  }
  delete(flowId: string) {
    return this.http.request("DELETE", `/pods/${this.podId()}/flows/${flowId}`);
  }

  readonly graph = {
    update: (flowId: string, graph: { nodes: unknown[]; edges: unknown[]; start?: unknown }) =>
      this.http.request("PUT", `/pods/${this.podId()}/flows/${flowId}/graph`, { body: graph }),
  };

  readonly installs = {
    create: (flowId: string, payload: Record<string, unknown> = {}) =>
      this.http.request("POST", `/pods/${this.podId()}/flows/${flowId}/installs`, { body: payload }),
    delete: (flowId: string, installId: string) =>
      this.http.request("DELETE", `/pods/${this.podId()}/flows/${flowId}/installs/${installId}`),
  };

  readonly runs = {
    start: (flowId: string, inputs: WorkflowRunInputs = {}) =>
      this.http.request("POST", `/pods/${this.podId()}/flows/${flowId}/runs`, { body: inputs }),
    list: (flowId: string, options: { limit?: number; pageToken?: string } = {}) =>
      this.http.request("GET", `/pods/${this.podId()}/flows/${flowId}/runs`, { params: options }),
    get: (podId: string, runId: string) =>
      this.http.request("GET", `/pods/${podId}/flows/runs/${runId}`),
    resume: (podId: string, runId: string, inputs: WorkflowRunInputs = {}) =>
      this.http.request("POST", `/pods/${podId}/flows/runs/${runId}/resume`, { body: inputs }),
  };
}
