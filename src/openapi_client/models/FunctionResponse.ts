/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { FunctionStatus } from './FunctionStatus.js';
import type { FunctionTableAccessEntry } from './FunctionTableAccessEntry.js';
import type { FunctionType } from './FunctionType.js';
/**
 * Function response.
 */
export type FunctionResponse = {
    accessible_applications: Array<ApplicationAccessConfig>;
    accessible_folders: Array<string>;
    accessible_tables: Array<FunctionTableAccessEntry>;
    code?: (string | null);
    code_path?: (string | null);
    config?: (Record<string, any> | null);
    /**
     * Optional configuration schema derived from the function code.
     */
    config_schema?: (Record<string, any> | null);
    created_at: any;
    description?: (string | null);
    icon_url?: (string | null);
    id: string;
    /**
     * Input JSON schema derived from the function code.
     */
    input_schema: Record<string, any>;
    name: string;
    /**
     * Output JSON schema derived from the function code.
     */
    output_schema: Record<string, any>;
    pod_id: string;
    status: FunctionStatus;
    type: FunctionType;
    updated_at: any;
    user_id: string;
    visibility?: string;
    visibility_roles?: Array<string>;
};

