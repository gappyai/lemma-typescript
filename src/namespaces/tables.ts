import type { HttpClient } from "../http.js";

export class TablesNamespace {
  constructor(private readonly http: HttpClient, private readonly podId: () => string) {}

  list(datastore: string, options: { limit?: number; pageToken?: string } = {}) {
    return this.http.request("GET", `/pods/${this.podId()}/datastores/${datastore}/tables`, { params: options });
  }
  create(datastore: string, payload: Record<string, unknown>) {
    return this.http.request("POST", `/pods/${this.podId()}/datastores/${datastore}/tables`, { body: payload });
  }
  get(datastore: string, tableName: string) {
    return this.http.request("GET", `/pods/${this.podId()}/datastores/${datastore}/tables/${tableName}`);
  }
  update(datastore: string, tableName: string, payload: Record<string, unknown>) {
    return this.http.request("PATCH", `/pods/${this.podId()}/datastores/${datastore}/tables/${tableName}`, { body: payload });
  }
  delete(datastore: string, tableName: string) {
    return this.http.request("DELETE", `/pods/${this.podId()}/datastores/${datastore}/tables/${tableName}`);
  }

  readonly columns = {
    add: (datastore: string, tableName: string, column: Record<string, unknown>) =>
      this.http.request("POST", `/pods/${this.podId()}/datastores/${datastore}/tables/${tableName}/columns`, { body: { column } }),
    remove: (datastore: string, tableName: string, columnName: string) =>
      this.http.request("DELETE", `/pods/${this.podId()}/datastores/${datastore}/tables/${tableName}/columns/${columnName}`),
  };
}
