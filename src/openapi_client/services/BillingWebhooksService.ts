/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class BillingWebhooksService {
    /**
     * DodoPayments Webhook
     * Handle webhooks from DodoPayments.
     * @param xDodoSignature
     * @param xDodoEventType
     * @returns any Successful Response
     * @throws ApiError
     */
    public static billingWebhooksDodo(
        xDodoSignature?: (string | null),
        xDodoEventType?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/billing/webhooks/dodo',
            headers: {
                'X-Dodo-Signature': xDodoSignature,
                'X-Dodo-Event-Type': xDodoEventType,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
