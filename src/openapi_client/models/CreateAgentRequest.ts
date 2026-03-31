/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { ToolSet } from './ToolSet.js';
/**
 * Request schema for creating an agent.
 */
export type CreateAgentRequest = {
    accessible_applications?: Array<ApplicationAccessConfig>;
    accessible_datastores?: Array<string>;
    description?: (string | null);
    icon_url?: (string | null);
    input_schema?: (Record<string, any> | null);
    instruction: string;
    name: string;
    output_schema?: (Record<string, any> | null);
    tool_sets?: Array<ToolSet>;
};

