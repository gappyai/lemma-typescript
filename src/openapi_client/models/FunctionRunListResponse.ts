/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FunctionRunResponse } from './FunctionRunResponse.js';
/**
 * List of function runs.
 */
export type FunctionRunListResponse = {
    items: Array<FunctionRunResponse>;
    limit: number;
    next_page_token?: (string | null);
};

