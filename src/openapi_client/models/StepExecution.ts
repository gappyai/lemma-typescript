/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FlowRunStatus } from './FlowRunStatus.js';
/**
 * Record of a single node execution.
 */
export type StepExecution = {
    node_id: string;
    status: FlowRunStatus;
    started_at: string;
    completed_at?: (string | null);
    input_data?: (Record<string, any> | null);
    output_data?: null;
    error?: (string | null);
};

