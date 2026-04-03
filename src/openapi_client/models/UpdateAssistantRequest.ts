/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { TableAccessEntry } from './TableAccessEntry.js';
import type { ToolSet } from './ToolSet.js';
/**
 * Request to update an assistant.
 */
export type UpdateAssistantRequest = {
    accessible_applications?: (Array<ApplicationAccessConfig> | null);
    accessible_folders?: (Array<string> | null);
    accessible_tables?: (Array<TableAccessEntry> | null);
    agent_names?: (Array<string> | null);
    description?: (string | null);
    function_names?: (Array<string> | null);
    icon_url?: (string | null);
    instruction?: (string | null);
    tool_sets?: (Array<ToolSet> | null);
};

