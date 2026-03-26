/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TriggerResponse } from './TriggerResponse.js';
/**
 * Trigger list response.
 */
export type TriggerListResponse = {
    items: Array<TriggerResponse>;
    limit: number;
    next_page_token?: (string | null);
};

