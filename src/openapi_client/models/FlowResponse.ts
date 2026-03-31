/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentNodeResponse } from './AgentNodeResponse.js';
import type { DecisionNodeResponse } from './DecisionNodeResponse.js';
import type { EndNodeResponse } from './EndNodeResponse.js';
import type { FlowStart } from './FlowStart.js';
import type { FormNodeResponse } from './FormNodeResponse.js';
import type { FunctionNodeResponse } from './FunctionNodeResponse.js';
import type { LoopNodeResponse } from './LoopNodeResponse.js';
import type { WaitUntilNodeResponse } from './WaitUntilNodeResponse.js';
import type { WorkflowEdge } from './WorkflowEdge.js';
export type FlowResponse = {
    id: string;
    created_at?: (string | null);
    updated_at?: (string | null);
    name: string;
    description?: (string | null);
    icon_url?: (string | null);
    pod_id: string;
    nodes?: Array<(FormNodeResponse | AgentNodeResponse | FunctionNodeResponse | DecisionNodeResponse | LoopNodeResponse | WaitUntilNodeResponse | EndNodeResponse)>;
    edges?: Array<WorkflowEdge>;
    start?: (FlowStart | null);
    is_active?: boolean;
    require_user_install?: boolean;
};

