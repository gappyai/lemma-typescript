/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FileResponse = {
    id: string;
    datastore_id: string;
    parent_id?: (string | null);
    kind: string;
    name: string;
    description: (string | null);
    file_path: (string | null);
    content_hash: (string | null);
    mime_type?: (string | null);
    size_bytes?: number;
    search_enabled?: boolean;
    status: string;
    metadata?: (Record<string, any> | null);
    graph_status?: string;
    created_at: string;
    updated_at: string;
};

