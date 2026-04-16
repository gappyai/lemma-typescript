/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class PublicDesksService {
    /**
     * Get public desk asset by slug host
     * @param xDeskPublicSlug
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deskAssetPublicSlugGet(
        xDeskPublicSlug?: (string | null),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public/desks',
            headers: {
                'x-desk-public-slug': xDeskPublicSlug,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
