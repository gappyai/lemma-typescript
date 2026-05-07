/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { app__modules__function__api__schemas__function_schemas__TableAccessEntry } from './app__modules__function__api__schemas__function_schemas__TableAccessEntry.js';
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { FunctionType } from './FunctionType.js';
/**
 * Request to update a function.
 */
export type UpdateFunctionRequest = {
    accessible_applications?: (Array<ApplicationAccessConfig> | null);
    accessible_folders?: (Array<string> | null);
    accessible_tables?: (Array<app__modules__function__api__schemas__function_schemas__TableAccessEntry> | null);
    code?: (string | null);
    config?: (Record<string, any> | null);
    description?: (string | null);
    icon_url?: (string | null);
    type?: (FunctionType | null);
};

