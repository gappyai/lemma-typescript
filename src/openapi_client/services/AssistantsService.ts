/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssistantListResponse } from '../models/AssistantListResponse.js';
import type { AssistantResponse } from '../models/AssistantResponse.js';
import type { CreateAssistantRequest } from '../models/CreateAssistantRequest.js';
import type { UpdateAssistantRequest } from '../models/UpdateAssistantRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class AssistantsService {
    /**
     * Create Assistant
     * @param podId
     * @param requestBody
     * @returns AssistantResponse Successful Response
     * @throws ApiError
     */
    public static assistantCreate(
        podId: string,
        requestBody: CreateAssistantRequest,
    ): CancelablePromise<AssistantResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/assistants',
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
     * List Assistants
     * @param podId
     * @param limit
     * @param pageToken
     * @returns AssistantListResponse Successful Response
     * @throws ApiError
     */
    public static assistantList(
        podId: string,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<AssistantListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/assistants',
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
     * Get Assistant
     * @param podId
     * @param assistantName
     * @returns AssistantResponse Successful Response
     * @throws ApiError
     */
    public static assistantGet(
        podId: string,
        assistantName: string,
    ): CancelablePromise<AssistantResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/assistants/{assistant_name}',
            path: {
                'pod_id': podId,
                'assistant_name': assistantName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Assistant
     * @param podId
     * @param assistantName
     * @param requestBody
     * @returns AssistantResponse Successful Response
     * @throws ApiError
     */
    public static assistantUpdate(
        podId: string,
        assistantName: string,
        requestBody: UpdateAssistantRequest,
    ): CancelablePromise<AssistantResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/assistants/{assistant_name}',
            path: {
                'pod_id': podId,
                'assistant_name': assistantName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Assistant
     * @param podId
     * @param assistantName
     * @returns void
     * @throws ApiError
     */
    public static assistantDelete(
        podId: string,
        assistantName: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/assistants/{assistant_name}',
            path: {
                'pod_id': podId,
                'assistant_name': assistantName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
