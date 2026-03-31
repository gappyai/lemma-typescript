/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FlowRunStatus } from './FlowRunStatus.js';
/**
 * Record of a single node execution.
 */
export type StepExecution = {
    completed_at?: (string | null);
    error?: (string | null);
    input_data?: (Record<string, any> | null);
    node_id: string;
    output_data?: null;
    started_at: string;
    status: FlowRunStatus;
};

