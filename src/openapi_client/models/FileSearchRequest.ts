/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SearchMethod } from './SearchMethod.js';
export type FileSearchRequest = {
    limit?: number;
    /**
     * Optional folder id to scope search results to that folder subtree.
     */
    parent_id?: (string | null);
    query: string;
    search_method?: SearchMethod;
};

