/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BillingInvoiceResponse } from './BillingInvoiceResponse.js';
/**
 * Response with invoice payment checkout URL.
 */
export type CreateInvoicePaymentUrlResponse = {
    checkout_url: string;
    invoice: BillingInvoiceResponse;
};

