import type { GeneratedClientAdapter } from "../generated.js";
import type { HttpClient } from "../http.js";
import type { BulkCreateRecordsRequest } from "../openapi_client/models/BulkCreateRecordsRequest.js";
import type { BulkDeleteRecordsRequest } from "../openapi_client/models/BulkDeleteRecordsRequest.js";
import type { BulkUpdateRecordsRequest } from "../openapi_client/models/BulkUpdateRecordsRequest.js";
import type { RecordListResponse } from "../openapi_client/models/RecordListResponse.js";
import type { RecordQueryRequest } from "../openapi_client/models/RecordQueryRequest.js";
import { RecordsService } from "../openapi_client/services/RecordsService.js";
import type { ListRecordsOptions } from "../types.js";

function getRecordsPath(podId: string, table: string): string {
  return `/pods/${encodeURIComponent(podId)}/datastore/tables/${encodeURIComponent(table)}/records`;
}

export class RecordsNamespace {
  constructor(
    private readonly client: GeneratedClientAdapter,
    private readonly http: HttpClient,
    private readonly podId: () => string,
  ) {}

  list(table: string, options: ListRecordsOptions = {}) {
    const { filters, sort, limit, pageToken, offset, sortBy, order, params } = options;

    if (filters || sort) {
      const payload: RecordQueryRequest = {
        filters,
        sort,
        limit,
        page_token: pageToken,
      };
      return this.client.request(() => RecordsService.recordQuery(this.podId(), table, payload));
    }

    const hasCustomParams =
      typeof offset === "number" ||
      typeof sortBy === "string" ||
      typeof order === "string" ||
      !!params;

    if (hasCustomParams) {
      return this.http.request<RecordListResponse>("GET", getRecordsPath(this.podId(), table), {
        params: {
          limit: limit ?? 20,
          page_token: pageToken,
          offset,
          sort_by: sortBy,
          order,
          ...(params ?? {}),
        },
      });
    }

    return this.client.request(() =>
      RecordsService.recordList(this.podId(), table, limit ?? 20, pageToken),
    );
  }

  listWithParams(
    table: string,
    params: Record<string, string | number | boolean | undefined | null>,
  ) {
    return this.http.request<RecordListResponse>("GET", getRecordsPath(this.podId(), table), {
      params,
    });
  }

  create(table: string, data: Record<string, unknown>) {
    return this.client.request(() => RecordsService.recordCreate(this.podId(), table, { data }));
  }

  get(table: string, recordId: string) {
    return this.client.request(() => RecordsService.recordGet(this.podId(), table, recordId));
  }

  update(table: string, recordId: string, data: Record<string, unknown>) {
    return this.client.request(() => RecordsService.recordUpdate(this.podId(), table, recordId, { data }));
  }

  delete(table: string, recordId: string) {
    return this.client.request(() => RecordsService.recordDelete(this.podId(), table, recordId));
  }

  query(table: string, payload: RecordQueryRequest) {
    return this.client.request(() => RecordsService.recordQuery(this.podId(), table, payload));
  }

  readonly bulk = {
    create: (table: string, records: Record<string, unknown>[]) => {
      const payload: BulkCreateRecordsRequest = { records };
      return this.client.request(() => RecordsService.recordBulkCreate(this.podId(), table, payload));
    },

    update: (table: string, records: Record<string, unknown>[]) => {
      const payload: BulkUpdateRecordsRequest = { records };
      return this.client.request(() => RecordsService.recordBulkUpdate(this.podId(), table, payload));
    },

    delete: (table: string, recordIds: string[]) => {
      const payload: BulkDeleteRecordsRequest = { record_ids: recordIds };
      return this.client.request(() => RecordsService.recordBulkDelete(this.podId(), table, payload));
    },
  };
}
