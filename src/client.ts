import { resolveConfig, type LemmaConfig } from "./config.js";
import { AuthManager, type AuthState, type AuthListener } from "./auth.js";
import { GeneratedClientAdapter } from "./generated.js";
import { HttpClient } from "./http.js";
import { AgentsNamespace } from "./namespaces/agents.js";
import { AssistantsNamespace, ConversationsNamespace } from "./namespaces/assistants.js";
import { DatastoresNamespace } from "./namespaces/datastores.js";
import { DesksNamespace } from "./namespaces/desks.js";
import { FilesNamespace } from "./namespaces/files.js";
import { FunctionsNamespace } from "./namespaces/functions.js";
import { IconsNamespace } from "./namespaces/icons.js";
import { IntegrationsNamespace } from "./namespaces/integrations.js";
import { OrganizationsNamespace } from "./namespaces/organizations.js";
import { PodMembersNamespace } from "./namespaces/pod-members.js";
import { PodsNamespace } from "./namespaces/pods.js";
import { PodSurfacesNamespace } from "./namespaces/pod-surfaces.js";
import { RecordsNamespace } from "./namespaces/records.js";
import { ResourcesNamespace } from "./namespaces/resources.js";
import { TablesNamespace } from "./namespaces/tables.js";
import { TasksNamespace } from "./namespaces/tasks.js";
import { UsersNamespace } from "./namespaces/users.js";
import { WorkflowsNamespace } from "./namespaces/workflows.js";

export type { LemmaConfig };
export { AuthManager };
export type { AuthState, AuthListener };

interface LemmaClientInternalOptions {
  authManager?: AuthManager;
}

export class LemmaClient {
  private readonly _config: LemmaConfig;
  private readonly _podId: string | undefined;
  private _currentPodId: string | undefined;

  /** Auth manager — subscribe to auth state, check auth, redirect to auth. */
  readonly auth: AuthManager;

  private readonly _http: HttpClient;
  private readonly _generated: GeneratedClientAdapter;

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
  readonly resources: ResourcesNamespace;

  readonly users: UsersNamespace;
  readonly icons: IconsNamespace;
  readonly pods: PodsNamespace;
  readonly podMembers: PodMembersNamespace;
  readonly organizations: OrganizationsNamespace;
  readonly podSurfaces: PodSurfacesNamespace;

  constructor(
    overrides: Partial<LemmaConfig> = {},
    internalOptions: LemmaClientInternalOptions = {},
  ) {
    this._config = resolveConfig(overrides);
    this._currentPodId = this._config.podId;
    this._podId = this._config.podId;

    this.auth = internalOptions.authManager ?? new AuthManager(this._config.apiUrl, this._config.authUrl);
    this._http = new HttpClient(this._config.apiUrl, this.auth);
    this._generated = new GeneratedClientAdapter(this._config.apiUrl, this.auth);

    const podIdFn = () => {
      if (!this._currentPodId) {
        throw new Error(
          "pod_id is required. Pass podId in the constructor or call client.setPodId(id).",
        );
      }
      return this._currentPodId;
    };

    this.datastores = new DatastoresNamespace(this._generated, podIdFn);
    this.tables = new TablesNamespace(this._generated, podIdFn);
    this.records = new RecordsNamespace(this._generated, this._http, podIdFn);
    this.files = new FilesNamespace(this._generated, this._http, podIdFn);
    this.functions = new FunctionsNamespace(this._generated, podIdFn);
    this.agents = new AgentsNamespace(this._generated, podIdFn);
    this.tasks = new TasksNamespace(this._http, podIdFn);
    this.assistants = new AssistantsNamespace(this._http, podIdFn);
    this.conversations = new ConversationsNamespace(this._http, podIdFn);
    this.workflows = new WorkflowsNamespace(this._generated, this._http, podIdFn);
    this.desks = new DesksNamespace(this._generated, this._http, podIdFn);
    this.integrations = new IntegrationsNamespace(this._generated);
    this.resources = new ResourcesNamespace(this._http);

    this.users = new UsersNamespace(this._generated);
    this.icons = new IconsNamespace(this._generated);
    this.pods = new PodsNamespace(this._generated, this._http);
    this.podMembers = new PodMembersNamespace(this._generated);
    this.organizations = new OrganizationsNamespace(this._generated, this._http);
    this.podSurfaces = new PodSurfacesNamespace(this._generated);
  }

  /** Change the active pod ID for subsequent calls. */
  setPodId(podId: string): void {
    this._currentPodId = podId;
  }

  /** Return a new client scoped to a specific pod, sharing auth state. */
  withPod(podId: string): LemmaClient {
    return new LemmaClient({ ...this._config, podId }, { authManager: this.auth });
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
      headers?: HeadersInit;
      isFormData?: boolean;
      signal?: AbortSignal;
    },
  ): Promise<T> {
    return this._http.request<T>(method, path, options);
  }
}
