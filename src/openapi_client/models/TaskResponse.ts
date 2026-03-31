/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskStatus } from './TaskStatus.js';
/**
 * Response schema for task.
 */
export type TaskResponse = {
    agent_id: string;
    created_at: string;
    error: (string | null);
    id: string;
    input_data: (Record<string, any> | null);
    output_data: (Record<string, any> | null);
    pod_id: string;
    status: TaskStatus;
    updated_at: string;
    user_id: string;
};

