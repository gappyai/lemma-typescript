(() => {
  const modules = {
"./browser.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.resolveSafeRedirectUri = exports.buildAuthUrl = exports.AuthManager = exports.LemmaClient = void 0;
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
Object.defineProperty(exports, "buildAuthUrl", { enumerable: true, get: function () { return auth_js_1.buildAuthUrl; } });
Object.defineProperty(exports, "resolveSafeRedirectUri", { enumerable: true, get: function () { return auth_js_1.resolveSafeRedirectUri; } });
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
const generated_js_1 = require("./generated.js");
const http_js_1 = require("./http.js");
const agents_js_1 = require("./namespaces/agents.js");
const assistants_js_1 = require("./namespaces/assistants.js");
const datastores_js_1 = require("./namespaces/datastores.js");
const desks_js_1 = require("./namespaces/desks.js");
const files_js_1 = require("./namespaces/files.js");
const functions_js_1 = require("./namespaces/functions.js");
const icons_js_1 = require("./namespaces/icons.js");
const integrations_js_1 = require("./namespaces/integrations.js");
const organizations_js_1 = require("./namespaces/organizations.js");
const pod_members_js_1 = require("./namespaces/pod-members.js");
const pods_js_1 = require("./namespaces/pods.js");
const pod_surfaces_js_1 = require("./namespaces/pod-surfaces.js");
const records_js_1 = require("./namespaces/records.js");
const resources_js_1 = require("./namespaces/resources.js");
const tables_js_1 = require("./namespaces/tables.js");
const tasks_js_1 = require("./namespaces/tasks.js");
const users_js_1 = require("./namespaces/users.js");
const workflows_js_1 = require("./namespaces/workflows.js");
class LemmaClient {
    constructor(overrides = {}, internalOptions = {}) {
        this._config = (0, config_js_1.resolveConfig)(overrides);
        this._currentPodId = this._config.podId;
        this._podId = this._config.podId;
        this.auth = internalOptions.authManager ?? new auth_js_1.AuthManager(this._config.apiUrl, this._config.authUrl);
        this._http = new http_js_1.HttpClient(this._config.apiUrl, this.auth);
        this._generated = new generated_js_1.GeneratedClientAdapter(this._config.apiUrl, this.auth);
        const podIdFn = () => {
            if (!this._currentPodId) {
                throw new Error("pod_id is required. Pass podId in the constructor or call client.setPodId(id).");
            }
            return this._currentPodId;
        };
        this.datastores = new datastores_js_1.DatastoresNamespace(this._generated, podIdFn);
        this.tables = new tables_js_1.TablesNamespace(this._generated, podIdFn);
        this.records = new records_js_1.RecordsNamespace(this._generated, this._http, podIdFn);
        this.files = new files_js_1.FilesNamespace(this._generated, this._http, podIdFn);
        this.functions = new functions_js_1.FunctionsNamespace(this._generated, podIdFn);
        this.agents = new agents_js_1.AgentsNamespace(this._generated, podIdFn);
        this.tasks = new tasks_js_1.TasksNamespace(this._http, podIdFn);
        this.assistants = new assistants_js_1.AssistantsNamespace(this._http, podIdFn);
        this.conversations = new assistants_js_1.ConversationsNamespace(this._http, podIdFn);
        this.workflows = new workflows_js_1.WorkflowsNamespace(this._generated, this._http, podIdFn);
        this.desks = new desks_js_1.DesksNamespace(this._generated, this._http, podIdFn);
        this.integrations = new integrations_js_1.IntegrationsNamespace(this._generated);
        this.resources = new resources_js_1.ResourcesNamespace(this._http);
        this.users = new users_js_1.UsersNamespace(this._generated);
        this.icons = new icons_js_1.IconsNamespace(this._generated);
        this.pods = new pods_js_1.PodsNamespace(this._generated, this._http);
        this.podMembers = new pod_members_js_1.PodMembersNamespace(this._generated);
        this.organizations = new organizations_js_1.OrganizationsNamespace(this._generated, this._http);
        this.podSurfaces = new pod_surfaces_js_1.PodSurfacesNamespace(this._generated);
    }
    /** Change the active pod ID for subsequent calls. */
    setPodId(podId) {
        this._currentPodId = podId;
    }
    /** Return a new client scoped to a specific pod, sharing auth state. */
    withPod(podId) {
        return new LemmaClient({ ...this._config, podId }, { authManager: this.auth });
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
 * after the user authenticates at the auth service. In cookie mode we initialise
 * the SuperTokens browser SDK so fetch/XHR automatically handles anti-CSRF and
 * refresh-token flows for mutating requests.
 *
 * Auth state is determined by calling GET /users/me (user.current.get).
 * 401 → unauthenticated. 200 → authenticated.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = void 0;
exports.buildAuthUrl = buildAuthUrl;
exports.resolveSafeRedirectUri = resolveSafeRedirectUri;
const session_1 = require("supertokens-web-js/recipe/session");
const supertokens_js_1 = require("./supertokens.js");
const DEFAULT_BLOCKED_REDIRECT_PATHS = ["/login", "/signup", "/auth"];
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
function normalizePath(path) {
    const trimmed = path.trim();
    if (!trimmed)
        return "/";
    if (trimmed === "/")
        return "/";
    const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return withLeadingSlash.endsWith("/") ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}
function resolveAuthPath(basePath, path) {
    const normalizedBase = normalizePath(basePath);
    if (!path || !path.trim()) {
        return normalizedBase;
    }
    const segment = path.trim().replace(/^\/+/, "");
    if (!segment) {
        return normalizedBase;
    }
    return `${normalizedBase}/${segment}`.replace(/\/{2,}/g, "/");
}
function isBlockedLocalPath(pathname, blockedPaths) {
    const normalizedPathname = normalizePath(pathname);
    return blockedPaths.some((rawBlockedPath) => {
        const blockedPath = normalizePath(rawBlockedPath);
        return normalizedPathname === blockedPath || normalizedPathname.startsWith(`${blockedPath}/`);
    });
}
function normalizeOrigin(rawOrigin) {
    const parsed = new URL(rawOrigin);
    return parsed.origin;
}
function buildAuthUrl(authUrl, options = {}) {
    const url = new URL(authUrl);
    url.pathname = resolveAuthPath(url.pathname, options.path);
    for (const [key, value] of Object.entries(options.params ?? {})) {
        if (value === null || value === undefined)
            continue;
        if (Array.isArray(value)) {
            url.searchParams.delete(key);
            for (const item of value) {
                url.searchParams.append(key, String(item));
            }
            continue;
        }
        url.searchParams.set(key, String(value));
    }
    if (options.mode === "signup") {
        url.searchParams.set("show", "signup");
    }
    if (options.redirectUri && options.redirectUri.trim()) {
        url.searchParams.set("redirect_uri", options.redirectUri);
    }
    return url.toString();
}
function resolveSafeRedirectUri(rawValue, options) {
    const siteOrigin = normalizeOrigin(options.siteOrigin);
    const blockedPaths = options.blockedPaths ?? DEFAULT_BLOCKED_REDIRECT_PATHS;
    const fallbackTarget = options.fallback ?? "/";
    const fallback = new URL(fallbackTarget, siteOrigin).toString();
    if (!rawValue || !rawValue.trim()) {
        return fallback;
    }
    try {
        const parsed = new URL(rawValue, siteOrigin);
        if (parsed.origin === siteOrigin && isBlockedLocalPath(parsed.pathname, blockedPaths)) {
            return fallback;
        }
        return parsed.toString();
    }
    catch {
        return fallback;
    }
}
class AuthManager {
    constructor(apiUrl, authUrl) {
        this.state = { status: "loading", user: null };
        this.listeners = new Set();
        this.apiUrl = apiUrl;
        this.authUrl = authUrl;
        this.injectedToken = detectInjectedToken();
        if (!this.injectedToken) {
            (0, supertokens_js_1.ensureCookieSessionSupport)(this.apiUrl, () => this.markUnauthenticated());
        }
    }
    /** Whether requests will use an injected Bearer token (testing mode). */
    get isTokenMode() {
        return this.injectedToken !== null;
    }
    /** The current injected Bearer token, if token-mode auth is active. */
    getBearerToken() {
        return this.injectedToken;
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
    assertBrowserContext() {
        if (typeof window === "undefined") {
            throw new Error("This auth method is only available in browser environments.");
        }
    }
    getCookie(name) {
        if (typeof document === "undefined")
            return undefined;
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
        return match ? decodeURIComponent(match[1]) : undefined;
    }
    clearInjectedToken() {
        this.injectedToken = null;
        if (typeof window === "undefined")
            return;
        try {
            sessionStorage.removeItem(LOCALSTORAGE_TOKEN_KEY);
        }
        catch {
            // ignore storage errors
        }
        try {
            localStorage.removeItem(LOCALSTORAGE_TOKEN_KEY);
        }
        catch {
            // ignore storage errors
        }
    }
    async rawSignOutViaBackend() {
        const antiCsrf = this.getCookie("sAntiCsrf");
        const headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
            rid: "anti-csrf",
            "fdi-version": "4.2",
            "st-auth-mode": "cookie",
        };
        if (antiCsrf) {
            headers["anti-csrf"] = antiCsrf;
        }
        const separator = this.apiUrl.includes("?") ? "&" : "?";
        const signOutUrl = `${this.apiUrl.replace(/\/$/, "")}/st/auth/signout${separator}superTokensDoNotDoInterception=true`;
        await fetch(signOutUrl, {
            method: "POST",
            credentials: "include",
            headers,
        });
    }
    /**
     * Check whether a cookie-backed session is active without mutating auth state.
     */
    async isAuthenticatedViaCookie() {
        if (this.injectedToken) {
            return this.isAuthenticated();
        }
        try {
            const response = await fetch(`${this.apiUrl}/users/me`, {
                method: "GET",
                credentials: "include",
                headers: { Accept: "application/json" },
            });
            return response.status !== 401;
        }
        catch {
            return false;
        }
    }
    /**
     * Return a browser access token from the session layer.
     * Throws if no token is available.
     */
    async getAccessToken() {
        if (this.injectedToken) {
            return this.injectedToken;
        }
        this.assertBrowserContext();
        (0, supertokens_js_1.ensureCookieSessionSupport)(this.apiUrl, () => this.markUnauthenticated());
        const token = await session_1.default.getAccessToken();
        if (!token) {
            throw new Error("Token unavailable");
        }
        return token;
    }
    /**
     * Force a refresh-token flow and return the new access token.
     */
    async refreshAccessToken() {
        if (this.injectedToken) {
            return this.injectedToken;
        }
        this.assertBrowserContext();
        (0, supertokens_js_1.ensureCookieSessionSupport)(this.apiUrl, () => this.markUnauthenticated());
        const refreshed = await session_1.default.attemptRefreshingSession();
        if (!refreshed) {
            throw new Error("Session refresh failed");
        }
        const token = await session_1.default.getAccessToken();
        if (!token) {
            throw new Error("Token unavailable");
        }
        return token;
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
     * Sign out the current user session.
     * Returns true when the session is no longer active.
     */
    async signOut() {
        if (this.injectedToken) {
            this.clearInjectedToken();
            this.markUnauthenticated();
            return true;
        }
        this.assertBrowserContext();
        (0, supertokens_js_1.ensureCookieSessionSupport)(this.apiUrl, () => this.markUnauthenticated());
        try {
            await session_1.default.signOut();
        }
        catch {
            // continue with raw fallback
        }
        if (await this.isAuthenticatedViaCookie()) {
            try {
                await this.rawSignOutViaBackend();
            }
            catch {
                // best effort fallback only
            }
        }
        const isAuthenticated = await this.isAuthenticatedViaCookie();
        if (!isAuthenticated) {
            this.markUnauthenticated();
        }
        return !isAuthenticated;
    }
    /**
     * Build auth URL for login/signup/custom auth sub-path.
     */
    getAuthUrl(options = {}) {
        return buildAuthUrl(this.authUrl, options);
    }
    /**
     * Redirect to the auth service, passing the current URL as redirect_uri.
     * After the user authenticates, the auth service should redirect back to
     * the original URL and set the session cookie.
     */
    redirectToAuth(options = {}) {
        if (typeof window === "undefined") {
            return;
        }
        const redirectUri = options.redirectUri ?? window.location.href;
        window.location.href = this.getAuthUrl({ ...options, redirectUri });
    }
}
exports.AuthManager = AuthManager;

},
"./supertokens.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCookieSessionSupport = ensureCookieSessionSupport;
const supertokens_web_js_1 = require("supertokens-web-js");
const session_1 = require("supertokens-web-js/recipe/session");
const APP_NAME = "Lemma";
const SESSION_API_SUFFIX = "/st/auth";
let initializedSignature = null;
const unauthorisedListeners = new Set();
function normalizePath(pathname) {
    const trimmed = pathname.trim();
    if (!trimmed || trimmed === "/") {
        return "";
    }
    const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return withLeadingSlash.endsWith("/") ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}
function resolveApiBase(apiUrl) {
    if (typeof window === "undefined") {
        throw new Error("Cookie session support requires a browser environment.");
    }
    if (/^https?:\/\//.test(apiUrl)) {
        const url = new URL(apiUrl);
        const apiPrefix = normalizePath(url.pathname);
        return {
            apiDomain: url.origin,
            apiBasePath: `${apiPrefix}${SESSION_API_SUFFIX}` || SESSION_API_SUFFIX,
        };
    }
    const apiPrefix = normalizePath(apiUrl);
    return {
        apiDomain: window.location.origin,
        apiBasePath: `${apiPrefix}${SESSION_API_SUFFIX}` || SESSION_API_SUFFIX,
    };
}
function ensureCookieSessionSupport(apiUrl, onUnauthorised) {
    if (typeof window === "undefined") {
        return;
    }
    if (onUnauthorised) {
        unauthorisedListeners.add(onUnauthorised);
    }
    const { apiDomain, apiBasePath } = resolveApiBase(apiUrl);
    const signature = `${apiDomain}${apiBasePath}`;
    if (initializedSignature === signature) {
        return;
    }
    if (initializedSignature !== null && initializedSignature !== signature) {
        console.warn(`[lemma] SuperTokens was already initialised for ${initializedSignature}; continuing with the existing session config.`);
        return;
    }
    supertokens_web_js_1.default.init({
        appInfo: {
            appName: APP_NAME,
            apiDomain,
            apiBasePath,
        },
        recipeList: [
            session_1.default.init({
                tokenTransferMethod: "cookie",
                onHandleEvent: (event) => {
                    if (event.action === "UNAUTHORISED") {
                        unauthorisedListeners.forEach((listener) => listener());
                    }
                },
            }),
        ],
    });
    initializedSignature = signature;
}

},
"./generated.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratedClientAdapter = void 0;
const http_js_1 = require("./http.js");
const ApiError_js_1 = require("./openapi_client/core/ApiError.js");
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
function extractMessage(body, fallback) {
    if (body && typeof body === "object" && typeof body.message === "string") {
        return body.message;
    }
    return fallback;
}
function extractCode(body) {
    if (body && typeof body === "object" && typeof body.code === "string") {
        return body.code;
    }
    return undefined;
}
function extractDetails(body) {
    if (body && typeof body === "object" && "details" in body) {
        return body.details;
    }
    return undefined;
}
class GeneratedClientAdapter {
    constructor(apiUrl, auth) {
        this.apiUrl = apiUrl;
        this.auth = auth;
    }
    configure() {
        OpenAPI_js_1.OpenAPI.BASE = this.apiUrl;
        OpenAPI_js_1.OpenAPI.WITH_CREDENTIALS = true;
        OpenAPI_js_1.OpenAPI.CREDENTIALS = this.auth.isTokenMode ? "omit" : "include";
        OpenAPI_js_1.OpenAPI.TOKEN = this.auth.getBearerToken() ?? undefined;
        OpenAPI_js_1.OpenAPI.HEADERS = undefined;
    }
    async request(operation) {
        this.configure();
        try {
            return await operation();
        }
        catch (error) {
            if (error instanceof ApiError_js_1.ApiError) {
                if (error.status === 401) {
                    this.auth.markUnauthenticated();
                }
                throw new http_js_1.ApiError(error.status, extractMessage(error.body, error.message), extractCode(error.body), extractDetails(error.body), error.body);
            }
            throw error;
        }
    }
}
exports.GeneratedClientAdapter = GeneratedClientAdapter;

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
    getBaseUrl() {
        return this.apiUrl;
    }
    buildUrl(path, params) {
        let url = `${this.apiUrl}${path}`;
        if (!params) {
            return url;
        }
        const qs = Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join("&");
        if (qs) {
            url += `?${qs}`;
        }
        return url;
    }
    mergeHeaders(base, extra) {
        if (!extra) {
            return base;
        }
        const merged = new Headers(base.headers ?? {});
        const extraHeaders = new Headers(extra);
        extraHeaders.forEach((value, key) => merged.set(key, value));
        return {
            ...base,
            headers: merged,
        };
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
                const record = body;
                if (typeof record.message === "string") {
                    message = record.message;
                }
                if (typeof record.code === "string") {
                    code = record.code;
                }
                details = record.details;
            }
        }
        catch {
            // non-JSON error body
        }
        return new ApiError(response.status, message, code, details, raw);
    }
    getRequestBody(options) {
        if (options.body === undefined) {
            return undefined;
        }
        if (options.isFormData && options.body instanceof FormData) {
            return options.body;
        }
        return JSON.stringify(options.body);
    }
    buildRequestInit(method, options) {
        const initBase = {
            method,
            body: this.getRequestBody(options),
            signal: options.signal,
        };
        // For FormData, let the browser set Content-Type with boundary.
        const withAuth = options.isFormData
            ? {
                ...this.auth.getRequestInit(initBase),
                headers: Object.fromEntries(Object.entries(this.auth.getRequestInit(initBase).headers ?? {}).filter(([key]) => key.toLowerCase() !== "content-type")),
            }
            : this.auth.getRequestInit(initBase);
        return this.mergeHeaders(withAuth, options.headers);
    }
    async request(method, path, options = {}) {
        const url = this.buildUrl(path, options.params);
        const init = this.buildRequestInit(method, options);
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
    async stream(path, options = {}) {
        const response = await fetch(this.buildUrl(path, options.params), this.buildRequestInit(options.method ?? "GET", {
            ...options,
            headers: {
                Accept: "text/event-stream",
                ...options.headers,
            },
        }));
        if (response.status === 401) {
            this.auth.markUnauthenticated();
        }
        if (!response.ok) {
            throw await this.parseError(response);
        }
        if (!response.body) {
            throw new ApiError(response.status, "Stream response had no body.");
        }
        return response.body;
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
"./openapi_client/core/ApiError.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    constructor(request, response, message) {
        super(message);
        this.name = 'ApiError';
        this.url = response.url;
        this.status = response.status;
        this.statusText = response.statusText;
        this.body = response.body;
        this.request = request;
    }
}
exports.ApiError = ApiError;

},
"./openapi_client/core/OpenAPI.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPI = void 0;
exports.OpenAPI = {
    BASE: '',
    VERSION: '1.0.0',
    WITH_CREDENTIALS: false,
    CREDENTIALS: 'include',
    TOKEN: undefined,
    USERNAME: undefined,
    PASSWORD: undefined,
    HEADERS: undefined,
    ENCODE_PATH: undefined,
};

},
"./namespaces/agents.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsNamespace = void 0;
const AgentsService_js_1 = require("./openapi_client/services/AgentsService.js");
class AgentsNamespace {
    constructor(client, podId) {
        this.client = client;
        this.podId = podId;
    }
    list(options = {}) {
        return this.client.request(() => AgentsService_js_1.AgentsService.agentList(this.podId(), options.limit ?? 100, options.pageToken));
    }
    create(payload) {
        return this.client.request(() => AgentsService_js_1.AgentsService.agentCreate(this.podId(), payload));
    }
    get(agentName) {
        return this.client.request(() => AgentsService_js_1.AgentsService.agentGet(this.podId(), agentName));
    }
    update(agentName, payload) {
        return this.client.request(() => AgentsService_js_1.AgentsService.agentUpdate(this.podId(), agentName, payload));
    }
    delete(agentName) {
        return this.client.request(() => AgentsService_js_1.AgentsService.agentDelete(this.podId(), agentName));
    }
}
exports.AgentsNamespace = AgentsNamespace;

},
"./openapi_client/services/AgentsService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class AgentsService {
    /**
     * Create Agent
     * Create a new agent in a pod
     * @param podId
     * @param requestBody
     * @returns AgentResponse Successful Response
     * @throws ApiError
     */
    static agentCreate(podId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/agents',
            path: {
                'pod_id': podId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Agents
     * List all agents in a pod
     * @param podId
     * @param limit
     * @param pageToken
     * @returns AgentListResponse Successful Response
     * @throws ApiError
     */
    static agentList(podId, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/agents',
            path: {
                'pod_id': podId,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Agent
     * Get an agent by name
     * @param podId
     * @param agentName
     * @returns AgentResponse Successful Response
     * @throws ApiError
     */
    static agentGet(podId, agentName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/agents/{agent_name}',
            path: {
                'pod_id': podId,
                'agent_name': agentName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Agent
     * Update an agent
     * @param podId
     * @param agentName
     * @param requestBody
     * @returns AgentResponse Successful Response
     * @throws ApiError
     */
    static agentUpdate(podId, agentName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/agents/{agent_name}',
            path: {
                'pod_id': podId,
                'agent_name': agentName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Agent
     * Delete an agent
     * @param podId
     * @param agentName
     * @returns AgentMessageResponse Successful Response
     * @throws ApiError
     */
    static agentDelete(podId, agentName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/agents/{agent_name}',
            path: {
                'pod_id': podId,
                'agent_name': agentName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.AgentsService = AgentsService;

},
"./openapi_client/core/request.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports.catchErrorCodes = exports.getResponseBody = exports.getResponseHeader = exports.sendRequest = exports.getRequestBody = exports.getHeaders = exports.resolve = exports.getFormData = exports.getQueryString = exports.base64 = exports.isFormData = exports.isBlob = exports.isStringWithValue = exports.isString = exports.isDefined = void 0;
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
const ApiError_js_1 = require("./openapi_client/core/ApiError.js");
const CancelablePromise_js_1 = require("./openapi_client/core/CancelablePromise.js");
const isDefined = (value) => {
    return value !== undefined && value !== null;
};
exports.isDefined = isDefined;
const isString = (value) => {
    return typeof value === 'string';
};
exports.isString = isString;
const isStringWithValue = (value) => {
    return (0, exports.isString)(value) && value !== '';
};
exports.isStringWithValue = isStringWithValue;
const isBlob = (value) => {
    return (typeof value === 'object' &&
        typeof value.type === 'string' &&
        typeof value.stream === 'function' &&
        typeof value.arrayBuffer === 'function' &&
        typeof value.constructor === 'function' &&
        typeof value.constructor.name === 'string' &&
        /^(Blob|File)$/.test(value.constructor.name) &&
        /^(Blob|File)$/.test(value[Symbol.toStringTag]));
};
exports.isBlob = isBlob;
const isFormData = (value) => {
    return value instanceof FormData;
};
exports.isFormData = isFormData;
const base64 = (str) => {
    try {
        return btoa(str);
    }
    catch (err) {
        // @ts-ignore
        return Buffer.from(str).toString('base64');
    }
};
exports.base64 = base64;
const getQueryString = (params) => {
    const qs = [];
    const append = (key, value) => {
        qs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    };
    const process = (key, value) => {
        if ((0, exports.isDefined)(value)) {
            if (Array.isArray(value)) {
                value.forEach(v => {
                    process(key, v);
                });
            }
            else if (typeof value === 'object') {
                Object.entries(value).forEach(([k, v]) => {
                    process(`${key}[${k}]`, v);
                });
            }
            else {
                append(key, value);
            }
        }
    };
    Object.entries(params).forEach(([key, value]) => {
        process(key, value);
    });
    if (qs.length > 0) {
        return `?${qs.join('&')}`;
    }
    return '';
};
exports.getQueryString = getQueryString;
const getUrl = (config, options) => {
    const encoder = config.ENCODE_PATH || encodeURI;
    const path = options.url
        .replace('{api-version}', config.VERSION)
        .replace(/{(.*?)}/g, (substring, group) => {
        if (options.path?.hasOwnProperty(group)) {
            return encoder(String(options.path[group]));
        }
        return substring;
    });
    const url = `${config.BASE}${path}`;
    if (options.query) {
        return `${url}${(0, exports.getQueryString)(options.query)}`;
    }
    return url;
};
const getFormData = (options) => {
    if (options.formData) {
        const formData = new FormData();
        const process = (key, value) => {
            if ((0, exports.isString)(value) || (0, exports.isBlob)(value)) {
                formData.append(key, value);
            }
            else {
                formData.append(key, JSON.stringify(value));
            }
        };
        Object.entries(options.formData)
            .filter(([_, value]) => (0, exports.isDefined)(value))
            .forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => process(key, v));
            }
            else {
                process(key, value);
            }
        });
        return formData;
    }
    return undefined;
};
exports.getFormData = getFormData;
const resolve = async (options, resolver) => {
    if (typeof resolver === 'function') {
        return resolver(options);
    }
    return resolver;
};
exports.resolve = resolve;
const getHeaders = async (config, options) => {
    const [token, username, password, additionalHeaders] = await Promise.all([
        (0, exports.resolve)(options, config.TOKEN),
        (0, exports.resolve)(options, config.USERNAME),
        (0, exports.resolve)(options, config.PASSWORD),
        (0, exports.resolve)(options, config.HEADERS),
    ]);
    const headers = Object.entries({
        Accept: 'application/json',
        ...additionalHeaders,
        ...options.headers,
    })
        .filter(([_, value]) => (0, exports.isDefined)(value))
        .reduce((headers, [key, value]) => ({
        ...headers,
        [key]: String(value),
    }), {});
    if ((0, exports.isStringWithValue)(token)) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if ((0, exports.isStringWithValue)(username) && (0, exports.isStringWithValue)(password)) {
        const credentials = (0, exports.base64)(`${username}:${password}`);
        headers['Authorization'] = `Basic ${credentials}`;
    }
    if (options.body !== undefined) {
        if (options.mediaType) {
            headers['Content-Type'] = options.mediaType;
        }
        else if ((0, exports.isBlob)(options.body)) {
            headers['Content-Type'] = options.body.type || 'application/octet-stream';
        }
        else if ((0, exports.isString)(options.body)) {
            headers['Content-Type'] = 'text/plain';
        }
        else if (!(0, exports.isFormData)(options.body)) {
            headers['Content-Type'] = 'application/json';
        }
    }
    return new Headers(headers);
};
exports.getHeaders = getHeaders;
const getRequestBody = (options) => {
    if (options.body !== undefined) {
        if (options.mediaType?.includes('/json')) {
            return JSON.stringify(options.body);
        }
        else if ((0, exports.isString)(options.body) || (0, exports.isBlob)(options.body) || (0, exports.isFormData)(options.body)) {
            return options.body;
        }
        else {
            return JSON.stringify(options.body);
        }
    }
    return undefined;
};
exports.getRequestBody = getRequestBody;
const sendRequest = async (config, options, url, body, formData, headers, onCancel) => {
    const controller = new AbortController();
    const request = {
        headers,
        body: body ?? formData,
        method: options.method,
        signal: controller.signal,
    };
    if (config.WITH_CREDENTIALS) {
        request.credentials = config.CREDENTIALS;
    }
    onCancel(() => controller.abort());
    return await fetch(url, request);
};
exports.sendRequest = sendRequest;
const getResponseHeader = (response, responseHeader) => {
    if (responseHeader) {
        const content = response.headers.get(responseHeader);
        if ((0, exports.isString)(content)) {
            return content;
        }
    }
    return undefined;
};
exports.getResponseHeader = getResponseHeader;
const getResponseBody = async (response) => {
    if (response.status !== 204) {
        try {
            const contentType = response.headers.get('Content-Type');
            if (contentType) {
                const jsonTypes = ['application/json', 'application/problem+json'];
                const isJSON = jsonTypes.some(type => contentType.toLowerCase().startsWith(type));
                if (isJSON) {
                    return await response.json();
                }
                else {
                    return await response.text();
                }
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    return undefined;
};
exports.getResponseBody = getResponseBody;
const catchErrorCodes = (options, result) => {
    const errors = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        ...options.errors,
    };
    const error = errors[result.status];
    if (error) {
        throw new ApiError_js_1.ApiError(options, result, error);
    }
    if (!result.ok) {
        const errorStatus = result.status ?? 'unknown';
        const errorStatusText = result.statusText ?? 'unknown';
        const errorBody = (() => {
            try {
                return JSON.stringify(result.body, null, 2);
            }
            catch (e) {
                return undefined;
            }
        })();
        throw new ApiError_js_1.ApiError(options, result, `Generic Error: status: ${errorStatus}; status text: ${errorStatusText}; body: ${errorBody}`);
    }
};
exports.catchErrorCodes = catchErrorCodes;
/**
 * Request method
 * @param config The OpenAPI configuration object
 * @param options The request options from the service
 * @returns CancelablePromise<T>
 * @throws ApiError
 */
const request = (config, options) => {
    return new CancelablePromise_js_1.CancelablePromise(async (resolve, reject, onCancel) => {
        try {
            const url = getUrl(config, options);
            const formData = (0, exports.getFormData)(options);
            const body = (0, exports.getRequestBody)(options);
            const headers = await (0, exports.getHeaders)(config, options);
            if (!onCancel.isCancelled) {
                const response = await (0, exports.sendRequest)(config, options, url, body, formData, headers, onCancel);
                const responseBody = await (0, exports.getResponseBody)(response);
                const responseHeader = (0, exports.getResponseHeader)(response, options.responseHeader);
                const result = {
                    url,
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    body: responseHeader ?? responseBody,
                };
                (0, exports.catchErrorCodes)(options, result);
                resolve(result.body);
            }
        }
        catch (error) {
            reject(error);
        }
    });
};
exports.request = request;

},
"./openapi_client/core/CancelablePromise.js": function (module, exports, require) {
"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CancelablePromise_isResolved, _CancelablePromise_isRejected, _CancelablePromise_isCancelled, _CancelablePromise_cancelHandlers, _CancelablePromise_promise, _CancelablePromise_resolve, _CancelablePromise_reject;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelablePromise = exports.CancelError = void 0;
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
    get isCancelled() {
        return true;
    }
}
exports.CancelError = CancelError;
class CancelablePromise {
    constructor(executor) {
        _CancelablePromise_isResolved.set(this, void 0);
        _CancelablePromise_isRejected.set(this, void 0);
        _CancelablePromise_isCancelled.set(this, void 0);
        _CancelablePromise_cancelHandlers.set(this, void 0);
        _CancelablePromise_promise.set(this, void 0);
        _CancelablePromise_resolve.set(this, void 0);
        _CancelablePromise_reject.set(this, void 0);
        __classPrivateFieldSet(this, _CancelablePromise_isResolved, false, "f");
        __classPrivateFieldSet(this, _CancelablePromise_isRejected, false, "f");
        __classPrivateFieldSet(this, _CancelablePromise_isCancelled, false, "f");
        __classPrivateFieldSet(this, _CancelablePromise_cancelHandlers, [], "f");
        __classPrivateFieldSet(this, _CancelablePromise_promise, new Promise((resolve, reject) => {
            __classPrivateFieldSet(this, _CancelablePromise_resolve, resolve, "f");
            __classPrivateFieldSet(this, _CancelablePromise_reject, reject, "f");
            const onResolve = (value) => {
                if (__classPrivateFieldGet(this, _CancelablePromise_isResolved, "f") || __classPrivateFieldGet(this, _CancelablePromise_isRejected, "f") || __classPrivateFieldGet(this, _CancelablePromise_isCancelled, "f")) {
                    return;
                }
                __classPrivateFieldSet(this, _CancelablePromise_isResolved, true, "f");
                if (__classPrivateFieldGet(this, _CancelablePromise_resolve, "f"))
                    __classPrivateFieldGet(this, _CancelablePromise_resolve, "f").call(this, value);
            };
            const onReject = (reason) => {
                if (__classPrivateFieldGet(this, _CancelablePromise_isResolved, "f") || __classPrivateFieldGet(this, _CancelablePromise_isRejected, "f") || __classPrivateFieldGet(this, _CancelablePromise_isCancelled, "f")) {
                    return;
                }
                __classPrivateFieldSet(this, _CancelablePromise_isRejected, true, "f");
                if (__classPrivateFieldGet(this, _CancelablePromise_reject, "f"))
                    __classPrivateFieldGet(this, _CancelablePromise_reject, "f").call(this, reason);
            };
            const onCancel = (cancelHandler) => {
                if (__classPrivateFieldGet(this, _CancelablePromise_isResolved, "f") || __classPrivateFieldGet(this, _CancelablePromise_isRejected, "f") || __classPrivateFieldGet(this, _CancelablePromise_isCancelled, "f")) {
                    return;
                }
                __classPrivateFieldGet(this, _CancelablePromise_cancelHandlers, "f").push(cancelHandler);
            };
            Object.defineProperty(onCancel, 'isResolved', {
                get: () => __classPrivateFieldGet(this, _CancelablePromise_isResolved, "f"),
            });
            Object.defineProperty(onCancel, 'isRejected', {
                get: () => __classPrivateFieldGet(this, _CancelablePromise_isRejected, "f"),
            });
            Object.defineProperty(onCancel, 'isCancelled', {
                get: () => __classPrivateFieldGet(this, _CancelablePromise_isCancelled, "f"),
            });
            return executor(onResolve, onReject, onCancel);
        }), "f");
    }
    get [(_CancelablePromise_isResolved = new WeakMap(), _CancelablePromise_isRejected = new WeakMap(), _CancelablePromise_isCancelled = new WeakMap(), _CancelablePromise_cancelHandlers = new WeakMap(), _CancelablePromise_promise = new WeakMap(), _CancelablePromise_resolve = new WeakMap(), _CancelablePromise_reject = new WeakMap(), Symbol.toStringTag)]() {
        return "Cancellable Promise";
    }
    then(onFulfilled, onRejected) {
        return __classPrivateFieldGet(this, _CancelablePromise_promise, "f").then(onFulfilled, onRejected);
    }
    catch(onRejected) {
        return __classPrivateFieldGet(this, _CancelablePromise_promise, "f").catch(onRejected);
    }
    finally(onFinally) {
        return __classPrivateFieldGet(this, _CancelablePromise_promise, "f").finally(onFinally);
    }
    cancel() {
        if (__classPrivateFieldGet(this, _CancelablePromise_isResolved, "f") || __classPrivateFieldGet(this, _CancelablePromise_isRejected, "f") || __classPrivateFieldGet(this, _CancelablePromise_isCancelled, "f")) {
            return;
        }
        __classPrivateFieldSet(this, _CancelablePromise_isCancelled, true, "f");
        if (__classPrivateFieldGet(this, _CancelablePromise_cancelHandlers, "f").length) {
            try {
                for (const cancelHandler of __classPrivateFieldGet(this, _CancelablePromise_cancelHandlers, "f")) {
                    cancelHandler();
                }
            }
            catch (error) {
                console.warn('Cancellation threw an error', error);
                return;
            }
        }
        __classPrivateFieldGet(this, _CancelablePromise_cancelHandlers, "f").length = 0;
        if (__classPrivateFieldGet(this, _CancelablePromise_reject, "f"))
            __classPrivateFieldGet(this, _CancelablePromise_reject, "f").call(this, new CancelError('Request aborted'));
    }
    get isCancelled() {
        return __classPrivateFieldGet(this, _CancelablePromise_isCancelled, "f");
    }
}
exports.CancelablePromise = CancelablePromise;

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
        return this.http.request("GET", `/pods/${this.podId()}/assistants`, {
            params: {
                limit: options.limit ?? 100,
                page_token: options.page_token,
            },
        });
    }
    create(payload) {
        return this.http.request("POST", `/pods/${this.podId()}/assistants`, { body: payload });
    }
    get(assistantName) {
        return this.http.request("GET", `/pods/${this.podId()}/assistants/${assistantName}`);
    }
    update(assistantName, payload) {
        return this.http.request("PATCH", `/pods/${this.podId()}/assistants/${assistantName}`, {
            body: payload,
        });
    }
    delete(assistantName) {
        return this.http.request("DELETE", `/pods/${this.podId()}/assistants/${assistantName}`);
    }
}
exports.AssistantsNamespace = AssistantsNamespace;
class ConversationsNamespace {
    constructor(http, podId) {
        this.http = http;
        this.podId = podId;
        this.messages = {
            list: (conversationId, options = {}) => this.http.request("GET", `/conversations/${conversationId}/messages`, {
                params: {
                    pod_id: this.resolvePodId(options.pod_id),
                    limit: options.limit ?? 20,
                    page_token: options.page_token,
                },
            }),
            send: (conversationId, payload, options = {}) => this.http.request("POST", `/conversations/${conversationId}/messages`, {
                params: {
                    pod_id: this.resolvePodId(options.pod_id),
                },
                body: payload,
            }),
        };
    }
    resolvePodId(explicitPodId) {
        if (typeof explicitPodId === "string") {
            return explicitPodId;
        }
        try {
            return this.podId();
        }
        catch {
            return undefined;
        }
    }
    requirePodId(explicitPodId) {
        const podId = this.resolvePodId(explicitPodId);
        if (!podId) {
            throw new Error("pod_id is required for this conversation operation.");
        }
        return podId;
    }
    list(options = {}) {
        return this.http.request("GET", "/conversations", {
            params: {
                assistant_id: options.assistant_id,
                pod_id: this.resolvePodId(options.pod_id),
                organization_id: options.organization_id,
                limit: options.limit ?? 20,
                page_token: options.page_token,
            },
        });
    }
    listByAssistant(assistantId, options = {}) {
        return this.list({ ...options, assistant_id: assistantId });
    }
    create(payload) {
        return this.http.request("POST", "/conversations", {
            body: {
                ...payload,
                pod_id: this.resolvePodId(payload.pod_id),
            },
        });
    }
    createForAssistant(assistantId, payload = {}) {
        return this.create({
            ...payload,
            assistant_id: assistantId,
        });
    }
    get(conversationId, options = {}) {
        return this.http.request("GET", `/conversations/${conversationId}`, {
            params: {
                pod_id: this.resolvePodId(options.pod_id),
            },
        });
    }
    update(conversationId, payload, options = {}) {
        return this.http.request("PATCH", `/conversations/${conversationId}`, {
            params: {
                pod_id: this.resolvePodId(options.pod_id),
            },
            body: payload,
        });
    }
    delete(conversationId, options = {}) {
        const scopedPodId = this.requirePodId(options.pod_id);
        return this.http.request("DELETE", `/pods/${scopedPodId}/conversations/${conversationId}`);
    }
    sendMessageStream(conversationId, payload, options = {}) {
        return this.http.stream(`/conversations/${conversationId}/messages`, {
            method: "POST",
            params: {
                pod_id: this.resolvePodId(options.pod_id),
            },
            body: payload,
            signal: options.signal,
            headers: {
                "Content-Type": "application/json",
                Accept: "text/event-stream",
            },
        });
    }
    resumeStream(conversationId, options = {}) {
        return this.http.stream(`/conversations/${conversationId}/stream`, {
            params: {
                pod_id: this.resolvePodId(options.pod_id),
            },
            signal: options.signal,
            headers: {
                Accept: "text/event-stream",
            },
        });
    }
    stopRun(conversationId, options = {}) {
        return this.http.request("PATCH", `/conversations/${conversationId}/stop`, {
            params: {
                pod_id: this.resolvePodId(options.pod_id),
            },
            body: {},
        });
    }
}
exports.ConversationsNamespace = ConversationsNamespace;

},
"./namespaces/datastores.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatastoresNamespace = void 0;
const DatastoreService_js_1 = require("./openapi_client/services/DatastoreService.js");
class DatastoresNamespace {
    constructor(client, podId) {
        this.client = client;
        this.podId = podId;
    }
    list(options = {}) {
        return this.client.request(() => DatastoreService_js_1.DatastoreService.datastoreList(this.podId(), options.limit ?? 100, options.pageToken));
    }
    create(payload) {
        return this.client.request(() => DatastoreService_js_1.DatastoreService.datastoreCreate(this.podId(), payload));
    }
    get(name) {
        return this.client.request(() => DatastoreService_js_1.DatastoreService.datastoreGet(this.podId(), name));
    }
    update(name, payload) {
        return this.client.request(() => DatastoreService_js_1.DatastoreService.datastoreUpdate(this.podId(), name, payload));
    }
    delete(name) {
        return this.client.request(() => DatastoreService_js_1.DatastoreService.datastoreDelete(this.podId(), name));
    }
    query(name, request) {
        const payload = typeof request === "string" ? { query: request } : request;
        return this.client.request(() => DatastoreService_js_1.DatastoreService.datastoreQuery(this.podId(), name, payload));
    }
}
exports.DatastoresNamespace = DatastoresNamespace;

},
"./openapi_client/services/DatastoreService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatastoreService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class DatastoreService {
    /**
     * Create Datastore
     * Create a datastore namespace inside a pod. Use this before creating tables. Datastore names are normalized for stable API paths.
     * @param podId
     * @param requestBody
     * @returns DatastoreResponse Successful Response
     * @throws ApiError
     */
    static datastoreCreate(podId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores',
            path: {
                'pod_id': podId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Datastores
     * List datastores available in the pod.
     * @param podId
     * @param limit Max number of datastores to return.
     * @param pageToken Cursor from a previous response to fetch the next page.
     * @returns DatastoreListResponse Successful Response
     * @throws ApiError
     */
    static datastoreList(podId, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores',
            path: {
                'pod_id': podId,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Datastore
     * Get datastore metadata by datastore name.
     * @param podId
     * @param datastoreName
     * @returns DatastoreResponse Successful Response
     * @throws ApiError
     */
    static datastoreGet(podId, datastoreName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Datastore
     * Update datastore metadata and event emission settings.
     * @param podId
     * @param datastoreName
     * @param requestBody
     * @returns DatastoreResponse Successful Response
     * @throws ApiError
     */
    static datastoreUpdate(podId, datastoreName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/datastores/{datastore_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Datastore
     * Delete a datastore and its underlying resources.
     * @param podId
     * @param datastoreName
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    static datastoreDelete(podId, datastoreName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/datastores/{datastore_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Execute Query
     * Execute a read-only SQL query in the datastore schema. Mutating statements (`INSERT`, `UPDATE`, `DELETE`, `DROP`, etc.) are blocked.
     * @param podId
     * @param datastoreName
     * @param requestBody
     * @returns RecordQueryResponse Successful Response
     * @throws ApiError
     */
    static datastoreQuery(podId, datastoreName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/query',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.DatastoreService = DatastoreService;

},
"./namespaces/desks.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesksNamespace = void 0;
const DesksService_js_1 = require("./openapi_client/services/DesksService.js");
class DesksNamespace {
    constructor(client, http, podId) {
        this.client = client;
        this.http = http;
        this.podId = podId;
        this.html = {
            get: (name) => this.client.request(() => DesksService_js_1.DesksService.podDeskHtmlGet(this.podId(), name)),
        };
        this.bundle = {
            upload: (name, payload) => this.client.request(() => DesksService_js_1.DesksService.podDeskBundleUpload(this.podId(), name, payload)),
        };
        this.source = {
            download: (name) => this.http.requestBytes("GET", `/pods/${this.podId()}/desks/${name}/source/archive`),
        };
    }
    list(options = {}) {
        return this.client.request(() => DesksService_js_1.DesksService.podDeskList(this.podId(), options.limit ?? 100, options.pageToken));
    }
    create(payload) {
        return this.client.request(() => DesksService_js_1.DesksService.podDeskCreate(this.podId(), payload));
    }
    get(name) {
        return this.client.request(() => DesksService_js_1.DesksService.podDeskGet(this.podId(), name));
    }
    update(name, payload) {
        return this.client.request(() => DesksService_js_1.DesksService.podDeskUpdate(this.podId(), name, payload));
    }
    delete(name) {
        return this.client.request(() => DesksService_js_1.DesksService.podDeskDelete(this.podId(), name));
    }
}
exports.DesksNamespace = DesksNamespace;

},
"./openapi_client/services/DesksService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesksService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class DesksService {
    /**
     * Create Desk
     * @param podId
     * @param requestBody
     * @returns DeskResponse Successful Response
     * @throws ApiError
     */
    static podDeskCreate(podId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/desks',
            path: {
                'pod_id': podId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Desks
     * @param podId
     * @param limit
     * @param pageToken
     * @returns DeskListResponse Successful Response
     * @throws ApiError
     */
    static podDeskList(podId, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/desks',
            path: {
                'pod_id': podId,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Desk
     * @param podId
     * @param deskName
     * @returns DeskResponse Successful Response
     * @throws ApiError
     */
    static podDeskGet(podId, deskName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/desks/{desk_name}',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Desk
     * @param podId
     * @param deskName
     * @param requestBody
     * @returns DeskResponse Successful Response
     * @throws ApiError
     */
    static podDeskUpdate(podId, deskName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/desks/{desk_name}',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Desk
     * @param podId
     * @param deskName
     * @returns DeskMessageResponse Successful Response
     * @throws ApiError
     */
    static podDeskDelete(podId, deskName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/desks/{desk_name}',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Desk Bundle
     * @param podId
     * @param deskName
     * @param formData
     * @returns DeskBundleUploadResponse Successful Response
     * @throws ApiError
     */
    static podDeskBundleUpload(podId, deskName, formData) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/desks/{desk_name}/bundle',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Desk HTML
     * @param podId
     * @param deskName
     * @returns any Successful Response
     * @throws ApiError
     */
    static podDeskHtmlGet(podId, deskName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/desks/{desk_name}/html',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Download Desk Source Archive
     * @param podId
     * @param deskName
     * @returns any Successful Response
     * @throws ApiError
     */
    static podDeskSourceArchiveGet(podId, deskName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/desks/{desk_name}/source/archive',
            path: {
                'pod_id': podId,
                'desk_name': deskName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.DesksService = DesksService;

},
"./namespaces/files.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesNamespace = void 0;
const SearchMethod_js_1 = require("./openapi_client/models/SearchMethod.js");
const FilesService_js_1 = require("./openapi_client/services/FilesService.js");
class FilesNamespace {
    constructor(client, http, podId) {
        this.client = client;
        this.http = http;
        this.podId = podId;
        this.folder = {
            create: (datastore, name, options = {}) => {
                const payload = {
                    name,
                    description: options.description,
                    parent_id: options.parentId,
                };
                return this.client.request(() => FilesService_js_1.FilesService.fileFolderCreate(this.podId(), datastore, payload));
            },
        };
    }
    list(datastore, options = {}) {
        return this.client.request(() => FilesService_js_1.FilesService.fileList(this.podId(), datastore, options.parentId, options.limit ?? 100, options.pageToken));
    }
    get(datastore, fileId) {
        return this.client.request(() => FilesService_js_1.FilesService.fileGet(this.podId(), datastore, fileId));
    }
    delete(datastore, fileId) {
        return this.client.request(() => FilesService_js_1.FilesService.fileDelete(this.podId(), datastore, fileId));
    }
    search(datastore, query, options = {}) {
        return this.client.request(() => FilesService_js_1.FilesService.fileSearch(this.podId(), datastore, {
            query,
            limit: options.limit ?? 10,
            search_method: options.searchMethod ?? SearchMethod_js_1.SearchMethod.HYBRID,
        }));
    }
    download(datastore, fileId) {
        return this.http.requestBytes("GET", `/pods/${this.podId()}/datastores/${datastore}/files/${fileId}/download`);
    }
    upload(datastore, file, options = {}) {
        const payload = {
            data: file,
            name: options.name ?? (file instanceof File ? file.name : undefined),
            description: options.description,
            parent_id: options.parentId,
            search_enabled: options.searchEnabled ?? true,
        };
        return this.client.request(() => FilesService_js_1.FilesService.fileUpload(this.podId(), datastore, payload));
    }
    update(datastore, fileId, options = {}) {
        const payload = {
            data: options.file,
            name: options.name,
            description: options.description,
            parent_id: options.parentId,
            search_enabled: options.searchEnabled,
        };
        return this.client.request(() => FilesService_js_1.FilesService.fileUpdate(this.podId(), datastore, fileId, payload));
    }
}
exports.FilesNamespace = FilesNamespace;

},
"./openapi_client/models/SearchMethod.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchMethod = void 0;
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
var SearchMethod;
(function (SearchMethod) {
    SearchMethod["VECTOR"] = "VECTOR";
    SearchMethod["TEXT"] = "TEXT";
    SearchMethod["HYBRID"] = "HYBRID";
})(SearchMethod || (exports.SearchMethod = SearchMethod = {}));

},
"./openapi_client/services/FilesService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class FilesService {
    /**
     * List Files
     * @param resourceType
     * @param resourceId
     * @param path
     * @param limit
     * @param pageToken
     * @returns ResourceFileListResponse Successful Response
     * @throws ApiError
     */
    static listFilesFilesResourceTypeResourceIdListGet(resourceType, resourceId, path = '', limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/files/{resource_type}/{resource_id}/list',
            path: {
                'resource_type': resourceType,
                'resource_id': resourceId,
            },
            query: {
                'path': path,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload File
     * @param resourceType
     * @param resourceId
     * @param formData
     * @param path
     * @returns FileUploadResponse Successful Response
     * @throws ApiError
     */
    static uploadFileFilesResourceTypeResourceIdUploadPost(resourceType, resourceId, formData, path) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/files/{resource_type}/{resource_id}/upload',
            path: {
                'resource_type': resourceType,
                'resource_id': resourceId,
            },
            query: {
                'path': path,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Download File
     * @param resourceType
     * @param resourceId
     * @param filePath
     * @returns any Successful Response
     * @throws ApiError
     */
    static downloadFileFilesResourceTypeResourceIdDownloadFilePathGet(resourceType, resourceId, filePath) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/files/{resource_type}/{resource_id}/download/{file_path}',
            path: {
                'resource_type': resourceType,
                'resource_id': resourceId,
                'file_path': filePath,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete File
     * @param resourceType
     * @param resourceId
     * @param filePath
     * @returns any Successful Response
     * @throws ApiError
     */
    static deleteFileFilesResourceTypeResourceIdDeleteFilePathDelete(resourceType, resourceId, filePath) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/files/{resource_type}/{resource_id}/delete/{file_path}',
            path: {
                'resource_type': resourceType,
                'resource_id': resourceId,
                'file_path': filePath,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload File
     * @param podId
     * @param datastoreName
     * @param formData
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    static fileUpload(podId, datastoreName, formData) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Files
     * @param podId
     * @param datastoreName
     * @param parentId
     * @param limit
     * @param pageToken
     * @returns FileListResponse Successful Response
     * @throws ApiError
     */
    static fileList(podId, datastoreName, parentId, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            query: {
                'parent_id': parentId,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Folder
     * @param podId
     * @param datastoreName
     * @param requestBody
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    static fileFolderCreate(podId, datastoreName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files/folders',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get File
     * @param podId
     * @param datastoreName
     * @param fileId
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    static fileGet(podId, datastoreName, fileId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files/{file_id}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update File
     * @param podId
     * @param datastoreName
     * @param fileId
     * @param formData
     * @returns FileResponse Successful Response
     * @throws ApiError
     */
    static fileUpdate(podId, datastoreName, fileId, formData) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files/{file_id}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'file_id': fileId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete File
     * @param podId
     * @param datastoreName
     * @param fileId
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    static fileDelete(podId, datastoreName, fileId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files/{file_id}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Download File
     * @param podId
     * @param datastoreName
     * @param fileId
     * @returns any Successful Response
     * @throws ApiError
     */
    static fileDownload(podId, datastoreName, fileId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files/{file_id}/download',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'file_id': fileId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Search Files
     * @param podId
     * @param datastoreName
     * @param requestBody
     * @returns FileSearchResponse Successful Response
     * @throws ApiError
     */
    static fileSearch(podId, datastoreName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/files/search',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.FilesService = FilesService;

},
"./namespaces/functions.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionsNamespace = void 0;
const FunctionsService_js_1 = require("./openapi_client/services/FunctionsService.js");
class FunctionsNamespace {
    constructor(client, podId) {
        this.client = client;
        this.podId = podId;
        this.runs = {
            create: (name, options = {}) => this.client.request(() => {
                const payload = { input_data: options.input };
                return FunctionsService_js_1.FunctionsService.functionRun(this.podId(), name, payload);
            }),
            list: (name, params = {}) => this.client.request(() => FunctionsService_js_1.FunctionsService.functionRunList(this.podId(), name, params.limit ?? 100, params.pageToken)),
            get: (name, runId) => this.client.request(() => FunctionsService_js_1.FunctionsService.functionRunGet(this.podId(), name, runId)),
        };
    }
    list(options = {}) {
        return this.client.request(() => FunctionsService_js_1.FunctionsService.functionList(this.podId(), options.limit ?? 100, options.pageToken));
    }
    create(payload) {
        return this.client.request(() => FunctionsService_js_1.FunctionsService.functionCreate(this.podId(), payload));
    }
    get(name) {
        return this.client.request(() => FunctionsService_js_1.FunctionsService.functionGet(this.podId(), name));
    }
    update(name, payload) {
        return this.client.request(() => FunctionsService_js_1.FunctionsService.functionUpdate(this.podId(), name, payload));
    }
    delete(name) {
        return this.client.request(() => FunctionsService_js_1.FunctionsService.functionDelete(this.podId(), name));
    }
}
exports.FunctionsNamespace = FunctionsNamespace;

},
"./openapi_client/services/FunctionsService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionsService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class FunctionsService {
    /**
     * Create Function
     * Create a new function in a pod
     * @param podId
     * @param requestBody
     * @returns FunctionResponse Successful Response
     * @throws ApiError
     */
    static functionCreate(podId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/functions',
            path: {
                'pod_id': podId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Functions
     * List all functions in a pod
     * @param podId
     * @param limit
     * @param pageToken
     * @returns FunctionListResponse Successful Response
     * @throws ApiError
     */
    static functionList(podId, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/functions',
            path: {
                'pod_id': podId,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Function
     * Get a function by name
     * @param podId
     * @param functionName
     * @returns FunctionResponse Successful Response
     * @throws ApiError
     */
    static functionGet(podId, functionName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/functions/{function_name}',
            path: {
                'pod_id': podId,
                'function_name': functionName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Function
     * Update a function
     * @param podId
     * @param functionName
     * @param requestBody
     * @returns FunctionResponse Successful Response
     * @throws ApiError
     */
    static functionUpdate(podId, functionName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/functions/{function_name}',
            path: {
                'pod_id': podId,
                'function_name': functionName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Function
     * Delete a function
     * @param podId
     * @param functionName
     * @returns FunctionMessageResponse Successful Response
     * @throws ApiError
     */
    static functionDelete(podId, functionName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/functions/{function_name}',
            path: {
                'pod_id': podId,
                'function_name': functionName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Execute Function
     * Execute a function
     * @param podId
     * @param functionName
     * @param requestBody
     * @returns FunctionRunResponse Successful Response
     * @throws ApiError
     */
    static functionRun(podId, functionName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/functions/{function_name}/runs',
            path: {
                'pod_id': podId,
                'function_name': functionName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Runs
     * List runs for a function
     * @param podId
     * @param functionName
     * @param limit
     * @param pageToken
     * @returns FunctionRunListResponse Successful Response
     * @throws ApiError
     */
    static functionRunList(podId, functionName, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/functions/{function_name}/runs',
            path: {
                'pod_id': podId,
                'function_name': functionName,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Run
     * Get a specific function run
     * @param podId
     * @param functionName
     * @param runId
     * @returns FunctionRunResponse Successful Response
     * @throws ApiError
     */
    static functionRunGet(podId, functionName, runId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/functions/{function_name}/runs/{run_id}',
            path: {
                'pod_id': podId,
                'function_name': functionName,
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.FunctionsService = FunctionsService;

},
"./namespaces/icons.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IconsNamespace = void 0;
const IconsService_js_1 = require("./openapi_client/services/IconsService.js");
class IconsNamespace {
    constructor(client) {
        this.client = client;
    }
    upload(file) {
        return this.client.request(() => IconsService_js_1.IconsService.iconUpload({ file }));
    }
    getPublic(iconPath) {
        return this.client.request(() => IconsService_js_1.IconsService.iconPublicGet(iconPath));
    }
}
exports.IconsNamespace = IconsNamespace;

},
"./openapi_client/services/IconsService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IconsService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class IconsService {
    /**
     * Upload Icon
     * Upload an image asset and receive a public icon URL.
     * @param formData
     * @returns IconUploadResponse Successful Response
     * @throws ApiError
     */
    static iconUpload(formData) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/icons/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Public Icon
     * Fetch a previously uploaded public icon asset.
     * @param iconPath
     * @returns any Successful Response
     * @throws ApiError
     */
    static iconPublicGet(iconPath) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/public/icons/{icon_path}',
            path: {
                'icon_path': iconPath,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.IconsService = IconsService;

},
"./namespaces/integrations.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsNamespace = void 0;
const ApplicationsService_js_1 = require("./openapi_client/services/ApplicationsService.js");
const IntegrationsService_js_1 = require("./openapi_client/services/IntegrationsService.js");
class IntegrationsNamespace {
    constructor(client) {
        this.client = client;
        this.operations = {
            list: (applicationId) => this.client.request(() => ApplicationsService_js_1.ApplicationsService.applicationOperationList(applicationId)),
            get: (applicationId, operationName) => this.client.request(() => ApplicationsService_js_1.ApplicationsService.applicationOperationDetail(applicationId, operationName)),
            execute: (applicationId, operationName, payload, accountId) => {
                const body = { payload, account_id: accountId };
                return this.client.request(() => ApplicationsService_js_1.ApplicationsService.applicationOperationExecute(applicationId, operationName, body));
            },
            descriptor: (applicationId) => this.client.request(() => ApplicationsService_js_1.ApplicationsService.applicationDescriptor(applicationId)),
        };
        this.triggers = {
            list: (options = {}) => this.client.request(() => ApplicationsService_js_1.ApplicationsService.applicationTriggerList(options.applicationId, options.search, options.limit ?? 100, options.pageToken)),
            get: (triggerId) => this.client.request(() => ApplicationsService_js_1.ApplicationsService.applicationTriggerGet(triggerId)),
        };
        this.accounts = {
            list: (options = {}) => this.client.request(() => IntegrationsService_js_1.IntegrationsService.integrationAccountList(options.applicationId, options.limit ?? 100, options.pageToken)),
            get: (accountId) => this.client.request(() => IntegrationsService_js_1.IntegrationsService.integrationAccountGet(accountId)),
            credentials: (accountId) => this.client.request(() => IntegrationsService_js_1.IntegrationsService.integrationAccountCredentialsGet(accountId)),
            delete: (accountId) => this.client.request(() => IntegrationsService_js_1.IntegrationsService.integrationAccountDelete(accountId)),
        };
    }
    list(options = {}) {
        return this.client.request(() => ApplicationsService_js_1.ApplicationsService.applicationList(options.limit ?? 100, options.pageToken));
    }
    get(applicationId) {
        return this.client.request(() => ApplicationsService_js_1.ApplicationsService.applicationGet(applicationId));
    }
    createConnectRequest(applicationId) {
        const payload = { application_id: applicationId };
        return this.client.request(() => IntegrationsService_js_1.IntegrationsService.integrationConnectRequestCreate(payload));
    }
}
exports.IntegrationsNamespace = IntegrationsNamespace;

},
"./openapi_client/services/ApplicationsService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class ApplicationsService {
    /**
     * List Applications
     * Get all active applications available for integration
     * @param limit
     * @param pageToken
     * @returns ApplicationListResponseSchema Successful Response
     * @throws ApiError
     */
    static applicationList(limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/integrations/applications',
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Triggers
     * Get all triggers. Optionally filter by application_id and search in description
     * @param applicationId
     * @param search
     * @param limit
     * @param pageToken
     * @returns AppTriggerListResponseSchema Successful Response
     * @throws ApiError
     */
    static applicationTriggerList(applicationId, search, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/integrations/applications/triggers',
            query: {
                'application_id': applicationId,
                'search': search,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Trigger
     * Get a specific trigger by ID
     * @param triggerId
     * @returns AppTriggerResponseSchema Successful Response
     * @throws ApiError
     */
    static applicationTriggerGet(triggerId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/integrations/applications/triggers/{trigger_id}',
            path: {
                'trigger_id': triggerId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Application
     * Get a specific application by ID along with its operation catalog
     * @param applicationId
     * @returns ApplicationDetailResponseSchema Successful Response
     * @throws ApiError
     */
    static applicationGet(applicationId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/integrations/applications/{application_id}',
            path: {
                'application_id': applicationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Application Descriptor
     * @param applicationId
     * @returns AppDescriptorResponse Successful Response
     * @throws ApiError
     */
    static applicationDescriptor(applicationId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/integrations/applications/{application_id}/operations/descriptor',
            path: {
                'application_id': applicationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Application Operations
     * @param applicationId
     * @param search
     * @param limit
     * @param pageToken
     * @returns OperationListResponse Successful Response
     * @throws ApiError
     */
    static applicationOperationList(applicationId, search, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/integrations/applications/{application_id}/operations',
            path: {
                'application_id': applicationId,
            },
            query: {
                'search': search,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Application Operation Details
     * @param applicationId
     * @param operationName
     * @returns OperationDetail Successful Response
     * @throws ApiError
     */
    static applicationOperationDetail(applicationId, operationName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/integrations/applications/{application_id}/operations/{operation_name}',
            path: {
                'application_id': applicationId,
                'operation_name': operationName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Execute Application Operation
     * @param applicationId
     * @param operationName
     * @param requestBody
     * @returns OperationExecutionResponse Successful Response
     * @throws ApiError
     */
    static applicationOperationExecute(applicationId, operationName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/integrations/applications/{application_id}/operations/{operation_name}/execute',
            path: {
                'application_id': applicationId,
                'operation_name': operationName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.ApplicationsService = ApplicationsService;

},
"./openapi_client/services/IntegrationsService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class IntegrationsService {
    /**
     * Initiate Connect Request
     * Initiate an OAuth connection request for an application
     * @param requestBody
     * @returns ConnectRequestResponseSchema Successful Response
     * @throws ApiError
     */
    static integrationConnectRequestCreate(requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/integrations/connect-requests',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * OAuth Callback
     * Handle OAuth callback and complete account connection. This endpoint is public and uses state parameter for security.
     * @param error
     * @returns AccountResponseSchema Successful Response
     * @throws ApiError
     */
    static integrationOauthCallback(error) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/integrations/connect-requests/oauth/callback',
            query: {
                'error': error,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Accounts
     * Get all connected accounts for the current user. Optionally filter by application_id or application_name
     * @param applicationId
     * @param limit
     * @param pageToken
     * @returns AccountListResponseSchema Successful Response
     * @throws ApiError
     */
    static integrationAccountList(applicationId, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/integrations/accounts',
            query: {
                'application_id': applicationId,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Account
     * Get a specific account by ID
     * @param accountId
     * @returns AccountResponseSchema Successful Response
     * @throws ApiError
     */
    static integrationAccountGet(accountId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/integrations/accounts/{account_id}',
            path: {
                'account_id': accountId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Account
     * Delete a connected account and revoke the connection
     * @param accountId
     * @returns MessageResponseSchema Successful Response
     * @throws ApiError
     */
    static integrationAccountDelete(accountId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/integrations/accounts/{account_id}',
            path: {
                'account_id': accountId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Credentials
     * Get the credentials for a specific account
     * @param accountId
     * @returns AccountCredentialsResponseSchema Successful Response
     * @throws ApiError
     */
    static integrationAccountCredentialsGet(accountId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/integrations/accounts/{account_id}/credentials',
            path: {
                'account_id': accountId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.IntegrationsService = IntegrationsService;

},
"./namespaces/organizations.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsNamespace = void 0;
const OrganizationsService_js_1 = require("./openapi_client/services/OrganizationsService.js");
class OrganizationsNamespace {
    constructor(client, http) {
        this.client = client;
        this.http = http;
        this.members = {
            list: (orgId, options = {}) => this.client.request(() => OrganizationsService_js_1.OrganizationsService.orgMemberList(orgId, options.limit ?? 100, options.pageToken ?? options.cursor)),
            updateRole: (orgId, memberId, role) => this.client.request(() => OrganizationsService_js_1.OrganizationsService.orgMemberUpdateRole(orgId, memberId, { role })),
            remove: (orgId, memberId) => this.client.request(() => OrganizationsService_js_1.OrganizationsService.orgMemberRemove(orgId, memberId)),
        };
        this.invitations = {
            listMine: async (options = {}) => {
                if (options.status) {
                    return this.client.request(() => OrganizationsService_js_1.OrganizationsService.orgInvitationListMine(options.status, options.limit ?? 100, options.pageToken ?? options.cursor));
                }
                return this.http.request("GET", "/organizations/invitations", {
                    params: {
                        limit: options.limit ?? 100,
                        page_token: options.pageToken ?? options.cursor,
                    },
                });
            },
            list: async (orgId, options = {}) => {
                if (options.status) {
                    return this.client.request(() => OrganizationsService_js_1.OrganizationsService.orgInvitationList(orgId, options.status, options.limit ?? 100, options.pageToken ?? options.cursor));
                }
                return this.http.request("GET", `/organizations/${encodeURIComponent(orgId)}/invitations`, {
                    params: {
                        limit: options.limit ?? 100,
                        page_token: options.pageToken ?? options.cursor,
                    },
                });
            },
            get: (invitationId) => this.client.request(() => OrganizationsService_js_1.OrganizationsService.orgInvitationGet(invitationId)),
            invite: (orgId, payload) => this.client.request(() => OrganizationsService_js_1.OrganizationsService.orgInvitationInvite(orgId, payload)),
            accept: (invitationId) => this.client.request(() => OrganizationsService_js_1.OrganizationsService.orgInvitationAccept(invitationId)),
            revoke: (invitationId) => this.client.request(() => OrganizationsService_js_1.OrganizationsService.orgInvitationRevoke(invitationId)),
        };
    }
    list(options = {}) {
        return this.client.request(() => OrganizationsService_js_1.OrganizationsService.orgList(options.limit ?? 100, options.pageToken ?? options.cursor));
    }
    get(orgId) {
        return this.client.request(() => OrganizationsService_js_1.OrganizationsService.orgGet(orgId));
    }
    create(payload) {
        return this.client.request(() => OrganizationsService_js_1.OrganizationsService.orgCreate(payload));
    }
}
exports.OrganizationsNamespace = OrganizationsNamespace;

},
"./openapi_client/services/OrganizationsService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsService = void 0;
const OrganizationInvitationStatus_js_1 = require("./openapi_client/models/OrganizationInvitationStatus.js");
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class OrganizationsService {
    /**
     * Create Organization
     * Create a new organization
     * @param requestBody
     * @returns OrganizationResponse Successful Response
     * @throws ApiError
     */
    static orgCreate(requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/organizations',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List My Organizations
     * Get all organizations the current user belongs to
     * @param limit
     * @param pageToken
     * @returns OrganizationListResponse Successful Response
     * @throws ApiError
     */
    static orgList(limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/organizations',
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List My Invitations
     * Get all pending invitations for the current user
     * @param status
     * @param limit
     * @param pageToken
     * @returns OrganizationInvitationListResponse Successful Response
     * @throws ApiError
     */
    static orgInvitationListMine(status = OrganizationInvitationStatus_js_1.OrganizationInvitationStatus.PENDING, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/organizations/invitations',
            query: {
                'status': status,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Organization
     * Get organization details
     * @param orgId
     * @returns OrganizationResponse Successful Response
     * @throws ApiError
     */
    static orgGet(orgId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/organizations/{org_id}',
            path: {
                'org_id': orgId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Organization Members
     * Get all members of an organization
     * @param orgId
     * @param limit
     * @param pageToken
     * @returns OrganizationMemberListResponse Successful Response
     * @throws ApiError
     */
    static orgMemberList(orgId, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/organizations/{org_id}/members',
            path: {
                'org_id': orgId,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Invite Member
     * Invite a user to join the organization
     * @param orgId
     * @param requestBody
     * @returns OrganizationInvitationResponse Successful Response
     * @throws ApiError
     */
    static orgInvitationInvite(orgId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/organizations/{org_id}/invitations',
            path: {
                'org_id': orgId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Organization Invitations
     * Get all pending invitations for an organization
     * @param orgId
     * @param status
     * @param limit
     * @param pageToken
     * @returns OrganizationInvitationListResponse Successful Response
     * @throws ApiError
     */
    static orgInvitationList(orgId, status = OrganizationInvitationStatus_js_1.OrganizationInvitationStatus.PENDING, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/organizations/{org_id}/invitations',
            path: {
                'org_id': orgId,
            },
            query: {
                'status': status,
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Accept Invitation
     * Accept an organization invitation
     * @param invitationId
     * @returns OrganizationMessageResponse Successful Response
     * @throws ApiError
     */
    static orgInvitationAccept(invitationId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/organizations/invitations/{invitation_id}/accept',
            path: {
                'invitation_id': invitationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Organization Invitation
     * Get an invitation by id
     * @param invitationId
     * @returns OrganizationInvitationResponse Successful Response
     * @throws ApiError
     */
    static orgInvitationGet(invitationId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/organizations/invitations/{invitation_id}',
            path: {
                'invitation_id': invitationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Revoke Invitation
     * Revoke an organization invitation
     * @param invitationId
     * @returns void
     * @throws ApiError
     */
    static orgInvitationRevoke(invitationId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/organizations/invitations/{invitation_id}',
            path: {
                'invitation_id': invitationId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Member Role
     * Update a member's role in the organization
     * @param orgId
     * @param memberId
     * @param requestBody
     * @returns OrganizationMemberResponse Successful Response
     * @throws ApiError
     */
    static orgMemberUpdateRole(orgId, memberId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PATCH',
            url: '/organizations/{org_id}/members/{member_id}/role',
            path: {
                'org_id': orgId,
                'member_id': memberId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove Member
     * Remove a member from the organization
     * @param orgId
     * @param memberId
     * @returns void
     * @throws ApiError
     */
    static orgMemberRemove(orgId, memberId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/organizations/{org_id}/members/{member_id}',
            path: {
                'org_id': orgId,
                'member_id': memberId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.OrganizationsService = OrganizationsService;

},
"./openapi_client/models/OrganizationInvitationStatus.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationInvitationStatus = void 0;
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Statuses for organization invitations.
 */
var OrganizationInvitationStatus;
(function (OrganizationInvitationStatus) {
    OrganizationInvitationStatus["PENDING"] = "PENDING";
    OrganizationInvitationStatus["ACCEPTED"] = "ACCEPTED";
    OrganizationInvitationStatus["EXPIRED"] = "EXPIRED";
    OrganizationInvitationStatus["REVOKED"] = "REVOKED";
})(OrganizationInvitationStatus || (exports.OrganizationInvitationStatus = OrganizationInvitationStatus = {}));

},
"./namespaces/pod-members.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodMembersNamespace = void 0;
const PodMembersService_js_1 = require("./openapi_client/services/PodMembersService.js");
class PodMembersNamespace {
    constructor(client) {
        this.client = client;
    }
    list(podId, options = {}) {
        return this.client.request(() => PodMembersService_js_1.PodMembersService.podMemberList(podId, options.limit ?? 100, options.pageToken ?? options.cursor));
    }
    add(podId, payload) {
        return this.client.request(() => PodMembersService_js_1.PodMembersService.podMemberAdd(podId, payload));
    }
    updateRole(podId, memberId, role) {
        return this.client.request(() => PodMembersService_js_1.PodMembersService.podMemberUpdateRole(podId, memberId, { role }));
    }
    remove(podId, memberId) {
        return this.client.request(() => PodMembersService_js_1.PodMembersService.podMemberRemove(podId, memberId));
    }
}
exports.PodMembersNamespace = PodMembersNamespace;

},
"./openapi_client/services/PodMembersService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodMembersService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class PodMembersService {
    /**
     * Add Pod Member
     * Add a member to a pod
     * @param podId
     * @param requestBody
     * @returns PodMemberResponse Successful Response
     * @throws ApiError
     */
    static podMemberAdd(podId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/members',
            path: {
                'pod_id': podId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Pod Members
     * List all members of a pod
     * @param podId
     * @param limit
     * @param pageToken
     * @returns PodMemberListResponse Successful Response
     * @throws ApiError
     */
    static podMemberList(podId, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/members',
            path: {
                'pod_id': podId,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Member Role
     * Update a pod member's role
     * @param podId
     * @param memberId
     * @param requestBody
     * @returns PodMemberResponse Successful Response
     * @throws ApiError
     */
    static podMemberUpdateRole(podId, memberId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/members/{member_id}/role',
            path: {
                'pod_id': podId,
                'member_id': memberId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove Pod Member
     * Remove a member from a pod
     * @param podId
     * @param memberId
     * @returns void
     * @throws ApiError
     */
    static podMemberRemove(podId, memberId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/members/{member_id}',
            path: {
                'pod_id': podId,
                'member_id': memberId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.PodMembersService = PodMembersService;

},
"./namespaces/pods.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodsNamespace = void 0;
const PodsService_js_1 = require("./openapi_client/services/PodsService.js");
class PodsNamespace {
    constructor(client, http) {
        this.client = client;
        this.http = http;
    }
    list(options = {}) {
        if (options.organizationId) {
            return this.listByOrganization(options.organizationId, {
                limit: options.limit,
                pageToken: options.pageToken ?? options.cursor,
            });
        }
        return this.http.request("GET", "/pods", {
            params: {
                limit: options.limit ?? 100,
                page_token: options.pageToken ?? options.cursor,
            },
        });
    }
    listByOrganization(organizationId, options = {}) {
        return this.client.request(() => PodsService_js_1.PodsService.podList(organizationId, options.limit ?? 100, options.pageToken ?? options.cursor));
    }
    get(podId) {
        return this.client.request(() => PodsService_js_1.PodsService.podGet(podId));
    }
    create(payload) {
        return this.client.request(() => PodsService_js_1.PodsService.podCreate(payload));
    }
    update(podId, payload) {
        return this.client.request(() => PodsService_js_1.PodsService.podUpdate(podId, payload));
    }
    delete(podId) {
        return this.client.request(() => PodsService_js_1.PodsService.podDelete(podId));
    }
    config(podId) {
        return this.client.request(() => PodsService_js_1.PodsService.podConfigGet(podId));
    }
}
exports.PodsNamespace = PodsNamespace;

},
"./openapi_client/services/PodsService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodsService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class PodsService {
    /**
     * Create Pod
     * Create a new pod
     * @param requestBody
     * @returns PodResponse Successful Response
     * @throws ApiError
     */
    static podCreate(requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Pod
     * Get pod details
     * @param podId
     * @returns PodResponse Successful Response
     * @throws ApiError
     */
    static podGet(podId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}',
            path: {
                'pod_id': podId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Pod
     * Update pod details
     * @param podId
     * @param requestBody
     * @returns PodResponse Successful Response
     * @throws ApiError
     */
    static podUpdate(podId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PUT',
            url: '/pods/{pod_id}',
            path: {
                'pod_id': podId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Pod
     * Delete a pod
     * @param podId
     * @returns void
     * @throws ApiError
     */
    static podDelete(podId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}',
            path: {
                'pod_id': podId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List PodS by Organization
     * List all pods in an organization
     * @param organizationId
     * @param limit
     * @param pageToken
     * @returns PodListResponse Successful Response
     * @throws ApiError
     */
    static podList(organizationId, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/organization/{organization_id}',
            path: {
                'organization_id': organizationId,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Pod Config
     * Get pod configuration requirements (apps, flows) and user status
     * @param podId
     * @returns PodConfigResponse Successful Response
     * @throws ApiError
     */
    static podConfigGet(podId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/config',
            path: {
                'pod_id': podId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.PodsService = PodsService;

},
"./namespaces/pod-surfaces.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodSurfacesNamespace = void 0;
const AssistantSurfacesService_js_1 = require("./openapi_client/services/AssistantSurfacesService.js");
class PodSurfacesNamespace {
    constructor(client) {
        this.client = client;
    }
    list(podId, options = {}) {
        return this.client.request(() => AssistantSurfacesService_js_1.AssistantSurfacesService.assistantSurfaceList(podId, options.limit ?? 100, options.pageToken ?? options.cursor));
    }
    create(podId, payload) {
        return this.client.request(() => AssistantSurfacesService_js_1.AssistantSurfacesService.assistantSurfaceCreate(podId, payload));
    }
    get(podId, surfaceId) {
        return this.client.request(() => AssistantSurfacesService_js_1.AssistantSurfacesService.assistantSurfaceGet(podId, surfaceId));
    }
    updateConfig(podId, surfaceId, payload) {
        return this.client.request(() => AssistantSurfacesService_js_1.AssistantSurfacesService.assistantSurfaceUpdateConfig(podId, surfaceId, payload));
    }
    toggle(podId, surfaceId, isActive) {
        return this.client.request(() => AssistantSurfacesService_js_1.AssistantSurfacesService.assistantSurfaceToggle(podId, surfaceId, { is_active: isActive }));
    }
}
exports.PodSurfacesNamespace = PodSurfacesNamespace;

},
"./openapi_client/services/AssistantSurfacesService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssistantSurfacesService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class AssistantSurfacesService {
    /**
     * Create Surface
     * Create a new surface for an assistant.
     * @param podId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    static assistantSurfaceCreate(podId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/surfaces',
            path: {
                'pod_id': podId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Surfaces
     * List configured surfaces in a pod.
     * @param podId
     * @param limit
     * @param pageToken
     * @returns AssistantSurfaceListResponse Successful Response
     * @throws ApiError
     */
    static assistantSurfaceList(podId, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/surfaces',
            path: {
                'pod_id': podId,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Surface
     * Get a specific surface configuration.
     * @param podId
     * @param surfaceId
     * @returns any Successful Response
     * @throws ApiError
     */
    static assistantSurfaceGet(podId, surfaceId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/surfaces/{surface_id}',
            path: {
                'pod_id': podId,
                'surface_id': surfaceId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Surface
     * Update a surface configuration.
     * @param podId
     * @param surfaceId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    static assistantSurfaceUpdateConfig(podId, surfaceId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/surfaces/{surface_id}/config',
            path: {
                'pod_id': podId,
                'surface_id': surfaceId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Toggle Surface
     * Toggle a surface active state.
     * @param podId
     * @param surfaceId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    static assistantSurfaceToggle(podId, surfaceId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/surfaces/{surface_id}/toggle',
            path: {
                'pod_id': podId,
                'surface_id': surfaceId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.AssistantSurfacesService = AssistantSurfacesService;

},
"./namespaces/records.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordsNamespace = void 0;
const RecordsService_js_1 = require("./openapi_client/services/RecordsService.js");
function getRecordsPath(podId, datastore, table) {
    return `/pods/${encodeURIComponent(podId)}/datastores/${encodeURIComponent(datastore)}/tables/${encodeURIComponent(table)}/records`;
}
class RecordsNamespace {
    constructor(client, http, podId) {
        this.client = client;
        this.http = http;
        this.podId = podId;
        this.bulk = {
            create: (datastore, table, records) => {
                const payload = { records };
                return this.client.request(() => RecordsService_js_1.RecordsService.recordBulkCreate(this.podId(), datastore, table, payload));
            },
            update: (datastore, table, records) => {
                const payload = { records };
                return this.client.request(() => RecordsService_js_1.RecordsService.recordBulkUpdate(this.podId(), datastore, table, payload));
            },
            delete: (datastore, table, recordIds) => {
                const payload = { record_ids: recordIds };
                return this.client.request(() => RecordsService_js_1.RecordsService.recordBulkDelete(this.podId(), datastore, table, payload));
            },
        };
    }
    list(datastore, table, options = {}) {
        const { filters, sort, limit, pageToken, offset, sortBy, order, params } = options;
        if (filters || sort) {
            const payload = {
                filters,
                sort,
                limit,
                page_token: pageToken,
            };
            return this.client.request(() => RecordsService_js_1.RecordsService.recordQuery(this.podId(), datastore, table, payload));
        }
        const hasCustomParams = typeof offset === "number" ||
            typeof sortBy === "string" ||
            typeof order === "string" ||
            !!params;
        if (hasCustomParams) {
            return this.http.request("GET", getRecordsPath(this.podId(), datastore, table), {
                params: {
                    limit: limit ?? 20,
                    page_token: pageToken,
                    offset,
                    sort_by: sortBy,
                    order,
                    ...(params ?? {}),
                },
            });
        }
        return this.client.request(() => RecordsService_js_1.RecordsService.recordList(this.podId(), datastore, table, limit ?? 20, pageToken));
    }
    listWithParams(datastore, table, params) {
        return this.http.request("GET", getRecordsPath(this.podId(), datastore, table), {
            params,
        });
    }
    create(datastore, table, data) {
        return this.client.request(() => RecordsService_js_1.RecordsService.recordCreate(this.podId(), datastore, table, { data }));
    }
    get(datastore, table, recordId) {
        return this.client.request(() => RecordsService_js_1.RecordsService.recordGet(this.podId(), datastore, table, recordId));
    }
    update(datastore, table, recordId, data) {
        return this.client.request(() => RecordsService_js_1.RecordsService.recordUpdate(this.podId(), datastore, table, recordId, { data }));
    }
    delete(datastore, table, recordId) {
        return this.client.request(() => RecordsService_js_1.RecordsService.recordDelete(this.podId(), datastore, table, recordId));
    }
    query(datastore, table, payload) {
        return this.client.request(() => RecordsService_js_1.RecordsService.recordQuery(this.podId(), datastore, table, payload));
    }
}
exports.RecordsNamespace = RecordsNamespace;

},
"./openapi_client/services/RecordsService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordsService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class RecordsService {
    /**
     * Create Record
     * Insert a record into a table. Reserved tables (`reserved_*`) are system-managed and cannot be mutated through record write endpoints.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns RecordResponse Successful Response
     * @throws ApiError
     */
    static recordCreate(podId, datastoreName, tableName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Records
     * List table records with token pagination only. Use `record.query` when you need structured filters or explicit sort clauses.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param limit Max number of rows to return.
     * @param pageToken Opaque token from a previous response page.
     * @returns RecordListResponse Successful Response
     * @throws ApiError
     */
    static recordList(podId, datastoreName, tableName, limit = 20, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Record
     * Fetch one record by primary key value. The `record_id` path segment is the table's primary key value as stored in the table, not necessarily a UUID.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param recordId
     * @returns RecordResponse Successful Response
     * @throws ApiError
     */
    static recordGet(podId, datastoreName, tableName, recordId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/{record_id}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
                'record_id': recordId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Record
     * Patch a record by primary key.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param recordId
     * @param requestBody
     * @returns RecordResponse Successful Response
     * @throws ApiError
     */
    static recordUpdate(podId, datastoreName, tableName, recordId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/{record_id}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
                'record_id': recordId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Record
     * Delete a record by primary key.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param recordId
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    static recordDelete(podId, datastoreName, tableName, recordId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/{record_id}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
                'record_id': recordId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Bulk Create
     * Insert multiple records in one request.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    static recordBulkCreate(podId, datastoreName, tableName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/bulk/create',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Bulk Update
     * Update multiple records in one request (each item needs primary key).
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    static recordBulkUpdate(podId, datastoreName, tableName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/bulk/update',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Bulk Delete
     * Delete multiple records by primary key values.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    static recordBulkDelete(podId, datastoreName, tableName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/bulk/delete',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Query Records
     * Query one table with structured filters and sorting. Use this instead of dynamic query parameters when you need filtering. Example filters: `[{"field": "status", "op": "eq", "value": "OPEN"}]`.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns RecordListResponse Successful Response
     * @throws ApiError
     */
    static recordQuery(podId, datastoreName, tableName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/records/query',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.RecordsService = RecordsService;

},
"./namespaces/resources.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourcesNamespace = void 0;
class ResourcesNamespace {
    constructor(http) {
        this.http = http;
    }
    list(resourceType, resourceId, options = {}) {
        return this.http.request("GET", `/files/${resourceType}/${resourceId}/list`, {
            params: {
                path: options.path,
                limit: options.limit ?? 100,
                page_token: options.page_token,
            },
        });
    }
    upload(resourceType, resourceId, file, options = {}) {
        const formData = new FormData();
        const name = options.name ?? (file instanceof File ? file.name : "upload.bin");
        formData.append("file", file, name);
        return this.http.request("POST", `/files/${resourceType}/${resourceId}/upload`, {
            params: {
                path: options.path,
            },
            body: formData,
            isFormData: true,
        });
    }
    delete(resourceType, resourceId, filePath) {
        return this.http.request("DELETE", `/files/${resourceType}/${resourceId}/delete/${filePath}`);
    }
    download(resourceType, resourceId, filePath) {
        return this.http.requestBytes("GET", `/files/${resourceType}/${resourceId}/download/${filePath}`);
    }
}
exports.ResourcesNamespace = ResourcesNamespace;

},
"./namespaces/tables.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TablesNamespace = void 0;
const TablesService_js_1 = require("./openapi_client/services/TablesService.js");
function normalizeCreateTablePayload(payload) {
    if ("table_name" in payload) {
        const { table_name, name, ...rest } = payload;
        return {
            ...rest,
            name: name ?? table_name,
        };
    }
    return payload;
}
class TablesNamespace {
    constructor(client, podId) {
        this.client = client;
        this.podId = podId;
        this.columns = {
            add: (datastore, tableName, request) => {
                const payload = "column" in request ? request : { column: request };
                return this.client.request(() => TablesService_js_1.TablesService.tableColumnAdd(this.podId(), datastore, tableName, payload));
            },
            remove: (datastore, tableName, columnName) => this.client.request(() => TablesService_js_1.TablesService.tableColumnRemove(this.podId(), datastore, tableName, columnName)),
        };
    }
    list(datastore, options = {}) {
        return this.client.request(() => TablesService_js_1.TablesService.tableList(this.podId(), datastore, options.limit ?? 100, options.pageToken));
    }
    create(datastore, payload) {
        return this.client.request(() => TablesService_js_1.TablesService.tableCreate(this.podId(), datastore, normalizeCreateTablePayload(payload)));
    }
    get(datastore, tableName) {
        return this.client.request(() => TablesService_js_1.TablesService.tableGet(this.podId(), datastore, tableName));
    }
    update(datastore, tableName, payload) {
        return this.client.request(() => TablesService_js_1.TablesService.tableUpdate(this.podId(), datastore, tableName, payload));
    }
    delete(datastore, tableName) {
        return this.client.request(() => TablesService_js_1.TablesService.tableDelete(this.podId(), datastore, tableName));
    }
}
exports.TablesNamespace = TablesNamespace;

},
"./openapi_client/services/TablesService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TablesService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class TablesService {
    /**
     * Create Table
     * Create a table in a datastore. Define primary key, column schema, and optional RLS behavior.
     * @param podId
     * @param datastoreName
     * @param requestBody
     * @returns TableResponse Successful Response
     * @throws ApiError
     */
    static tableCreate(podId, datastoreName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Tables
     * List tables in a datastore.
     * @param podId
     * @param datastoreName
     * @param limit Max number of tables to return.
     * @param pageToken Cursor from a previous response for pagination.
     * @returns TableListResponse Successful Response
     * @throws ApiError
     */
    static tableList(podId, datastoreName, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Table
     * Get table schema metadata by table name.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @returns TableResponse Successful Response
     * @throws ApiError
     */
    static tableGet(podId, datastoreName, tableName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Table
     * Delete a table and all records in it.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    static tableDelete(podId, datastoreName, tableName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Table
     * Update table metadata/configuration payload.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns TableResponse Successful Response
     * @throws ApiError
     */
    static tableUpdate(podId, datastoreName, tableName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Column
     * Add a new column to a table. Column names must be unique and compatible with existing table schema rules.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param requestBody
     * @returns TableResponse Successful Response
     * @throws ApiError
     */
    static tableColumnAdd(podId, datastoreName, tableName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/columns',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove Column
     * Remove a non-primary, non-system column from a table. System columns and the primary key cannot be removed.
     * @param podId
     * @param datastoreName
     * @param tableName
     * @param columnName
     * @returns DatastoreMessageResponse Successful Response
     * @throws ApiError
     */
    static tableColumnRemove(podId, datastoreName, tableName, columnName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/datastores/{datastore_name}/tables/{table_name}/columns/{column_name}',
            path: {
                'pod_id': podId,
                'datastore_name': datastoreName,
                'table_name': tableName,
                'column_name': columnName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.TablesService = TablesService;

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
            list: (taskId, options = {}) => this.http.request("GET", `/pods/${this.podId()}/tasks/${taskId}/messages`, {
                params: {
                    limit: options.limit ?? 100,
                    page_token: options.page_token,
                },
            }),
            add: (taskId, payload) => {
                return this.http.request("POST", `/pods/${this.podId()}/tasks/${taskId}/messages`, {
                    body: payload,
                });
            },
        };
    }
    list(options = {}) {
        return this.http.request("GET", `/pods/${this.podId()}/tasks`, {
            params: {
                agent_name: options.agent_name,
                limit: options.limit ?? 100,
                page_token: options.page_token,
            },
        });
    }
    create(payload) {
        return this.http.request("POST", `/pods/${this.podId()}/tasks`, {
            body: payload,
        });
    }
    get(taskId) {
        return this.http.request("GET", `/pods/${this.podId()}/tasks/${taskId}`);
    }
    stop(taskId) {
        return this.http.request("PATCH", `/pods/${this.podId()}/tasks/${taskId}/stop`);
    }
    stream(taskId, options = {}) {
        return this.http.stream(`/pods/${this.podId()}/tasks/${taskId}/stream`, {
            signal: options.signal,
            headers: {
                Accept: "text/event-stream",
            },
        });
    }
}
exports.TasksNamespace = TasksNamespace;

},
"./namespaces/users.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersNamespace = void 0;
const UsersService_js_1 = require("./openapi_client/services/UsersService.js");
class UsersNamespace {
    constructor(client) {
        this.client = client;
    }
    current() {
        return this.client.request(() => UsersService_js_1.UsersService.userCurrentGet());
    }
    getProfile() {
        return this.client.request(() => UsersService_js_1.UsersService.userProfileGet());
    }
    upsertProfile(payload) {
        return this.client.request(() => UsersService_js_1.UsersService.userProfileUpsert(payload));
    }
}
exports.UsersNamespace = UsersNamespace;

},
"./openapi_client/services/UsersService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class UsersService {
    /**
     * Get Current User
     * Get the current authenticated user's information
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    static userCurrentGet() {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/users/me',
        });
    }
    /**
     * Get User Profile
     * Get the current user's profile
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    static userProfileGet() {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/users/me/profile',
        });
    }
    /**
     * Create or Update Profile
     * Create or update the current user's profile
     * @param requestBody
     * @returns UserResponse Successful Response
     * @throws ApiError
     */
    static userProfileUpsert(requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/users/me/profile',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.UsersService = UsersService;

},
"./namespaces/workflows.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsNamespace = void 0;
const http_js_1 = require("./http.js");
const WorkflowsService_js_1 = require("./openapi_client/services/WorkflowsService.js");
class WorkflowsNamespace {
    constructor(client, http, podId) {
        this.client = client;
        this.http = http;
        this.podId = podId;
        this.graph = {
            update: (workflowName, graph) => this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowGraphUpdate(this.podId(), workflowName, graph)),
        };
        this.installs = {
            create: (workflowName, payload = {}) => this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowInstallCreate(this.podId(), workflowName, payload)),
            delete: (workflowName, installId) => this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowInstallDelete(this.podId(), workflowName, installId)),
        };
        this.runs = {
            start: (workflowName, inputs = {}) => this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowStart(this.podId(), workflowName, inputs)),
            list: (workflowName, options = {}) => this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowRunList(this.podId(), workflowName, options.limit ?? 100, options.pageToken)),
            get: (runId, podId = this.podId()) => this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowRunGet(podId, runId)),
            resume: (runId, inputs = {}, podId = this.podId()) => this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowRunResume(podId, runId, inputs)),
            visualize: (runId, podId = this.podId()) => this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowRunVisualize(podId, runId)),
            cancel: (runId, podId = this.podId()) => this.postRunAction(runId, "cancel", podId),
            retry: (runId, podId = this.podId()) => this.postRunAction(runId, "retry", podId),
        };
    }
    list(options = {}) {
        return this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowList(this.podId(), options.limit ?? 100, options.pageToken));
    }
    create(payload) {
        return this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowCreate(this.podId(), payload));
    }
    get(workflowName) {
        return this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowGet(this.podId(), workflowName));
    }
    update(workflowName, payload) {
        return this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowUpdate(this.podId(), workflowName, payload));
    }
    delete(workflowName) {
        return this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowDelete(this.podId(), workflowName));
    }
    visualize(workflowName) {
        return this.client.request(() => WorkflowsService_js_1.WorkflowsService.workflowVisualize(this.podId(), workflowName));
    }
    async postRunAction(runId, action, podId) {
        const encodedPodId = encodeURIComponent(podId);
        const encodedRunId = encodeURIComponent(runId);
        try {
            return await this.http.request("POST", `/pods/${encodedPodId}/workflow-runs/${encodedRunId}/${action}`, { body: {} });
        }
        catch (error) {
            if (error instanceof http_js_1.ApiError && (error.statusCode === 404 || error.statusCode === 405)) {
                return this.http.request("POST", `/pods/${encodedPodId}/flow-runs/${encodedRunId}/${action}`, { body: {} });
            }
            throw error;
        }
    }
}
exports.WorkflowsNamespace = WorkflowsNamespace;

},
"./openapi_client/services/WorkflowsService.js": function (module, exports, require) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsService = void 0;
const OpenAPI_js_1 = require("./openapi_client/core/OpenAPI.js");
const request_js_1 = require("./openapi_client/core/request.js");
class WorkflowsService {
    /**
     * Create Workflow
     * Create a workflow definition. Use this before uploading graph nodes/edges with `workflow.graph.update`.
     * @param podId
     * @param requestBody
     * @returns FlowEntity Successful Response
     * @throws ApiError
     */
    static workflowCreate(podId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/workflows',
            path: {
                'pod_id': podId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Workflows
     * List all workflows in a pod.
     * @param podId
     * @param limit
     * @param pageToken
     * @returns WorkflowListResponse Successful Response
     * @throws ApiError
     */
    static workflowList(podId, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/workflows',
            path: {
                'pod_id': podId,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Workflow
     * Get a single workflow definition including graph and start configuration.
     * @param podId
     * @param workflowName
     * @returns FlowEntity Successful Response
     * @throws ApiError
     */
    static workflowGet(podId, workflowName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/workflows/{workflow_name}',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Workflow Metadata
     * Update workflow-level metadata such as description/install requirements. Workflow names are immutable after creation. Use `workflow.graph.update` for nodes and edges.
     * @param podId
     * @param workflowName
     * @param requestBody
     * @returns FlowEntity Successful Response
     * @throws ApiError
     */
    static workflowUpdate(podId, workflowName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PATCH',
            url: '/pods/{pod_id}/workflows/{workflow_name}',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Workflow
     * Delete a workflow definition.
     * @param podId
     * @param workflowName
     * @returns void
     * @throws ApiError
     */
    static workflowDelete(podId, workflowName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/workflows/{workflow_name}',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Workflow Graph
     * Replace the workflow graph. Agent/function node `input_mapping` entries must use explicit typed bindings. Use `{type: "expression", value: "start.payload.issue.key"}` for context lookups and `{type: "literal", value: "abc"}` for fixed JSON values.
     * @param podId
     * @param workflowName
     * @param requestBody
     * @returns FlowEntity Successful Response
     * @throws ApiError
     */
    static workflowGraphUpdate(podId, workflowName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'PUT',
            url: '/pods/{pod_id}/workflows/{workflow_name}/graph',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Install Workflow
     * Install a workflow for runtime execution. Provide `account_id` when the workflow needs an integration account binding.
     * @param podId
     * @param workflowName
     * @param requestBody
     * @returns FlowInstallEntity Successful Response
     * @throws ApiError
     */
    static workflowInstallCreate(podId, workflowName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/workflows/{workflow_name}/install',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Uninstall Workflow
     * Remove a previously created workflow installation binding.
     * @param podId
     * @param workflowName
     * @param installId
     * @returns void
     * @throws ApiError
     */
    static workflowInstallDelete(podId, workflowName, installId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'DELETE',
            url: '/pods/{pod_id}/workflows/{workflow_name}/installs/{install_id}',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
                'install_id': installId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Start Workflow
     * Start a new workflow run. For event/scheduled/datastore starts, the request body is treated as initial trigger payload and merged into execution context.
     * @param podId
     * @param workflowName
     * @param requestBody
     * @returns FlowRunEntity Successful Response
     * @throws ApiError
     */
    static workflowStart(podId, workflowName, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/workflows/{workflow_name}/start',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Visualize Workflow
     * Render an HTML visualization for debugging workflow graph structure.
     * @param podId
     * @param workflowName
     * @returns string Successful Response
     * @throws ApiError
     */
    static workflowVisualize(podId, workflowName) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/workflows/{workflow_name}/visualize',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Resume Workflow Run
     * Resume a run in WAITING or EXECUTING state. The payload is written back into the current waiting node output and execution continues.
     * @param podId
     * @param runId
     * @param requestBody
     * @returns FlowRunEntity Successful Response
     * @throws ApiError
     */
    static workflowRunResume(podId, runId, requestBody) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'POST',
            url: '/pods/{pod_id}/workflow-runs/{run_id}/resume',
            path: {
                'pod_id': podId,
                'run_id': runId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Workflow Run
     * Get current state, context, and step history of a workflow run.
     * @param podId
     * @param runId
     * @returns FlowRunEntity Successful Response
     * @throws ApiError
     */
    static workflowRunGet(podId, runId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/workflow-runs/{run_id}',
            path: {
                'pod_id': podId,
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Workflow Runs
     * List recent runs for a given workflow.
     * @param podId
     * @param workflowName
     * @param limit
     * @param pageToken
     * @returns WorkflowRunListResponse Successful Response
     * @throws ApiError
     */
    static workflowRunList(podId, workflowName, limit = 100, pageToken) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/workflow-runs/{workflow_name}/runs',
            path: {
                'pod_id': podId,
                'workflow_name': workflowName,
            },
            query: {
                'limit': limit,
                'page_token': pageToken,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Visualize Workflow Run
     * Render an HTML view of a run overlaid on its workflow graph.
     * @param podId
     * @param runId
     * @returns string Successful Response
     * @throws ApiError
     */
    static workflowRunVisualize(podId, runId) {
        return (0, request_js_1.request)(OpenAPI_js_1.OpenAPI, {
            method: 'GET',
            url: '/pods/{pod_id}/workflow-runs/{run_id}/visualize',
            path: {
                'pod_id': podId,
                'run_id': runId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
exports.WorkflowsService = WorkflowsService;

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
