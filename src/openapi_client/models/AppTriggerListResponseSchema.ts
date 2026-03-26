/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AppTriggerResponseSchema } from './AppTriggerResponseSchema.js';
/**
 * Schema for trigger list response.
 */
export type AppTriggerListResponseSchema = {
    items: Array<AppTriggerResponseSchema>;
    limit: number;
    next_page_token?: (string | null);
};

