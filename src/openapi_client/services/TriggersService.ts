/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateTriggerRequest } from '../models/CreateTriggerRequest.js';
import type { TriggerListResponse } from '../models/TriggerListResponse.js';
import type { TriggerResponse } from '../models/TriggerResponse.js';
import type { TriggerType } from '../models/TriggerType.js';
import type { UpdateTriggerRequest } from '../models/UpdateTriggerRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class TriggersService {
    /**
     * List Triggers
     * List triggers.
     * @param triggerType
     * @param isActive
     * @param podId
     * @param limit
     * @param pageToken
     * @returns TriggerListResponse Successful Response
     * @throws ApiError
     */
    public static triggerList(
        triggerType?: (TriggerType | null),
        isActive?: (boolean | null),
        podId?: (string | null),
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<TriggerListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/triggers',
            query: {
                'trigger_type': triggerType,
                'is_active': isActive,
                'pod_id': podId,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Trigger
     * Create a new trigger.
     * @param requestBody
     * @returns TriggerResponse Successful Response
     * @throws ApiError
     */
    public static triggerCreate(
        requestBody: CreateTriggerRequest,
    ): CancelablePromise<TriggerResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/triggers',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Trigger
     * Delete a trigger.
     * @param triggerId
     * @returns void
     * @throws ApiError
     */
    public static triggerDelete(
        triggerId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/triggers/{trigger_id}',
            path: {
                'trigger_id': triggerId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Trigger
     * Get a trigger by ID.
     * @param triggerId
     * @returns TriggerResponse Successful Response
     * @throws ApiError
     */
    public static triggerGet(
        triggerId: string,
    ): CancelablePromise<TriggerResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/triggers/{trigger_id}',
            path: {
                'trigger_id': triggerId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Trigger
     * Update a trigger.
     * @param triggerId
     * @param requestBody
     * @returns TriggerResponse Successful Response
     * @throws ApiError
     */
    public static triggerUpdate(
        triggerId: string,
        requestBody: UpdateTriggerRequest,
    ): CancelablePromise<TriggerResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/triggers/{trigger_id}',
            path: {
                'trigger_id': triggerId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
