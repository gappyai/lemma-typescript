/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PodRole } from './PodRole.js';
import type { UserResponse } from './UserResponse.js';
/**
 * Pod member detail response schema.
 */
export type PodMemberDetailResponse = {
    created_at: string;
    role: PodRole;
    updated_at: string;
    user?: (UserResponse | null);
    user_email: string;
    user_id: string;
    user_name?: (string | null);
};

