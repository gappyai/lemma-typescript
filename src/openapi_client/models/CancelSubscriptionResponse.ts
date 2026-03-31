/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SubscriptionStatus } from './SubscriptionStatus.js';
/**
 * Response for subscription cancellation.
 */
export type CancelSubscriptionResponse = {
    effective_date: (string | null);
    message: string;
    status: SubscriptionStatus;
    subscription_id: string;
};

