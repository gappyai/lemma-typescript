/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BillingInterval } from './BillingInterval.js';
/**
 * Response schema for a plan.
 */
export type PlanResponse = {
    id: string;
    name: string;
    description: (string | null);
    price_cents: number;
    currency: string;
    billing_interval: BillingInterval;
    features: Record<string, any>;
    seat_limit: (number | null);
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

