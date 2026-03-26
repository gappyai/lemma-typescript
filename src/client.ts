import { resolveConfig, type LemmaConfig } from "./config.js";
import { AuthManager, type AuthState, type AuthListener } from "./auth.js";
import { HttpClient } from "./http.js";
import { DatastoresNamespace } from "./namespaces/datastores.js";
import { TablesNamespace } from "./namespaces/tables.js";
import { RecordsNamespace } from "./namespaces/records.js";
import { FilesNamespace } from "./namespaces/files.js";
import { FunctionsNamespace } from "./namespaces/functions.js";
import { AgentsNamespace } from "./namespaces/agents.js";
import { TasksNamespace } from "./namespaces/tasks.js";
import { AssistantsNamespace, ConversationsNamespace } from "./namespaces/assistants.js";
import { WorkflowsNamespace } from "./namespaces/workflows.js";
import { DesksNamespace } from "./namespaces/desks.js";
import { IntegrationsNamespace } from "./namespaces/integrations.js";

export type { LemmaConfig };
export { AuthManager };
export type { AuthState, AuthListener };

export class LemmaClient {
  private readonly _config: LemmaConfig;
  private readonly _podId: string | undefined;
  private _currentPodId: string | undefined;

  /** Auth manager — subscribe to auth state, check auth, redirect to auth. */
  readonly auth: AuthManager;

  private readonly _http: HttpClient;

  // Namespaces
  readonly datastores: DatastoresNamespace;
  readonly tables: TablesNamespace;
  readonly records: RecordsNamespace;
  readonly files: FilesNamespace;
  readonly functions: FunctionsNamespace;
  readonly agents: AgentsNamespace;
  readonly tasks: TasksNamespace;
  readonly assistants: AssistantsNamespace;
  readonly conversations: ConversationsNamespace;
  readonly workflows: WorkflowsNamespace;
  readonly desks: DesksNamespace;
  readonly integrations: IntegrationsNamespace;

  constructor(overrides: Partial<LemmaConfig> = {}) {
    this._config = resolveConfig(overrides);
    this._currentPodId = this._config.podId;
    this._podId = this._config.podId;

    this.auth = new AuthManager(this._config.apiUrl, this._config.authUrl);
    this._http = new HttpClient(this._config.apiUrl, this.auth);

    const podIdFn = () => {
      if (!this._currentPodId) {
        throw new Error(
          "pod_id is required. Pass podId in the constructor or call client.setPodId(id).",
        );
      }
      return this._currentPodId;
    };

    this.datastores = new DatastoresNamespace(this._http, podIdFn);
    this.tables = new TablesNamespace(this._http, podIdFn);
    this.records = new RecordsNamespace(this._http, podIdFn);
    this.files = new FilesNamespace(this._http, podIdFn);
    this.functions = new FunctionsNamespace(this._http, podIdFn);
    this.agents = new AgentsNamespace(this._http, podIdFn);
    this.tasks = new TasksNamespace(this._http, podIdFn);
    this.assistants = new AssistantsNamespace(this._http, podIdFn);
    this.conversations = new ConversationsNamespace(this._http, podIdFn);
    this.workflows = new WorkflowsNamespace(this._http, podIdFn);
    this.desks = new DesksNamespace(this._http, podIdFn);
    this.integrations = new IntegrationsNamespace(this._http);
  }

  /** Change the active pod ID for subsequent calls. */
  setPodId(podId: string): void {
    this._currentPodId = podId;
  }

  /** Return a new client scoped to a specific pod, sharing auth state. */
  withPod(podId: string): LemmaClient {
    return new LemmaClient({ ...this._config, podId });
  }

  get podId(): string | undefined {
    return this._currentPodId;
  }

  get apiUrl(): string {
    return this._config.apiUrl;
  }

  get authUrl(): string {
    return this._config.authUrl;
  }

  /**
   * Initialize the client by checking auth state.
   * Call this once on app startup (or let AuthGuard handle it).
   */
  async initialize(): Promise<AuthState> {
    return this.auth.checkAuth();
  }

  /** Raw HTTP request — escape hatch for operations not covered by namespaces. */
  request<T = unknown>(
    method: string,
    path: string,
    options?: {
      params?: Record<string, string | number | boolean | undefined | null>;
      body?: unknown;
    },
  ): Promise<T> {
    return this._http.request<T>(method, path, options);
  }
}
