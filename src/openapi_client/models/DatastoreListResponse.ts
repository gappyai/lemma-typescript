/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DatastoreResponse } from './DatastoreResponse.js';
/**
 * Schema for datastore list response.
 */
export type DatastoreListResponse = {
    items: Array<DatastoreResponse>;
    limit: number;
    next_page_token?: (string | null);
};

