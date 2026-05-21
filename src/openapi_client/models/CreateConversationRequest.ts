/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentModelName } from './AgentModelName.js';
import type { ConversationType } from './ConversationType.js';
export type CreateConversationRequest = {
    agent_name?: (string | null);
    instructions?: (string | null);
    metadata?: (Record<string, any> | null);
    model_name?: (AgentModelName | null);
    parent_id?: (string | null);
    title?: (string | null);
    type?: ConversationType;
};

