/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EventFlowStart = {
    /**
     * Integration trigger identifier to subscribe to.
     */
    application_trigger_id: string;
    /**
     * Integration application identifier.
     */
    application_id: string;
    trigger_config?: Record<string, any>;
    /**
     * Optional LLM filter instruction executed before flow continuation.
     */
    filter_instruction?: (string | null);
    /**
     * Optional expected schema for filter output.
     */
    filter_output_schema?: (Record<string, any> | null);
};

