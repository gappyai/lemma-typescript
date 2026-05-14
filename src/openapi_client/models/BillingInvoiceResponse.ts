/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BillingInvoiceStatus } from './BillingInvoiceStatus.js';
import type { BillingScope } from './BillingScope.js';
/**
 * Response schema for a billing invoice.
 */
export type BillingInvoiceResponse = {
    amount_cents: number;
    billing_scope: BillingScope;
    checkout_url: (string | null);
    created_at: string;
    currency: string;
    dodo_payment_id: (string | null);
    due_at: (string | null);
    id: string;
    llm_credit_cents: number;
    llm_overage_cents: number;
    metadata: Record<string, any>;
    organization_id: (string | null);
    paid_at: (string | null);
    period_end: string;
    period_start: string;
    plan_id: string;
    seat_count: number;
    status: BillingInvoiceStatus;
    subscription_id: (string | null);
    total_cents: number;
    updated_at: string;
    user_id: (string | null);
};

