/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response schema for usage summary.
 */
export type UsageSummaryResponse = {
    end_date: string;
    organization_id?: (string | null);
    period_days: number;
    pod_id?: (string | null);
    start_date: string;
    total_by_model: Record<string, Record<string, number>>;
    total_cost_usd: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    user_id?: (string | null);
};

