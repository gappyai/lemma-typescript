/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentModelName } from './AgentModelName.js';
import type { AgentToolset } from './AgentToolset.js';
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { HarnessKind } from './HarnessKind.js';
import type { TableAccessEntry } from './TableAccessEntry.js';
export type CreateAgentRequest = {
    accessible_applications?: Array<ApplicationAccessConfig>;
    accessible_folders?: Array<string>;
    accessible_tables?: Array<TableAccessEntry>;
    agent_names?: Array<string>;
    description?: (string | null);
    function_names?: Array<string>;
    harness_kind?: (HarnessKind | null);
    icon_url?: (string | null);
    input_schema?: (Record<string, any> | null);
    instruction: string;
    metadata?: (Record<string, any> | null);
    model_name?: AgentModelName;
    name: string;
    output_schema?: (Record<string, any> | null);
    toolsets?: Array<AgentToolset>;
    visibility_roles?: (Array<string> | null);
};

