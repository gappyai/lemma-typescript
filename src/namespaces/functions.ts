import type { HttpClient } from "../http.js";
import type { RunFunctionOptions } from "../types.js";

export class FunctionsNamespace {
  constructor(private readonly http: HttpClient, private readonly podId: () => string) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.http.request("GET", `/pods/${this.podId()}/functions`, { params: options });
  }
  create(payload: Record<string, unknown>) {
    return this.http.request("POST", `/pods/${this.podId()}/functions`, { body: payload });
  }
  get(name: string) {
    return this.http.request("GET", `/pods/${this.podId()}/functions/${name}`);
  }
  update(name: string, payload: Record<string, unknown>) {
    return this.http.request("PATCH", `/pods/${this.podId()}/functions/${name}`, { body: payload });
  }
  delete(name: string) {
    return this.http.request("DELETE", `/pods/${this.podId()}/functions/${name}`);
  }

  readonly runs = {
    create: (name: string, options: RunFunctionOptions = {}) =>
      this.http.request("POST", `/pods/${this.podId()}/functions/${name}/run`, {
        body: { input_data: options.input, runtime_account_ids: options.runtimeAccounts },
      }),
    list: (name: string, params: { limit?: number; pageToken?: string } = {}) =>
      this.http.request("GET", `/pods/${this.podId()}/functions/${name}/runs`, { params }),
    get: (name: string, runId: string) =>
      this.http.request("GET", `/pods/${this.podId()}/functions/${name}/runs/${runId}`),
  };
}
