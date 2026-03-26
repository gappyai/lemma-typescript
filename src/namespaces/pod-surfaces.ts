import type { GeneratedClientAdapter } from "../generated.js";
import type { CreateSurfaceRequest } from "../openapi_client/models/CreateSurfaceRequest.js";
import type { UpdateSurfaceRequest } from "../openapi_client/models/UpdateSurfaceRequest.js";
import { AssistantSurfacesService } from "../openapi_client/services/AssistantSurfacesService.js";

export class PodSurfacesNamespace {
  constructor(private readonly client: GeneratedClientAdapter) {}

  list(
    podId: string,
    options: { limit?: number; pageToken?: string; cursor?: string } = {},
  ) {
    return this.client.request(() =>
      AssistantSurfacesService.assistantSurfaceList(
        podId,
        options.limit ?? 100,
        options.pageToken ?? options.cursor,
      ),
    );
  }

  create(podId: string, payload: CreateSurfaceRequest) {
    return this.client.request(() => AssistantSurfacesService.assistantSurfaceCreate(podId, payload));
  }

  get(podId: string, surfaceId: string) {
    return this.client.request(() => AssistantSurfacesService.assistantSurfaceGet(podId, surfaceId));
  }

  updateConfig(podId: string, surfaceId: string, payload: UpdateSurfaceRequest) {
    return this.client.request(() =>
      AssistantSurfacesService.assistantSurfaceUpdateConfig(podId, surfaceId, payload),
    );
  }

  toggle(podId: string, surfaceId: string, isActive: boolean) {
    return this.client.request(() =>
      AssistantSurfacesService.assistantSurfaceToggle(podId, surfaceId, { is_active: isActive }),
    );
  }
}
