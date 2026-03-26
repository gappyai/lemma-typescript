(() => {
  const modules = {
"./browser.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.AuthManager = exports.LemmaClient = void 0;
/**
 * Browser bundle entry point.
 * Exposes LemmaClient as globalThis.LemmaClient.LemmaClient
 *
 * Usage in HTML:
 *   <script src="/lemma-client.js"></script>
 *   <script>
 *     const client = new window.LemmaClient.LemmaClient({ podId: "...", apiUrl: "..." });
 *   </script>
 */
var client_js_1 = require("./client.js");
Object.defineProperty(exports, "LemmaClient", { enumerable: true, get: function () { return client_js_1.LemmaClient; } });
var auth_js_1 = require("./auth.js");
Object.defineProperty(exports, "AuthManager", { enumerable: true, get: function () { return auth_js_1.AuthManager; } });
var http_js_1 = require("./http.js");
Object.defineProperty(exports, "ApiError", { enumerable: true, get: function () { return http_js_1.ApiError; } });

},
"./client.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LemmaClient = exports.AuthManager = void 0;
const config_js_1 = require("./config.js");
const auth_js_1 = require("./auth.js");
Object.defineProperty(exports, "AuthManager", { enumerable: true, get: function () { return auth_js_1.AuthManager; } });
const http_js_1 = require("./http.js");
const datastores_js_1 = require("./namespaces/datastores.js");
const tables_js_1 = require("./namespaces/tables.js");
const records_js_1 = require("./namespaces/records.js");
const files_js_1 = require("./namespaces/files.js");
const functions_js_1 = require("./namespaces/functions.js");
const agents_js_1 = require("./namespaces/agents.js");
const tasks_js_1 = require("./namespaces/tasks.js");
const assistants_js_1 = require("./namespaces/assistants.js");
const workflows_js_1 = require("./namespaces/workflows.js");
const desks_js_1 = require("./namespaces/desks.js");
const integrations_js_1 = require("./namespaces/integrations.js");
class LemmaClient {
    constructor(overrides = {}) {
        this._config = (0, config_js_1.resolveConfig)(overrides);
        this._currentPodId = this._config.podId;
        this._podId = this._config.podId;
        this.auth = new auth_js_1.AuthManager(this._config.apiUrl, this._config.authUrl);
        this._http = new http_js_1.HttpClient(this._config.apiUrl, this.auth);
        const podIdFn = () => {
            if (!this._currentPodId) {
                throw new Error("pod_id is required. Pass podId in the constructor or call client.setPodId(id).");
            }
            return this._currentPodId;
        };
        this.datastores = new datastores_js_1.DatastoresNamespace(this._http, podIdFn);
        this.tables = new tables_js_1.TablesNamespace(this._http, podIdFn);
        this.records = new records_js_1.RecordsNamespace(this._http, podIdFn);
        this.files = new files_js_1.FilesNamespace(this._http, podIdFn);
        this.functions = new functions_js_1.FunctionsNamespace(this._http, podIdFn);
        this.agents = new agents_js_1.AgentsNamespace(this._http, podIdFn);
        this.tasks = new tasks_js_1.TasksNamespace(this._http, podIdFn);
        this.assistants = new assistants_js_1.AssistantsNamespace(this._http, podIdFn);
        this.conversations = new assistants_js_1.ConversationsNamespace(this._http, podIdFn);
        this.workflows = new workflows_js_1.WorkflowsNamespace(this._http, podIdFn);
        this.desks = new desks_js_1.DesksNamespace(this._http, podIdFn);
        this.integrations = new integrations_js_1.IntegrationsNamespace(this._http);
    }
    /** Change the active pod ID for subsequent calls. */
    setPodId(podId) {
        this._currentPodId = podId;
    }
    /** Return a new client scoped to a specific pod, sharing auth state. */
    withPod(podId) {
        return new LemmaClient({ ...this._config, podId });
    }
    get podId() {
        return this._currentPodId;
    }
    get apiUrl() {
        return this._config.apiUrl;
    }
    get authUrl() {
        return this._config.authUrl;
    }
    /**
     * Initialize the client by checking auth state.
     * Call this once on app startup (or let AuthGuard handle it).
     */
    async initialize() {
        return this.auth.checkAuth();
    }
    /** Raw HTTP request — escape hatch for operations not covered by namespaces. */
    request(method, path, options) {
        return this._http.request(method, path, options);
    }
}
exports.LemmaClient = LemmaClient;

},
"./config.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfig = resolveConfig;
function fromEnv(key) {
    // Vite: import.meta.env.VITE_*
    // CRA / webpack: process.env.REACT_APP_*
    // Node: process.env.*
    try {
        // @ts-ignore — import.meta is valid in ESM/Vite builds; try/catch guards CJS bundles
        const meta = import.meta.env; // eslint-disable-line
        if (meta) {
            return (meta[`VITE_LEMMA_${key}`] ??
                meta[`REACT_APP_LEMMA_${key}`] ??
                meta[`LEMMA_${key}`]);
        }
    }
    catch {
        // not available in CJS/browser bundle context
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const env = globalThis.process?.env;
        if (env) {
            return env[`LEMMA_${key}`];
        }
    }
    catch {
        // not available
    }
    return undefined;
}
function windowConfig() {
    if (typeof window !== "undefined" && window.__LEMMA_CONFIG__) {
        return window.__LEMMA_CONFIG__;
    }
    return {};
}
function resolveConfig(overrides = {}) {
    const win = windowConfig();
    const apiUrl = overrides.apiUrl ??
        win.apiUrl ??
        fromEnv("API_URL") ??
        "http://localhost:8000";
    const authUrl = overrides.authUrl ??
        win.authUrl ??
        fromEnv("AUTH_URL") ??
        "http://localhost:3000";
    const podId = overrides.podId ??
        win.podId ??
        fromEnv("POD_ID");
    return { apiUrl: apiUrl.replace(/\/$/, ""), authUrl: authUrl.replace(/\/$/, ""), podId };
}

},
"./auth.js": function (module, exports, require) {
"use strict";
/**
 * Auth module — cookie-based auth (production) with Bearer token fallback
 * for agent/dev testing.
 *
 * Auth resolution order on init:
 * 1. ?lemma_token=<token> query param  (stored in memory for session)
 * 2. localStorage.getItem("lemma_token")
 * 3. Session cookie (credentials: "include") — production path
 *
 * If a token is found in (1) or (2), all requests use Authorization: Bearer <token>.
 * Otherwise requests rely on cookies, and the server must set the session cookie
 * after the user authenticates at the auth service.
 *
 * Auth state is determined by calling GET /users/me (user.current.get).
 * 401 → unauthenticated. 200 → authenticated.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = void 0;
const LOCALSTORAGE_TOKEN_KEY = "lemma_token";
const QUERY_PARAM_TOKEN_KEY = "lemma_token";
function detectInjectedToken() {
    if (typeof window === "undefined")
        return null;
    // 1. Query param — highest priority, persist to sessionStorage for this session
    try {
        const params = new URLSearchParams(window.location.search);
        const qpToken = params.get(QUERY_PARAM_TOKEN_KEY);
        if (qpToken) {
            try {
                sessionStorage.setItem(LOCALSTORAGE_TOKEN_KEY, qpToken);
            }
            catch { /* ignore */ }
            return qpToken;
        }
    }
    catch { /* ignore */ }
    // 2. sessionStorage — survives HMR and same-tab navigation
    try {
        const stored = sessionStorage.getItem(LOCALSTORAGE_TOKEN_KEY);
        if (stored)
            return stored;
    }
    catch { /* ignore */ }
    // 3. localStorage — set manually by dev/agent for persistent testing
    try {
        const stored = localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);
        if (stored)
            return stored;
    }
    catch { /* ignore */ }
    return null;
}
class AuthManager {
    constructor(apiUrl, authUrl) {
        this.state = { status: "loading", user: null };
        this.listeners = new Set();
        this.apiUrl = apiUrl;
        this.authUrl = authUrl;
        this.injectedToken = detectInjectedToken();
    }
    /** Whether requests will use an injected Bearer token (testing mode). */
    get isTokenMode() {
        return this.injectedToken !== null;
    }
    /** The current auth state. */
    getState() {
        return this.state;
    }
    /** True if currently authenticated (status === "authenticated"). */
    isAuthenticated() {
        return this.state.status === "authenticated";
    }
    /** Subscribe to auth state changes. Returns an unsubscribe function. */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    notify() {
        this.listeners.forEach((l) => l(this.state));
    }
    setState(state) {
        this.state = state;
        this.notify();
    }
    /**
     * Build request headers for an API call.
     * Uses Bearer token if one was injected, otherwise omits Authorization
     * and lets cookies carry the session.
     */
    getRequestInit(init = {}) {
        const headers = {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...init.headers,
        };
        if (this.injectedToken) {
            headers["Authorization"] = `Bearer ${this.injectedToken}`;
        }
        return {
            ...init,
            credentials: this.injectedToken ? "omit" : "include",
            headers,
        };
    }
    /**
     * Call GET /users/me to determine auth state.
     * Sets internal state and notifies listeners.
     */
    async checkAuth() {
        this.setState({ status: "loading", user: null });
        try {
            const response = await fetch(`${this.apiUrl}/users/me`, this.getRequestInit({ method: "GET" }));
            // Only 401 means not authenticated — 403 means authenticated but forbidden
            if (response.status === 401) {
                const next = { status: "unauthenticated", user: null };
                this.setState(next);
                return next;
            }
            if (!response.ok) {
                // For non-401 errors on /users/me, treat as unauthenticated (conservative)
                const next = { status: "unauthenticated", user: null };
                this.setState(next);
                return next;
            }
            const user = (await response.json());
            const next = { status: "authenticated", user };
            this.setState(next);
            return next;
        }
        catch {
            const next = { status: "unauthenticated", user: null };
            this.setState(next);
            return next;
        }
    }
    /**
     * Mark the session as unauthenticated (e.g. after a 401 response).
     * Does NOT redirect — call redirectToAuth() explicitly if desired.
     */
    markUnauthenticated() {
        this.setState({ status: "unauthenticated", user: null });
    }
    /**
     * Redirect to the auth service, passing the current URL as redirect_uri.
     * After the user authenticates, the auth service should redirect back to
     * the original URL and set the session cookie.
     */
    redirectToAuth() {
        if (typeof window === "undefined") {
            return;
        }
        const redirectUri = encodeURIComponent(window.location.href);
        window.location.href = `${this.authUrl}?redirect_uri=${redirectUri}`;
    }
}
exports.AuthManager = AuthManager;

},
"./http.js": function (module, exports, require) {
"use strict";
/**
 * Thin HTTP layer that wraps fetch with auth injection, error handling,
 * and automatic 401→unauthenticated state propagation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(statusCode, message, code, details, rawResponse) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.rawResponse = rawResponse;
        this.name = "ApiError";
    }
}
exports.ApiError = ApiError;
class HttpClient {
    constructor(apiUrl, auth) {
        this.apiUrl = apiUrl;
        this.auth = auth;
    }
    async parseError(response) {
        let message = response.statusText || "Request failed";
        let code;
        let details;
        let raw = null;
        try {
            const body = await response.json();
            raw = body;
            if (body && typeof body === "object") {
                message = body.message ?? message;
                code = body.code;
                details = body.details;
            }
        }
        catch {
            // non-JSON error body
        }
        return new ApiError(response.status, message, code, details, raw);
    }
    async request(method, path, options = {}) {
        let url = `${this.apiUrl}${path}`;
        if (options.params) {
            const qs = Object.entries(options.params)
                .filter(([, v]) => v !== undefined && v !== null)
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
                .join("&");
            if (qs) {
                url += `?${qs}`;
            }
        }
        const initBase = { method };
        if (options.body !== undefined && !options.isFormData) {
            initBase.body = JSON.stringify(options.body);
        }
        else if (options.isFormData && options.body instanceof FormData) {
            initBase.body = options.body;
        }
        // For FormData, let the browser set Content-Type with boundary
        const init = options.isFormData
            ? {
                ...this.auth.getRequestInit(initBase),
                headers: Object.fromEntries(Object.entries(this.auth.getRequestInit(initBase).headers ?? {}).filter(([k]) => k.toLowerCase() !== "content-type")),
            }
            : this.auth.getRequestInit(initBase);
        const response = await fetch(url, init);
        // Only 401 means the session is gone — 403 is a permission/RLS error, not an auth failure
        if (response.status === 401) {
            this.auth.markUnauthenticated();
        }
        if (!response.ok) {
            throw await this.parseError(response);
        }
        if (response.status === 204) {
            return undefined;
        }
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
            return response.json();
        }
        return response.text();
    }
    async requestBytes(method, path) {
        const url = `${this.apiUrl}${path}`;
        const response = await fetch(url, this.auth.getRequestInit({ method }));
        if (response.status === 401) {
            this.auth.markUnauthenticated();
        }
        if (!response.ok) {
            throw await this.parseError(response);
        }
        return response.blob();
    }
}
exports.HttpClient = HttpClient;

},
"./namespaces/datastores.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatastoresNamespace = void 0;
class DatastoresNamespace {
    constructor(http, podId) {
        this.http = http;
        this.podId = podId;
    }
    list(options = {}) {
        return this.http.request("GET", `/pods/${this.podId()}/datastores`, { params: options });
    }
    create(payload) {
        return this.http.request("POST", `/pods/${this.podId()}/datastores`, { body: payload });
    }
    get(name) {
        return this.http.request("GET", `/pods/${this.podId()}/datastores/${name}`);
    }
    update(name, payload) {
        return this.http.request("PATCH", `/pods/${this.podId()}/datastores/${name}`, { body: payload });
    }
    delete(name) {
        return this.http.request("DELETE", `/pods/${this.podId()}/datastores/${name}`);
    }
    query(name, query) {
        return this.http.request("POST", `/pods/${this.podId()}/datastores/${name}/query`, { body: { query } });
    }
}
exports.DatastoresNamespace = DatastoresNamespace;

},
"./namespaces/tables.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TablesNamespace = void 0;
class TablesNamespace {
    constructor(http, podId) {
        this.http = http;
        this.podId = podId;
        this.columns = {
            add: (datastore, tableName, column) => this.http.request("POST", `/pods/${this.podId()}/datastores/${datastore}/tables/${tableName}/columns`, { body: { column } }),
            remove: (datastore, tableName, columnName) => this.http.request("DELETE", `/pods/${this.podId()}/datastores/${datastore}/tables/${tableName}/columns/${columnName}`),
        };
    }
    list(datastore, options = {}) {
        return this.http.request("GET", `/pods/${this.podId()}/datastores/${datastore}/tables`, { params: options });
    }
    create(datastore, payload) {
        return this.http.request("POST", `/pods/${this.podId()}/datastores/${datastore}/tables`, { body: payload });
    }
    get(datastore, tableName) {
        return this.http.request("GET", `/pods/${this.podId()}/datastores/${datastore}/tables/${tableName}`);
    }
    update(datastore, tableName, payload) {
        return this.http.request("PATCH", `/pods/${this.podId()}/datastores/${datastore}/tables/${tableName}`, { body: payload });
    }
    delete(datastore, tableName) {
        return this.http.request("DELETE", `/pods/${this.podId()}/datastores/${datastore}/tables/${tableName}`);
    }
}
exports.TablesNamespace = TablesNamespace;

},
"./namespaces/records.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordsNamespace = void 0;
class RecordsNamespace {
    constructor(http, podId) {
        this.http = http;
        this.podId = podId;
        this.bulk = {
            create: (datastore, table, records) => this.http.request("POST", `${this.base(datastore, table)}/bulk`, { body: { records } }),
            update: (datastore, table, records) => this.http.request("PATCH", `${this.base(datastore, table)}/bulk`, { body: { records } }),
            delete: (datastore, table, recordIds) => this.http.request("DELETE", `${this.base(datastore, table)}/bulk`, { body: { record_ids: recordIds } }),
        };
    }
    base(datastore, table) {
        return `/pods/${this.podId()}/datastores/${datastore}/tables/${table}/records`;
    }
    list(datastore, table, options = {}) {
        const { filters, sort, limit, offset, pageToken } = options;
        if (filters || sort) {
            // Use query endpoint for structured filters
            return this.http.request("POST", `/pods/${this.podId()}/datastores/${datastore}/tables/${table}/records/query`, {
                body: { filters, sort, limit, offset, page_token: pageToken },
            });
        }
        return this.http.request("GET", this.base(datastore, table), {
            params: { limit, offset, page_token: pageToken },
        });
    }
    create(datastore, table, data) {
        return this.http.request("POST", this.base(datastore, table), { body: { data } });
    }
    get(datastore, table, recordId) {
        return this.http.request("GET", `${this.base(datastore, table)}/${recordId}`);
    }
    update(datastore, table, recordId, data) {
        return this.http.request("PATCH", `${this.base(datastore, table)}/${recordId}`, { body: { data } });
    }
    delete(datastore, table, recordId) {
        return this.http.request("DELETE", `${this.base(datastore, table)}/${recordId}`);
    }
    query(datastore, table, payload) {
        return this.http.request("POST", `/pods/${this.podId()}/datastores/${datastore}/tables/${table}/records/query`, { body: payload });
    }
}
exports.RecordsNamespace = RecordsNamespace;

},
"./namespaces/files.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesNamespace = void 0;
class FilesNamespace {
    constructor(http, podId) {
        this.http = http;
        this.podId = podId;
        this.folder = {
            create: (datastore, name, options = {}) => this.http.request("POST", `${this.base(datastore)}/folders`, {
                body: { name, description: options.description, parent_id: options.parentId },
            }),
        };
    }
    base(datastore) {
        return `/pods/${this.podId()}/datastores/${datastore}/files`;
    }
    list(datastore, options = {}) {
        const { parentId, ...rest } = options;
        return this.http.request("GET", this.base(datastore), { params: { ...rest, parent_id: parentId } });
    }
    get(datastore, fileId) {
        return this.http.request("GET", `${this.base(datastore)}/${fileId}`);
    }
    delete(datastore, fileId) {
        return this.http.request("DELETE", `${this.base(datastore)}/${fileId}`);
    }
    search(datastore, query, options = {}) {
        return this.http.request("POST", `${this.base(datastore)}/search`, {
            body: { query, limit: options.limit ?? 10, search_method: options.searchMethod ?? "HYBRID" },
        });
    }
    download(datastore, fileId) {
        return this.http.requestBytes("GET", `${this.base(datastore)}/${fileId}/download`);
    }
    upload(datastore, file, options = {}) {
        const form = new FormData();
        form.append("data", file, file.name);
        if (options.parentId)
            form.append("parent_id", options.parentId);
        if (options.description)
            form.append("description", options.description);
        form.append("search_enabled", String(options.searchEnabled ?? true));
        return this.http.request("POST", this.base(datastore), { body: form, isFormData: true });
    }
    update(datastore, fileId, options = {}) {
        const form = new FormData();
        if (options.file)
            form.append("data", options.file, options.file.name);
        if (options.name)
            form.append("name", options.name);
        if (options.description)
            form.append("description", options.description);
        if (options.parentId)
            form.append("parent_id", options.parentId);
        if (options.searchEnabled !== undefined)
            form.append("search_enabled", String(options.searchEnabled));
        return this.http.request("PATCH", `${this.base(datastore)}/${fileId}`, { body: form, isFormData: true });
    }
}
exports.FilesNamespace = FilesNamespace;

},
"./namespaces/functions.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionsNamespace = void 0;
class FunctionsNamespace {
    constructor(http, podId) {
        this.http = http;
        this.podId = podId;
        this.runs = {
            create: (name, options = {}) => this.http.request("POST", `/pods/${this.podId()}/functions/${name}/run`, {
                body: { input_data: options.input, runtime_account_ids: options.runtimeAccounts },
            }),
            list: (name, params = {}) => this.http.request("GET", `/pods/${this.podId()}/functions/${name}/runs`, { params }),
            get: (name, runId) => this.http.request("GET", `/pods/${this.podId()}/functions/${name}/runs/${runId}`),
        };
    }
    list(options = {}) {
        return this.http.request("GET", `/pods/${this.podId()}/functions`, { params: options });
    }
    create(payload) {
        return this.http.request("POST", `/pods/${this.podId()}/functions`, { body: payload });
    }
    get(name) {
        return this.http.request("GET", `/pods/${this.podId()}/functions/${name}`);
    }
    update(name, payload) {
        return this.http.request("PATCH", `/pods/${this.podId()}/functions/${name}`, { body: payload });
    }
    delete(name) {
        return this.http.request("DELETE", `/pods/${this.podId()}/functions/${name}`);
    }
}
exports.FunctionsNamespace = FunctionsNamespace;

},
"./namespaces/agents.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsNamespace = void 0;
class AgentsNamespace {
    constructor(http, podId) {
        this.http = http;
        this.podId = podId;
    }
    list(options = {}) {
        return this.http.request("GET", `/pods/${this.podId()}/agents`, { params: options });
    }
    create(payload) {
        return this.http.request("POST", `/pods/${this.podId()}/agents`, { body: payload });
    }
    get(agentId) {
        return this.http.request("GET", `/pods/${this.podId()}/agents/${agentId}`);
    }
    update(agentId, payload) {
        return this.http.request("PATCH", `/pods/${this.podId()}/agents/${agentId}`, { body: payload });
    }
    delete(agentId) {
        return this.http.request("DELETE", `/pods/${this.podId()}/agents/${agentId}`);
    }
}
exports.AgentsNamespace = AgentsNamespace;

},
"./namespaces/tasks.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksNamespace = void 0;
class TasksNamespace {
    constructor(http, podId) {
        this.http = http;
        this.podId = podId;
        this.messages = {
            list: (taskId, options = {}) => this.http.request("GET", `/pods/${this.podId()}/tasks/${taskId}/messages`, { params: options }),
            add: (taskId, content) => this.http.request("POST", `/pods/${this.podId()}/tasks/${taskId}/messages`, { body: { content } }),
        };
    }
    list(options = {}) {
        return this.http.request("GET", `/pods/${this.podId()}/tasks`, { params: options });
    }
    create(options) {
        return this.http.request("POST", `/pods/${this.podId()}/tasks`, {
            body: { agent_id: options.agentId, input_data: options.input, runtime_account_ids: options.runtimeAccounts },
        });
    }
    get(taskId) {
        return this.http.request("GET", `/pods/${this.podId()}/tasks/${taskId}`);
    }
    stop(taskId) {
        return this.http.request("POST", `/pods/${this.podId()}/tasks/${taskId}/stop`);
    }
}
exports.TasksNamespace = TasksNamespace;

},
"./namespaces/assistants.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsNamespace = exports.AssistantsNamespace = void 0;
class AssistantsNamespace {
    constructor(http, podId) {
        this.http = http;
        this.podId = podId;
    }
    list(options = {}) {
        return this.http.request("GET", `/pods/${this.podId()}/assistants`, { params: options });
    }
    create(payload) {
        return this.http.request("POST", `/pods/${this.podId()}/assistants`, { body: payload });
    }
    get(assistantId) {
        return this.http.request("GET", `/pods/${this.podId()}/assistants/${assistantId}`);
    }
    update(assistantId, payload) {
        return this.http.request("PATCH", `/pods/${this.podId()}/assistants/${assistantId}`, { body: payload });
    }
    delete(assistantId) {
        return this.http.request("DELETE", `/pods/${this.podId()}/assistants/${assistantId}`);
    }
}
exports.AssistantsNamespace = AssistantsNamespace;
class ConversationsNamespace {
    constructor(http, podId) {
        this.http = http;
        this.podId = podId;
        this.messages = {
            list: (conversationId, options = {}) => this.http.request("GET", `/pods/${this.podId()}/conversations/${conversationId}/messages`, { params: options }),
            send: (conversationId, payload) => this.http.request("POST", `/pods/${this.podId()}/conversations/${conversationId}/messages`, { body: payload }),
        };
    }
    list(options = {}) {
        return this.http.request("GET", `/pods/${this.podId()}/conversations`, { params: options });
    }
    create(payload) {
        return this.http.request("POST", `/pods/${this.podId()}/conversations`, { body: payload });
    }
    get(conversationId) {
        return this.http.request("GET", `/pods/${this.podId()}/conversations/${conversationId}`);
    }
}
exports.ConversationsNamespace = ConversationsNamespace;

},
"./namespaces/workflows.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsNamespace = void 0;
class WorkflowsNamespace {
    constructor(http, podId) {
        this.http = http;
        this.podId = podId;
        this.graph = {
            update: (flowId, graph) => this.http.request("PUT", `/pods/${this.podId()}/flows/${flowId}/graph`, { body: graph }),
        };
        this.installs = {
            create: (flowId, payload = {}) => this.http.request("POST", `/pods/${this.podId()}/flows/${flowId}/installs`, { body: payload }),
            delete: (flowId, installId) => this.http.request("DELETE", `/pods/${this.podId()}/flows/${flowId}/installs/${installId}`),
        };
        this.runs = {
            start: (flowId, inputs = {}) => this.http.request("POST", `/pods/${this.podId()}/flows/${flowId}/runs`, { body: inputs }),
            list: (flowId, options = {}) => this.http.request("GET", `/pods/${this.podId()}/flows/${flowId}/runs`, { params: options }),
            get: (podId, runId) => this.http.request("GET", `/pods/${podId}/flows/runs/${runId}`),
            resume: (podId, runId, inputs = {}) => this.http.request("POST", `/pods/${podId}/flows/runs/${runId}/resume`, { body: inputs }),
        };
    }
    list(options = {}) {
        return this.http.request("GET", `/pods/${this.podId()}/flows`, { params: options });
    }
    create(payload) {
        return this.http.request("POST", `/pods/${this.podId()}/flows`, { body: payload });
    }
    get(flowId) {
        return this.http.request("GET", `/pods/${this.podId()}/flows/${flowId}`);
    }
    update(flowId, payload) {
        return this.http.request("PATCH", `/pods/${this.podId()}/flows/${flowId}`, { body: payload });
    }
    delete(flowId) {
        return this.http.request("DELETE", `/pods/${this.podId()}/flows/${flowId}`);
    }
}
exports.WorkflowsNamespace = WorkflowsNamespace;

},
"./namespaces/desks.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesksNamespace = void 0;
class DesksNamespace {
    constructor(http, podId) {
        this.http = http;
        this.podId = podId;
        this.html = {
            get: (name) => this.http.request("GET", `/pods/${this.podId()}/desks/${name}/html`),
        };
        this.bundle = {
            upload: (name, form) => this.http.request("POST", `/pods/${this.podId()}/desks/${name}/bundle`, { body: form, isFormData: true }),
        };
        this.source = {
            download: (name) => this.http.requestBytes("GET", `/pods/${this.podId()}/desks/${name}/source`),
        };
    }
    list(options = {}) {
        return this.http.request("GET", `/pods/${this.podId()}/desks`, { params: options });
    }
    create(payload) {
        return this.http.request("POST", `/pods/${this.podId()}/desks`, { body: payload });
    }
    get(name) {
        return this.http.request("GET", `/pods/${this.podId()}/desks/${name}`);
    }
    update(name, payload) {
        return this.http.request("PATCH", `/pods/${this.podId()}/desks/${name}`, { body: payload });
    }
    delete(name) {
        return this.http.request("DELETE", `/pods/${this.podId()}/desks/${name}`);
    }
}
exports.DesksNamespace = DesksNamespace;

},
"./namespaces/integrations.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsNamespace = void 0;
class IntegrationsNamespace {
    constructor(http) {
        this.http = http;
        this.operations = {
            list: (applicationId) => this.http.request("GET", `/integrations/applications/${applicationId}/operations`),
            get: (applicationId, operationName) => this.http.request("GET", `/integrations/applications/${applicationId}/operations/${operationName}`),
            execute: (applicationId, operationName, payload, accountId) => this.http.request("POST", `/integrations/applications/${applicationId}/operations/${operationName}/execute`, {
                body: { payload, account_id: accountId },
            }),
            descriptor: (applicationId) => this.http.request("GET", `/integrations/applications/${applicationId}/operations/descriptor`),
        };
        this.triggers = {
            list: (options = {}) => this.http.request("GET", "/integrations/applications/triggers", { params: { application_id: options.applicationId } }),
            get: (triggerId) => this.http.request("GET", `/integrations/applications/triggers/${triggerId}`),
        };
        this.accounts = {
            list: (options = {}) => this.http.request("GET", "/integrations/accounts", { params: { application_id: options.applicationId } }),
            get: (accountId) => this.http.request("GET", `/integrations/accounts/${accountId}`),
            delete: (accountId) => this.http.request("DELETE", `/integrations/accounts/${accountId}`),
        };
    }
    list(options = {}) {
        return this.http.request("GET", "/integrations/applications", { params: options });
    }
    get(applicationId) {
        return this.http.request("GET", `/integrations/applications/${applicationId}`);
    }
    createConnectRequest(applicationId, payload = {}) {
        return this.http.request("POST", "/integrations/connect-requests", { body: { application_id: applicationId, ...payload } });
    }
}
exports.IntegrationsNamespace = IntegrationsNamespace;

}
  };

  const moduleCache = {};
  const requireModule = (id) => {
    if (moduleCache[id]) {
      return moduleCache[id].exports;
    }
    const factory = modules[id];
    if (!factory) {
      throw new Error("Module not found: " + id);
    }
    const module = { exports: {} };
    moduleCache[id] = module;
    factory(module, module.exports, requireModule);
    return module.exports;
  };

  const entry = requireModule("./browser.js");
  const globalScope = typeof window !== "undefined" ? window : globalThis;
  globalScope.LemmaClient = entry;
})();
