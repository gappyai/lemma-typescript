/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FormNodeConfig } from './FormNodeConfig.js';
/**
 * Form node for user input.
 */
export type FormNode = {
    id: string;
    label?: (string | null);
    position?: (Record<string, number> | null);
    type?: string;
    config: FormNodeConfig;
};

