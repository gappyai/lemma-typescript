/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One usage statistics bucket.
 */
export type UsageStatsBucketResponse = {
    bucket: string;
    group?: (string | null);
    input_tokens: number;
    output_tokens: number;
    total_cost_usd: number;
    total_tokens: number;
    units: number;
};

