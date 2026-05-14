/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { FunctionTableAccessEntry } from './FunctionTableAccessEntry.js';
import type { FunctionType } from './FunctionType.js';
/**
 * Request to update a function.
 */
export type UpdateFunctionRequest = {
    accessible_applications?: (Array<ApplicationAccessConfig> | null);
    accessible_folders?: (Array<string> | null);
    accessible_tables?: (Array<FunctionTableAccessEntry> | null);
    /**
     * Updated Python source for the function. When provided, the platform re-analyzes the code and refreshes input_schema, output_schema, and config_schema on the returned function.
     */
    code?: (string | null);
    config?: (Record<string, any> | null);
    description?: (string | null);
    icon_url?: (string | null);
    type?: (FunctionType | null);
    visibility_roles?: (Array<string> | null);
};

