/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Response model for web search agent.
 */
export type WebSearchAgentResponse = {
    /**
     * The answer generated from the search results
     */
    answer?: (string | null);
    /**
     * Error message if the web search was not successful
     */
    error?: (string | null);
    /**
     * A message to the user about the web search results
     */
    message?: (string | null);
    /**
     * List of search results with title and URL
     */
    search_results?: (Array<Record<string, string>> | null);
    /**
     * Whether the web search was successful
     */
    success: boolean;
};

