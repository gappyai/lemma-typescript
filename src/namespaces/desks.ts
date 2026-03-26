import type { GeneratedClientAdapter } from "../generated.js";
import type { HttpClient } from "../http.js";
import type { Body_pod_desk_bundle_upload } from "../openapi_client/models/Body_pod_desk_bundle_upload.js";
import type { CreateDeskRequest } from "../openapi_client/models/CreateDeskRequest.js";
import type { UpdateDeskRequest } from "../openapi_client/models/UpdateDeskRequest.js";
import { DesksService } from "../openapi_client/services/DesksService.js";

export class DesksNamespace {
  constructor(
    private readonly client: GeneratedClientAdapter,
    private readonly http: HttpClient,
    private readonly podId: () => string,
  ) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.client.request(() => DesksService.podDeskList(this.podId(), options.limit ?? 100, options.pageToken));
  }
  create(payload: CreateDeskRequest) {
    return this.client.request(() => DesksService.podDeskCreate(this.podId(), payload));
  }
  get(name: string) {
    return this.client.request(() => DesksService.podDeskGet(this.podId(), name));
  }
  update(name: string, payload: UpdateDeskRequest) {
    return this.client.request(() => DesksService.podDeskUpdate(this.podId(), name, payload));
  }
  delete(name: string) {
    return this.client.request(() => DesksService.podDeskDelete(this.podId(), name));
  }

  readonly html = {
    get: (name: string): Promise<string> =>
      this.client.request(() => DesksService.podDeskHtmlGet(this.podId(), name)),
  };

  readonly bundle = {
    upload: (name: string, payload: Body_pod_desk_bundle_upload) =>
      this.client.request(() => DesksService.podDeskBundleUpload(this.podId(), name, payload)),
  };

  readonly source = {
    download: (name: string): Promise<Blob> =>
      this.http.requestBytes("GET", `/pods/${this.podId()}/desks/${name}/source/archive`),
  };
}
