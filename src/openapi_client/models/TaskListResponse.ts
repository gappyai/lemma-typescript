/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskResponse } from './TaskResponse.js';
/**
 * Response schema for list of tasks.
 */
export type TaskListResponse = {
    items: Array<TaskResponse>;
    limit: number;
    next_page_token: (string | null);
};

