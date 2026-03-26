/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FlowRunStatus } from './FlowRunStatus.js';
import type { StackFrame } from './StackFrame.js';
import type { StepExecution } from './StepExecution.js';
/**
 * FlowRun Aggregate representing an execution of a Flow.
 */
export type FlowRunEntity = {
    id?: string;
    created_at?: string;
    updated_at?: string;
    flow_id: string;
    pod_id: string;
    user_id: string;
    trigger_type?: string;
    status?: FlowRunStatus;
    current_node_id?: (string | null);
    waiting_task_id?: (string | null);
    waiting_trigger_id?: (string | null);
    execution_stack?: Array<StackFrame>;
    execution_context?: Record<string, any>;
    step_history?: Array<StepExecution>;
    started_at?: (string | null);
    completed_at?: (string | null);
};

