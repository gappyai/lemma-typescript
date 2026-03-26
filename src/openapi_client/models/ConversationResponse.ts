/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvailableModels } from './AvailableModels.js';
import type { ConversationStatus } from './ConversationStatus.js';
/**
 * Response for conversation.
 */
export type ConversationResponse = {
    id: string;
    pod_id: (string | null);
    organization_id?: (string | null);
    assistant_id: (string | null);
    assistant_name?: (string | null);
    user_id: string;
    title: (string | null);
    surface_type?: (string | null);
    external_thread_id?: (string | null);
    external_channel_id?: (string | null);
    external_user_id?: (string | null);
    model?: (AvailableModels | null);
    status: ConversationStatus;
    created_at: any;
    updated_at: any;
};

