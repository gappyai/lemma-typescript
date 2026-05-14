/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BillingInvoiceResponse } from './BillingInvoiceResponse.js';
/**
 * Response schema for billing invoice history.
 */
export type BillingHistoryResponse = {
    items: Array<BillingInvoiceResponse>;
    next_page_token?: (string | null);
};

