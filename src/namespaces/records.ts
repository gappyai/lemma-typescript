import type { GeneratedClientAdapter } from "../generated.js";
import type { HttpClient } from "../http.js";
import type { BulkCreateRecordsRequest } from "../openapi_client/models/BulkCreateRecordsRequest.js";
import type { BulkDeleteRecordsRequest } from "../openapi_client/models/BulkDeleteRecordsRequest.js";
import type { BulkUpdateRecordsRequest } from "../openapi_client/models/BulkUpdateRecordsRequest.js";
import type { RecordListResponse } from "../openapi_client/models/RecordListResponse.js";
import { RecordsService } from "../openapi_client/services/RecordsService.js";
import type { ListRecordsOptions, RecordFilter, RecordSort } from "../types.js";

export interface RecordQueryRequest {
  filters?: RecordFilter[];
  sort?: RecordSort[];
  limit?: number;
  page_token?: string;
  offset?: number;
  sort_by?: string;
  order?: "asc" | "desc" | string;
}

function getRecordsPath(podId: string, table: string): string {
  return `/pods/${encodeURIComponent(podId)}/datastore/tables/${encodeURIComponent(table)}/records`;
}

function serializeFilters(filters?: RecordFilter[]): string[] | undefined {
  if (!filters || filters.length === 0) {
    return undefined;
  }
  return filters.map((filter) => JSON.stringify(filter));
}

function serializeSort(sort?: RecordSort[]): string[] | undefined {
  if (!sort || sort.length === 0) {
    return undefined;
  }
  return sort.map((entry) => JSON.stringify(entry));
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
      return this.client.request(() => RecordsService.recordList(
        this.podId(),
        table,
        limit ?? 20,
        offset,
        sortBy ?? undefined,
        order ?? "asc",
        serializeFilters(filters),
        serializeSort(sort),
        pageToken,
      ));
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
      RecordsService.recordList(
        this.podId(),
        table,
        limit ?? 20,
        offset,
        sortBy ?? undefined,
        order ?? "asc",
        undefined,
        undefined,
        pageToken,
      ),
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
    return this.client.request(() => RecordsService.recordList(
      this.podId(),
      table,
      payload.limit ?? 20,
      payload.offset,
      payload.sort_by ?? undefined,
      payload.order ?? "asc",
      serializeFilters(payload.filters),
      serializeSort(payload.sort),
      payload.page_token,
    ));
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
