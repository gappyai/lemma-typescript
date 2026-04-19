/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DatastoreOperation } from './DatastoreOperation.js';
export type DataStoreFlowStartInput = {
    /**
     * Datastore operations that should trigger this flow. Accepted values: INSERT, UPDATE, DELETE (aliases: WRITE, CREATE). Empty means all mutations for the selected table.
     */
    operations?: Array<DatastoreOperation>;
    /**
     * Table name inside the datastore to subscribe to.
     */
    table_name: string;
};

