/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelSubscriptionResponse } from '../models/CancelSubscriptionResponse.js';
import type { PlanListResponse } from '../models/PlanListResponse.js';
import type { SeatInfoResponse } from '../models/SeatInfoResponse.js';
import type { StartSubscriptionRequest } from '../models/StartSubscriptionRequest.js';
import type { StartSubscriptionResponse } from '../models/StartSubscriptionResponse.js';
import type { SubscriptionStatusResponse } from '../models/SubscriptionStatusResponse.js';
import type { SubscriptionWithPlanResponse } from '../models/SubscriptionWithPlanResponse.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class BillingSubscriptionsService {
    /**
     * List Plans
     * List available subscription plans.
     * @param onlyActive
     * @param limit
     * @param pageToken
     * @returns PlanListResponse Successful Response
     * @throws ApiError
     */
    public static billingPlansList(
        onlyActive: boolean = true,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<PlanListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/plans',
            query: {
                'only_active': onlyActive,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get My Subscription
     * Get the current organization's subscription.
     * @returns SubscriptionWithPlanResponse Successful Response
     * @throws ApiError
     */
    public static billingSubscriptionsMy(): CancelablePromise<SubscriptionWithPlanResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/subscriptions/my',
        });
    }
    /**
     * Get Subscription Status
     * Get simple subscription status for the organization.
     * @returns SubscriptionStatusResponse Successful Response
     * @throws ApiError
     */
    public static billingSubscriptionsStatus(): CancelablePromise<SubscriptionStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/subscriptions/status',
        });
    }
    /**
     * Start Subscription
     * Start a new subscription. Returns checkout URL.
     * @param requestBody
     * @returns StartSubscriptionResponse Successful Response
     * @throws ApiError
     */
    public static billingSubscriptionsStart(
        requestBody: StartSubscriptionRequest,
    ): CancelablePromise<StartSubscriptionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/billing/subscriptions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Subscription
     * Cancel the current subscription.
     * @returns CancelSubscriptionResponse Successful Response
     * @throws ApiError
     */
    public static billingSubscriptionsCancel(): CancelablePromise<CancelSubscriptionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/billing/subscriptions/cancel',
        });
    }
    /**
     * Get Seat Info
     * Get seat availability information.
     * @returns SeatInfoResponse Successful Response
     * @throws ApiError
     */
    public static billingSeatsInfo(): CancelablePromise<SeatInfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/seats',
        });
    }
}
