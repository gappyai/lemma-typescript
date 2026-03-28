/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentNode_Output } from './AgentNode_Output.js';
import type { DecisionNode_Output } from './DecisionNode_Output.js';
import type { EndNode } from './EndNode.js';
import type { FlowStart } from './FlowStart.js';
import type { FormNode } from './FormNode.js';
import type { FunctionNode_Output } from './FunctionNode_Output.js';
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
    nodes?: Array<(FormNode | AgentNode_Output | FunctionNode_Output | DecisionNode_Output | LoopNode | WaitUntilNode | EndNode)>;
    edges?: Array<WorkflowEdge>;
    start?: (FlowStart | null);
    is_active?: boolean;
    require_user_install?: boolean;
};

