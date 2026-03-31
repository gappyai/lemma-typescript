/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response schema for a usage record.
 */
export type UsageRecordResponse = {
    created_at: string;
    id: string;
    input_cost_usd: number;
    input_tokens: number;
    metadata: Record<string, any>;
    model_name: string;
    occurred_at: string;
    organization_id: string;
    output_cost_usd: number;
    output_tokens: number;
    pod_id: string;
    source_id: string;
    source_type: string;
    total_cost_usd: number;
    total_tokens: number;
    user_id: string;
};

