import type { GeneratedClientAdapter } from "../generated.js";
import { ApiError, type HttpClient } from "../http.js";
import type { WorkflowCreateRequest } from "../openapi_client/models/WorkflowCreateRequest.js";
import type { WorkflowGraphUpdateRequest } from "../openapi_client/models/WorkflowGraphUpdateRequest.js";
import type { WorkflowInstallRequest } from "../openapi_client/models/WorkflowInstallRequest.js";
import type { WorkflowUpdateRequest } from "../openapi_client/models/WorkflowUpdateRequest.js";
import { WorkflowsService } from "../openapi_client/services/WorkflowsService.js";
import type { WorkflowRunInputs } from "../types.js";

export class WorkflowsNamespace {
  constructor(
    private readonly client: GeneratedClientAdapter,
    private readonly http: HttpClient,
    private readonly podId: () => string,
  ) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.client.request(() => WorkflowsService.workflowList(this.podId(), options.limit ?? 100, options.pageToken));
  }

  create(payload: WorkflowCreateRequest) {
    return this.client.request(() => WorkflowsService.workflowCreate(this.podId(), payload));
  }

  get(workflowName: string) {
    return this.client.request(() => WorkflowsService.workflowGet(this.podId(), workflowName));
  }

  update(workflowName: string, payload: WorkflowUpdateRequest) {
    return this.client.request(() => WorkflowsService.workflowUpdate(this.podId(), workflowName, payload));
  }

  delete(workflowName: string) {
    return this.client.request(() => WorkflowsService.workflowDelete(this.podId(), workflowName));
  }

  visualize(workflowName: string) {
    return this.client.request(() => WorkflowsService.workflowVisualize(this.podId(), workflowName));
  }

  readonly graph = {
    update: (workflowName: string, graph: WorkflowGraphUpdateRequest) =>
      this.client.request(() => WorkflowsService.workflowGraphUpdate(this.podId(), workflowName, graph)),
  };

  readonly installs = {
    create: (workflowName: string, payload: WorkflowInstallRequest = {}) =>
      this.client.request(() => WorkflowsService.workflowInstallCreate(this.podId(), workflowName, payload)),

    delete: (workflowName: string, installId: string) =>
      this.client.request(() => WorkflowsService.workflowInstallDelete(this.podId(), workflowName, installId)),
  };

  private async postRunAction(
    runId: string,
    action: "cancel" | "retry",
    podId: string,
  ): Promise<Record<string, unknown>> {
    const encodedPodId = encodeURIComponent(podId);
    const encodedRunId = encodeURIComponent(runId);

    try {
      return await this.http.request<Record<string, unknown>>(
        "POST",
        `/pods/${encodedPodId}/workflow-runs/${encodedRunId}/${action}`,
        { body: {} },
      );
    } catch (error) {
      if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 405)) {
        return this.http.request<Record<string, unknown>>(
          "POST",
          `/pods/${encodedPodId}/flow-runs/${encodedRunId}/${action}`,
          { body: {} },
        );
      }

      throw error;
    }
  }

  readonly runs = {
    start: (workflowName: string, inputs: WorkflowRunInputs = {}) =>
      this.client.request(() => WorkflowsService.workflowStart(this.podId(), workflowName, inputs)),

    list: (workflowName: string, options: { limit?: number; pageToken?: string } = {}) =>
      this.client.request(() =>
        WorkflowsService.workflowRunList(this.podId(), workflowName, options.limit ?? 100, options.pageToken),
      ),

    get: (runId: string, podId = this.podId()) =>
      this.client.request(() => WorkflowsService.workflowRunGet(podId, runId)),

    resume: (runId: string, inputs: WorkflowRunInputs = {}, podId = this.podId()) =>
      this.client.request(() => WorkflowsService.workflowRunResume(podId, runId, inputs)),

    visualize: (runId: string, podId = this.podId()) =>
      this.client.request(() => WorkflowsService.workflowRunVisualize(podId, runId)),

    cancel: (runId: string, podId = this.podId()) => this.postRunAction(runId, "cancel", podId),

    retry: (runId: string, podId = this.podId()) => this.postRunAction(runId, "retry", podId),
  };
}
