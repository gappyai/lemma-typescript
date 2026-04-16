import type { GeneratedClientAdapter } from "../generated.js";
import type { HttpClient } from "../http.js";
import type { ConvertedFileResponse } from "../openapi_client/models/ConvertedFileResponse.js";
import type { CreateFolderRequest } from "../openapi_client/models/CreateFolderRequest.js";
import type { DatastoreFileUploadRequest } from "../openapi_client/models/DatastoreFileUploadRequest.js";
import type { DirectoryTreeResponse } from "../openapi_client/models/DirectoryTreeResponse.js";
import { SearchMethod } from "../openapi_client/models/SearchMethod.js";
import type { update } from "../openapi_client/models/update.js";
import { FilesService } from "../openapi_client/services/FilesService.js";

function joinDatastorePath(basePath: string | undefined, leaf: string): string {
  const normalizedLeaf = leaf.replace(/^\/+/, "");
  const trimmedBase = (basePath ?? "/").trim();
  const normalizedBase = trimmedBase.length > 0 ? trimmedBase : "/";
  if (normalizedBase === "/") {
    return `/${normalizedLeaf}`;
  }
  return `${normalizedBase.replace(/\/+$/, "")}/${normalizedLeaf}`;
}

function getDirectoryPath(path: string): string {
  const normalized = path.trim();
  if (!normalized || normalized === "/") {
    return "/";
  }
  const withoutTrailing = normalized.replace(/\/+$/, "");
  const index = withoutTrailing.lastIndexOf("/");
  if (index <= 0) {
    return "/";
  }
  return withoutTrailing.slice(0, index);
}

function getBaseName(path: string): string {
  const normalized = path.trim().replace(/\/+$/, "");
  const index = normalized.lastIndexOf("/");
  if (index === -1) {
    return normalized;
  }
  return normalized.slice(index + 1);
}

export class FilesNamespace {
  constructor(
    private readonly client: GeneratedClientAdapter,
    private readonly http: HttpClient,
    private readonly podId: () => string,
  ) {}

  list(options: { limit?: number; pageToken?: string; directoryPath?: string; parentId?: string } = {}) {
    const directoryPath = options.directoryPath ?? options.parentId ?? "/";
    return this.client.request(() => FilesService.fileList(
      this.podId(),
      directoryPath,
      options.limit ?? 100,
      options.pageToken,
    ));
  }

  get(path: string) {
    return this.client.request(() => FilesService.fileGet(this.podId(), path));
  }

  delete(path: string) {
    return this.client.request(() => FilesService.fileDelete(this.podId(), path));
  }

  search(query: string, options: { limit?: number; searchMethod?: SearchMethod } = {}) {
    return this.client.request(() => FilesService.fileSearch(this.podId(), {
      query,
      limit: options.limit ?? 10,
      search_method: options.searchMethod ?? SearchMethod.HYBRID,
    }));
  }

  download(path: string): Promise<Blob> {
    const encodedPath = encodeURIComponent(path);
    return this.http.requestBytes("GET", `/pods/${this.podId()}/datastore/files/download?path=${encodedPath}`);
  }

  tree(options: { rootPath?: string; filesPerDirectory?: number } = {}): Promise<DirectoryTreeResponse> {
    return this.client.request(() =>
      FilesService.fileTree(
        this.podId(),
        options.rootPath ?? "/",
        options.filesPerDirectory ?? 3,
      ),
    );
  }

  upload(
    file: Blob,
    options: {
      name?: string;
      directoryPath?: string;
      parentId?: string;
      searchEnabled?: boolean;
      description?: string;
    } = {},
  ) {
    const payload: DatastoreFileUploadRequest = {
      data: file as unknown as string,
      name: options.name ?? (file instanceof File ? file.name : undefined),
      description: options.description,
      directory_path: options.directoryPath ?? options.parentId ?? "/",
      search_enabled: options.searchEnabled ?? true,
    };
    return this.client.request(() => FilesService.fileUpload(this.podId(), payload));
  }

  update(
    path: string,
    options: {
      file?: Blob;
      name?: string;
      description?: string;
      directoryPath?: string;
      parentId?: string;
      newPath?: string;
      searchEnabled?: boolean;
    } = {},
  ) {
    const targetDirectory = options.directoryPath ?? options.parentId;
    const resolvedNewPath = options.newPath
      ?? (options.name
        ? joinDatastorePath(targetDirectory ?? getDirectoryPath(path), options.name)
        : undefined)
      ?? (targetDirectory
        ? joinDatastorePath(targetDirectory, getBaseName(path))
        : undefined);

    const payload: update = {
      path,
      data: options.file as unknown as string | undefined,
      description: options.description,
      new_path: resolvedNewPath,
      search_enabled: options.searchEnabled,
    };
    return this.client.request(() => FilesService.fileUpdate(this.podId(), payload));
  }

  readonly folder = {
    create: (name: string, options: { directoryPath?: string; parentId?: string; description?: string } = {}) => {
      const payload: CreateFolderRequest = {
        path: joinDatastorePath(options.directoryPath ?? options.parentId, name),
        description: options.description,
      };
      return this.client.request(() => FilesService.fileFolderCreate(this.podId(), payload));
    },
  };

  readonly converted = {
    get: (path: string): Promise<ConvertedFileResponse> =>
      this.client.request(() => FilesService.fileConvertedGet(this.podId(), path)),

    render: (path: string): Promise<string> =>
      this.client.request(() => FilesService.fileConvertedRender(this.podId(), path)),

    download: (path: string, artifact = "document.md"): Promise<Blob> => {
      const encodedPath = encodeURIComponent(path);
      const encodedArtifact = encodeURIComponent(artifact);
      return this.http.requestBytes(
        "GET",
        `/pods/${this.podId()}/datastore/files/converted/download?path=${encodedPath}&artifact=${encodedArtifact}`,
      );
    },
  };
}
