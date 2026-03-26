/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OperationSummary } from './OperationSummary.js';
/**
 * Schema for application details including operation catalog.
 */
export type ApplicationDetailResponseSchema = {
    id: string;
    title?: (string | null);
    description: (string | null);
    auth_method: string;
    auth_provider: string;
    operation_executor: string;
    icon: (string | null);
    is_active: boolean;
    created_at: string;
    updated_at: string;
    operations?: Record<string, OperationSummary>;
};

