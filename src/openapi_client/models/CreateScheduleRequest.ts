/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScheduleType } from './ScheduleType.js';
/**
 * Request to create a pod schedule.
 */
export type CreateScheduleRequest = {
    /**
     * Connected integration account used to provision provider-backed webhook schedules.
     */
    account_id?: (string | null);
    agent_name?: (string | null);
    /**
     * Integration trigger id for agent WEBHOOK schedules. Do not provide this for workflow schedules; workflow WEBHOOK schedules derive it from the workflow start configuration.
     */
    application_trigger_id?: (string | null);
    config?: Record<string, any>;
    /**
     * Optional schedule-level LLM filter instruction. Filters belong to the schedule, not the workflow start.
     */
    filter_instruction?: (string | null);
    /**
     * Optional schema for the schedule-level filter output. Filters belong to the schedule, not the workflow start.
     */
    filter_output_schema?: (Record<string, any> | null);
    schedule_type: ScheduleType;
    visibility_roles?: (Array<string> | null);
    workflow_name?: (string | null);
};

