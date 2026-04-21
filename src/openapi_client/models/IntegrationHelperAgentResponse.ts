/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response model for the integration helper agent.
 */
export type IntegrationHelperAgentResponse = {
    /**
     * Detailed markdown guidance for accomplishing the requested goal.
     */
    answer_markdown?: (string | null);
    /**
     * Error message when the helper agent fails.
     */
    error?: (string | null);
    /**
     * Human-readable status message.
     */
    message?: (string | null);
    /**
     * Recommended operation names grouped by application.
     */
    operations_by_app?: Record<string, Array<string>>;
    /**
     * Whether the helper agent completed successfully.
     */
    success: boolean;
};

