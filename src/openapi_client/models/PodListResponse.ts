/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PodResponse } from './PodResponse.js';
/**
 * Pod list response.
 */
export type PodListResponse = {
    items: Array<PodResponse>;
    limit: number;
    total: number;
    next_page_token?: (string | null);
};

