/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ColumnSchema } from './ColumnSchema.js';
/**
 * Schema for table response.
 */
export type TableResponse = {
    columns: Array<ColumnSchema>;
    config: (Record<string, any> | null);
    created_at: string;
    datastore_id: string;
    enable_rls: boolean;
    id: string;
    name: string;
    primary_key_column: string;
    updated_at: string;
};

