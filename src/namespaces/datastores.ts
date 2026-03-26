import type { HttpClient } from "../http.js";

export class DatastoresNamespace {
  constructor(private readonly http: HttpClient, private readonly podId: () => string) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.http.request("GET", `/pods/${this.podId()}/datastores`, { params: options });
  }
  create(payload: Record<string, unknown>) {
    return this.http.request("POST", `/pods/${this.podId()}/datastores`, { body: payload });
  }
  get(name: string) {
    return this.http.request("GET", `/pods/${this.podId()}/datastores/${name}`);
  }
  update(name: string, payload: Record<string, unknown>) {
    return this.http.request("PATCH", `/pods/${this.podId()}/datastores/${name}`, { body: payload });
  }
  delete(name: string) {
    return this.http.request("DELETE", `/pods/${this.podId()}/datastores/${name}`);
  }
  query(name: string, query: string) {
    return this.http.request("POST", `/pods/${this.podId()}/datastores/${name}/query`, { body: { query } });
  }
}
