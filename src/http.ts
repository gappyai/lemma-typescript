/**
 * Thin HTTP layer that wraps fetch with auth injection, error handling,
 * and automatic 401→unauthenticated state propagation.
 */

import type { AuthManager } from "./auth.js";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
    public readonly rawResponse?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class HttpClient {
  constructor(
    private readonly apiUrl: string,
    private readonly auth: AuthManager,
  ) {}

  private async parseError(response: Response): Promise<ApiError> {
    let message = response.statusText || "Request failed";
    let code: string | undefined;
    let details: unknown;
    let raw: unknown = null;

    try {
      const body = await response.json();
      raw = body;
      if (body && typeof body === "object") {
        message = (body as Record<string, unknown>).message as string ?? message;
        code = (body as Record<string, unknown>).code as string | undefined;
        details = (body as Record<string, unknown>).details;
      }
    } catch {
      // non-JSON error body
    }

    return new ApiError(response.status, message, code, details, raw);
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options: {
      params?: Record<string, string | number | boolean | undefined | null>;
      body?: unknown;
      isFormData?: boolean;
    } = {},
  ): Promise<T> {
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

    const initBase: RequestInit = { method };

    if (options.body !== undefined && !options.isFormData) {
      initBase.body = JSON.stringify(options.body);
    } else if (options.isFormData && options.body instanceof FormData) {
      initBase.body = options.body;
    }

    // For FormData, let the browser set Content-Type with boundary
    const init = options.isFormData
      ? {
          ...this.auth.getRequestInit(initBase),
          headers: Object.fromEntries(
            Object.entries(
              (this.auth.getRequestInit(initBase).headers as Record<string, string>) ?? {},
            ).filter(([k]) => k.toLowerCase() !== "content-type"),
          ),
        }
      : this.auth.getRequestInit(initBase);

    const response = await fetch(url, init);

    if (response.status === 401 || response.status === 403) {
      this.auth.markUnauthenticated();
    }

    if (!response.ok) {
      throw await this.parseError(response);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as T;
  }

  async requestBytes(method: string, path: string): Promise<Blob> {
    const url = `${this.apiUrl}${path}`;
    const response = await fetch(url, this.auth.getRequestInit({ method }));

    if (response.status === 401 || response.status === 403) {
      this.auth.markUnauthenticated();
    }

    if (!response.ok) {
      throw await this.parseError(response);
    }

    return response.blob();
  }
}
