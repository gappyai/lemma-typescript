/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FileVisibility } from './FileVisibility.js';
export type FileResponse = {
    content_hash: (string | null);
    created_at: string;
    datastore_id: string;
    description: (string | null);
    file_path: (string | null);
    graph_status?: string;
    id: string;
    kind: string;
    metadata?: (Record<string, any> | null);
    mime_type?: (string | null);
    name: string;
    owner_user_id?: (string | null);
    parent_id?: (string | null);
    permissions_inherit?: boolean;
    search_enabled?: boolean;
    size_bytes?: number;
    status: string;
    updated_at: string;
    visibility?: FileVisibility;
};

