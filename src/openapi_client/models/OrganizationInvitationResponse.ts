/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OrganizationInvitationStatus } from './OrganizationInvitationStatus.js';
import type { OrganizationRole } from './OrganizationRole.js';
/**
 * Organization invitation response schema.
 */
export type OrganizationInvitationResponse = {
    id: string;
    email: string;
    organization_id: string;
    role: OrganizationRole;
    status: OrganizationInvitationStatus;
    expires_at: string;
    accepted_at?: (string | null);
    revoked_at?: (string | null);
    created_at: string;
    updated_at: string;
};

