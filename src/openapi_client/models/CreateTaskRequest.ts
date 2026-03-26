/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request schema for creating a task.
 */
export type CreateTaskRequest = {
    /**
     * Agent name to execute. Agent names are immutable pod resource identifiers.
     */
    agent_name: string;
    input_data?: (Record<string, any> | null);
};

