/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
/**
 * Request to create a function.
 */
export type CreateFunctionRequest = {
    name: string;
    description?: (string | null);
    icon_url?: (string | null);
    input_schema?: Record<string, any>;
    output_schema?: Record<string, any>;
    config_schema?: (Record<string, any> | null);
    config?: (Record<string, any> | null);
    code?: (string | null);
    accessible_datastores?: Array<string>;
    accessible_applications?: Array<ApplicationAccessConfig>;
};

