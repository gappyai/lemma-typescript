/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataStoreWorkflowStartOutput } from './DataStoreWorkflowStartOutput.js';
import type { EventWorkflowStartOutput } from './EventWorkflowStartOutput.js';
import type { ManualWorkflowStartOutput } from './ManualWorkflowStartOutput.js';
import type { ScheduledWorkflowStartOutput } from './ScheduledWorkflowStartOutput.js';
export type FlowInstallResponse = {
    created_at: string;
    flow_id: string;
    flow_start: (ManualWorkflowStartOutput | ScheduledWorkflowStartOutput | EventWorkflowStartOutput | DataStoreWorkflowStartOutput);
    id: string;
    is_active?: boolean;
    pod_id: string;
    trigger_id?: (string | null);
    updated_at: string;
    user_id: string;
};

