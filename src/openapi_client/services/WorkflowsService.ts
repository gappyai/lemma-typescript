/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FlowInstallEntity } from '../models/FlowInstallEntity.js';
import type { FlowResponse } from '../models/FlowResponse.js';
import type { FlowRunEntity } from '../models/FlowRunEntity.js';
import type { WorkflowCreateRequest } from '../models/WorkflowCreateRequest.js';
import type { WorkflowGraphUpdateRequest } from '../models/WorkflowGraphUpdateRequest.js';
import type { WorkflowInstallRequest } from '../models/WorkflowInstallRequest.js';
import type { WorkflowListResponse } from '../models/WorkflowListResponse.js';
import type { WorkflowRunListResponse } from '../models/WorkflowRunListResponse.js';
import type { WorkflowUpdateRequest } from '../models/WorkflowUpdateRequest.js';
import type { CancelablePromise } from '../core/CancelablePromise.js';
import { OpenAPI } from '../core/OpenAPI.js';
import { request as __request } from '../core/request.js';
export class WorkflowsService {
    /**
     * Get Workflow Run
     * Get current state, context, and step history of a workflow run.
     * @param podId
     * @param runId
     * @returns FlowRunEntity Successful Response
     * @throws ApiError
     */
    public static workflowRunGet(
        podId: string,
        runId: string,
    ): CancelablePromise<FlowRunEntity> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/workflow-runs/{run_id}',
            path: {
                'pod_id': podId,
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Resume Workflow Run
     * Resume a run in WAITING or EXECUTING state. The payload is written back into the current waiting node output and execution continues.
     * @param podId
     * @param runId
     * @param requestBody
     * @returns FlowRunEntity Successful Response
     * @throws ApiError
     */
    public static workflowRunResume(
        podId: string,
        runId: string,
        requestBody: Record<string, any>,
    ): CancelablePromise<FlowRunEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/workflow-runs/{run_id}/resume',
            path: {
                'pod_id': podId,
                'run_id': runId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Visualize Workflow Run
     * Render an HTML view of a run overlaid on its workflow graph.
     * @param podId
     * @param runId
     * @returns string Successful Response
     * @throws ApiError
     */
    public static workflowRunVisualize(
        podId: string,
        runId: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/workflow-runs/{run_id}/visualize',
            path: {
                'pod_id': podId,
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Workflow Runs
     * List recent runs for a given workflow.
     * @param podId
     * @param workflowName
     * @param limit
     * @param pageToken
     * @returns WorkflowRunListResponse Successful Response
     * @throws ApiError
     */
    public static workflowRunList(
        podId: string,
        workflowName: string,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<WorkflowRunListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/workflow-runs/{workflow_name}/runs',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
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
     * List Workflows
     * List all workflows in a pod.
     * @param podId
     * @param limit
     * @param pageToken
     * @returns WorkflowListResponse Successful Response
     * @throws ApiError
     */
    public static workflowList(
        podId: string,
        limit: number = 100,
        pageToken?: (string | null),
    ): CancelablePromise<WorkflowListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/workflows',
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
     * Create Workflow
     * Create a workflow definition. Use this before uploading graph nodes/edges with `workflow.graph.update`.
     * @param podId
     * @param requestBody
     * @returns FlowResponse Successful Response
     * @throws ApiError
     */
    public static workflowCreate(
        podId: string,
        requestBody: WorkflowCreateRequest,
    ): CancelablePromise<FlowResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/workflows',
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
     * Delete Workflow
     * Delete a workflow definition.
     * @param podId
     * @param workflowName
     * @returns void
     * @throws ApiError
     */
    public static workflowDelete(
        podId: string,
        workflowName: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/workflows/{workflow_name}',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Workflow
     * Get a single workflow definition including graph and start configuration.
     * @param podId
     * @param workflowName
     * @returns FlowResponse Successful Response
     * @throws ApiError
     */
    public static workflowGet(
        podId: string,
        workflowName: string,
    ): CancelablePromise<FlowResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/workflows/{workflow_name}',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Workflow Metadata
     * Update workflow-level metadata such as description/install mode. Workflow names are immutable after creation. Use `workflow.graph.update` for nodes and edges.
     * @param podId
     * @param workflowName
     * @param requestBody
     * @returns FlowResponse Successful Response
     * @throws ApiError
     */
    public static workflowUpdate(
        podId: string,
        workflowName: string,
        requestBody: WorkflowUpdateRequest,
    ): CancelablePromise<FlowResponse> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/workflows/{workflow_name}',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Workflow Graph
     * Replace the workflow graph. Agent/function node `input_mapping` entries must use explicit typed bindings. Use `{type: "expression", value: "start.payload.issue.key"}` for context lookups and `{type: "literal", value: "abc"}` for fixed JSON values.
     * @param podId
     * @param workflowName
     * @param requestBody
     * @returns FlowResponse Successful Response
     * @throws ApiError
     */
    public static workflowGraphUpdate(
        podId: string,
        workflowName: string,
        requestBody: WorkflowGraphUpdateRequest,
    ): CancelablePromise<FlowResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/pods/{pod_id}/workflows/{workflow_name}/graph',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Install Workflow
     * Install a workflow for runtime execution. Provide `account_id` when the workflow needs an integration account binding, and provide `schedule` when installing a scheduled workflow.
     * @param podId
     * @param workflowName
     * @param requestBody
     * @returns FlowInstallEntity Successful Response
     * @throws ApiError
     */
    public static workflowInstallCreate(
        podId: string,
        workflowName: string,
        requestBody: WorkflowInstallRequest,
    ): CancelablePromise<FlowInstallEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/workflows/{workflow_name}/install',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Uninstall Workflow
     * Remove a previously created workflow installation binding.
     * @param podId
     * @param workflowName
     * @param installId
     * @returns void
     * @throws ApiError
     */
    public static workflowInstallDelete(
        podId: string,
        workflowName: string,
        installId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/workflows/{workflow_name}/installs/{install_id}',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
                'install_id': installId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Start Workflow
     * Start a new workflow run. For event/scheduled/datastore starts, the request body is treated as initial trigger payload and merged into execution context.
     * @param podId
     * @param workflowName
     * @param requestBody
     * @returns FlowRunEntity Successful Response
     * @throws ApiError
     */
    public static workflowStart(
        podId: string,
        workflowName: string,
        requestBody: Record<string, any>,
    ): CancelablePromise<FlowRunEntity> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/workflows/{workflow_name}/start',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Visualize Workflow
     * Render an HTML visualization for debugging workflow graph structure.
     * @param podId
     * @param workflowName
     * @returns string Successful Response
     * @throws ApiError
     */
    public static workflowVisualize(
        podId: string,
        workflowName: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/workflows/{workflow_name}/visualize',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
