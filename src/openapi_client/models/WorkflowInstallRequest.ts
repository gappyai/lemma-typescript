/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WorkflowTimeInstallConfig } from './WorkflowTimeInstallConfig.js';
export type WorkflowInstallRequest = {
    /**
     * Optional integration account to bind when installing an event-driven workflow. Scheduled and datastore-event workflows usually do not need this.
     */
    account_id?: (string | null);
    /**
     * Concrete time trigger settings for scheduled workflows. Provide either a one-time `time` or a recurring `cron_expression`.
     */
    schedule?: (WorkflowTimeInstallConfig | null);
};

