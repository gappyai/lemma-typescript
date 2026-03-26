/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for trigger response.
 */
export type AppTriggerResponseSchema = {
    id: string;
    application_id: (string | null);
    description: (string | null);
    config_schema: (Record<string, any> | null);
    payload_schema: (Record<string, any> | null);
    payload_example: (Record<string, any> | null);
    created_at: string;
    updated_at: string;
};

