/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentModelName } from './AgentModelName.js';
import type { AgentToolset } from './AgentToolset.js';
import type { app__modules__agent__domain__value_objects__TableAccessEntry } from './app__modules__agent__domain__value_objects__TableAccessEntry.js';
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { HarnessKind } from './HarnessKind.js';
export type UpdateAgentRequest = {
    accessible_applications?: (Array<ApplicationAccessConfig> | null);
    accessible_folders?: (Array<string> | null);
    accessible_tables?: (Array<app__modules__agent__domain__value_objects__TableAccessEntry> | null);
    agent_names?: (Array<string> | null);
    description?: (string | null);
    function_names?: (Array<string> | null);
    harness_kind?: (HarnessKind | null);
    icon_url?: (string | null);
    input_schema?: (Record<string, any> | null);
    instruction?: (string | null);
    metadata?: (Record<string, any> | null);
    model_name?: (AgentModelName | null);
    output_schema?: (Record<string, any> | null);
    toolsets?: (Array<AgentToolset> | null);
};

