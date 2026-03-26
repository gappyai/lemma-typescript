/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for datastore response.
 */
export type DatastoreResponse = {
    id: string;
    pod_id: string;
    name: string;
    description: (string | null);
    events_enabled: boolean;
    search_enabled: boolean;
    graph_rag_enabled: boolean;
    graph_instruction: (string | null);
    created_at: string;
    updated_at: string;
};

