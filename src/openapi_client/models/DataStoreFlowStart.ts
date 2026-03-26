/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DataStoreFlowStart = {
    /**
     * Datastore name to watch for change events. Defaults to the pod's default datastore.
     */
    datastore_name?: string;
    /**
     * Table name inside the datastore to subscribe to.
     */
    table_name: string;
    /**
     * Datastore operations that should trigger this flow (for example: INSERT, UPDATE, DELETE).
     */
    operations: Array<string>;
};

