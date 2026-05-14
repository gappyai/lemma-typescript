/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { FunctionTableAccessEntry } from './FunctionTableAccessEntry.js';
import type { FunctionType } from './FunctionType.js';
/**
 * Request to create a function.
 *
 * Input and output schemas are derived from the submitted code and returned
 * on the function response. They are not accepted in create requests.
 */
export type CreateFunctionRequest = {
    accessible_applications?: Array<ApplicationAccessConfig>;
    accessible_folders?: Array<string>;
    accessible_tables?: Array<FunctionTableAccessEntry>;
    /**
     * Python source for the function. When provided, the platform analyzes the code and populates input_schema, output_schema, and config_schema on the returned function.
     */
    code?: (string | null);
    config?: (Record<string, any> | null);
    config_schema?: (Record<string, any> | null);
    description?: (string | null);
    icon_url?: (string | null);
    name: string;
    type?: FunctionType;
    visibility_roles?: (Array<string> | null);
};

