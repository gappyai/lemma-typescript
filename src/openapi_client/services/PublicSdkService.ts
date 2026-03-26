/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class PublicSdkService {
    /**
     * Get browser-ready Lemma pod client bundle
     * @returns any Successful Response
     * @throws ApiError
     */
    public static publicSdkPodClientGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/sdk/pod-client.js',
        });
    }
    /**
     * Get public desk HTML preview
     * @param podId
     * @param deskName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static podDeskHtmlPublicGet(
        podId: string,
        deskName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/desks/{pod_id}/{desk_name}/html',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
