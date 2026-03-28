/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateDeskRequest } from '../models/CreateDeskRequest.js';
import type { DeskBundleUploadResponse } from '../models/DeskBundleUploadResponse.js';
import type { DeskListResponse } from '../models/DeskListResponse.js';
import type { DeskMessageResponse } from '../models/DeskMessageResponse.js';
import type { DeskResponse } from '../models/DeskResponse.js';
import type { fastapi___compat__v2__Body_pod__desk__bundle__upload } from '../models/fastapi___compat__v2__Body_pod__desk__bundle__upload.js';
import type { UpdateDeskRequest } from '../models/UpdateDeskRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class DesksService {
    /**
     * Create Desk
     * @param podId
     * @param requestBody
     * @returns DeskResponse Successful Response
     * @throws ApiError
     */
    public static podDeskCreate(
        podId: string,
        requestBody: CreateDeskRequest,
    ): CancelablePromise<DeskResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/desks',
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
     * List Desks
     * @param podId
     * @param limit
     * @param pageToken
     * @returns DeskListResponse Successful Response
     * @throws ApiError
     */
    public static podDeskList(
        podId: string,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<DeskListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/desks',
            path: {
                'pod_id': podId,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Desk
     * @param podId
     * @param deskName
     * @returns DeskResponse Successful Response
     * @throws ApiError
     */
    public static podDeskGet(
        podId: string,
        deskName: string,
    ): CancelablePromise<DeskResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/desks/{desk_name}',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Desk
     * @param podId
     * @param deskName
     * @param requestBody
     * @returns DeskResponse Successful Response
     * @throws ApiError
     */
    public static podDeskUpdate(
        podId: string,
        deskName: string,
        requestBody: UpdateDeskRequest,
    ): CancelablePromise<DeskResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/desks/{desk_name}',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Desk
     * @param podId
     * @param deskName
     * @returns DeskMessageResponse Successful Response
     * @throws ApiError
     */
    public static podDeskDelete(
        podId: string,
        deskName: string,
    ): CancelablePromise<DeskMessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/desks/{desk_name}',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Desk Bundle
     * @param podId
     * @param deskName
     * @param formData
     * @returns DeskBundleUploadResponse Successful Response
     * @throws ApiError
     */
    public static podDeskBundleUpload(
        podId: string,
        deskName: string,
        formData?: fastapi___compat__v2__Body_pod__desk__bundle__upload,
    ): CancelablePromise<DeskBundleUploadResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/desks/{desk_name}/bundle',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Desk HTML
     * @param podId
     * @param deskName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static podDeskHtmlGet(
        podId: string,
        deskName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/desks/{desk_name}/html',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Download Desk Source Archive
     * @param podId
     * @param deskName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static podDeskSourceArchiveGet(
        podId: string,
        deskName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/desks/{desk_name}/source/archive',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
