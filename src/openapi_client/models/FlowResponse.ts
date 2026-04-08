/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentNodeResponse } from './AgentNodeResponse.js';
import type { DecisionNodeResponse } from './DecisionNodeResponse.js';
import type { EndNodeResponse } from './EndNodeResponse.js';
import type { FlowStart_Output } from './FlowStart_Output.js';
import type { FormNodeResponse } from './FormNodeResponse.js';
import type { FunctionNodeResponse } from './FunctionNodeResponse.js';
import type { LoopNodeResponse } from './LoopNodeResponse.js';
import type { WaitUntilNodeResponse } from './WaitUntilNodeResponse.js';
import type { WorkflowEdge } from './WorkflowEdge.js';
import type { WorkflowInstallMode } from './WorkflowInstallMode.js';
export type FlowResponse = {
    created_at?: (string | null);
    description?: (string | null);
    edges?: Array<WorkflowEdge>;
    icon_url?: (string | null);
    id: string;
    is_active?: boolean;
    mode?: WorkflowInstallMode;
    name: string;
    nodes?: Array<(FormNodeResponse | AgentNodeResponse | FunctionNodeResponse | DecisionNodeResponse | LoopNodeResponse | WaitUntilNodeResponse | EndNodeResponse)>;
    pod_id: string;
    start?: (FlowStart_Output | null);
    updated_at?: (string | null);
};

