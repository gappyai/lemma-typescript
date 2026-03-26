/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WebSearchAgentRequest } from '../models/WebSearchAgentRequest.js';
import type { WebSearchAgentResponse } from '../models/WebSearchAgentResponse.js';
import type { WebSearchRequest } from '../models/WebSearchRequest.js';
import type { WebSearchResponse } from '../models/WebSearchResponse.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class AgentToolsService {
    /**
     * Web Search
     * Run a raw web search and return structured results.
     * @param requestBody
     * @returns WebSearchResponse Successful Response
     * @throws ApiError
     */
    public static toolWebSearch(
        requestBody: WebSearchRequest,
    ): CancelablePromise<WebSearchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/tools/web-search',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Web Search Agent
     * Run the multi-step web search agent and return a synthesized answer.
     * @param requestBody
     * @returns WebSearchAgentResponse Successful Response
     * @throws ApiError
     */
    public static toolWebSearchAgent(
        requestBody: WebSearchAgentRequest,
    ): CancelablePromise<WebSearchAgentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/tools/web-search-agent',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
