/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeskStatus } from './DeskStatus.js';
export type DeskResponse = {
    id: string;
    pod_id: string;
    user_id: string;
    name: string;
    description?: (string | null);
    framework: string;
    entry_path: string;
    source_archive_path?: (string | null);
    build_html_path?: (string | null);
    status: DeskStatus;
    created_at: any;
    updated_at: any;
};

