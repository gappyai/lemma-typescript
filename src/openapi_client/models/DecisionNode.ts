/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DecisionNodeConfig } from './DecisionNodeConfig.js';
/**
 * Decision node.
 */
export type DecisionNode = {
    id: string;
    label?: (string | null);
    position?: (Record<string, number> | null);
    type?: string;
    config: DecisionNodeConfig;
};

