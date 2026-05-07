/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationMode } from './ApplicationMode.js';
/**
 * Configuration for application access granted to a workload.
 */
export type ApplicationAccessConfig = {
    /**
     * Required for AGENT_OWNED mode - specific account to use
     */
    account_id?: (string | null);
    /**
     * Name of the application
     */
    app_name: string;
    /**
     * Application account ownership mode
     */
    mode: ApplicationMode;
};

