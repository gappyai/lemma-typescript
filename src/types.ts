import type {
  AgentModelName,
  AgentResponse,
  ColumnSchema,
  ConversationResponse as GeneratedConversationResponse,
  CreateAgentRequest,
  DatastoreQueryResponse,
  DirectoryTreeNode,
  DirectoryTreeResponse,
  FileResponse,
  FileNamespace,
  FileSearchResponse,
  FileSearchResultSchema,
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
  UpdateAgentRequest,
  UserResponse,
} from "./openapi_client/index.js";

/** Public ergonomic types. */

export interface AvailableModelInfo {
  id: ConversationModel;
  name: string;
  description?: string | null;
}

export type AvailableModels = AgentModelName;

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

export type ConversationModel = `${AgentModelName}` | (string & {});
export type Conversation = GeneratedConversationResponse & {
  model?: ConversationModel | null;
  status?: string | null;
};

export interface ConversationMessageResponse {
  id: string;
  role: string;
  content: unknown;
  created_at: string;
  conversation_id?: string;
  sequence?: number;
  agent_run_id?: string | null;
  metadata?: Record<string, unknown> | null;
  tool_call_id?: string | null;
  tool_name?: string | null;
}

export type ConversationMessage = ConversationMessageResponse;

export type TaskStatus =
  | "PENDING"
  | "RUNNING"
  | "WAITING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "STOPPED"
  | (string & {});

export interface CreateTaskRequest {
  agent_name: string;
  input_data?: Record<string, unknown> | null;
  title?: string | null;
  conversation_id?: string | null;
  content?: string | null;
}

export interface AddMessageRequest {
  content: string;
}

export interface TaskResponse {
  id: string;
  agent_id?: string | null;
  agent_name?: string | null;
  pod_id: string;
  user_id?: string;
  input_data?: Record<string, unknown> | null;
  output_data?: unknown;
  error?: string | null;
  status?: TaskStatus;
  created_at?: string;
  updated_at?: string;
  conversation?: Conversation;
}

export interface TaskListResponse {
  items: TaskResponse[];
  limit: number;
  next_page_token?: string | null;
  total?: number;
}

export type TaskMessageResponse = ConversationMessageResponse;

export interface TaskMessageListResponse {
  items: TaskMessageResponse[];
  limit: number;
  next_page_token?: string | null;
}

export type Task = TaskResponse;
export type TaskMessage = TaskMessageResponse;
export type FunctionRun = FunctionRunResponse;
export type FlowRun = FlowRunEntity;
export type Workflow = FlowResponse;
export type WorkflowStart = Workflow["start"];
export type WorkflowStartType = NonNullable<WorkflowStart>["type"];
export type Table = TableResponse;
export type TableColumn = ColumnSchema;
export type DatastoreQueryResult = DatastoreQueryResponse;
export type DatastoreFile = FileResponse;
export type DatastoreFileSearchResponse = FileSearchResponse;
export type DatastoreFileSearchResult = FileSearchResultSchema;
export type DatastoreDirectoryTree = DirectoryTreeResponse;
export type DatastoreDirectoryTreeNode = DirectoryTreeNode;
export type DatastoreFileNamespace = FileNamespace | "PRIVATE" | "PERSONAL" | "POD";

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
