/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrganizationRole } from './OrganizationRole.js';
import type { UserResponse } from './UserResponse.js';
/**
 * Organization member response schema.
 */
export type OrganizationMemberResponse = {
    id: string;
    user_id: string;
    organization_id: string;
    role: OrganizationRole;
    user?: (UserResponse | null);
    created_at: string;
    updated_at: string;
};

