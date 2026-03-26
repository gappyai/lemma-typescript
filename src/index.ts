export { LemmaClient } from "./client.js";
export type { LemmaConfig } from "./client.js";
export { AuthManager } from "./auth.js";
export type { AuthState, AuthListener, AuthStatus, UserInfo } from "./auth.js";
export { ApiError } from "./http.js";
export type {
  Agent,
  Assistant,
  Conversation,
  ConversationMessage,
  ConversationModel,
  CreateAgentInput,
  CreateAssistantInput,
  CreateTaskOptions,
  CursorPage,
  ListRecordsOptions,
  Organization,
  OrganizationInvitation,
  OrganizationMember,
  Pod,
  PodConfig,
  PodMember,
  RecordFilter,
  RecordSort,
  RunFunctionOptions,
  StreamOptions,
  Task,
  TaskMessage,
  UpdateAgentInput,
  UpdateAssistantInput,
  UploadedIcon,
  User,
  WorkflowRunInputs,
} from "./types.js";
export { readSSE, parseSSEJson } from "./streams.js";
export type { SseRawEvent } from "./streams.js";
export * from "./openapi_client/index.js";

// Namespace types (for advanced usage)
export type { AgentsNamespace } from "./namespaces/agents.js";
export type { AssistantsNamespace, ConversationsNamespace } from "./namespaces/assistants.js";
export type { DatastoresNamespace } from "./namespaces/datastores.js";
export type { DesksNamespace } from "./namespaces/desks.js";
export type { FilesNamespace } from "./namespaces/files.js";
export type { FunctionsNamespace } from "./namespaces/functions.js";
export type { IconsNamespace } from "./namespaces/icons.js";
export type { IntegrationsNamespace } from "./namespaces/integrations.js";
export type { OrganizationsNamespace } from "./namespaces/organizations.js";
export type { PodMembersNamespace } from "./namespaces/pod-members.js";
export type { PodsNamespace } from "./namespaces/pods.js";
export type { PodSurfacesNamespace } from "./namespaces/pod-surfaces.js";
export type { RecordsNamespace } from "./namespaces/records.js";
export type { ResourceType, ResourcesNamespace } from "./namespaces/resources.js";
export type { TablesNamespace } from "./namespaces/tables.js";
export type { TasksNamespace } from "./namespaces/tasks.js";
export type { UsersNamespace } from "./namespaces/users.js";
export type { WorkflowsNamespace } from "./namespaces/workflows.js";
