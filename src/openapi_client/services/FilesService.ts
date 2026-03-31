/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_upload_file_files__resource_type___resource_id__upload_post } from '../models/Body_upload_file_files__resource_type___resource_id__upload_post.js';
import type { CreateFolderRequest } from '../models/CreateFolderRequest.js';
import type { DatastoreFileUploadRequest } from '../models/DatastoreFileUploadRequest.js';
import type { DatastoreMessageResponse } from '../models/DatastoreMessageResponse.js';
import type { FileListResponse } from '../models/FileListResponse.js';
import type { FileResponse } from '../models/FileResponse.js';
import type { FileSearchRequest } from '../models/FileSearchRequest.js';
import type { FileSearchResponse } from '../models/FileSearchResponse.js';
import type { FileUploadResponse } from '../models/FileUploadResponse.js';
import type { ResourceFileListResponse } from '../models/ResourceFileListResponse.js';
import type { ResourceType } from '../models/ResourceType.js';
import type { update } from '../models/update.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class FilesService {
    /**
     * Delete File
     * @param resourceType
     * @param resourceId
     * @param filePath
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteFileFilesResourceTypeResourceIdDeleteFilePathDelete(
        resourceType: ResourceType,
        resourceId: string,
        filePath: string,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/files/{resource_type}/{resource_id}/delete/{file_path}',
            path: {
                'resource_type': resourceType,
                'resource_id': resourceId,
                'file_path': filePath,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Download File
     * @param resourceType
     * @param resourceId
     * @param filePath
     * @returns any Successful Response
     * @throws ApiError
     */
    public static downloadFileFilesResourceTypeResourceIdDownloadFilePathGet(
        resourceType: ResourceType,
        resourceId: string,
        filePath: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/files/{resource_type}/{resource_id}/download/{file_path}',
            path: {
                'resource_type': resourceType,
                'resource_id': resourceId,
                'file_path': filePath,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Files
     * @param resourceType
     * @param resourceId
     * @param path
     * @param limit
     * @param pageToken
     * @returns ResourceFileListResponse Successful Response
     * @throws ApiError
     */
    public static listFilesFilesResourceTypeResourceIdListGet(
        resourceType: ResourceType,
        resourceId: string,
        path: string = '',
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<ResourceFileListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/files/{resource_type}/{resource_id}/list',
            path: {
                'resource_type': resourceType,
                'resource_id': resourceId,
            },
            query: {
                'path': path,
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
     * @param resourceType
     * @param resourceId
     * @param formData
     * @param path
     * @returns FileUploadResponse Successful Response
     * @throws ApiError
     */
    public static uploadFileFilesResourceTypeResourceIdUploadPost(
        resourceType: ResourceType,
        resourceId: string,
        formData: Body_upload_file_files__resource_type___resource_id__upload_post,
        path?: (string | null),
    ): CancelablePromise<FileUploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/files/{resource_type}/{resource_id}/upload',
            path: {
                'resource_type': resourceType,
                'resource_id': resourceId,
            },
            query: {
                'path': path,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Files
     * @param podId
     * @param datastoreName
     * @param parentId
     * @param limit
     * @param pageToken
     * @returns FileListResponse Successful Response
     * @throws ApiError
     */
    public static fileList(
        podId: string,
        datastoreName: string,
        parentId?: (string | null),
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<FileListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            query: {
                'parent_id': parentId,
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
     * @param datastoreName
     * @param formData
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    public static fileUpload(
        podId: string,
        datastoreName: string,
        formData: DatastoreFileUploadRequest,
    ): CancelablePromise<FileResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Folder
     * @param podId
     * @param datastoreName
     * @param requestBody
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    public static fileFolderCreate(
        podId: string,
        datastoreName: string,
        requestBody: CreateFolderRequest,
    ): CancelablePromise<FileResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files/folders',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
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
     * @param datastoreName
     * @param requestBody
     * @returns FileSearchResponse Successful Response
     * @throws ApiError
     */
    public static fileSearch(
        podId: string,
        datastoreName: string,
        requestBody: FileSearchRequest,
    ): CancelablePromise<FileSearchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files/search',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete File
     * @param podId
     * @param datastoreName
     * @param fileId
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    public static fileDelete(
        podId: string,
        datastoreName: string,
        fileId: string,
    ): CancelablePromise<DatastoreMessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files/{file_id}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get File
     * @param podId
     * @param datastoreName
     * @param fileId
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    public static fileGet(
        podId: string,
        datastoreName: string,
        fileId: string,
    ): CancelablePromise<FileResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files/{file_id}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update File
     * @param podId
     * @param datastoreName
     * @param fileId
     * @param formData
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    public static fileUpdate(
        podId: string,
        datastoreName: string,
        fileId: string,
        formData?: update,
    ): CancelablePromise<FileResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files/{file_id}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'file_id': fileId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Download File
     * @param podId
     * @param datastoreName
     * @param fileId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static fileDownload(
        podId: string,
        datastoreName: string,
        fileId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files/{file_id}/download',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
