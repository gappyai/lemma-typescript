/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request model for the integration helper agent.
 */
export type IntegrationHelperAgentRequest = {
    /**
     * Application IDs the agent may use while planning the goal.
     */
    app_names: Array<string>;
    /**
     * What the caller wants to achieve with one or more integrations.
     */
    goal: string;
    /**
     * Maximum recommended operations per application in the final plan.
     */
    max_operations_per_app?: number;
};

