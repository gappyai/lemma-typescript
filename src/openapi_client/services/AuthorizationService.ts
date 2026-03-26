/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PodPermissionsResponse } from '../models/PodPermissionsResponse.js';
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
}
