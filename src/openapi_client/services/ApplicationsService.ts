/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationDetailResponseSchema } from '../models/ApplicationDetailResponseSchema.js';
import type { ApplicationListResponseSchema } from '../models/ApplicationListResponseSchema.js';
import type { AppTriggerListResponseSchema } from '../models/AppTriggerListResponseSchema.js';
import type { AppTriggerResponseSchema } from '../models/AppTriggerResponseSchema.js';
import type { OperationDetail } from '../models/OperationDetail.js';
import type { OperationDetailsBatchRequest } from '../models/OperationDetailsBatchRequest.js';
import type { OperationDetailsBatchResponse } from '../models/OperationDetailsBatchResponse.js';
import type { OperationDiscoverResponse } from '../models/OperationDiscoverResponse.js';
import type { OperationExecutionRequest } from '../models/OperationExecutionRequest.js';
import type { OperationExecutionResponse } from '../models/OperationExecutionResponse.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class ApplicationsService {
    /**
     * List Applications
     * Get all active applications available for integration
     * @param limit
     * @param pageToken
     * @returns ApplicationListResponseSchema Successful Response
     * @throws ApiError
     */
    public static applicationList(
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<ApplicationListResponseSchema> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations/applications',
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
     * List Triggers
     * Get all triggers. Optionally filter by application_id and search in description
     * @param applicationId
     * @param search
     * @param limit
     * @param pageToken
     * @returns AppTriggerListResponseSchema Successful Response
     * @throws ApiError
     */
    public static applicationTriggerList(
        applicationId?: (string | null),
        search?: (string | null),
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<AppTriggerListResponseSchema> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations/applications/triggers',
            query: {
                'application_id': applicationId,
                'search': search,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Trigger
     * Get a specific trigger by ID
     * @param triggerId
     * @returns AppTriggerResponseSchema Successful Response
     * @throws ApiError
     */
    public static applicationTriggerGet(
        triggerId: string,
    ): CancelablePromise<AppTriggerResponseSchema> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations/applications/triggers/{trigger_id}',
            path: {
                'trigger_id': triggerId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Application
     * Get a specific application by ID along with its operation catalog
     * @param applicationId
     * @returns ApplicationDetailResponseSchema Successful Response
     * @throws ApiError
     */
    public static applicationGet(
        applicationId: string,
    ): CancelablePromise<ApplicationDetailResponseSchema> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations/applications/{application_id}',
            path: {
                'application_id': applicationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Discover Application Operations
     * @param applicationId
     * @param query
     * @param limit
     * @returns OperationDiscoverResponse Successful Response
     * @throws ApiError
     */
    public static applicationOperationDiscover(
        applicationId: string,
        query?: (string | null),
        limit: number = 100,
    ): CancelablePromise<OperationDiscoverResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations/applications/{application_id}/operations',
            path: {
                'application_id': applicationId,
            },
            query: {
                'query': query,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Application Operation Details In Batch
     * @param applicationId
     * @param requestBody
     * @returns OperationDetailsBatchResponse Successful Response
     * @throws ApiError
     */
    public static applicationOperationDetailsBatch(
        applicationId: string,
        requestBody: OperationDetailsBatchRequest,
    ): CancelablePromise<OperationDetailsBatchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/integrations/applications/{application_id}/operations/details',
            path: {
                'application_id': applicationId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Application Operation Details
     * @param applicationId
     * @param operationName
     * @returns OperationDetail Successful Response
     * @throws ApiError
     */
    public static applicationOperationDetail(
        applicationId: string,
        operationName: string,
    ): CancelablePromise<OperationDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations/applications/{application_id}/operations/{operation_name}',
            path: {
                'application_id': applicationId,
                'operation_name': operationName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Execute Application Operation
     * @param applicationId
     * @param operationName
     * @param requestBody
     * @returns OperationExecutionResponse Successful Response
     * @throws ApiError
     */
    public static applicationOperationExecute(
        applicationId: string,
        operationName: string,
        requestBody: OperationExecutionRequest,
    ): CancelablePromise<OperationExecutionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/integrations/applications/{application_id}/operations/{operation_name}/execute',
            path: {
                'application_id': applicationId,
                'operation_name': operationName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
