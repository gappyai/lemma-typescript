/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentNode_Input } from './AgentNode_Input.js';
import type { DecisionNode_Input } from './DecisionNode_Input.js';
import type { EndNode } from './EndNode.js';
import type { FlowStart } from './FlowStart.js';
import type { FormNode } from './FormNode.js';
import type { FunctionNode_Input } from './FunctionNode_Input.js';
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
    nodes: Array<(FormNode | AgentNode_Input | FunctionNode_Input | DecisionNode_Input | LoopNode | WaitUntilNode | EndNode)>;
    /**
     * Complete edge list connecting the provided nodes.
     */
    edges: Array<WorkflowEdge>;
    /**
     * Optional replacement start configuration stored with the graph.
     */
    start?: (FlowStart | null);
};

