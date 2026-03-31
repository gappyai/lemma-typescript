/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeskStatus } from './DeskStatus.js';
export type DeskResponse = {
    build_html_path?: (string | null);
    created_at: any;
    description?: (string | null);
    entry_path: string;
    framework: string;
    id: string;
    name: string;
    pod_id: string;
    source_archive_path?: (string | null);
    status: DeskStatus;
    updated_at: any;
    user_id: string;
};

