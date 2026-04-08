/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FlowStart_Input } from './FlowStart_Input.js';
import type { WorkflowInstallMode } from './WorkflowInstallMode.js';
export type WorkflowCreateRequest = {
    /**
     * Optional workflow description.
     */
    description?: (string | null);
    /**
     * Optional public icon URL for the workflow.
     */
    icon_url?: (string | null);
    /**
     * Workflow installation scope for non-manual starts. `GLOBAL` means one pod-level installation, `USER` means each user installs their own.
     */
    mode?: WorkflowInstallMode;
    /**
     * Workflow name.
     */
    name: string;
    /**
     * Start configuration. If omitted, the workflow can be started manually via `workflow.start`.
     */
    start?: (FlowStart_Input | null);
};

