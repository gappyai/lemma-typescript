/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentModelName } from './AgentModelName.js';
import type { AgentToolset } from './AgentToolset.js';
import type { app__modules__agent__domain__value_objects__TableAccessEntry } from './app__modules__agent__domain__value_objects__TableAccessEntry.js';
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { HarnessKind } from './HarnessKind.js';
export type AgentResponse = {
    accessible_applications?: Array<ApplicationAccessConfig>;
    accessible_folders?: Array<string>;
    accessible_tables?: Array<app__modules__agent__domain__value_objects__TableAccessEntry>;
    agent_names?: Array<string>;
    created_at: string;
    description?: (string | null);
    function_names?: Array<string>;
    harness_kind: HarnessKind;
    icon_url?: (string | null);
    id: string;
    input_schema?: (Record<string, any> | null);
    instruction: string;
    metadata?: (Record<string, any> | null);
    model_name: AgentModelName;
    name: string;
    output_schema?: (Record<string, any> | null);
    pod_id: string;
    toolsets?: Array<AgentToolset>;
    updated_at: string;
    user_id: string;
    visibility?: string;
};

