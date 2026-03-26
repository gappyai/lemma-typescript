/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ScheduledFlowStart = {
    /**
     * Cron expression controlling run schedule.
     */
    cron_expression: string;
    /**
     * IANA timezone used when evaluating `cron_expression`.
     */
    timezone?: string;
};

