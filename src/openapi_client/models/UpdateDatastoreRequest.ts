/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for updating a datastore.
 */
export type UpdateDatastoreRequest = {
    /**
     * Updated datastore description.
     */
    description?: (string | null);
    /**
     * Toggle datastore record change events.
     */
    events_enabled?: (boolean | null);
    /**
     * Toggle datastore file indexing and search.
     */
    search_enabled?: (boolean | null);
};

