/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SubscriptionStatus } from './SubscriptionStatus.js';
/**
 * Response for subscription cancellation.
 */
export type CancelSubscriptionResponse = {
    subscription_id: string;
    status: SubscriptionStatus;
    message: string;
    effective_date: (string | null);
};

