/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PodStatus } from './PodStatus.js';
import type { PodType } from './PodType.js';
/**
 * Pod creation request schema.
 */
export type PodCreateRequest = {
    organization_id: string;
    name: string;
    description?: (string | null);
    icon_url?: (string | null);
    type?: PodType;
    status?: PodStatus;
};

