/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FlowStart } from './FlowStart.js';
export type WorkflowCreateRequest = {
    /**
     * Workflow name.
     */
    name: string;
    /**
     * Optional workflow description.
     */
    description?: (string | null);
    /**
     * Optional public icon URL for the workflow.
     */
    icon_url?: (string | null);
    /**
     * Start configuration. If omitted, the workflow can be started manually via `workflow.start`.
     */
    start?: (FlowStart | null);
    /**
     * Require per-user workflow installation before execution.
     */
    require_user_install?: boolean;
};

