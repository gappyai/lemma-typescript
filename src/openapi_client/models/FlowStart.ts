/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataStoreFlowStart } from './DataStoreFlowStart.js';
import type { EventFlowStart } from './EventFlowStart.js';
import type { FlowStartType } from './FlowStartType.js';
import type { ScheduledFlowStart } from './ScheduledFlowStart.js';
export type FlowStart = {
    /**
     * Start mode configuration payload. Required for non-manual start types.
     */
    config?: (ScheduledFlowStart | EventFlowStart | DataStoreFlowStart | null);
    /**
     * Flow start mode: MANUAL, SCHEDULED, EVENT, or DATASTORE_EVENT.
     */
    type: FlowStartType;
};

