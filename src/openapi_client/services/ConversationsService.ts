/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConversationListResponse } from '../models/ConversationListResponse.js';
import type { ConversationMessageListResponse } from '../models/ConversationMessageListResponse.js';
import type { ConversationResponse } from '../models/ConversationResponse.js';
import type { CreateConversationRequest } from '../models/CreateConversationRequest.js';
import type { CreateMessageRequest } from '../models/CreateMessageRequest.js';
import type { UpdateConversationRequest } from '../models/UpdateConversationRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class ConversationsService {
    /**
     * List Conversations
     * @param assistantId
     * @param podId
     * @param organizationId
     * @param pageToken
     * @param limit
     * @returns ConversationListResponse Successful Response
     * @throws ApiError
     */
    public static conversationList(
        assistantId?: (string | null),
        podId?: (string | null),
        organizationId?: (string | null),
        pageToken?: (string | null),
        limit: number = 20,
    ): CancelablePromise<ConversationListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations',
            query: {
                'assistant_id': assistantId,
                'pod_id': podId,
                'organization_id': organizationId,
                'page_token': pageToken,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Conversation
     * @param requestBody
     * @returns ConversationResponse Successful Response
     * @throws ApiError
     */
    public static conversationCreate(
        requestBody: CreateConversationRequest,
    ): CancelablePromise<ConversationResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/conversations',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Conversation
     * @param conversationId
     * @param podId
     * @returns ConversationResponse Successful Response
     * @throws ApiError
     */
    public static conversationGet(
        conversationId: string,
        podId?: (string | null),
    ): CancelablePromise<ConversationResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations/{conversation_id}',
            path: {
                'conversation_id': conversationId,
            },
            query: {
                'pod_id': podId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Conversation
     * @param conversationId
     * @param requestBody
     * @param podId
     * @returns ConversationResponse Successful Response
     * @throws ApiError
     */
    public static conversationUpdate(
        conversationId: string,
        requestBody: UpdateConversationRequest,
        podId?: (string | null),
    ): CancelablePromise<ConversationResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/conversations/{conversation_id}',
            path: {
                'conversation_id': conversationId,
            },
            query: {
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
     * List Messages
     * List messages in a conversation with token pagination. Use `page_token` to fetch older messages.
     * @param conversationId
     * @param podId
     * @param pageToken
     * @param limit
     * @returns ConversationMessageListResponse Successful Response
     * @throws ApiError
     */
    public static conversationMessageList(
        conversationId: string,
        podId?: (string | null),
        pageToken?: (string | null),
        limit: number = 20,
    ): CancelablePromise<ConversationMessageListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations/{conversation_id}/messages',
            path: {
                'conversation_id': conversationId,
            },
            query: {
                'pod_id': podId,
                'page_token': pageToken,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Send Message (Stream)
     * @param conversationId
     * @param requestBody
     * @param podId
     * @returns any Server-Sent Events
     * @throws ApiError
     */
    public static conversationMessageCreate(
        conversationId: string,
        requestBody: CreateMessageRequest,
        podId?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/conversations/{conversation_id}/messages',
            path: {
                'conversation_id': conversationId,
            },
            query: {
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
     * Stop Conversation Run
     * @param conversationId
     * @param podId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static conversationRunStop(
        conversationId: string,
        podId?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/conversations/{conversation_id}/stop',
            path: {
                'conversation_id': conversationId,
            },
            query: {
                'pod_id': podId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Resume Conversation Stream
     * @param conversationId
     * @param podId
     * @returns any Server-Sent Events for an already-running conversation.
     * @throws ApiError
     */
    public static conversationStreamResume(
        conversationId: string,
        podId?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/conversations/{conversation_id}/stream',
            path: {
                'conversation_id': conversationId,
            },
            query: {
                'pod_id': podId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
