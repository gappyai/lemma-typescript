/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentNode } from './AgentNode.js';
import type { DecisionNode } from './DecisionNode.js';
import type { EndNode } from './EndNode.js';
import type { FlowStart } from './FlowStart.js';
import type { FormNode } from './FormNode.js';
import type { FunctionNode } from './FunctionNode.js';
import type { LoopNode } from './LoopNode.js';
import type { WaitUntilNode } from './WaitUntilNode.js';
import type { WorkflowEdge } from './WorkflowEdge.js';
/**
 * Flow Aggregate representing a workflow definition.
 */
export type FlowEntity = {
    id?: string;
    created_at?: (string | null);
    updated_at?: (string | null);
    name: string;
    description?: (string | null);
    icon_url?: (string | null);
    pod_id: string;
    nodes?: Array<(FormNode | AgentNode | FunctionNode | DecisionNode | LoopNode | WaitUntilNode | EndNode)>;
    edges?: Array<WorkflowEdge>;
    start?: (FlowStart | null);
    is_active?: boolean;
    require_user_install?: boolean;
};

