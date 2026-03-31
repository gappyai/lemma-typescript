/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateDatastoreRequest } from '../models/CreateDatastoreRequest.js';
import type { DatastoreListResponse } from '../models/DatastoreListResponse.js';
import type { DatastoreMessageResponse } from '../models/DatastoreMessageResponse.js';
import type { DatastoreQueryRequest } from '../models/DatastoreQueryRequest.js';
import type { DatastoreResponse } from '../models/DatastoreResponse.js';
import type { RecordQueryResponse } from '../models/RecordQueryResponse.js';
import type { UpdateDatastoreRequest } from '../models/UpdateDatastoreRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class DatastoreService {
    /**
     * List Datastores
     * List datastores available in the pod.
     * @param podId
     * @param limit Max number of datastores to return.
     * @param pageToken Cursor from a previous response to fetch the next page.
     * @returns DatastoreListResponse Successful Response
     * @throws ApiError
     */
    public static datastoreList(
        podId: string,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<DatastoreListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores',
            path: {
                'pod_id': podId,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Datastore
     * Create a datastore namespace inside a pod. Use this before creating tables. Datastore names are normalized for stable API paths.
     * @param podId
     * @param requestBody
     * @returns DatastoreResponse Successful Response
     * @throws ApiError
     */
    public static datastoreCreate(
        podId: string,
        requestBody: CreateDatastoreRequest,
    ): CancelablePromise<DatastoreResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores',
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
    /**
     * Delete Datastore
     * Delete a datastore and its underlying resources.
     * @param podId
     * @param datastoreName
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    public static datastoreDelete(
        podId: string,
        datastoreName: string,
    ): CancelablePromise<DatastoreMessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/datastores/{datastore_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Datastore
     * Get datastore metadata by datastore name.
     * @param podId
     * @param datastoreName
     * @returns DatastoreResponse Successful Response
     * @throws ApiError
     */
    public static datastoreGet(
        podId: string,
        datastoreName: string,
    ): CancelablePromise<DatastoreResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Datastore
     * Update datastore metadata and event emission settings.
     * @param podId
     * @param datastoreName
     * @param requestBody
     * @returns DatastoreResponse Successful Response
     * @throws ApiError
     */
    public static datastoreUpdate(
        podId: string,
        datastoreName: string,
        requestBody: UpdateDatastoreRequest,
    ): CancelablePromise<DatastoreResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/datastores/{datastore_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Execute Query
     * Execute a read-only SQL query in the datastore schema. Mutating statements (`INSERT`, `UPDATE`, `DELETE`, `DROP`, etc.) are blocked.
     * @param podId
     * @param datastoreName
     * @param requestBody
     * @returns RecordQueryResponse Successful Response
     * @throws ApiError
     */
    public static datastoreQuery(
        podId: string,
        datastoreName: string,
        requestBody: DatastoreQueryRequest,
    ): CancelablePromise<RecordQueryResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/query',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
