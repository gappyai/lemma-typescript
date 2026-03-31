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
    completed_at?: (string | null);
    created_at?: string;
    current_node_id?: (string | null);
    execution_context?: Record<string, any>;
    execution_stack?: Array<StackFrame>;
    flow_id: string;
    id?: string;
    pod_id: string;
    started_at?: (string | null);
    status?: FlowRunStatus;
    step_history?: Array<StepExecution>;
    trigger_type?: string;
    updated_at?: string;
    user_id: string;
    waiting_task_id?: (string | null);
    waiting_trigger_id?: (string | null);
};

