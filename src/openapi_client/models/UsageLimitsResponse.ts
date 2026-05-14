/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UsageLimitScopeResponse } from './UsageLimitScopeResponse.js';
/**
 * Current usage limit state for an organization/user.
 */
export type UsageLimitsResponse = {
    allowed: boolean;
    org_monthly: UsageLimitScopeResponse;
    organization_id: string;
    user_id: string;
    user_weekly: UsageLimitScopeResponse;
};

