/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FlowStart } from './FlowStart.js';
/**
 * Represents an installed flow instance.
 * Associate a Flow definition with a specific Trigger (Schedule or Event).
 */
export type FlowInstallEntity = {
    id?: string;
    created_at?: string;
    updated_at?: string;
    flow_id: string;
    user_id: string;
    pod_id: string;
    flow_start: FlowStart;
    trigger_id?: (string | null);
    is_active?: boolean;
};

