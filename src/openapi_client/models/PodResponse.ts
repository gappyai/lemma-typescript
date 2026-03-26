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
    id: string;
    user_id: string;
    organization_id: string;
    name: string;
    slug: string;
    description?: (string | null);
    icon_url?: (string | null);
    type: PodType;
    status: PodStatus;
    created_at: string;
    updated_at: string;
};

