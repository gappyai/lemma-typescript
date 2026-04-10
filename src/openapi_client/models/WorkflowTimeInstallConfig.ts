/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScheduledFlowStartType } from './ScheduledFlowStartType.js';
export type WorkflowTimeInstallConfig = {
    /**
     * Cron expression for `CRON` schedules.
     */
    cron_expression?: (string | null);
    /**
     * Concrete time trigger mode to install: `ONCE` or `CRON`.
     */
    schedule_type: ScheduledFlowStartType;
    /**
     * One-time execution timestamp for `ONCE` schedules.
     */
    time?: (string | null);
    /**
     * IANA timezone used for cron evaluation or naive one-time values.
     */
    timezone?: (string | null);
};

