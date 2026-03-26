/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response schema for usage summary.
 */
export type UsageSummaryResponse = {
    organization_id?: (string | null);
    pod_id?: (string | null);
    user_id?: (string | null);
    start_date: string;
    end_date: string;
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    total_cost_usd: number;
    total_by_model: Record<string, Record<string, number>>;
    period_days: number;
};

