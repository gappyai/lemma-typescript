/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { TableAccessEntry } from './TableAccessEntry.js';
import type { ToolSet } from './ToolSet.js';
/**
 * Response for assistant.
 */
export type AssistantResponse = {
    accessible_applications: Array<ApplicationAccessConfig>;
    accessible_folders: Array<string>;
    accessible_tables: Array<TableAccessEntry>;
    created_at: any;
    description: (string | null);
    icon_url: (string | null);
    id: string;
    instruction: string;
    name: string;
    pod_id: string;
    tool_sets: Array<ToolSet>;
    updated_at: any;
    user_id: string;
};

