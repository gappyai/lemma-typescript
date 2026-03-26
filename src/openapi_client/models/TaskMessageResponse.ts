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
 * Response schema for task message.
 */
export type TaskMessageResponse = {
    id: string;
    role: string;
    content: (NotificationContent | TextContent | ThinkingContent | ToolCallRequest | ToolCallResponse);
    created_at: string;
    metadata?: (Record<string, any> | null);
};

