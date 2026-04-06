/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DatastoreQueryRequest } from '../models/DatastoreQueryRequest.js';
import type { DatastoreQueryResponse } from '../models/DatastoreQueryResponse.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class QueryService {
    /**
     * Execute Query
     * Execute a read-only SQL query inside the datastore schema. Joins, aggregates, subqueries, and cross-table reads are allowed as long as the statement is read only.
     * @param podId
     * @param requestBody
     * @returns DatastoreQueryResponse Successful Response
     * @throws ApiError
     */
    public static queryExecute(
        podId: string,
        requestBody: DatastoreQueryRequest,
    ): CancelablePromise<DatastoreQueryResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastore/query',
            path: {
                'pod_id': podId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
