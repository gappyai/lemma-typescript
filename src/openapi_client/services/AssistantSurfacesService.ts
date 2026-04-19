/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminConsentInfoResponse } from '../models/AdminConsentInfoResponse.js';
import type { AssistantSurfaceListResponse } from '../models/AssistantSurfaceListResponse.js';
import type { CreateSurfaceRequest } from '../models/CreateSurfaceRequest.js';
import type { SurfacePlatformSetupGuideResponse } from '../models/SurfacePlatformSetupGuideResponse.js';
import type { ToggleSurfaceRequest } from '../models/ToggleSurfaceRequest.js';
import type { UpdateSurfaceRequest } from '../models/UpdateSurfaceRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class AssistantSurfacesService {
    /**
     * List Surfaces
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
     * Get Surface Platform Checklist
     * @param podId
     * @param platform
     * @returns SurfacePlatformSetupGuideResponse Successful Response
     * @throws ApiError
     */
    public static assistantSurfacePlatformChecklist(
        podId: string,
        platform: string,
    ): CancelablePromise<SurfacePlatformSetupGuideResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/surfaces/platforms/{platform}/checklist',
            path: {
                'pod_id': podId,
                'platform': platform,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Surface
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
     * @param podId
     * @param surfaceId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static assistantSurfaceUpdate(
        podId: string,
        surfaceId: string,
        requestBody: UpdateSurfaceRequest,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/surfaces/{surface_id}',
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
     * Get Admin Consent Info
     * @param podId
     * @param surfaceId
     * @returns AdminConsentInfoResponse Successful Response
     * @throws ApiError
     */
    public static assistantSurfaceAdminConsentInfo(
        podId: string,
        surfaceId: string,
    ): CancelablePromise<AdminConsentInfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/surfaces/{surface_id}/admin-consent',
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
     * Toggle Surface
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
    /**
     * Get Webhook Url
     * @param podId
     * @param surfaceId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static assistantSurfaceWebhookUrl(
        podId: string,
        surfaceId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/surfaces/{surface_id}/webhook-url',
            path: {
                'pod_id': podId,
                'surface_id': surfaceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
