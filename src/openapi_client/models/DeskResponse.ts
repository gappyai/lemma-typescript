/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeskStatus } from './DeskStatus.js';
export type DeskResponse = {
    created_at: any;
    current_release_id?: (string | null);
    description?: (string | null);
    id: string;
    name: string;
    pod_id: string;
    public_slug: string;
    source_archive_path?: (string | null);
    status: DeskStatus;
    updated_at: any;
    user_id: string;
};

