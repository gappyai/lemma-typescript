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
    assistant_id: (string | null);
    assistant_name?: (string | null);
    created_at: any;
    external_channel_id?: (string | null);
    external_thread_id?: (string | null);
    external_user_id?: (string | null);
    id: string;
    model?: (AvailableModels | null);
    organization_id?: (string | null);
    pod_id: (string | null);
    status: ConversationStatus;
    surface_type?: (string | null);
    title: (string | null);
    updated_at: any;
    user_id: string;
};

