import type { GeneratedClientAdapter } from "../generated.js";
import type { HttpClient } from "../http.js";
import type { CreateFolderRequest } from "../openapi_client/models/CreateFolderRequest.js";
import type { DatastoreFileUploadRequest } from "../openapi_client/models/DatastoreFileUploadRequest.js";
import { SearchMethod } from "../openapi_client/models/SearchMethod.js";
import type { update } from "../openapi_client/models/update.js";
import { FilesService } from "../openapi_client/services/FilesService.js";

export class FilesNamespace {
  constructor(
    private readonly client: GeneratedClientAdapter,
    private readonly http: HttpClient,
    private readonly podId: () => string,
  ) {}

  list(options: { limit?: number; pageToken?: string; parentId?: string } = {}) {
    return this.client.request(() => FilesService.fileList(this.podId(), options.parentId, options.limit ?? 100, options.pageToken));
  }
  get(fileId: string) {
    return this.client.request(() => FilesService.fileGet(this.podId(), fileId));
  }
  delete(fileId: string) {
    return this.client.request(() => FilesService.fileDelete(this.podId(), fileId));
  }
  search(query: string, options: { limit?: number; searchMethod?: SearchMethod } = {}) {
    return this.client.request(() => FilesService.fileSearch(this.podId(), {
      query,
      limit: options.limit ?? 10,
      search_method: options.searchMethod ?? SearchMethod.HYBRID,
    }));
  }
  download(fileId: string): Promise<Blob> {
    return this.http.requestBytes("GET", `/pods/${this.podId()}/datastore/files/${fileId}/download`);
  }

  upload(file: Blob, options: { name?: string; parentId?: string; searchEnabled?: boolean; description?: string } = {}) {
    const payload: DatastoreFileUploadRequest = {
      data: file as unknown as string,
      name: options.name ?? (file instanceof File ? file.name : undefined),
      description: options.description,
      parent_id: options.parentId,
      search_enabled: options.searchEnabled ?? true,
    };
    return this.client.request(() => FilesService.fileUpload(this.podId(), payload));
  }

  update(fileId: string, options: { file?: Blob; name?: string; description?: string; parentId?: string; searchEnabled?: boolean } = {}) {
    const payload: update = {
      data: options.file as unknown as string | undefined,
      name: options.name,
      description: options.description,
      parent_id: options.parentId,
      search_enabled: options.searchEnabled,
    };
    return this.client.request(() => FilesService.fileUpdate(this.podId(), fileId, payload));
  }

  readonly folder = {
    create: (name: string, options: { parentId?: string; description?: string } = {}) => {
      const payload: CreateFolderRequest = {
        name,
        description: options.description,
        parent_id: options.parentId,
      };
      return this.client.request(() => FilesService.fileFolderCreate(this.podId(), payload));
    },
  };
}
