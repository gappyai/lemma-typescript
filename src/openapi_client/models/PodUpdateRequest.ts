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
    description?: (string | null);
    icon_url?: (string | null);
    name?: (string | null);
    status?: (PodStatus | null);
    type?: (PodType | null);
};

