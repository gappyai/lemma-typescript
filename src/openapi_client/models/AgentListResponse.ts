/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentResponse } from './AgentResponse.js';
/**
 * Response schema for list of agents.
 */
export type AgentListResponse = {
    items: Array<AgentResponse>;
    next_page_token: (string | null);
};

