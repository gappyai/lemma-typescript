export { LemmaClient } from "./client.js";
export type { LemmaConfig } from "./client.js";
export { AuthManager } from "./auth.js";
export type { AuthState, AuthListener, AuthStatus, UserInfo } from "./auth.js";
export { ApiError } from "./http.js";
export type { ListRecordsOptions, RecordFilter, RecordSort, RunFunctionOptions, CreateTaskOptions, WorkflowRunInputs } from "./types.js";

// Namespace types (for advanced usage)
export type { DatastoresNamespace } from "./namespaces/datastores.js";
export type { TablesNamespace } from "./namespaces/tables.js";
export type { RecordsNamespace } from "./namespaces/records.js";
export type { FilesNamespace } from "./namespaces/files.js";
export type { FunctionsNamespace } from "./namespaces/functions.js";
export type { AgentsNamespace } from "./namespaces/agents.js";
export type { TasksNamespace } from "./namespaces/tasks.js";
export type { AssistantsNamespace, ConversationsNamespace } from "./namespaces/assistants.js";
export type { WorkflowsNamespace } from "./namespaces/workflows.js";
export type { DesksNamespace } from "./namespaces/desks.js";
export type { IntegrationsNamespace } from "./namespaces/integrations.js";
