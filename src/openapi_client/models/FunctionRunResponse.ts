/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FunctionRunStatus } from './FunctionRunStatus.js';
/**
 * Function run response.
 */
export type FunctionRunResponse = {
    id: string;
    function_id: string;
    user_id: string;
    input_data?: (Record<string, any> | null);
    output_data?: (Record<string, any> | null);
    status: FunctionRunStatus;
    error?: (string | null);
    logs?: (string | null);
    started_at: any;
    completed_at: any;
    created_at: any;
};

