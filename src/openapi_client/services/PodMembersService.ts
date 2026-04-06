/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PodMemberAddRequest } from '../models/PodMemberAddRequest.js';
import type { PodMemberDetailResponse } from '../models/PodMemberDetailResponse.js';
import type { PodMemberListResponse } from '../models/PodMemberListResponse.js';
import type { PodMemberResponse } from '../models/PodMemberResponse.js';
import type { PodMemberUpdateRoleRequest } from '../models/PodMemberUpdateRoleRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class PodMembersService {
    /**
     * List Pod Members
     * List all members of a pod
     * @param podId
     * @param limit
     * @param pageToken
     * @returns PodMemberListResponse Successful Response
     * @throws ApiError
     */
    public static podMemberList(
        podId: string,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<PodMemberListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/members',
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
     * Add Pod Member
     * Add a member to a pod
     * @param podId
     * @param requestBody
     * @returns PodMemberResponse Successful Response
     * @throws ApiError
     */
    public static podMemberAdd(
        podId: string,
        requestBody: PodMemberAddRequest,
    ): CancelablePromise<PodMemberResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/members',
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
     * Remove Pod Member
     * Remove a member from a pod
     * @param podId
     * @param userId
     * @returns void
     * @throws ApiError
     */
    public static podMemberRemove(
        podId: string,
        userId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/members/{user_id}',
            path: {
                'pod_id': podId,
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Pod Member
     * Get a pod member by user id
     * @param podId
     * @param userId
     * @returns PodMemberDetailResponse Successful Response
     * @throws ApiError
     */
    public static podMemberGet(
        podId: string,
        userId: string,
    ): CancelablePromise<PodMemberDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/members/{user_id}',
            path: {
                'pod_id': podId,
                'user_id': userId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Member Role
     * Update a pod member's role
     * @param podId
     * @param userId
     * @param requestBody
     * @returns PodMemberResponse Successful Response
     * @throws ApiError
     */
    public static podMemberUpdateRole(
        podId: string,
        userId: string,
        requestBody: PodMemberUpdateRoleRequest,
    ): CancelablePromise<PodMemberResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/members/{user_id}/role',
            path: {
                'pod_id': podId,
                'user_id': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
