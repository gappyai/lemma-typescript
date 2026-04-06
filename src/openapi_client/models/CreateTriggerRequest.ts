/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TriggerType } from './TriggerType.js';
/**
 * Request to create a trigger.
 */
export type CreateTriggerRequest = {
    account_id?: (string | null);
    application_trigger_id?: (string | null);
    config?: Record<string, any>;
    filter_instruction?: (string | null);
    filter_output_schema?: (Record<string, any> | null);
    pod_id?: (string | null);
    trigger_type: TriggerType;
};

