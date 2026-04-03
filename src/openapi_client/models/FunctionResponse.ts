/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
import type { FunctionStatus } from './FunctionStatus.js';
import type { FunctionType } from './FunctionType.js';
import type { TableAccessEntry } from './TableAccessEntry.js';
/**
 * Function response.
 */
export type FunctionResponse = {
    accessible_applications: Array<ApplicationAccessConfig>;
    accessible_folders: Array<string>;
    accessible_tables: Array<TableAccessEntry>;
    code?: (string | null);
    code_path?: (string | null);
    config?: (Record<string, any> | null);
    config_schema?: (Record<string, any> | null);
    created_at: any;
    description?: (string | null);
    icon_url?: (string | null);
    id: string;
    input_schema: Record<string, any>;
    name: string;
    output_schema: Record<string, any>;
    pod_id: string;
    status: FunctionStatus;
    type: FunctionType;
    updated_at: any;
    user_id: string;
};

