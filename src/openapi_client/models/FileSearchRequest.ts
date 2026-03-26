/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SearchMethod } from './SearchMethod.js';
export type FileSearchRequest = {
    query: string;
    limit?: number;
    search_method?: SearchMethod;
    /**
     * Optional folder id to scope search results to that folder subtree.
     */
    parent_id?: (string | null);
};

