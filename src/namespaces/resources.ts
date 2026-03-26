import type { HttpClient } from "../http.js";

export type ResourceType = "conversation" | "assistant" | "task" | string;

export class ResourcesNamespace {
  constructor(private readonly http: HttpClient) {}

  list(resourceType: ResourceType, resourceId: string, options: { path?: string } = {}) {
    return this.http.request("GET", `/files/${resourceType}/${resourceId}/list`, {
      params: {
        path: options.path,
      },
    });
  }

  upload(
    resourceType: ResourceType,
    resourceId: string,
    file: Blob,
    options: { path?: string; name?: string; fieldName?: string } = {},
  ) {
    const formData = new FormData();
    const fieldName = options.fieldName ?? "file";
    const name = options.name ?? (file instanceof File ? file.name : "upload.bin");
    formData.append(fieldName, file, name);

    return this.http.request("POST", `/files/${resourceType}/${resourceId}/upload`, {
      params: {
        path: options.path,
      },
      body: formData,
      isFormData: true,
    });
  }

  delete(resourceType: ResourceType, resourceId: string, filePath: string) {
    return this.http.request("DELETE", `/files/${resourceType}/${resourceId}/delete/${filePath}`);
  }

  download(resourceType: ResourceType, resourceId: string, filePath: string): Promise<Blob> {
    return this.http.requestBytes("GET", `/files/${resourceType}/${resourceId}/download/${filePath}`);
  }
}
