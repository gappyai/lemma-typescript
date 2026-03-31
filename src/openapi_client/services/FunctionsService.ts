/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateFunctionRequest } from '../models/CreateFunctionRequest.js';
import type { ExecuteFunctionRequest } from '../models/ExecuteFunctionRequest.js';
import type { FunctionListResponse } from '../models/FunctionListResponse.js';
import type { FunctionMessageResponse } from '../models/FunctionMessageResponse.js';
import type { FunctionResponse } from '../models/FunctionResponse.js';
import type { FunctionRunListResponse } from '../models/FunctionRunListResponse.js';
import type { FunctionRunResponse } from '../models/FunctionRunResponse.js';
import type { UpdateFunctionRequest } from '../models/UpdateFunctionRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class FunctionsService {
    /**
     * List Functions
     * List all functions in a pod
     * @param podId
     * @param limit
     * @param pageToken
     * @returns FunctionListResponse Successful Response
     * @throws ApiError
     */
    public static functionList(
        podId: string,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<FunctionListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/functions',
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
     * Create Function
     * Create a new function in a pod
     * @param podId
     * @param requestBody
     * @returns FunctionResponse Successful Response
     * @throws ApiError
     */
    public static functionCreate(
        podId: string,
        requestBody: CreateFunctionRequest,
    ): CancelablePromise<FunctionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/functions',
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
     * Delete Function
     * Delete a function
     * @param podId
     * @param functionName
     * @returns FunctionMessageResponse Successful Response
     * @throws ApiError
     */
    public static functionDelete(
        podId: string,
        functionName: string,
    ): CancelablePromise<FunctionMessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/functions/{function_name}',
            path: {
                'pod_id': podId,
                'function_name': functionName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Function
     * Get a function by name
     * @param podId
     * @param functionName
     * @returns FunctionResponse Successful Response
     * @throws ApiError
     */
    public static functionGet(
        podId: string,
        functionName: string,
    ): CancelablePromise<FunctionResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/functions/{function_name}',
            path: {
                'pod_id': podId,
                'function_name': functionName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Function
     * Update a function
     * @param podId
     * @param functionName
     * @param requestBody
     * @returns FunctionResponse Successful Response
     * @throws ApiError
     */
    public static functionUpdate(
        podId: string,
        functionName: string,
        requestBody: UpdateFunctionRequest,
    ): CancelablePromise<FunctionResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/functions/{function_name}',
            path: {
                'pod_id': podId,
                'function_name': functionName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Runs
     * List runs for a function
     * @param podId
     * @param functionName
     * @param limit
     * @param pageToken
     * @returns FunctionRunListResponse Successful Response
     * @throws ApiError
     */
    public static functionRunList(
        podId: string,
        functionName: string,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<FunctionRunListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/functions/{function_name}/runs',
            path: {
                'pod_id': podId,
                'function_name': functionName,
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
     * Execute Function
     * Execute a function
     * @param podId
     * @param functionName
     * @param requestBody
     * @returns FunctionRunResponse Successful Response
     * @throws ApiError
     */
    public static functionRun(
        podId: string,
        functionName: string,
        requestBody: ExecuteFunctionRequest,
    ): CancelablePromise<FunctionRunResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/functions/{function_name}/runs',
            path: {
                'pod_id': podId,
                'function_name': functionName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Run
     * Get a specific function run
     * @param podId
     * @param functionName
     * @param runId
     * @returns FunctionRunResponse Successful Response
     * @throws ApiError
     */
    public static functionRunGet(
        podId: string,
        functionName: string,
        runId: string,
    ): CancelablePromise<FunctionRunResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/functions/{function_name}/runs/{run_id}',
            path: {
                'pod_id': podId,
                'function_name': functionName,
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
