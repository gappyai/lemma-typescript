import type { RecordFilter as GeneratedRecordFilter } from "./openapi_client/models/RecordFilter.js";
import type { RecordSort as GeneratedRecordSort } from "./openapi_client/models/RecordSort.js";
import type {
  AgentResponse,
  AssistantResponse,
  AvailableModels,
  ConversationMessageResponse,
  ConversationResponse,
  CreateAgentRequest,
  CreateAssistantRequest,
  IconUploadResponse,
  OrganizationInvitationResponse,
  OrganizationMemberResponse,
  OrganizationResponse,
  PodConfigResponse,
  PodMemberResponse,
  PodResponse,
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

export type RecordFilter = GeneratedRecordFilter;

export type RecordSort = GeneratedRecordSort;

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

export interface CreateTaskOptions {
  /** Preferred field in newer APIs */
  agentId?: string;
  /** Backward-compatible alias supported by older APIs */
  agentName?: string;
  input?: Record<string, unknown>;
  runtimeAccountIds?: string[];
}

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
export type ConversationModel = `${AvailableModels}`;

export type Task = TaskResponse;
export type TaskMessage = TaskMessageResponse;

export type Pod = PodResponse;
export type PodConfig = PodConfigResponse;
export type PodMember = PodMemberResponse;

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
}
