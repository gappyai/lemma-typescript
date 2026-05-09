/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScheduleResponse } from './ScheduleResponse.js';
/**
 * Schedule list response.
 */
export type ScheduleListResponse = {
    items: Array<ScheduleResponse>;
    limit: number;
    next_page_token?: (string | null);
};

