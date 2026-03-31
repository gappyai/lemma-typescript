/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PodStatus } from './PodStatus.js';
import type { PodType } from './PodType.js';
/**
 * Pod response schema.
 */
export type PodResponse = {
    created_at: string;
    description?: (string | null);
    icon_url?: (string | null);
    id: string;
    name: string;
    organization_id: string;
    slug: string;
    status: PodStatus;
    type: PodType;
    updated_at: string;
    user_id: string;
};

