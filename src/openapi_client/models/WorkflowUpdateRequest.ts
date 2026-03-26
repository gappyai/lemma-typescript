/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FlowStart } from './FlowStart.js';
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
     * Updated install requirement flag.
     */
    require_user_install?: (boolean | null);
    /**
     * Updated start trigger configuration.
     */
    start?: (FlowStart | null);
};

