import type { HttpClient } from "../http.js";
import type { FileUploadResponse } from "../openapi_client/models/FileUploadResponse.js";
import type { ResourceFileListResponse } from "../openapi_client/models/ResourceFileListResponse.js";
import type { ResourceType as OpenApiResourceType } from "../openapi_client/models/ResourceType.js";

export type ResourceType = `${OpenApiResourceType}`;

export class ResourcesNamespace {
  constructor(private readonly http: HttpClient) {}

  list(
    resourceType: ResourceType,
    resourceId: string,
    options: { path?: string; limit?: number; page_token?: string } = {},
  ): Promise<ResourceFileListResponse> {
    return this.http.request<ResourceFileListResponse>("GET", `/files/${resourceType}/${resourceId}/list`, {
      params: {
        path: options.path,
        limit: options.limit ?? 100,
        page_token: options.page_token,
      },
    });
  }

  upload(
    resourceType: ResourceType,
    resourceId: string,
    file: Blob,
    options: { path?: string; name?: string } = {},
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    const name = options.name ?? (file instanceof File ? file.name : "upload.bin");
    formData.append("file", file, name);

    return this.http.request<FileUploadResponse>("POST", `/files/${resourceType}/${resourceId}/upload`, {
      params: {
        path: options.path,
      },
      body: formData,
      isFormData: true,
    });
  }

  delete(resourceType: ResourceType, resourceId: string, filePath: string): Promise<Record<string, unknown>> {
    return this.http.request<Record<string, unknown>>("DELETE", `/files/${resourceType}/${resourceId}/delete/${filePath}`);
  }

  download(resourceType: ResourceType, resourceId: string, filePath: string): Promise<Blob> {
    return this.http.requestBytes("GET", `/files/${resourceType}/${resourceId}/download/${filePath}`);
  }
}
