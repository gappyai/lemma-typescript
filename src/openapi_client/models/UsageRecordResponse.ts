/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response schema for a usage record.
 */
export type UsageRecordResponse = {
    agent_id?: (string | null);
    agent_run_id: string;
    conversation_id: string;
    created_at: string;
    duration_seconds: number;
    id: string;
    input_cost_usd: number;
    input_tokens: number;
    metadata: Record<string, any>;
    model_name: string;
    occurred_at: string;
    organization_id: (string | null);
    output_cost_usd: number;
    output_tokens: number;
    pod_id: (string | null);
    request_count: number;
    status?: (string | null);
    tool_call_count: number;
    total_cost_usd: number;
    total_tokens: number;
    unit_cost_usd: number;
    units: number;
    usage_kind: string;
    user_id: string;
};

