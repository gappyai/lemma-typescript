/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScheduleType } from './ScheduleType.js';
/**
 * Schedule response.
 */
export type ScheduleResponse = {
    account_id: (string | null);
    agent_id: (string | null);
    agent_name?: (string | null);
    application_trigger_id: (string | null);
    config: Record<string, any>;
    created_at: string;
    filter_instruction: (string | null);
    filter_output_schema: (Record<string, any> | null);
    id: string;
    is_active: boolean;
    is_internal: boolean;
    pod_id: (string | null);
    schedule_type: ScheduleType;
    updated_at: string;
    user_id: string;
    visibility: string;
    visibility_roles?: Array<string>;
    workflow_id: (string | null);
    workflow_name?: (string | null);
};

