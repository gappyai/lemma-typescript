/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FunctionResponse } from './FunctionResponse.js';
/**
 * List of functions.
 */
export type FunctionListResponse = {
    items: Array<FunctionResponse>;
    limit: number;
    next_page_token?: (string | null);
};

