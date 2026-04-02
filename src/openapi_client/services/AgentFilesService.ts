/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_upload_file_files__resource_type___resource_id__upload_post } from '../models/Body_upload_file_files__resource_type___resource_id__upload_post.js';
import type { FileUploadResponse } from '../models/FileUploadResponse.js';
import type { ResourceFileListResponse } from '../models/ResourceFileListResponse.js';
import type { ResourceType } from '../models/ResourceType.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class AgentFilesService {
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
}
