/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { ToolSet } from './ToolSet.js';
/**
 * Request schema for updating an agent.
 */
export type UpdateAgentRequest = {
    description?: (string | null);
    icon_url?: (string | null);
    instruction?: (string | null);
    input_schema?: (Record<string, any> | null);
    output_schema?: (Record<string, any> | null);
    tool_sets?: (Array<ToolSet> | null);
    accessible_datastores?: (Array<string> | null);
    accessible_applications?: (Array<ApplicationAccessConfig> | null);
};

