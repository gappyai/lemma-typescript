/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountCredentialsResponseSchema } from '../models/AccountCredentialsResponseSchema.js';
import type { AccountListResponseSchema } from '../models/AccountListResponseSchema.js';
import type { AccountResponseSchema } from '../models/AccountResponseSchema.js';
import type { ConnectRequestInitiateSchema } from '../models/ConnectRequestInitiateSchema.js';
import type { ConnectRequestResponseSchema } from '../models/ConnectRequestResponseSchema.js';
import type { MessageResponseSchema } from '../models/MessageResponseSchema.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class IntegrationsService {
    /**
     * List Accounts
     * Get all connected accounts for the current user. Optionally filter by application_id or application_name
     * @param applicationId
     * @param limit
     * @param pageToken
     * @returns AccountListResponseSchema Successful Response
     * @throws ApiError
     */
    public static integrationAccountList(
        applicationId?: (string | null),
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<AccountListResponseSchema> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations/accounts',
            query: {
                'application_id': applicationId,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Account
     * Delete a connected account and revoke the connection
     * @param accountId
     * @returns MessageResponseSchema Successful Response
     * @throws ApiError
     */
    public static integrationAccountDelete(
        accountId: string,
    ): CancelablePromise<MessageResponseSchema> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/integrations/accounts/{account_id}',
            path: {
                'account_id': accountId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Account
     * Get a specific account by ID
     * @param accountId
     * @returns AccountResponseSchema Successful Response
     * @throws ApiError
     */
    public static integrationAccountGet(
        accountId: string,
    ): CancelablePromise<AccountResponseSchema> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations/accounts/{account_id}',
            path: {
                'account_id': accountId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Credentials
     * Get the credentials for a specific account
     * @param accountId
     * @returns AccountCredentialsResponseSchema Successful Response
     * @throws ApiError
     */
    public static integrationAccountCredentialsGet(
        accountId: string,
    ): CancelablePromise<AccountCredentialsResponseSchema> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations/accounts/{account_id}/credentials',
            path: {
                'account_id': accountId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Initiate Connect Request
     * Initiate an OAuth connection request for an application
     * @param requestBody
     * @returns ConnectRequestResponseSchema Successful Response
     * @throws ApiError
     */
    public static integrationConnectRequestCreate(
        requestBody: ConnectRequestInitiateSchema,
    ): CancelablePromise<ConnectRequestResponseSchema> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/integrations/connect-requests',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * OAuth Callback
     * Handle OAuth callback and complete account connection. This endpoint is public and uses state parameter for security.
     * @param error
     * @returns AccountResponseSchema Successful Response
     * @throws ApiError
     */
    public static integrationOauthCallback(
        error?: (string | null),
    ): CancelablePromise<AccountResponseSchema> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/integrations/connect-requests/oauth/callback',
            query: {
                'error': error,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
