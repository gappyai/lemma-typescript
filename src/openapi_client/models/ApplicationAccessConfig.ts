/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationMode } from './ApplicationMode.js';
/**
 * Configuration for application access.
 *
 * Defines how an agent or function can access a specific application.
 */
export type ApplicationAccessConfig = {
    /**
     * Required for FIXED mode - specific account to use
     */
    account_id?: (string | null);
    /**
     * Name of the application
     */
    app_name: string;
    /**
     * Access mode - FIXED or DYNAMIC
     */
    mode: ApplicationMode;
};

