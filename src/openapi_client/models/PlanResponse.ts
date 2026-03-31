/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BillingInterval } from './BillingInterval.js';
/**
 * Response schema for a plan.
 */
export type PlanResponse = {
    billing_interval: BillingInterval;
    created_at: string;
    currency: string;
    description: (string | null);
    features: Record<string, any>;
    id: string;
    is_active: boolean;
    name: string;
    price_cents: number;
    seat_limit: (number | null);
    updated_at: string;
};

