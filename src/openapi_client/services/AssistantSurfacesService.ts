/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssistantSurfaceListResponse } from '../models/AssistantSurfaceListResponse.js';
import type { CreateSurfaceRequest } from '../models/CreateSurfaceRequest.js';
import type { ToggleSurfaceRequest } from '../models/ToggleSurfaceRequest.js';
import type { UpdateSurfaceRequest } from '../models/UpdateSurfaceRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class AssistantSurfacesService {
    /**
     * List Surfaces
     * List configured surfaces in a pod.
     * @param podId
     * @param limit
     * @param pageToken
     * @returns AssistantSurfaceListResponse Successful Response
     * @throws ApiError
     */
    public static assistantSurfaceList(
        podId: string,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<AssistantSurfaceListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/surfaces',
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
     * Create Surface
     * Create a new surface for an assistant.
     * @param podId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static assistantSurfaceCreate(
        podId: string,
        requestBody: CreateSurfaceRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/surfaces',
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
     * Get Surface
     * Get a specific surface configuration.
     * @param podId
     * @param surfaceId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static assistantSurfaceGet(
        podId: string,
        surfaceId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/surfaces/{surface_id}',
            path: {
                'pod_id': podId,
                'surface_id': surfaceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Surface
     * Update a surface configuration.
     * @param podId
     * @param surfaceId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static assistantSurfaceUpdateConfig(
        podId: string,
        surfaceId: string,
        requestBody: UpdateSurfaceRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/surfaces/{surface_id}/config',
            path: {
                'pod_id': podId,
                'surface_id': surfaceId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Toggle Surface
     * Toggle a surface active state.
     * @param podId
     * @param surfaceId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static assistantSurfaceToggle(
        podId: string,
        surfaceId: string,
        requestBody: ToggleSurfaceRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/surfaces/{surface_id}/toggle',
            path: {
                'pod_id': podId,
                'surface_id': surfaceId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
