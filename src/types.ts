import type { RecordFilter as GeneratedRecordFilter } from "./openapi_client/models/RecordFilter.js";
import type { RecordSort as GeneratedRecordSort } from "./openapi_client/models/RecordSort.js";

/** Public ergonomic types. */

export interface PageResult<T> {
  items: T[];
  nextPageToken?: string;
  total?: number;
}

export type RecordFilter = GeneratedRecordFilter;

export type RecordSort = GeneratedRecordSort;

export interface ListRecordsOptions {
  filters?: RecordFilter[];
  sort?: RecordSort[];
  limit?: number;
  pageToken?: string;
}

export interface RunFunctionOptions {
  /** Input payload for the function */
  input?: Record<string, unknown>;
}

export interface CreateTaskOptions {
  agentName: string;
  input?: Record<string, unknown>;
}

export interface WorkflowRunInputs {
  [key: string]: unknown;
}
