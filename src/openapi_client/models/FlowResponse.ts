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
    created_at?: (string | null);
    description?: (string | null);
    edges?: Array<WorkflowEdge>;
    icon_url?: (string | null);
    id: string;
    is_active?: boolean;
    name: string;
    nodes?: Array<(FormNodeResponse | AgentNodeResponse | FunctionNodeResponse | DecisionNodeResponse | LoopNodeResponse | WaitUntilNodeResponse | EndNodeResponse)>;
    pod_id: string;
    require_user_install?: boolean;
    start?: (FlowStart | null);
    updated_at?: (string | null);
};

