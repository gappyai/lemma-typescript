/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationResponseSchema } from './ApplicationResponseSchema.js';
/**
 * Schema for account response.
 */
export type AccountResponseSchema = {
    id: string;
    user_id: string;
    application_id: string;
    provider_account_id?: (string | null);
    email: (string | null);
    preferences: (Record<string, any> | null);
    allowed_scopes: (Array<string> | null);
    application?: (ApplicationResponseSchema | null);
    created_at: string;
    updated_at: string;
};

