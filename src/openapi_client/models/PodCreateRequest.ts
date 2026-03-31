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
    description?: (string | null);
    icon_url?: (string | null);
    name: string;
    organization_id: string;
    status?: PodStatus;
    type?: PodType;
};

