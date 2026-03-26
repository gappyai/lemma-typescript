/** Public ergonomic types. All field names use camelCase. */

export interface PageResult<T> {
  items: T[];
  nextPageToken?: string;
  total?: number;
}

export interface RecordFilter {
  field: string;
  op: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "like" | "in";
  value: unknown;
}

export interface RecordSort {
  field: string;
  direction: "asc" | "desc";
}

export interface ListRecordsOptions {
  filters?: RecordFilter[];
  sort?: RecordSort[];
  limit?: number;
  offset?: number;
  pageToken?: string;
}

export interface RunFunctionOptions {
  /** Input payload for the function */
  input?: Record<string, unknown>;
  /** Runtime integration account IDs */
  runtimeAccounts?: string[];
}

export interface CreateTaskOptions {
  agentId: string;
  input?: Record<string, unknown>;
  runtimeAccounts?: string[];
}

export interface WorkflowRunInputs {
  [key: string]: unknown;
}
