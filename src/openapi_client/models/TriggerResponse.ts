/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TriggerType } from './TriggerType.js';
/**
 * Trigger response.
 */
export type TriggerResponse = {
    account_id: (string | null);
    application_trigger_id: (string | null);
    config: Record<string, any>;
    created_at: string;
    datastore_id: (string | null);
    filter_instruction: (string | null);
    filter_output_schema: (Record<string, any> | null);
    id: string;
    is_active: boolean;
    is_internal: boolean;
    pod_id: (string | null);
    trigger_type: TriggerType;
    updated_at: string;
    user_id: string;
};

