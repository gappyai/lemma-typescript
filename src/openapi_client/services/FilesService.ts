/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateFolderRequest } from '../models/CreateFolderRequest.js';
import type { DatastoreFileUploadRequest } from '../models/DatastoreFileUploadRequest.js';
import type { DatastoreMessageResponse } from '../models/DatastoreMessageResponse.js';
import type { FileListResponse } from '../models/FileListResponse.js';
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
     * @param parentId
     * @param limit
     * @param pageToken
     * @returns FileListResponse Successful Response
     * @throws ApiError
     */
    public static fileList(
        podId: string,
        parentId?: (string | null),
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
     * Delete File
     * @param podId
     * @param fileId
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    public static fileDelete(
        podId: string,
        fileId: string,
    ): CancelablePromise<DatastoreMessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/datastore/files/{file_id}',
            path: {
                'pod_id': podId,
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
     * @param fileId
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    public static fileGet(
        podId: string,
        fileId: string,
    ): CancelablePromise<FileResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastore/files/{file_id}',
            path: {
                'pod_id': podId,
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
     * @param fileId
     * @param formData
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    public static fileUpdate(
        podId: string,
        fileId: string,
        formData?: update,
    ): CancelablePromise<FileResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/datastore/files/{file_id}',
            path: {
                'pod_id': podId,
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
     * @param fileId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static fileDownload(
        podId: string,
        fileId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastore/files/{file_id}/download',
            path: {
                'pod_id': podId,
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
