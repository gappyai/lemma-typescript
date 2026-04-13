import type { GeneratedClientAdapter } from "../generated.js";
import type { DatastoreQueryRequest } from "../openapi_client/models/DatastoreQueryRequest.js";
import type { DatastoreQueryResponse } from "../openapi_client/models/DatastoreQueryResponse.js";
import { QueryService } from "../openapi_client/services/QueryService.js";

export class DatastoreNamespace {
  constructor(
    private readonly client: GeneratedClientAdapter,
    private readonly podId: () => string,
  ) {}

  query(request: string | DatastoreQueryRequest): Promise<DatastoreQueryResponse> {
    const payload = typeof request === "string" ? { query: request } : request;
    return this.client.request(() => QueryService.queryExecute(this.podId(), payload));
  }
}
