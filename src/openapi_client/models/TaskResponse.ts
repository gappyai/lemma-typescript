/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskStatus } from './TaskStatus.js';
/**
 * Response schema for task.
 */
export type TaskResponse = {
    id: string;
    pod_id: string;
    agent_id: string;
    user_id: string;
    input_data: (Record<string, any> | null);
    output_data: (Record<string, any> | null);
    status: TaskStatus;
    error: (string | null);
    created_at: string;
    updated_at: string;
};

