/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { TableAccessEntry } from './TableAccessEntry.js';
import type { ToolSet } from './ToolSet.js';
/**
 * Request to create an assistant.
 */
export type CreateAssistantRequest = {
    accessible_applications?: Array<ApplicationAccessConfig>;
    accessible_folders?: Array<string>;
    accessible_tables?: Array<TableAccessEntry>;
    description?: (string | null);
    icon_url?: (string | null);
    instruction: string;
    name: string;
    tool_sets?: Array<ToolSet>;
};

