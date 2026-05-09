/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScheduleType } from './ScheduleType.js';
/**
 * Request to create a pod schedule.
 */
export type CreateScheduleRequest = {
    account_id?: (string | null);
    agent_name?: (string | null);
    application_trigger_id?: (string | null);
    config?: Record<string, any>;
    filter_instruction?: (string | null);
    filter_output_schema?: (Record<string, any> | null);
    schedule_type: ScheduleType;
    workflow_name?: (string | null);
};

