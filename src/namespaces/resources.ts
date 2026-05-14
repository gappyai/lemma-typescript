import type { HttpClient } from "../http.js";

export type ResourceType = "pod" | "conversation" | (string & {});

export interface ResourceFileInfo {
  created?: string | null;
  last_modified?: string | null;
  name: string;
  path: string;
  size?: number | null;
  type: "file" | "directory" | (string & {});
}

export interface ResourceFileListResponse {
  items: ResourceFileInfo[];
  limit: number;
  next_page_token?: string | null;
}

export interface ResourceFileUploadResponse {
  file_name: string;
  message: string;
  path: string;
  success: boolean;
}

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
  ): Promise<ResourceFileUploadResponse> {
    const formData = new FormData();
    const name = options.name ?? (file instanceof File ? file.name : "upload.bin");
    formData.append("file", file, name);

    return this.http.request<ResourceFileUploadResponse>("POST", `/files/${resourceType}/${resourceId}/upload`, {
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
