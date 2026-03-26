/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response schema for a usage record.
 */
export type UsageRecordResponse = {
    id: string;
    organization_id: string;
    pod_id: string;
    user_id: string;
    model_name: string;
    source_type: string;
    source_id: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    input_cost_usd: number;
    output_cost_usd: number;
    total_cost_usd: number;
    metadata: Record<string, any>;
    occurred_at: string;
    created_at: string;
};

