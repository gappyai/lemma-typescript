import type { GeneratedClientAdapter } from "../generated.js";
import type { BulkCreateRecordsRequest } from "../openapi_client/models/BulkCreateRecordsRequest.js";
import type { BulkDeleteRecordsRequest } from "../openapi_client/models/BulkDeleteRecordsRequest.js";
import type { BulkUpdateRecordsRequest } from "../openapi_client/models/BulkUpdateRecordsRequest.js";
import type { RecordQueryRequest } from "../openapi_client/models/RecordQueryRequest.js";
import { RecordsService } from "../openapi_client/services/RecordsService.js";
import type { ListRecordsOptions } from "../types.js";

export class RecordsNamespace {
  constructor(private readonly client: GeneratedClientAdapter, private readonly podId: () => string) {}

  list(datastore: string, table: string, options: ListRecordsOptions = {}) {
    const { filters, sort, limit, pageToken } = options;
    if (filters || sort) {
      const payload: RecordQueryRequest = { filters, sort, limit, page_token: pageToken };
      return this.client.request(() => RecordsService.recordQuery(this.podId(), datastore, table, payload));
    }
    return this.client.request(() => RecordsService.recordList(this.podId(), datastore, table, limit ?? 20, pageToken));
  }
  create(datastore: string, table: string, data: Record<string, unknown>) {
    return this.client.request(() => RecordsService.recordCreate(this.podId(), datastore, table, { data }));
  }
  get(datastore: string, table: string, recordId: string) {
    return this.client.request(() => RecordsService.recordGet(this.podId(), datastore, table, recordId));
  }
  update(datastore: string, table: string, recordId: string, data: Record<string, unknown>) {
    return this.client.request(() => RecordsService.recordUpdate(this.podId(), datastore, table, recordId, { data }));
  }
  delete(datastore: string, table: string, recordId: string) {
    return this.client.request(() => RecordsService.recordDelete(this.podId(), datastore, table, recordId));
  }
  query(datastore: string, table: string, payload: RecordQueryRequest) {
    return this.client.request(() => RecordsService.recordQuery(this.podId(), datastore, table, payload));
  }

  readonly bulk = {
    create: (datastore: string, table: string, records: Record<string, unknown>[]) => {
      const payload: BulkCreateRecordsRequest = { records };
      return this.client.request(() => RecordsService.recordBulkCreate(this.podId(), datastore, table, payload));
    },
    update: (datastore: string, table: string, records: Record<string, unknown>[]) => {
      const payload: BulkUpdateRecordsRequest = { records };
      return this.client.request(() => RecordsService.recordBulkUpdate(this.podId(), datastore, table, payload));
    },
    delete: (datastore: string, table: string, recordIds: string[]) => {
      const payload: BulkDeleteRecordsRequest = { record_ids: recordIds };
      return this.client.request(() => RecordsService.recordBulkDelete(this.podId(), datastore, table, payload));
    },
  };
}
