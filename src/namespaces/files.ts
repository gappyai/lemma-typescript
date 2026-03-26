import type { HttpClient } from "../http.js";

export class FilesNamespace {
  constructor(private readonly http: HttpClient, private readonly podId: () => string) {}

  private base(datastore: string) {
    return `/pods/${this.podId()}/datastores/${datastore}/files`;
  }

  list(datastore: string, options: { limit?: number; pageToken?: string; parentId?: string } = {}) {
    const { parentId, ...rest } = options;
    return this.http.request("GET", this.base(datastore), { params: { ...rest, parent_id: parentId } });
  }
  get(datastore: string, fileId: string) {
    return this.http.request("GET", `${this.base(datastore)}/${fileId}`);
  }
  delete(datastore: string, fileId: string) {
    return this.http.request("DELETE", `${this.base(datastore)}/${fileId}`);
  }
  search(datastore: string, query: string, options: { limit?: number; searchMethod?: string } = {}) {
    return this.http.request("POST", `${this.base(datastore)}/search`, {
      body: { query, limit: options.limit ?? 10, search_method: options.searchMethod ?? "HYBRID" },
    });
  }
  download(datastore: string, fileId: string): Promise<Blob> {
    return this.http.requestBytes("GET", `${this.base(datastore)}/${fileId}/download`);
  }

  upload(datastore: string, file: File, options: { parentId?: string; searchEnabled?: boolean; description?: string } = {}) {
    const form = new FormData();
    form.append("data", file, file.name);
    if (options.parentId) form.append("parent_id", options.parentId);
    if (options.description) form.append("description", options.description);
    form.append("search_enabled", String(options.searchEnabled ?? true));
    return this.http.request("POST", this.base(datastore), { body: form, isFormData: true });
  }

  update(datastore: string, fileId: string, options: { file?: File; name?: string; description?: string; parentId?: string; searchEnabled?: boolean } = {}) {
    const form = new FormData();
    if (options.file) form.append("data", options.file, options.file.name);
    if (options.name) form.append("name", options.name);
    if (options.description) form.append("description", options.description);
    if (options.parentId) form.append("parent_id", options.parentId);
    if (options.searchEnabled !== undefined) form.append("search_enabled", String(options.searchEnabled));
    return this.http.request("PATCH", `${this.base(datastore)}/${fileId}`, { body: form, isFormData: true });
  }

  readonly folder = {
    create: (datastore: string, name: string, options: { parentId?: string; description?: string } = {}) =>
      this.http.request("POST", `${this.base(datastore)}/folders`, {
        body: { name, description: options.description, parent_id: options.parentId },
      }),
  };
}
