/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationResponseSchema } from './ApplicationResponseSchema.js';
/**
 * Schema for account response.
 */
export type AccountResponseSchema = {
    allowed_scopes: (Array<string> | null);
    application?: (ApplicationResponseSchema | null);
    application_id: string;
    created_at: string;
    email: (string | null);
    id: string;
    preferences: (Record<string, any> | null);
    provider_account_id?: (string | null);
    updated_at: string;
    user_id: string;
};

