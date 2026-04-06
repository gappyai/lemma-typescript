/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvailableModels } from './AvailableModels.js';
/**
 * Request to create a conversation.
 */
export type CreateConversationRequest = {
    assistant_name?: (string | null);
    model?: (AvailableModels | null);
    organization_id?: (string | null);
    pod_id?: (string | null);
    title?: (string | null);
};

