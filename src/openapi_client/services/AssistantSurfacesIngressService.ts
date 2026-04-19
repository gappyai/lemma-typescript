/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class AssistantSurfacesIngressService {
    /**
     * Teams Admin Consent Callback
     * @param tenant
     * @param adminConsent
     * @param state
     * @param error
     * @param errorDescription
     * @returns any Successful Response
     * @throws ApiError
     */
    public static assistantSurfaceTeamsAdminConsentCallback(
        tenant?: (string | null),
        adminConsent?: (string | null),
        state?: (string | null),
        error?: (string | null),
        errorDescription?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/surfaces/teams/admin-consent/callback',
            query: {
                'tenant': tenant,
                'admin_consent': adminConsent,
                'state': state,
                'error': error,
                'error_description': errorDescription,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Handle per-surface webhook verification
     * @param surfaceId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static surfaceWebhookHandleSurfaceVerify(
        surfaceId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/surfaces/webhooks/surface/{surface_id}',
            path: {
                'surface_id': surfaceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Handle per-surface webhook
     * Handle webhooks directed at a specific surface.
     *
     * Per-surface webhooks (e.g. /surfaces/webhooks/surface/{uuid}) are used
     * when users provide their own bot credentials (USER_PROVIDED credential mode).
     * @param surfaceId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static surfaceWebhookHandleSurface(
        surfaceId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/surfaces/webhooks/surface/{surface_id}',
            path: {
                'surface_id': surfaceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Verify surface webhook using the platform callback URL
     * Webhook verification endpoint for platforms that require it.
     * @param platform
     * @returns any Successful Response
     * @throws ApiError
     */
    public static surfaceWebhookVerify(
        platform: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/surfaces/webhooks/{platform}',
            path: {
                'platform': platform,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Handle platform-level surface webhook
     * Handle webhooks from platform-level native integration URLs.
     *
     * Platform webhooks (e.g. /surfaces/webhooks/slack) are used when
     * Lemma's own app handles the integration (NATIVE credential mode).
     * @param platform
     * @returns any Successful Response
     * @throws ApiError
     */
    public static surfaceWebhookHandlePlatform(
        platform: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/surfaces/webhooks/{platform}',
            path: {
                'platform': platform,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
