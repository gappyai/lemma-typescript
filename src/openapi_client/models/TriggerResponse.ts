/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TriggerType } from './TriggerType.js';
/**
 * Trigger response.
 */
export type TriggerResponse = {
    id: string;
    user_id: string;
    pod_id: (string | null);
    trigger_type: TriggerType;
    config: Record<string, any>;
    account_id: (string | null);
    application_trigger_id: (string | null);
    datastore_id: (string | null);
    filter_instruction: (string | null);
    filter_output_schema: (Record<string, any> | null);
    is_active: boolean;
    is_internal: boolean;
    created_at: string;
    updated_at: string;
};

