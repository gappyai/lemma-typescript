/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NotificationContent } from './NotificationContent.js';
import type { TextContent } from './TextContent.js';
import type { ThinkingContent } from './ThinkingContent.js';
import type { ToolCallContent } from './ToolCallContent.js';
import type { ToolReturnContent } from './ToolReturnContent.js';
export type MessageResponse = {
    content: (NotificationContent | TextContent | ThinkingContent | ToolCallContent | ToolReturnContent);
    conversation_id: string;
    created_at: string;
    id: string;
    metadata?: (Record<string, any> | null);
    role: string;
    sequence: number;
    tool_call_id?: (string | null);
    tool_name?: (string | null);
};
