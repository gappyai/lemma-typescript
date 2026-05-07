/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConvertedFileResponse } from '../models/ConvertedFileResponse.js';
import type { CreateFolderRequest } from '../models/CreateFolderRequest.js';
import type { DatastoreFileUploadRequest } from '../models/DatastoreFileUploadRequest.js';
import type { DatastoreMessageResponse } from '../models/DatastoreMessageResponse.js';
import type { DirectoryTreeResponse } from '../models/DirectoryTreeResponse.js';
import type { FileListResponse } from '../models/FileListResponse.js';
import { FileNamespace } from '../models/FileNamespace.js';
import type { FileResponse } from '../models/FileResponse.js';
import type { FileSearchRequest } from '../models/FileSearchRequest.js';
import type { FileSearchResponse } from '../models/FileSearchResponse.js';
import type { update } from '../models/update.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class FilesService {
    /**
     * List Files
     * @param podId
     * @param directoryPath
     * @param namespace
     * @param limit
     * @param pageToken
     * @returns FileListResponse Successful Response
     * @throws ApiError
     */
    public static fileList(
        podId: string,
        directoryPath: string = '/',
        namespace: FileNamespace = FileNamespace.PERSONAL,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<FileListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastore/files',
            path: {
                'pod_id': podId,
            },
            query: {
                'directory_path': directoryPath,
                'namespace': namespace,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload File
     * @param podId
     * @param formData
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    public static fileUpload(
        podId: string,
        formData: DatastoreFileUploadRequest,
    ): CancelablePromise<FileResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastore/files',
            path: {
                'pod_id': podId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete File Or Folder
     * @param podId
     * @param path
     * @param namespace
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    public static fileDelete(
        podId: string,
        path: string,
        namespace: FileNamespace = FileNamespace.PERSONAL,
    ): CancelablePromise<DatastoreMessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/datastore/files/by-path',
            path: {
                'pod_id': podId,
            },
            query: {
                'path': path,
                'namespace': namespace,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get File
     * @param podId
     * @param path
     * @param namespace
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    public static fileGet(
        podId: string,
        path: string,
        namespace: FileNamespace = FileNamespace.PERSONAL,
    ): CancelablePromise<FileResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastore/files/by-path',
            path: {
                'pod_id': podId,
            },
            query: {
                'path': path,
                'namespace': namespace,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update File
     * @param podId
     * @param formData
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    public static fileUpdate(
        podId: string,
        formData: update,
    ): CancelablePromise<FileResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/datastore/files/by-path',
            path: {
                'pod_id': podId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Converted File Metadata
     * @param podId
     * @param path
     * @param namespace
     * @returns ConvertedFileResponse Successful Response
     * @throws ApiError
     */
    public static fileConvertedGet(
        podId: string,
        path: string,
        namespace: FileNamespace = FileNamespace.PERSONAL,
    ): CancelablePromise<ConvertedFileResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastore/files/converted/by-path',
            path: {
                'pod_id': podId,
            },
            query: {
                'path': path,
                'namespace': namespace,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Download Converted File Artifact
     * @param podId
     * @param path
     * @param artifact
     * @param namespace
     * @returns any Successful Response
     * @throws ApiError
     */
    public static fileConvertedDownload(
        podId: string,
        path: string,
        artifact: string = 'document.md',
        namespace: FileNamespace = FileNamespace.PERSONAL,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastore/files/converted/download',
            path: {
                'pod_id': podId,
            },
            query: {
                'path': path,
                'artifact': artifact,
                'namespace': namespace,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Render Converted File As HTML
     * @param podId
     * @param path
     * @param namespace
     * @returns any Successful Response
     * @throws ApiError
     */
    public static fileConvertedRender(
        podId: string,
        path: string,
        namespace: FileNamespace = FileNamespace.PERSONAL,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastore/files/converted/render',
            path: {
                'pod_id': podId,
            },
            query: {
                'path': path,
                'namespace': namespace,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Download File
     * @param podId
     * @param path
     * @param namespace
     * @returns any Successful Response
     * @throws ApiError
     */
    public static fileDownload(
        podId: string,
        path: string,
        namespace: FileNamespace = FileNamespace.PERSONAL,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastore/files/download',
            path: {
                'pod_id': podId,
            },
            query: {
                'path': path,
                'namespace': namespace,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Folder
     * @param podId
     * @param requestBody
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    public static fileFolderCreate(
        podId: string,
        requestBody: CreateFolderRequest,
    ): CancelablePromise<FileResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastore/files/folders',
            path: {
                'pod_id': podId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Search Files
     * @param podId
     * @param requestBody
     * @returns FileSearchResponse Successful Response
     * @throws ApiError
     */
    public static fileSearch(
        podId: string,
        requestBody: FileSearchRequest,
    ): CancelablePromise<FileSearchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastore/files/search',
            path: {
                'pod_id': podId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Directory Tree
     * @param podId
     * @param rootPath
     * @param namespace
     * @param filesPerDirectory
     * @returns DirectoryTreeResponse Successful Response
     * @throws ApiError
     */
    public static fileTree(
        podId: string,
        rootPath: string = '/',
        namespace: FileNamespace = FileNamespace.PERSONAL,
        filesPerDirectory: number = 3,
    ): CancelablePromise<DirectoryTreeResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastore/files/tree',
            path: {
                'pod_id': podId,
            },
            query: {
                'root_path': rootPath,
                'namespace': namespace,
                'files_per_directory': filesPerDirectory,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
