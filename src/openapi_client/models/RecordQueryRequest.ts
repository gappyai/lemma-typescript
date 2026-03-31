/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecordFilter } from './RecordFilter.js';
import type { RecordSort } from './RecordSort.js';
/**
 * Structured query contract for listing table records.
 */
export type RecordQueryRequest = {
    /**
     * Structured filter conditions combined with AND semantics. Example: `[{"field": "status", "op": "eq", "value": "OPEN"}]`.
     */
    filters?: Array<RecordFilter>;
    limit?: number;
    /**
     * Opaque token from a previous response page.
     */
    page_token?: (string | null);
    /**
     * Ordered sort clauses. Example: `[{"field": "created_at", "direction": "desc"}]`.
     */
    sort?: Array<RecordSort>;
};

