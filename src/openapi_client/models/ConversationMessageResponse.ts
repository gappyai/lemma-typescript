/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NotificationContent } from './NotificationContent.js';
import type { TextContent } from './TextContent.js';
import type { ThinkingContent } from './ThinkingContent.js';
import type { ToolCallRequest } from './ToolCallRequest.js';
import type { ToolCallResponse } from './ToolCallResponse.js';
/**
 * Saved conversation message.
 */
export type ConversationMessageResponse = {
    content: (NotificationContent | TextContent | ThinkingContent | ToolCallRequest | ToolCallResponse);
    created_at: string;
    id: string;
    metadata?: (Record<string, any> | null);
    role: string;
};

