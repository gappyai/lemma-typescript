import type { GeneratedClientAdapter } from "../generated.js";
import type { CreateDatastoreRequest } from "../openapi_client/models/CreateDatastoreRequest.js";
import type { DatastoreQueryRequest } from "../openapi_client/models/DatastoreQueryRequest.js";
import type { UpdateDatastoreRequest } from "../openapi_client/models/UpdateDatastoreRequest.js";
import { DatastoreService } from "../openapi_client/services/DatastoreService.js";

export class DatastoresNamespace {
  constructor(private readonly client: GeneratedClientAdapter, private readonly podId: () => string) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.client.request(() => DatastoreService.datastoreList(this.podId(), options.limit ?? 100, options.pageToken));
  }
  create(payload: CreateDatastoreRequest) {
    return this.client.request(() => DatastoreService.datastoreCreate(this.podId(), payload));
  }
  get(name: string) {
    return this.client.request(() => DatastoreService.datastoreGet(this.podId(), name));
  }
  update(name: string, payload: UpdateDatastoreRequest) {
    return this.client.request(() => DatastoreService.datastoreUpdate(this.podId(), name, payload));
  }
  delete(name: string) {
    return this.client.request(() => DatastoreService.datastoreDelete(this.podId(), name));
  }
  query(name: string, request: DatastoreQueryRequest | string) {
    const payload = typeof request === "string" ? { query: request } : request;
    return this.client.request(() => DatastoreService.datastoreQuery(this.podId(), name, payload));
  }
}
