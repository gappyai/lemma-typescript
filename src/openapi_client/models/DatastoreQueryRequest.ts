/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for executing read-only SQL within a datastore.
 */
export type DatastoreQueryRequest = {
    /**
     * Read-only SQL query executed inside this datastore schema. Only SELECT-style queries are allowed; mutating statements are blocked. Write queries such as INSERT, UPDATE, DELETE, ALTER, DROP, CREATE, and TRUNCATE are rejected. Example: `SELECT id, amount FROM expenses WHERE amount > 100 ORDER BY created_at DESC LIMIT 20`.
     */
    query: string;
};

