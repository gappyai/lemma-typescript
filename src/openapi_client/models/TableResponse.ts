/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ColumnSchema } from './ColumnSchema.js';
/**
 * Schema for table response.
 */
export type TableResponse = {
    id: string;
    datastore_id: string;
    name: string;
    primary_key_column: string;
    columns: Array<ColumnSchema>;
    config: (Record<string, any> | null);
    enable_rls: boolean;
    created_at: string;
    updated_at: string;
};

