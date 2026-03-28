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

import Session from "supertokens-web-js/recipe/session";
import { ensureCookieSessionSupport } from "./supertokens.js";

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  [key: string]: unknown;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  user: UserInfo | null;
}

export type AuthListener = (state: AuthState) => void;

export type AuthRedirectMode = "login" | "signup";

export interface BuildAuthUrlOptions {
  /** Optional auth path segment relative to authUrl pathname, e.g. "callback" -> /auth/callback. */
  path?: string;
  /** Adds signup mode query, preserving existing params. */
  mode?: AuthRedirectMode;
  /** Redirect URI passed to auth service. */
  redirectUri?: string;
  /** Additional query parameters appended to auth URL. */
  params?: Record<string, string | number | boolean | Array<string | number | boolean> | null | undefined>;
}

export interface ResolveSafeRedirectUriOptions {
  /** Origin for resolving relative paths. */
  siteOrigin: string;
  /** Fallback path or URL when input is empty/invalid/blocked. Defaults to "/". */
  fallback?: string;
  /** Local paths blocked as redirect targets to avoid auth loops. */
  blockedPaths?: string[];
}

const DEFAULT_BLOCKED_REDIRECT_PATHS = ["/login", "/signup", "/auth"];

const LOCALSTORAGE_TOKEN_KEY = "lemma_token";
const QUERY_PARAM_TOKEN_KEY = "lemma_token";

function detectInjectedToken(): string | null {
  if (typeof window === "undefined") return null;

  // 1. Query param — highest priority, persist to sessionStorage for this session
  try {
    const params = new URLSearchParams(window.location.search);
    const qpToken = params.get(QUERY_PARAM_TOKEN_KEY);
    if (qpToken) {
      try { sessionStorage.setItem(LOCALSTORAGE_TOKEN_KEY, qpToken); } catch { /* ignore */ }
      return qpToken;
    }
  } catch { /* ignore */ }

  // 2. sessionStorage — survives HMR and same-tab navigation
  try {
    const stored = sessionStorage.getItem(LOCALSTORAGE_TOKEN_KEY);
    if (stored) return stored;
  } catch { /* ignore */ }

  // 3. localStorage — set manually by dev/agent for persistent testing
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);
    if (stored) return stored;
  } catch { /* ignore */ }

  return null;
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  if (trimmed === "/") return "/";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

function resolveAuthPath(basePath: string, path?: string): string {
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

function isBlockedLocalPath(pathname: string, blockedPaths: string[]): boolean {
  const normalizedPathname = normalizePath(pathname);
  return blockedPaths.some((rawBlockedPath) => {
    const blockedPath = normalizePath(rawBlockedPath);
    return normalizedPathname === blockedPath || normalizedPathname.startsWith(`${blockedPath}/`);
  });
}

function normalizeOrigin(rawOrigin: string): string {
  const parsed = new URL(rawOrigin);
  return parsed.origin;
}

export function buildAuthUrl(authUrl: string, options: BuildAuthUrlOptions = {}): string {
  const url = new URL(authUrl);
  url.pathname = resolveAuthPath(url.pathname, options.path);

  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value === null || value === undefined) continue;
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

export function resolveSafeRedirectUri(
  rawValue: string | null | undefined,
  options: ResolveSafeRedirectUriOptions,
): string {
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
  } catch {
    return fallback;
  }
}

export class AuthManager {
  private readonly apiUrl: string;
  private readonly authUrl: string;
  private injectedToken: string | null;
  private state: AuthState = { status: "loading", user: null };
  private listeners: Set<AuthListener> = new Set();

  constructor(apiUrl: string, authUrl: string) {
    this.apiUrl = apiUrl;
    this.authUrl = authUrl;
    this.injectedToken = detectInjectedToken();

    if (!this.injectedToken) {
      ensureCookieSessionSupport(this.apiUrl, () => this.markUnauthenticated());
    }
  }

  /** Whether requests will use an injected Bearer token (testing mode). */
  get isTokenMode(): boolean {
    return this.injectedToken !== null;
  }

  /** The current injected Bearer token, if token-mode auth is active. */
  getBearerToken(): string | null {
    return this.injectedToken;
  }

  /** The current auth state. */
  getState(): AuthState {
    return this.state;
  }

  /** True if currently authenticated (status === "authenticated"). */
  isAuthenticated(): boolean {
    return this.state.status === "authenticated";
  }

  /** Subscribe to auth state changes. Returns an unsubscribe function. */
  subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.state));
  }

  private setState(state: AuthState): void {
    this.state = state;
    this.notify();
  }

  private assertBrowserContext(): void {
    if (typeof window === "undefined") {
      throw new Error("This auth method is only available in browser environments.");
    }
  }

  private getCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  private clearInjectedToken(): void {
    this.injectedToken = null;
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(LOCALSTORAGE_TOKEN_KEY);
    } catch {
      // ignore storage errors
    }
    try {
      localStorage.removeItem(LOCALSTORAGE_TOKEN_KEY);
    } catch {
      // ignore storage errors
    }
  }

  private async rawSignOutViaBackend(): Promise<void> {
    const antiCsrf = this.getCookie("sAntiCsrf");
    const headers: Record<string, string> = {
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
  async isAuthenticatedViaCookie(): Promise<boolean> {
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
    } catch {
      return false;
    }
  }

  /**
   * Return a browser access token from the session layer.
   * Throws if no token is available.
   */
  async getAccessToken(): Promise<string> {
    if (this.injectedToken) {
      return this.injectedToken;
    }

    this.assertBrowserContext();
    ensureCookieSessionSupport(this.apiUrl, () => this.markUnauthenticated());

    const token = await Session.getAccessToken();
    if (!token) {
      throw new Error("Token unavailable");
    }
    return token;
  }

  /**
   * Force a refresh-token flow and return the new access token.
   */
  async refreshAccessToken(): Promise<string> {
    if (this.injectedToken) {
      return this.injectedToken;
    }

    this.assertBrowserContext();
    ensureCookieSessionSupport(this.apiUrl, () => this.markUnauthenticated());

    const refreshed = await Session.attemptRefreshingSession();
    if (!refreshed) {
      throw new Error("Session refresh failed");
    }

    const token = await Session.getAccessToken();
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
  getRequestInit(init: RequestInit = {}): RequestInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers as Record<string, string> | undefined),
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
  async checkAuth(): Promise<AuthState> {
    this.setState({ status: "loading", user: null });
    try {
      const response = await fetch(
        `${this.apiUrl}/users/me`,
        this.getRequestInit({ method: "GET" }),
      );

      // Only 401 means not authenticated — 403 means authenticated but forbidden
      if (response.status === 401) {
        const next: AuthState = { status: "unauthenticated", user: null };
        this.setState(next);
        return next;
      }

      if (!response.ok) {
        // For non-401 errors on /users/me, treat as unauthenticated (conservative)
        const next: AuthState = { status: "unauthenticated", user: null };
        this.setState(next);
        return next;
      }

      const user = (await response.json()) as UserInfo;
      const next: AuthState = { status: "authenticated", user };
      this.setState(next);
      return next;
    } catch {
      const next: AuthState = { status: "unauthenticated", user: null };
      this.setState(next);
      return next;
    }
  }

  /**
   * Mark the session as unauthenticated (e.g. after a 401 response).
   * Does NOT redirect — call redirectToAuth() explicitly if desired.
   */
  markUnauthenticated(): void {
    this.setState({ status: "unauthenticated", user: null });
  }

  /**
   * Sign out the current user session.
   * Returns true when the session is no longer active.
   */
  async signOut(): Promise<boolean> {
    if (this.injectedToken) {
      this.clearInjectedToken();
      this.markUnauthenticated();
      return true;
    }

    this.assertBrowserContext();
    ensureCookieSessionSupport(this.apiUrl, () => this.markUnauthenticated());

    try {
      await Session.signOut();
    } catch {
      // continue with raw fallback
    }

    if (await this.isAuthenticatedViaCookie()) {
      try {
        await this.rawSignOutViaBackend();
      } catch {
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
  getAuthUrl(options: BuildAuthUrlOptions = {}): string {
    return buildAuthUrl(this.authUrl, options);
  }

  /**
   * Redirect to the auth service, passing the current URL as redirect_uri.
   * After the user authenticates, the auth service should redirect back to
   * the original URL and set the session cookie.
   */
  redirectToAuth(options: Omit<BuildAuthUrlOptions, "redirectUri"> & { redirectUri?: string } = {}): void {
    if (typeof window === "undefined") {
      return;
    }
    const redirectUri = options.redirectUri ?? window.location.href;
    window.location.href = this.getAuthUrl({ ...options, redirectUri });
  }
}
