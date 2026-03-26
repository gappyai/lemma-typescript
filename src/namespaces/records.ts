import type { HttpClient } from "../http.js";
import type { ListRecordsOptions } from "../types.js";

export class RecordsNamespace {
  constructor(private readonly http: HttpClient, private readonly podId: () => string) {}

  private base(datastore: string, table: string) {
    return `/pods/${this.podId()}/datastores/${datastore}/tables/${table}/records`;
  }

  list(datastore: string, table: string, options: ListRecordsOptions = {}) {
    const { filters, sort, limit, offset, pageToken } = options;
    if (filters || sort) {
      // Use query endpoint for structured filters
      return this.http.request("POST", `/pods/${this.podId()}/datastores/${datastore}/tables/${table}/records/query`, {
        body: { filters, sort, limit, offset, page_token: pageToken },
      });
    }
    return this.http.request("GET", this.base(datastore, table), {
      params: { limit, offset, page_token: pageToken },
    });
  }
  create(datastore: string, table: string, data: Record<string, unknown>) {
    return this.http.request("POST", this.base(datastore, table), { body: { data } });
  }
  get(datastore: string, table: string, recordId: string) {
    return this.http.request("GET", `${this.base(datastore, table)}/${recordId}`);
  }
  update(datastore: string, table: string, recordId: string, data: Record<string, unknown>) {
    return this.http.request("PATCH", `${this.base(datastore, table)}/${recordId}`, { body: { data } });
  }
  delete(datastore: string, table: string, recordId: string) {
    return this.http.request("DELETE", `${this.base(datastore, table)}/${recordId}`);
  }
  query(datastore: string, table: string, payload: Record<string, unknown>) {
    return this.http.request("POST", `/pods/${this.podId()}/datastores/${datastore}/tables/${table}/records/query`, { body: payload });
  }

  readonly bulk = {
    create: (datastore: string, table: string, records: Record<string, unknown>[]) =>
      this.http.request("POST", `${this.base(datastore, table)}/bulk`, { body: { records } }),
    update: (datastore: string, table: string, records: Record<string, unknown>[]) =>
      this.http.request("PATCH", `${this.base(datastore, table)}/bulk`, { body: { records } }),
    delete: (datastore: string, table: string, recordIds: string[]) =>
      this.http.request("DELETE", `${this.base(datastore, table)}/bulk`, { body: { record_ids: recordIds } }),
  };
}
