/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddMessageRequest } from '../models/AddMessageRequest.js';
import type { CreateTaskRequest } from '../models/CreateTaskRequest.js';
import type { TaskListResponse } from '../models/TaskListResponse.js';
import type { TaskMessageListResponse } from '../models/TaskMessageListResponse.js';
import type { TaskResponse } from '../models/TaskResponse.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class TasksService {
    /**
     * List Tasks
     * List all tasks in a pod
     * @param podId
     * @param agentName
     * @param limit
     * @param pageToken
     * @returns TaskListResponse Successful Response
     * @throws ApiError
     */
    public static taskList(
        podId: string,
        agentName?: (string | null),
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<TaskListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/tasks',
            path: {
                'pod_id': podId,
            },
            query: {
                'agent_name': agentName,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Task
     * Create and start a new task
     * @param podId
     * @param requestBody
     * @returns TaskResponse Successful Response
     * @throws ApiError
     */
    public static taskCreate(
        podId: string,
        requestBody: CreateTaskRequest,
    ): CancelablePromise<TaskResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/tasks',
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
     * Get Task
     * Get a task by ID
     * @param podId
     * @param taskId
     * @returns TaskResponse Successful Response
     * @throws ApiError
     */
    public static taskGet(
        podId: string,
        taskId: string,
    ): CancelablePromise<TaskResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/tasks/{task_id}',
            path: {
                'pod_id': podId,
                'task_id': taskId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Messages
     * List messages for a task
     * @param podId
     * @param taskId
     * @param limit
     * @param pageToken
     * @returns TaskMessageListResponse Successful Response
     * @throws ApiError
     */
    public static taskMessageList(
        podId: string,
        taskId: string,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<TaskMessageListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/tasks/{task_id}/messages',
            path: {
                'pod_id': podId,
                'task_id': taskId,
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
     * Add Message
     * Add a message to a task
     * @param podId
     * @param taskId
     * @param requestBody
     * @returns TaskResponse Successful Response
     * @throws ApiError
     */
    public static taskMessageAdd(
        podId: string,
        taskId: string,
        requestBody: AddMessageRequest,
    ): CancelablePromise<TaskResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/tasks/{task_id}/messages',
            path: {
                'pod_id': podId,
                'task_id': taskId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Stop Task
     * Stop a running task
     * @param podId
     * @param taskId
     * @returns TaskResponse Successful Response
     * @throws ApiError
     */
    public static taskStop(
        podId: string,
        taskId: string,
    ): CancelablePromise<TaskResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/tasks/{task_id}/stop',
            path: {
                'pod_id': podId,
                'task_id': taskId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Stream Task Updates
     * Stream task updates via Server-Sent Events
     * @param podId
     * @param taskId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static taskStream(
        podId: string,
        taskId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/tasks/{task_id}/stream',
            path: {
                'pod_id': podId,
                'task_id': taskId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
