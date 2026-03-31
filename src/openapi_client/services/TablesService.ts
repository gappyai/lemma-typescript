/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddColumnRequest } from '../models/AddColumnRequest.js';
import type { CreateTableRequest } from '../models/CreateTableRequest.js';
import type { DatastoreMessageResponse } from '../models/DatastoreMessageResponse.js';
import type { TableListResponse } from '../models/TableListResponse.js';
import type { TableResponse } from '../models/TableResponse.js';
import type { UpdateTableRequest } from '../models/UpdateTableRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class TablesService {
    /**
     * List Tables
     * List tables in a datastore.
     * @param podId
     * @param datastoreName
     * @param limit Max number of tables to return.
     * @param pageToken Cursor from a previous response for pagination.
     * @returns TableListResponse Successful Response
     * @throws ApiError
     */
    public static tableList(
        podId: string,
        datastoreName: string,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<TableListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
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
     * Create Table
     * Create a table in a datastore. Define primary key, column schema, and optional RLS behavior.
     * @param podId
     * @param datastoreName
     * @param requestBody
     * @returns TableResponse Successful Response
     * @throws ApiError
     */
    public static tableCreate(
        podId: string,
        datastoreName: string,
        requestBody: CreateTableRequest,
    ): CancelablePromise<TableResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables',
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
     * Delete Table
     * Delete a table and all records in it.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    public static tableDelete(
        podId: string,
        datastoreName: string,
        tableName: string,
    ): CancelablePromise<DatastoreMessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Table
     * Get table schema metadata by table name.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @returns TableResponse Successful Response
     * @throws ApiError
     */
    public static tableGet(
        podId: string,
        datastoreName: string,
        tableName: string,
    ): CancelablePromise<TableResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Table
     * Update table metadata/configuration payload.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns TableResponse Successful Response
     * @throws ApiError
     */
    public static tableUpdate(
        podId: string,
        datastoreName: string,
        tableName: string,
        requestBody: UpdateTableRequest,
    ): CancelablePromise<TableResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}',
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
     * Add Column
     * Add a new column to a table. Column names must be unique and compatible with existing table schema rules.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns TableResponse Successful Response
     * @throws ApiError
     */
    public static tableColumnAdd(
        podId: string,
        datastoreName: string,
        tableName: string,
        requestBody: AddColumnRequest,
    ): CancelablePromise<TableResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/columns',
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
     * Remove Column
     * Remove a non-primary, non-system column from a table. System columns and the primary key cannot be removed.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param columnName
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    public static tableColumnRemove(
        podId: string,
        datastoreName: string,
        tableName: string,
        columnName: string,
    ): CancelablePromise<DatastoreMessageResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/columns/{column_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
                'column_name': columnName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
