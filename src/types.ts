import type {
  AgentResponse,
  AssistantResponse,
  AvailableModels,
  ColumnSchema,
  ConversationMessageResponse,
  ConversationResponse,
  CreateAgentRequest,
  CreateAssistantRequest,
  CreateTaskRequest,
  DatastoreQueryResponse,
  FlowRunEntity,
  FlowResponse,
  FunctionRunResponse,
  IconUploadResponse,
  OrganizationInvitationResponse,
  OrganizationMemberResponse,
  OrganizationResponse,
  PodConfigResponse,
  PodJoinRequestCreateResponse,
  PodMemberResponse,
  PodResponse,
  TableResponse,
  TaskMessageResponse,
  TaskResponse,
  UpdateAgentRequest,
  UpdateAssistantRequest,
  UserResponse,
} from "./openapi_client/index.js";

/** Public ergonomic types. */

export interface PageResult<T> {
  items: T[];
  nextPageToken?: string;
  total?: number;
}

export interface RecordFilter {
  field: string;
  op: string;
  value?: unknown;
  values?: unknown[];
}

export interface RecordSort {
  field: string;
  direction?: "asc" | "desc" | string;
}

export interface ListRecordsOptions {
  filters?: RecordFilter[];
  sort?: RecordSort[];
  limit?: number;
  pageToken?: string;
  offset?: number;
  sortBy?: string;
  order?: "asc" | "desc" | string;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export interface RunFunctionOptions {
  /** Input payload for the function */
  input?: Record<string, unknown>;
}

/** Alias kept for backward compatibility; shape follows generated OpenAPI schema exactly. */
export type CreateTaskOptions = CreateTaskRequest;

export interface WorkflowRunInputs {
  [key: string]: unknown;
}

export interface StreamOptions {
  signal?: AbortSignal;
}

/** Ergonomic entity aliases (instead of *Response/*Request names). */
export type Agent = AgentResponse;
export type CreateAgentInput = CreateAgentRequest;
export type UpdateAgentInput = UpdateAgentRequest;

export type Assistant = AssistantResponse;
export type CreateAssistantInput = CreateAssistantRequest;
export type UpdateAssistantInput = UpdateAssistantRequest;

export type Conversation = ConversationResponse;
export type ConversationMessage = ConversationMessageResponse;
export type ConversationModel = `${AvailableModels}` | (string & {});

export type Task = TaskResponse;
export type TaskMessage = TaskMessageResponse;
export type FunctionRun = FunctionRunResponse;
export type FlowRun = FlowRunEntity;
export type Workflow = FlowResponse;
export type Table = TableResponse;
export type TableColumn = ColumnSchema;
export type DatastoreQueryResult = DatastoreQueryResponse;

export type Pod = PodResponse;
export type PodConfig = PodConfigResponse;
export type PodMember = PodMemberResponse;
export type PodJoinRequest = PodJoinRequestCreateResponse;

export type Organization = OrganizationResponse;
export type OrganizationMember = OrganizationMemberResponse;
export type OrganizationInvitation = OrganizationInvitationResponse;

export type User = UserResponse;
export type UploadedIcon = IconUploadResponse;

/** Generic cursor-style page shape used by many list endpoints. */
export interface CursorPage<T> {
  items: T[];
  limit: number;
  next_page_token?: string | null;
  total?: number;
}

/**
 * Re-export generated OpenAPI models/enums/services from the same module so this
 * file remains the single public type surface for the SDK.
 */
export * from "./openapi_client/index.js";
