/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FlowStart_Output } from './FlowStart_Output.js';
/**
 * Represents an installed flow instance.
 * Associate a Flow definition with a specific Trigger (Schedule or Event).
 */
export type FlowInstallEntity = {
    created_at?: string;
    flow_id: string;
    flow_start: FlowStart_Output;
    id?: string;
    is_active?: boolean;
    pod_id: string;
    trigger_id?: (string | null);
    updated_at?: string;
    user_id: string;
};

