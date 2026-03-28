import type { GeneratedClientAdapter } from "../generated.js";
import type { HttpClient } from "../http.js";
import type { CreateFolderRequest } from "../openapi_client/models/CreateFolderRequest.js";
import { SearchMethod } from "../openapi_client/models/SearchMethod.js";
import type { fastapi___compat__v2__Body_file__upload } from "../openapi_client/models/fastapi___compat__v2__Body_file__upload.js";
import type { update } from "../openapi_client/models/update.js";
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
    const payload: fastapi___compat__v2__Body_file__upload = {
      data: file as unknown as string,
      name: options.name ?? (file instanceof File ? file.name : undefined),
      description: options.description,
      parent_id: options.parentId,
      search_enabled: options.searchEnabled ?? true,
    };
    return this.client.request(() => FilesService.fileUpload(this.podId(), datastore, payload));
  }

  update(datastore: string, fileId: string, options: { file?: Blob; name?: string; description?: string; parentId?: string; searchEnabled?: boolean } = {}) {
    const payload: update = {
      data: options.file as unknown as string | undefined,
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
