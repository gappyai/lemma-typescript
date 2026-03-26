/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationResponseSchema } from './ApplicationResponseSchema.js';
/**
 * Schema for application list response.
 */
export type ApplicationListResponseSchema = {
    items: Array<ApplicationResponseSchema>;
    limit: number;
    next_page_token?: (string | null);
};

