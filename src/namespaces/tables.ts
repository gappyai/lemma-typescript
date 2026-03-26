import type { GeneratedClientAdapter } from "../generated.js";
import type { AddColumnRequest } from "../openapi_client/models/AddColumnRequest.js";
import type { CreateTableRequest } from "../openapi_client/models/CreateTableRequest.js";
import type { UpdateTableRequest } from "../openapi_client/models/UpdateTableRequest.js";
import { TablesService } from "../openapi_client/services/TablesService.js";

export class TablesNamespace {
  constructor(private readonly client: GeneratedClientAdapter, private readonly podId: () => string) {}

  list(datastore: string, options: { limit?: number; pageToken?: string } = {}) {
    return this.client.request(() => TablesService.tableList(this.podId(), datastore, options.limit ?? 100, options.pageToken));
  }
  create(datastore: string, payload: CreateTableRequest) {
    return this.client.request(() => TablesService.tableCreate(this.podId(), datastore, payload));
  }
  get(datastore: string, tableName: string) {
    return this.client.request(() => TablesService.tableGet(this.podId(), datastore, tableName));
  }
  update(datastore: string, tableName: string, payload: UpdateTableRequest) {
    return this.client.request(() => TablesService.tableUpdate(this.podId(), datastore, tableName, payload));
  }
  delete(datastore: string, tableName: string) {
    return this.client.request(() => TablesService.tableDelete(this.podId(), datastore, tableName));
  }

  readonly columns = {
    add: (datastore: string, tableName: string, request: AddColumnRequest | AddColumnRequest["column"]) => {
      const payload: AddColumnRequest = "column" in request ? request : { column: request };
      return this.client.request(() => TablesService.tableColumnAdd(this.podId(), datastore, tableName, payload));
    },
    remove: (datastore: string, tableName: string, columnName: string) =>
      this.client.request(() => TablesService.tableColumnRemove(this.podId(), datastore, tableName, columnName)),
  };
}
