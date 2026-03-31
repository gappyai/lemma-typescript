/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
/**
 * Request to create a function.
 */
export type CreateFunctionRequest = {
    accessible_applications?: Array<ApplicationAccessConfig>;
    accessible_datastores?: Array<string>;
    code?: (string | null);
    config?: (Record<string, any> | null);
    config_schema?: (Record<string, any> | null);
    description?: (string | null);
    icon_url?: (string | null);
    input_schema?: Record<string, any>;
    name: string;
    output_schema?: Record<string, any>;
};

