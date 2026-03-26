import type { HttpClient } from "../http.js";

export class DesksNamespace {
  constructor(private readonly http: HttpClient, private readonly podId: () => string) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.http.request("GET", `/pods/${this.podId()}/desks`, { params: options });
  }
  create(payload: Record<string, unknown>) {
    return this.http.request("POST", `/pods/${this.podId()}/desks`, { body: payload });
  }
  get(name: string) {
    return this.http.request("GET", `/pods/${this.podId()}/desks/${name}`);
  }
  update(name: string, payload: Record<string, unknown>) {
    return this.http.request("PATCH", `/pods/${this.podId()}/desks/${name}`, { body: payload });
  }
  delete(name: string) {
    return this.http.request("DELETE", `/pods/${this.podId()}/desks/${name}`);
  }

  readonly html = {
    get: (name: string): Promise<string> =>
      this.http.request("GET", `/pods/${this.podId()}/desks/${name}/html`),
  };

  readonly bundle = {
    upload: (name: string, form: FormData) =>
      this.http.request("POST", `/pods/${this.podId()}/desks/${name}/bundle`, { body: form, isFormData: true }),
  };

  readonly source = {
    download: (name: string): Promise<Blob> =>
      this.http.requestBytes("GET", `/pods/${this.podId()}/desks/${name}/source`),
  };
}
