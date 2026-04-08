/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FlowStart_Input } from './FlowStart_Input.js';
import type { WorkflowInstallMode } from './WorkflowInstallMode.js';
export type WorkflowUpdateRequest = {
    /**
     * Updated workflow description.
     */
    description?: (string | null);
    /**
     * Updated public icon URL for the workflow.
     */
    icon_url?: (string | null);
    /**
     * Updated workflow installation scope.
     */
    mode?: (WorkflowInstallMode | null);
    /**
     * Updated start trigger configuration.
     */
    start?: (FlowStart_Input | null);
};

