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
    name: string;
    description?: (string | null);
    icon_url?: (string | null);
    instruction: string;
    input_schema?: (Record<string, any> | null);
    output_schema?: (Record<string, any> | null);
    tool_sets?: Array<ToolSet>;
    accessible_datastores?: Array<string>;
    accessible_applications?: Array<ApplicationAccessConfig>;
};

