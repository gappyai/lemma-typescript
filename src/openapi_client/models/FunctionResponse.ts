/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { FunctionStatus } from './FunctionStatus.js';
/**
 * Function response.
 */
export type FunctionResponse = {
    id: string;
    pod_id: string;
    user_id: string;
    name: string;
    description?: (string | null);
    icon_url?: (string | null);
    input_schema: Record<string, any>;
    output_schema: Record<string, any>;
    config_schema?: (Record<string, any> | null);
    config?: (Record<string, any> | null);
    status: FunctionStatus;
    code_path?: (string | null);
    code?: (string | null);
    accessible_datastores: Array<string>;
    accessible_applications: Array<ApplicationAccessConfig>;
    created_at: any;
    updated_at: any;
};

