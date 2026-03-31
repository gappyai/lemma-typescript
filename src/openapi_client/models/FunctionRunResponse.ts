/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FunctionRunStatus } from './FunctionRunStatus.js';
/**
 * Function run response.
 */
export type FunctionRunResponse = {
    completed_at: any;
    created_at: any;
    error?: (string | null);
    function_id: string;
    id: string;
    input_data?: (Record<string, any> | null);
    logs?: (string | null);
    output_data?: (Record<string, any> | null);
    started_at: any;
    status: FunctionRunStatus;
    user_id: string;
};

