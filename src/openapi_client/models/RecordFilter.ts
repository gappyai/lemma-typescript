/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecordFilterOperator } from './RecordFilterOperator.js';
export type RecordFilter = {
    /**
     * Table column name to filter on.
     */
    field: string;
    /**
     * Comparison operator to apply.
     */
    op?: RecordFilterOperator;
    /**
     * Filter comparison value.
     */
    value: any;
};

