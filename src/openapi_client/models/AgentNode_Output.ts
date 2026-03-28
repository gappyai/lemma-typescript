/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentNodeConfig } from './AgentNodeConfig.js';
/**
 * Agent node.
 */
export type AgentNode_Output = {
    id: string;
    label?: (string | null);
    position?: (Record<string, number> | null);
    type?: string;
    config: AgentNodeConfig;
};

