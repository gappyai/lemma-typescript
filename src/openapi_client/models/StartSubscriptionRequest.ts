/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to start a subscription.
 */
export type StartSubscriptionRequest = {
    plan_id: string;
    /**
     * URL to redirect after successful payment
     */
    success_url: string;
    /**
     * URL to redirect if payment is cancelled
     */
    cancel_url: string;
};

