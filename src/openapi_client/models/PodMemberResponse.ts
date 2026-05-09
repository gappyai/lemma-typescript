/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PodRole } from './PodRole.js';
/**
 * Pod member response schema.
 */
export type PodMemberResponse = {
    created_at: string;
    email: string;
    pod_member_id: string;
    role: PodRole;
    updated_at: string;
    user_email: string;
    user_id: string;
    user_name?: (string | null);
};

