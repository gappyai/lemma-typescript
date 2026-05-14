/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UsageRecordResponse } from './UsageRecordResponse.js';
/**
 * Response schema for list of usage records.
 */
export type UsageListResponse = {
    end_date: string;
    items: Array<UsageRecordResponse>;
    start_date: string;
    total: number;
};

