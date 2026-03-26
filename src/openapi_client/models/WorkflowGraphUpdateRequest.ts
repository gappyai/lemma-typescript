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
 * Named request body for replacing a workflow graph.
 */
export type WorkflowGraphUpdateRequest = {
    /**
     * Complete node list for the workflow graph. Agent/function `input_mapping` entries must use explicit typed bindings like `{"type": "expression", "value": "start.payload.issue.key"}` or `{"type": "literal", "value": "finance"}`.
     */
    nodes: Array<(FormNode | AgentNode | FunctionNode | DecisionNode | LoopNode | WaitUntilNode | EndNode)>;
    /**
     * Complete edge list connecting the provided nodes.
     */
    edges: Array<WorkflowEdge>;
    /**
     * Optional replacement start configuration stored with the graph.
     */
    start?: (FlowStart | null);
};

