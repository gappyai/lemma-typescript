/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkflowRunWaitStatus } from './WorkflowRunWaitStatus.js';
import type { WorkflowRunWaitType } from './WorkflowRunWaitType.js';
/**
 * A queryable wait owned by a workflow run.
 */
export type WorkflowRunWaitEntity = {
    assigned_pod_member_id?: (string | null);
    completed_at?: (string | null);
    created_at?: string;
    external_ref?: (string | null);
    flow_id: string;
    id?: string;
    node_id: string;
    payload?: Record<string, any>;
    pod_id: string;
    run_id: string;
    status?: WorkflowRunWaitStatus;
    updated_at?: string;
    wait_type: WorkflowRunWaitType;
};

