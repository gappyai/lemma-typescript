/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PodRole } from './PodRole.js';
/**
 * Pod member response schema.
 */
export type PodMemberResponse = {
    id: string;
    pod_id: string;
    organization_member_id: string;
    role: PodRole;
    created_at: string;
    updated_at: string;
};

