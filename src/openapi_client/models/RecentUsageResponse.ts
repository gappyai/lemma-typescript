/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UsageRecordResponse } from './UsageRecordResponse.js';
/**
 * Response schema for recent usage.
 */
export type RecentUsageResponse = {
    days: number;
    items: Array<UsageRecordResponse>;
    total: number;
};

