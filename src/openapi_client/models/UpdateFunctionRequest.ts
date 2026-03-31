/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationAccessConfig } from './ApplicationAccessConfig.js';
/**
 * Request to update a function.
 */
export type UpdateFunctionRequest = {
    accessible_applications?: (Array<ApplicationAccessConfig> | null);
    accessible_datastores?: (Array<string> | null);
    code?: (string | null);
    config?: (Record<string, any> | null);
    description?: (string | null);
    icon_url?: (string | null);
};

