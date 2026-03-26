/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskMessageResponse } from './TaskMessageResponse.js';
/**
 * Response schema for list of task messages.
 */
export type TaskMessageListResponse = {
    items: Array<TaskMessageResponse>;
    limit: number;
    next_page_token: (string | null);
};

