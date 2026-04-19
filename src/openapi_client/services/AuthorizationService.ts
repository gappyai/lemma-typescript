/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GrantPermissionRequest } from '../models/GrantPermissionRequest.js';
import type { PodPermissionsResponse } from '../models/PodPermissionsResponse.js';
import type { ResourcePermissionListResponse } from '../models/ResourcePermissionListResponse.js';
import type { ResourcePermissionResponse } from '../models/ResourcePermissionResponse.js';
import type { SetVisibilityRequest } from '../models/SetVisibilityRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class AuthorizationService {
    /**
     * Get My Pod Permissions
     * @param podId
     * @returns PodPermissionsResponse Successful Response
     * @throws ApiError
     */
    public static podPermissionsMe(
        podId: string,
    ): CancelablePromise<PodPermissionsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/permissions/me',
            path: {
                'pod_id': podId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Resource Permissions
     * List all ACL entries for a resource. Requires POD_ADMIN or being the resource creator.
     * @param podId
     * @param resourceType
     * @param resourceId
     * @returns ResourcePermissionListResponse Successful Response
     * @throws ApiError
     */
    public static resourcePermissionsList(
        podId: string,
        resourceType: string,
        resourceId: string,
    ): CancelablePromise<ResourcePermissionListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/resources/{resource_type}/{resource_id}/permissions',
            path: {
                'pod_id': podId,
                'resource_type': resourceType,
                'resource_id': resourceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Grant Resource Permission
     * Add an ACL entry granting a user or role access to a resource.
     * @param podId
     * @param resourceType
     * @param resourceId
     * @param requestBody
     * @returns ResourcePermissionResponse Successful Response
     * @throws ApiError
     */
    public static resourcePermissionsGrant(
        podId: string,
        resourceType: string,
        resourceId: string,
        requestBody: GrantPermissionRequest,
    ): CancelablePromise<ResourcePermissionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/resources/{resource_type}/{resource_id}/permissions',
            path: {
                'pod_id': podId,
                'resource_type': resourceType,
                'resource_id': resourceId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Revoke Resource Permission
     * Remove an ACL entry for a resource.
     * @param podId
     * @param resourceType
     * @param resourceId
     * @param permissionId
     * @returns void
     * @throws ApiError
     */
    public static resourcePermissionsRevoke(
        podId: string,
        resourceType: string,
        resourceId: string,
        permissionId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/resources/{resource_type}/{resource_id}/permissions/{permission_id}',
            path: {
                'pod_id': podId,
                'resource_type': resourceType,
                'resource_id': resourceId,
                'permission_id': permissionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Set Resource Visibility
     * Update visibility for a resource (OWNER | RESTRICTED | POD). Requires POD_ADMIN or being the resource creator.
     * @param podId
     * @param resourceType
     * @param resourceId
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public static resourceVisibilitySet(
        podId: string,
        resourceType: string,
        resourceId: string,
        requestBody: SetVisibilityRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/resources/{resource_type}/{resource_id}/visibility',
            path: {
                'pod_id': podId,
                'resource_type': resourceType,
                'resource_id': resourceId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
