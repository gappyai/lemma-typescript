/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OperationSummary } from './OperationSummary.js';
/**
 * Schema for application details including operation catalog.
 */
export type ApplicationDetailResponseSchema = {
    auth_method: string;
    auth_provider: string;
    created_at: string;
    description: (string | null);
    icon: (string | null);
    id: string;
    is_active: boolean;
    operation_executor: string;
    operations?: Record<string, OperationSummary>;
    title?: (string | null);
    updated_at: string;
};

