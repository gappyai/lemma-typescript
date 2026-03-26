/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for creating a new datastore.
 */
export type CreateDatastoreRequest = {
    /**
     * Datastore name. Use a stable resource name because it becomes part of API paths.
     */
    name: string;
    /**
     * Human-readable datastore description.
     */
    description?: (string | null);
    /**
     * Emit datastore record change events for trigger/workflow integrations.
     */
    events_enabled?: boolean;
    /**
     * Enable file indexing and search inside this datastore.
     */
    search_enabled?: boolean;
};

