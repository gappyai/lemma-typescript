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
    id: string;
    organization_id: string;
    plan_id: string;
    plan: PlanResponse;
    status: SubscriptionStatus;
    dodo_subscription_id: (string | null);
    current_period_start: (string | null);
    current_period_end: (string | null);
    seat_count: number;
    cancel_at_period_end: boolean;
    created_at: string;
    updated_at: string;
};

