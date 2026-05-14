/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentModelName } from './AgentModelName.js';
export type ConversationResponse = {
    agent_id?: (string | null);
    created_at: string;
    id: string;
    instructions?: (string | null);
    metadata?: (Record<string, any> | null);
    model_name?: (AgentModelName | null);
    organization_id?: (string | null);
    parent_id?: (string | null);
    pod_id: string;
    title?: (string | null);
    updated_at: string;
    user_id: string;
};

