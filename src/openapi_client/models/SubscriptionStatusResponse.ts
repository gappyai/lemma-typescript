/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SubscriptionStatus } from './SubscriptionStatus.js';
/**
 * Simple subscription status response.
 */
export type SubscriptionStatusResponse = {
    has_subscription: boolean;
    status: (SubscriptionStatus | null);
    is_active: boolean;
    plan_name: (string | null);
};

