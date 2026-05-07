/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentListResponse } from '../models/AgentListResponse.js';
import type { AgentMessageResponse } from '../models/AgentMessageResponse.js';
import type { AgentResponse } from '../models/AgentResponse.js';
import type { CreateAgentRequest } from '../models/CreateAgentRequest.js';
import type { UpdateAgentRequest } from '../models/UpdateAgentRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class AgentsService {
    /**
     * List Agents
     * List pod-owned agent definitions visible to the current user.
     * @param podId
     * @param pageToken
     * @param limit
     * @returns AgentListResponse Successful Response
     * @throws ApiError
     */
    public static agentList(
        podId: string,
        pageToken?: (string | null),
        limit: number = 100,
    ): CancelablePromise<AgentListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/agents',
            path: {
                'pod_id': podId,
            },
            query: {
                'page_token': pageToken,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Agent
     * Create a pod-owned agent definition with model, harness, toolsets, resource access grants, callable functions, and callable child agents.
     * @param podId
     * @param requestBody
     * @returns AgentResponse Successful Response
     * @throws ApiError
     */
    public static agentCreate(
        podId: string,
        requestBody: CreateAgentRequest,
    ): CancelablePromise<AgentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/agents',
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
     * Delete Agent
     * Delete a pod-owned agent definition by name.
     * @param podId
     * @param agentName
     * @returns AgentMessageResponse Successful Response
     * @throws ApiError
     */
    public static agentDelete(
        podId: string,
        agentName: string,
    ): CancelablePromise<AgentMessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/agents/{agent_name}',
            path: {
                'pod_id': podId,
                'agent_name': agentName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Agent
     * Get one pod-owned agent definition by its stable name.
     * @param podId
     * @param agentName
     * @returns AgentResponse Successful Response
     * @throws ApiError
     */
    public static agentGet(
        podId: string,
        agentName: string,
    ): CancelablePromise<AgentResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/agents/{agent_name}',
            path: {
                'pod_id': podId,
                'agent_name': agentName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Agent
     * Update an agent definition, including prompt instruction, model, toolsets, schemas, and resource/tool grants.
     * @param podId
     * @param agentName
     * @param requestBody
     * @returns AgentResponse Successful Response
     * @throws ApiError
     */
    public static agentUpdate(
        podId: string,
        agentName: string,
        requestBody: UpdateAgentRequest,
    ): CancelablePromise<AgentResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/agents/{agent_name}',
            path: {
                'pod_id': podId,
                'agent_name': agentName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
