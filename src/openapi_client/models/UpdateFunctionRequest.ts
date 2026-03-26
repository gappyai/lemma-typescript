/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
/**
 * Request to update a function.
 */
export type UpdateFunctionRequest = {
    description?: (string | null);
    icon_url?: (string | null);
    config?: (Record<string, any> | null);
    code?: (string | null);
    accessible_datastores?: (Array<string> | null);
    accessible_applications?: (Array<ApplicationAccessConfig> | null);
};

