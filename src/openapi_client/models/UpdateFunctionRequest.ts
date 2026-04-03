/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { FunctionType } from './FunctionType.js';
import type { TableAccessEntry } from './TableAccessEntry.js';
/**
 * Request to update a function.
 */
export type UpdateFunctionRequest = {
    accessible_applications?: (Array<ApplicationAccessConfig> | null);
    accessible_folders?: (Array<string> | null);
    accessible_tables?: (Array<TableAccessEntry> | null);
    code?: (string | null);
    config?: (Record<string, any> | null);
    description?: (string | null);
    icon_url?: (string | null);
    type?: (FunctionType | null);
};

