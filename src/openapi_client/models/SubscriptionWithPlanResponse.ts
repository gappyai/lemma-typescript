/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PlanResponse } from './PlanResponse.js';
import type { SubscriptionStatus } from './SubscriptionStatus.js';
/**
 * Subscription response with plan details.
 */
export type SubscriptionWithPlanResponse = {
    cancel_at_period_end: boolean;
    created_at: string;
    current_period_end: (string | null);
    current_period_start: (string | null);
    dodo_subscription_id: (string | null);
    id: string;
    organization_id: string;
    plan: PlanResponse;
    plan_id: string;
    seat_count: number;
    status: SubscriptionStatus;
    updated_at: string;
};

