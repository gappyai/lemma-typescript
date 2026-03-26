/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PodStatus } from './PodStatus.js';
import type { PodType } from './PodType.js';
/**
 * Pod update request schema.
 */
export type PodUpdateRequest = {
    name?: (string | null);
    description?: (string | null);
    icon_url?: (string | null);
    type?: (PodType | null);
    status?: (PodStatus | null);
};

