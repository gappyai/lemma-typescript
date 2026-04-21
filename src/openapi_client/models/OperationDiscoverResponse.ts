/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OperationSummary } from './OperationSummary.js';
/**
 * Structured result for operation discovery within one application.
 */
export type OperationDiscoverResponse = {
    /**
     * Application identifier.
     */
    application_id: string;
    /**
     * Matching operations with compact descriptions.
     */
    items: Array<OperationSummary>;
    /**
     * Optional discovery query used to rank or filter operations.
     */
    query?: (string | null);
    /**
     * Number of operations returned in this response.
     */
    returned_count: number;
    /**
     * Total operations available for the application.
     */
    total_operations: number;
};

