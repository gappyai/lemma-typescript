/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvailableModels } from './AvailableModels.js';
/**
 * Request to create a conversation.
 */
export type CreateConversationRequest = {
    title?: (string | null);
    pod_id?: (string | null);
    assistant_id?: (string | null);
    organization_id?: (string | null);
    model?: (AvailableModels | null);
};

