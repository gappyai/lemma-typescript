/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { app__modules__function__api__schemas__function_schemas__TableAccessEntry } from './app__modules__function__api__schemas__function_schemas__TableAccessEntry.js';
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { FunctionType } from './FunctionType.js';
/**
 * Request to create a function.
 */
export type CreateFunctionRequest = {
    accessible_applications?: Array<ApplicationAccessConfig>;
    accessible_folders?: Array<string>;
    accessible_tables?: Array<app__modules__function__api__schemas__function_schemas__TableAccessEntry>;
    code?: (string | null);
    config?: (Record<string, any> | null);
    config_schema?: (Record<string, any> | null);
    description?: (string | null);
    icon_url?: (string | null);
    input_schema?: Record<string, any>;
    name: string;
    output_schema?: Record<string, any>;
    type?: FunctionType;
};

