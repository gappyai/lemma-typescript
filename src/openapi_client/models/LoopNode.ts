/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoopNodeConfig } from './LoopNodeConfig.js';
/**
 * Loop node.
 */
export type LoopNode = {
    id: string;
    label?: (string | null);
    position?: (Record<string, number> | null);
    type?: string;
    config: LoopNodeConfig;
};

