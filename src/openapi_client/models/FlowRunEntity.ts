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
    schedule_event_id?: (string | null);
    start_payload?: Record<string, any>;
    start_type?: string;
    started_at?: (string | null);
    status?: FlowRunStatus;
    step_history?: Array<StepExecution>;
    updated_at?: string;
    user_id: string;
    /**
     * Agent conversation id when the workflow is waiting for a pod agent execution.
     */
    waiting_agent_conversation_id?: (string | null);
    /**
     * Function run id when the workflow is waiting for an async function.
     */
    waiting_function_run_id?: (string | null);
    /**
     * Scheduler wake job id when the workflow is waiting for time.
     */
    waiting_timer_id?: (string | null);
};

