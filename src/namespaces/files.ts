import type { GeneratedClientAdapter } from "../generated.js";
import type { HttpClient } from "../http.js";
import type { Body_file_update } from "../openapi_client/models/Body_file_update.js";
import type { Body_file_upload } from "../openapi_client/models/Body_file_upload.js";
import type { CreateFolderRequest } from "../openapi_client/models/CreateFolderRequest.js";
import { SearchMethod } from "../openapi_client/models/SearchMethod.js";
import { FilesService } from "../openapi_client/services/FilesService.js";

export class FilesNamespace {
  constructor(
    private readonly client: GeneratedClientAdapter,
    private readonly http: HttpClient,
    private readonly podId: () => string,
  ) {}

  list(datastore: string, options: { limit?: number; pageToken?: string; parentId?: string } = {}) {
    return this.client.request(() => FilesService.fileList(this.podId(), datastore, options.parentId, options.limit ?? 100, options.pageToken));
  }
  get(datastore: string, fileId: string) {
    return this.client.request(() => FilesService.fileGet(this.podId(), datastore, fileId));
  }
  delete(datastore: string, fileId: string) {
    return this.client.request(() => FilesService.fileDelete(this.podId(), datastore, fileId));
  }
  search(datastore: string, query: string, options: { limit?: number; searchMethod?: SearchMethod } = {}) {
    return this.client.request(() => FilesService.fileSearch(this.podId(), datastore, {
      query,
      limit: options.limit ?? 10,
      search_method: options.searchMethod ?? SearchMethod.HYBRID,
    }));
  }
  download(datastore: string, fileId: string): Promise<Blob> {
    return this.http.requestBytes("GET", `/pods/${this.podId()}/datastores/${datastore}/files/${fileId}/download`);
  }

  upload(datastore: string, file: Blob, options: { name?: string; parentId?: string; searchEnabled?: boolean; description?: string } = {}) {
    const payload: Body_file_upload = {
      data: file,
      name: options.name ?? (file instanceof File ? file.name : undefined),
      description: options.description,
      parent_id: options.parentId,
      search_enabled: options.searchEnabled ?? true,
    };
    return this.client.request(() => FilesService.fileUpload(this.podId(), datastore, payload));
  }

  update(datastore: string, fileId: string, options: { file?: Blob; name?: string; description?: string; parentId?: string; searchEnabled?: boolean } = {}) {
    const payload: Body_file_update = {
      data: options.file,
      name: options.name,
      description: options.description,
      parent_id: options.parentId,
      search_enabled: options.searchEnabled,
    };
    return this.client.request(() => FilesService.fileUpdate(this.podId(), datastore, fileId, payload));
  }

  readonly folder = {
    create: (datastore: string, name: string, options: { parentId?: string; description?: string } = {}) => {
      const payload: CreateFolderRequest = {
        name,
        description: options.description,
        parent_id: options.parentId,
      };
      return this.client.request(() => FilesService.fileFolderCreate(this.podId(), datastore, payload));
    },
  };
}
