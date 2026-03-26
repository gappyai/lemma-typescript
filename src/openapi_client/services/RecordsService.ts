/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BulkCreateRecordsRequest } from '../models/BulkCreateRecordsRequest.js';
import type { BulkDeleteRecordsRequest } from '../models/BulkDeleteRecordsRequest.js';
import type { BulkUpdateRecordsRequest } from '../models/BulkUpdateRecordsRequest.js';
import type { CreateRecordRequest } from '../models/CreateRecordRequest.js';
import type { DatastoreMessageResponse } from '../models/DatastoreMessageResponse.js';
import type { RecordListResponse } from '../models/RecordListResponse.js';
import type { RecordQueryRequest } from '../models/RecordQueryRequest.js';
import type { RecordResponse } from '../models/RecordResponse.js';
import type { UpdateRecordRequest } from '../models/UpdateRecordRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class RecordsService {
    /**
     * Create Record
     * Insert a record into a table. Reserved tables (`reserved_*`) are system-managed and cannot be mutated through record write endpoints.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns RecordResponse Successful Response
     * @throws ApiError
     */
    public static recordCreate(
        podId: string,
        datastoreName: string,
        tableName: string,
        requestBody: CreateRecordRequest,
    ): CancelablePromise<RecordResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Records
     * List table records with token pagination only. Use `record.query` when you need structured filters or explicit sort clauses.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param limit Max number of rows to return.
     * @param pageToken Opaque token from a previous response page.
     * @returns RecordListResponse Successful Response
     * @throws ApiError
     */
    public static recordList(
        podId: string,
        datastoreName: string,
        tableName: string,
        limit: number = 20,
        pageToken?: (string | null),
    ): CancelablePromise<RecordListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
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
     * Get Record
     * Fetch one record by primary key value. The `record_id` path segment is the table's primary key value as stored in the table, not necessarily a UUID.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param recordId
     * @returns RecordResponse Successful Response
     * @throws ApiError
     */
    public static recordGet(
        podId: string,
        datastoreName: string,
        tableName: string,
        recordId: string,
    ): CancelablePromise<RecordResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/{record_id}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
                'record_id': recordId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Record
     * Patch a record by primary key.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param recordId
     * @param requestBody
     * @returns RecordResponse Successful Response
     * @throws ApiError
     */
    public static recordUpdate(
        podId: string,
        datastoreName: string,
        tableName: string,
        recordId: string,
        requestBody: UpdateRecordRequest,
    ): CancelablePromise<RecordResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/{record_id}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
                'record_id': recordId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Record
     * Delete a record by primary key.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param recordId
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    public static recordDelete(
        podId: string,
        datastoreName: string,
        tableName: string,
        recordId: string,
    ): CancelablePromise<DatastoreMessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/{record_id}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
                'record_id': recordId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Bulk Create
     * Insert multiple records in one request.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    public static recordBulkCreate(
        podId: string,
        datastoreName: string,
        tableName: string,
        requestBody: BulkCreateRecordsRequest,
    ): CancelablePromise<DatastoreMessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/bulk/create',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Bulk Update
     * Update multiple records in one request (each item needs primary key).
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    public static recordBulkUpdate(
        podId: string,
        datastoreName: string,
        tableName: string,
        requestBody: BulkUpdateRecordsRequest,
    ): CancelablePromise<DatastoreMessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/bulk/update',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Bulk Delete
     * Delete multiple records by primary key values.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    public static recordBulkDelete(
        podId: string,
        datastoreName: string,
        tableName: string,
        requestBody: BulkDeleteRecordsRequest,
    ): CancelablePromise<DatastoreMessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/bulk/delete',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Query Records
     * Query one table with structured filters and sorting. Use this instead of dynamic query parameters when you need filtering. Example filters: `[{"field": "status", "op": "eq", "value": "OPEN"}]`.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns RecordListResponse Successful Response
     * @throws ApiError
     */
    public static recordQuery(
        podId: string,
        datastoreName: string,
        tableName: string,
        requestBody: RecordQueryRequest,
    ): CancelablePromise<RecordListResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/query',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
