/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecentUsageResponse } from '../models/RecentUsageResponse.js';
import type { UsageLimitsResponse } from '../models/UsageLimitsResponse.js';
import type { UsageListResponse } from '../models/UsageListResponse.js';
import type { UsageStatsResponse } from '../models/UsageStatsResponse.js';
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
     * @param podId
     * @param userId
     * @param agentId
     * @param usageKind
     * @param status
     * @param days
     * @param limit
     * @returns UsageSummaryResponse Successful Response
     * @throws ApiError
     */
    public static billingUsageOrganizationSummaryGet(
        organizationId: string,
        start?: (string | null),
        end?: (string | null),
        modelName?: (string | null),
        podId?: (string | null),
        userId?: (string | null),
        agentId?: (string | null),
        usageKind?: (string | null),
        status?: (string | null),
        days: number = 30,
        limit: number = 100,
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
                'pod_id': podId,
                'user_id': userId,
                'agent_id': agentId,
                'usage_kind': usageKind,
                'status': status,
                'days': days,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Organization Usage Events
     * List usage events with optional filters.
     * @param organizationId
     * @param start
     * @param end
     * @param modelName
     * @param podId
     * @param userId
     * @param agentId
     * @param usageKind
     * @param status
     * @param days
     * @param limit
     * @returns UsageListResponse Successful Response
     * @throws ApiError
     */
    public static billingUsageOrganizationEventsList(
        organizationId: string,
        start?: (string | null),
        end?: (string | null),
        modelName?: (string | null),
        podId?: (string | null),
        userId?: (string | null),
        agentId?: (string | null),
        usageKind?: (string | null),
        status?: (string | null),
        days: number = 30,
        limit: number = 100,
    ): CancelablePromise<UsageListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/usage/organizations/{organization_id}/events',
            path: {
                'organization_id': organizationId,
            },
            query: {
                'start': start,
                'end': end,
                'model_name': modelName,
                'pod_id': podId,
                'user_id': userId,
                'agent_id': agentId,
                'usage_kind': usageKind,
                'status': status,
                'days': days,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Current Usage Limits
     * Get current usage limits for the requesting user in an organization.
     * @param organizationId
     * @returns UsageLimitsResponse Successful Response
     * @throws ApiError
     */
    public static billingUsageOrganizationLimitsGet(
        organizationId: string,
    ): CancelablePromise<UsageLimitsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/usage/organizations/{organization_id}/limits',
            path: {
                'organization_id': organizationId,
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
     * @param podId
     * @param userId
     * @param agentId
     * @param usageKind
     * @param status
     * @param days
     * @param limit
     * @returns UsageSummaryResponse Successful Response
     * @throws ApiError
     */
    public static billingUsageOrganizationMeSummaryGet(
        organizationId: string,
        start?: (string | null),
        end?: (string | null),
        modelName?: (string | null),
        podId?: (string | null),
        userId?: (string | null),
        agentId?: (string | null),
        usageKind?: (string | null),
        status?: (string | null),
        days: number = 30,
        limit: number = 100,
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
                'pod_id': podId,
                'user_id': userId,
                'agent_id': agentId,
                'usage_kind': usageKind,
                'status': status,
                'days': days,
                'limit': limit,
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
     * @param days
     * @returns UsageSummaryResponse Successful Response
     * @throws ApiError
     */
    public static billingUsageOrganizationPodSummaryGet(
        organizationId: string,
        podId: string,
        start?: (string | null),
        end?: (string | null),
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
     * @param podId
     * @param userId
     * @param agentId
     * @param usageKind
     * @param status
     * @param days
     * @param limit
     * @returns RecentUsageResponse Successful Response
     * @throws ApiError
     */
    public static billingUsageOrganizationRecentGet(
        organizationId: string,
        start?: (string | null),
        end?: (string | null),
        modelName?: (string | null),
        podId?: (string | null),
        userId?: (string | null),
        agentId?: (string | null),
        usageKind?: (string | null),
        status?: (string | null),
        days: number = 30,
        limit: number = 100,
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
                'pod_id': podId,
                'user_id': userId,
                'agent_id': agentId,
                'usage_kind': usageKind,
                'status': status,
                'days': days,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Organization Usage Stats
     * Get bucketed usage stats with optional filters.
     * @param organizationId
     * @param start
     * @param end
     * @param modelName
     * @param podId
     * @param userId
     * @param agentId
     * @param usageKind
     * @param status
     * @param days
     * @param limit
     * @param granularity
     * @param groupBy
     * @returns UsageStatsResponse Successful Response
     * @throws ApiError
     */
    public static billingUsageOrganizationStatsGet(
        organizationId: string,
        start?: (string | null),
        end?: (string | null),
        modelName?: (string | null),
        podId?: (string | null),
        userId?: (string | null),
        agentId?: (string | null),
        usageKind?: (string | null),
        status?: (string | null),
        days: number = 30,
        limit: number = 100,
        granularity: string = 'day',
        groupBy?: (string | null),
    ): CancelablePromise<UsageStatsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/usage/organizations/{organization_id}/stats',
            path: {
                'organization_id': organizationId,
            },
            query: {
                'start': start,
                'end': end,
                'model_name': modelName,
                'pod_id': podId,
                'user_id': userId,
                'agent_id': agentId,
                'usage_kind': usageKind,
                'status': status,
                'days': days,
                'limit': limit,
                'granularity': granularity,
                'group_by': groupBy,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Organization Usage Summary
     * Get usage summary with optional filters.
     * @param organizationId
     * @param start
     * @param end
     * @param modelName
     * @param podId
     * @param userId
     * @param agentId
     * @param usageKind
     * @param status
     * @param days
     * @param limit
     * @returns UsageSummaryResponse Successful Response
     * @throws ApiError
     */
    public static billingUsageOrganizationSummaryQuery(
        organizationId: string,
        start?: (string | null),
        end?: (string | null),
        modelName?: (string | null),
        podId?: (string | null),
        userId?: (string | null),
        agentId?: (string | null),
        usageKind?: (string | null),
        status?: (string | null),
        days: number = 30,
        limit: number = 100,
    ): CancelablePromise<UsageSummaryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/usage/organizations/{organization_id}/summary',
            path: {
                'organization_id': organizationId,
            },
            query: {
                'start': start,
                'end': end,
                'model_name': modelName,
                'pod_id': podId,
                'user_id': userId,
                'agent_id': agentId,
                'usage_kind': usageKind,
                'status': status,
                'days': days,
                'limit': limit,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
