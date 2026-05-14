/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BillingHistoryResponse } from '../models/BillingHistoryResponse.js';
import type { BillingInvoiceResponse } from '../models/BillingInvoiceResponse.js';
import type { CancelSubscriptionResponse } from '../models/CancelSubscriptionResponse.js';
import type { CreateInvoicePaymentUrlRequest } from '../models/CreateInvoicePaymentUrlRequest.js';
import type { CreateInvoicePaymentUrlResponse } from '../models/CreateInvoicePaymentUrlResponse.js';
import type { PlanListResponse } from '../models/PlanListResponse.js';
import type { SeatInfoResponse } from '../models/SeatInfoResponse.js';
import type { StartSubscriptionRequest } from '../models/StartSubscriptionRequest.js';
import type { StartSubscriptionResponse } from '../models/StartSubscriptionResponse.js';
import type { StartTeamBillingRequest } from '../models/StartTeamBillingRequest.js';
import type { SubscriptionStatusResponse } from '../models/SubscriptionStatusResponse.js';
import type { SubscriptionWithPlanResponse } from '../models/SubscriptionWithPlanResponse.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class BillingSubscriptionsService {
    /**
     * List Organization Billing History
     * List invoices for an organization.
     * @param organizationId
     * @param limit
     * @param pageToken
     * @returns BillingHistoryResponse Successful Response
     * @throws ApiError
     */
    public static billingOrganizationHistory(
        organizationId: string,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<BillingHistoryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/organizations/{organization_id}/billing-history',
            path: {
                'organization_id': organizationId,
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
     * Get Current Organization Invoice
     * Get or create the current unpaid monthly invoice.
     * @param organizationId
     * @returns BillingInvoiceResponse Successful Response
     * @throws ApiError
     */
    public static billingOrganizationInvoicesCurrent(
        organizationId: string,
    ): CancelablePromise<BillingInvoiceResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/organizations/{organization_id}/invoices/current',
            path: {
                'organization_id': organizationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Invoice Payment URL
     * Create a hosted checkout URL for an unpaid invoice.
     * @param organizationId
     * @param invoiceId
     * @param requestBody
     * @returns CreateInvoicePaymentUrlResponse Successful Response
     * @throws ApiError
     */
    public static billingOrganizationInvoicesPaymentUrl(
        organizationId: string,
        invoiceId: string,
        requestBody: CreateInvoicePaymentUrlRequest,
    ): CancelablePromise<CreateInvoicePaymentUrlResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/billing/organizations/{organization_id}/invoices/{invoice_id}/payment-url',
            path: {
                'organization_id': organizationId,
                'invoice_id': invoiceId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Seat Info
     * Get seat availability information.
     * @param organizationId
     * @returns SeatInfoResponse Successful Response
     * @throws ApiError
     */
    public static billingOrganizationSeatsInfo(
        organizationId: string,
    ): CancelablePromise<SeatInfoResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/organizations/{organization_id}/seats',
            path: {
                'organization_id': organizationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Organization Subscription
     * Get subscription for an organization.
     * @param organizationId
     * @returns SubscriptionWithPlanResponse Successful Response
     * @throws ApiError
     */
    public static billingOrganizationSubscriptionGet(
        organizationId: string,
    ): CancelablePromise<SubscriptionWithPlanResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/organizations/{organization_id}/subscription',
            path: {
                'organization_id': organizationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Organization Subscription
     * Cancel an organization's team billing subscription.
     * @param organizationId
     * @returns CancelSubscriptionResponse Successful Response
     * @throws ApiError
     */
    public static billingOrganizationSubscriptionCancel(
        organizationId: string,
    ): CancelablePromise<CancelSubscriptionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/billing/organizations/{organization_id}/subscription/cancel',
            path: {
                'organization_id': organizationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Start Organization Team Billing
     * Start monthly-invoiced team billing for an organization.
     * @param organizationId
     * @param requestBody
     * @returns SubscriptionWithPlanResponse Successful Response
     * @throws ApiError
     */
    public static billingOrganizationTeamBillingStart(
        organizationId: string,
        requestBody: StartTeamBillingRequest,
    ): CancelablePromise<SubscriptionWithPlanResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/billing/organizations/{organization_id}/team-billing',
            path: {
                'organization_id': organizationId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Personal Subscription
     * Get the current user's personal subscription.
     * @returns SubscriptionWithPlanResponse Successful Response
     * @throws ApiError
     */
    public static billingPersonalSubscriptionGet(): CancelablePromise<SubscriptionWithPlanResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/personal/subscription',
        });
    }
    /**
     * Start Personal Subscription
     * Start a new subscription.
     * @param requestBody
     * @returns StartSubscriptionResponse Successful Response
     * @throws ApiError
     */
    public static billingPersonalSubscriptionStart(
        requestBody: StartSubscriptionRequest,
    ): CancelablePromise<StartSubscriptionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/billing/personal/subscription',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cancel Personal Subscription
     * Cancel subscription.
     * @returns CancelSubscriptionResponse Successful Response
     * @throws ApiError
     */
    public static billingPersonalSubscriptionCancel(): CancelablePromise<CancelSubscriptionResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/billing/personal/subscription/cancel',
        });
    }
    /**
     * Get Personal Subscription Status
     * Get subscription status.
     * @returns SubscriptionStatusResponse Successful Response
     * @throws ApiError
     */
    public static billingPersonalSubscriptionStatus(): CancelablePromise<SubscriptionStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/personal/subscription/status',
        });
    }
    /**
     * List Plans
     * List available subscription plans.
     * @param onlyActive
     * @param audience
     * @param limit
     * @param pageToken
     * @returns PlanListResponse Successful Response
     * @throws ApiError
     */
    public static billingPlansList(
        onlyActive: boolean = true,
        audience?: (string | null),
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<PlanListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/billing/plans',
            query: {
                'only_active': onlyActive,
                'audience': audience,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
