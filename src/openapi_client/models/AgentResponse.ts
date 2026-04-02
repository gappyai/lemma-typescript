/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { TableAccessEntry } from './TableAccessEntry.js';
import type { ToolSet } from './ToolSet.js';
/**
 * Response schema for agent.
 */
export type AgentResponse = {
    accessible_applications: Array<ApplicationAccessConfig>;
    accessible_folders: Array<string>;
    accessible_tables: Array<TableAccessEntry>;
    created_at: string;
    description: (string | null);
    icon_url: (string | null);
    id: string;
    input_schema: Record<string, any>;
    instruction: string;
    name: string;
    output_schema: Record<string, any>;
    pod_id: string;
    tool_sets: Array<ToolSet>;
    updated_at: string;
    user_id: string;
};

