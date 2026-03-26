/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { ToolSet } from './ToolSet.js';
/**
 * Response schema for agent.
 */
export type AgentResponse = {
    id: string;
    pod_id: string;
    user_id: string;
    name: string;
    description: (string | null);
    icon_url: (string | null);
    instruction: string;
    input_schema: Record<string, any>;
    output_schema: Record<string, any>;
    tool_sets: Array<ToolSet>;
    accessible_datastores: Array<string>;
    accessible_applications: Array<ApplicationAccessConfig>;
    created_at: string;
    updated_at: string;
};

