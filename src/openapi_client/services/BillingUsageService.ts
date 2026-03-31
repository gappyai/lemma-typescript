/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecentUsageResponse } from '../models/RecentUsageResponse.js';
import type { UsageSummaryResponse } from '../models/UsageSummaryResponse.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class BillingUsageService {
    /**
     * Get Organization Usage Summary
     * Get usage summary for a specific organization.
     * @param organizationId
     * @param start
     * @param end
     * @param modelName
     * @param days
     * @returns UsageSummaryResponse Successful Response
     * @throws ApiError
     */
    public static billingUsageOrganizationSummaryGet(
        organizationId: string,
        start?: (string | null),
        end?: (string | null),
        modelName?: (string | null),
        days: number = 30,
    ): CancelablePromise<UsageSummaryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/usage/organizations/{organization_id}',
            path: {
                'organization_id': organizationId,
            },
            query: {
                'start': start,
                'end': end,
                'model_name': modelName,
                'days': days,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get My Organization Usage Summary
     * Get usage summary for the current user within an organization.
     * @param organizationId
     * @param start
     * @param end
     * @param modelName
     * @param days
     * @returns UsageSummaryResponse Successful Response
     * @throws ApiError
     */
    public static billingUsageOrganizationMeSummaryGet(
        organizationId: string,
        start?: (string | null),
        end?: (string | null),
        modelName?: (string | null),
        days: number = 30,
    ): CancelablePromise<UsageSummaryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/usage/organizations/{organization_id}/me',
            path: {
                'organization_id': organizationId,
            },
            query: {
                'start': start,
                'end': end,
                'model_name': modelName,
                'days': days,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Pod Usage Summary
     * Get usage summary for a specific pod within an organization.
     * @param organizationId
     * @param podId
     * @param start
     * @param end
     * @param modelName
     * @param days
     * @returns UsageSummaryResponse Successful Response
     * @throws ApiError
     */
    public static billingUsageOrganizationPodSummaryGet(
        organizationId: string,
        podId: string,
        start?: (string | null),
        end?: (string | null),
        modelName?: (string | null),
        days: number = 30,
    ): CancelablePromise<UsageSummaryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/usage/organizations/{organization_id}/pods/{pod_id}',
            path: {
                'organization_id': organizationId,
                'pod_id': podId,
            },
            query: {
                'start': start,
                'end': end,
                'model_name': modelName,
                'days': days,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Organization Recent Usage
     * Get recent usage records for a specific organization.
     * @param organizationId
     * @param start
     * @param end
     * @param modelName
     * @param days
     * @returns RecentUsageResponse Successful Response
     * @throws ApiError
     */
    public static billingUsageOrganizationRecentGet(
        organizationId: string,
        start?: (string | null),
        end?: (string | null),
        modelName?: (string | null),
        days: number = 30,
    ): CancelablePromise<RecentUsageResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/usage/organizations/{organization_id}/recent',
            path: {
                'organization_id': organizationId,
            },
            query: {
                'start': start,
                'end': end,
                'model_name': modelName,
                'days': days,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
