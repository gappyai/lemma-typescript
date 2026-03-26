/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TriggerType } from './TriggerType.js';
/**
 * Request to create a trigger.
 */
export type CreateTriggerRequest = {
    trigger_type: TriggerType;
    pod_id?: (string | null);
    config?: Record<string, any>;
    account_id?: (string | null);
    application_trigger_id?: (string | null);
    datastore_id?: (string | null);
    filter_instruction?: (string | null);
    filter_output_schema?: (Record<string, any> | null);
};

