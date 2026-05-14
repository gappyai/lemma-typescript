/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One usage limit scope.
 */
export type UsageLimitScopeResponse = {
    allowed: boolean;
    limit_usd?: (number | null);
    remaining_usd?: (number | null);
    reset_at: string;
    used_usd: number;
};

