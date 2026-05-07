import type { GeneratedClientAdapter } from "../generated.js";
import type { CreateSurfaceRequest } from "../openapi_client/models/CreateSurfaceRequest.js";
import type { UpdateSurfaceRequest } from "../openapi_client/models/UpdateSurfaceRequest.js";
import { AgentSurfacesService } from "../openapi_client/services/AgentSurfacesService.js";

export class PodSurfacesNamespace {
  constructor(private readonly client: GeneratedClientAdapter) {}

  list(
    podId: string,
    options: { limit?: number; pageToken?: string; cursor?: string } = {},
  ) {
    return this.client.request(() =>
      AgentSurfacesService.agentSurfaceList(
        podId,
        options.limit ?? 100,
        options.pageToken ?? options.cursor,
      ),
    );
  }

  create(podId: string, payload: CreateSurfaceRequest) {
    return this.client.request(() => AgentSurfacesService.agentSurfaceCreate(podId, payload));
  }

  get(podId: string, surfaceId: string) {
    return this.client.request(() => AgentSurfacesService.agentSurfaceGet(podId, surfaceId));
  }

  updateConfig(podId: string, surfaceId: string, payload: UpdateSurfaceRequest) {
    return this.client.request(() =>
      AgentSurfacesService.agentSurfaceUpdate(podId, surfaceId, payload),
    );
  }

  toggle(podId: string, surfaceId: string, isActive: boolean) {
    return this.client.request(() =>
      AgentSurfacesService.agentSurfaceToggle(podId, surfaceId, { is_active: isActive }),
    );
  }
}
