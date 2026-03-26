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
  }

  /** Whether requests will use an injected Bearer token (testing mode). */
  get isTokenMode(): boolean {
    return this.injectedToken !== null;
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
   * Redirect to the auth service, passing the current URL as redirect_uri.
   * After the user authenticates, the auth service should redirect back to
   * the original URL and set the session cookie.
   */
  redirectToAuth(): void {
    if (typeof window === "undefined") {
      return;
    }
    const redirectUri = encodeURIComponent(window.location.href);
    window.location.href = `${this.authUrl}?redirect_uri=${redirectUri}`;
  }
}
