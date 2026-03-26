/**
 * Thin HTTP layer that wraps fetch with auth injection, error handling,
 * and automatic 401→unauthenticated state propagation.
 */

import type { AuthManager } from "./auth.js";

type RequestParams = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  params?: RequestParams;
  body?: unknown;
  isFormData?: boolean;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

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

  getBaseUrl(): string {
    return this.apiUrl;
  }

  private buildUrl(path: string, params?: RequestParams): string {
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

  private mergeHeaders(base: RequestInit, extra?: HeadersInit): RequestInit {
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

  private async parseError(response: Response): Promise<ApiError> {
    let message = response.statusText || "Request failed";
    let code: string | undefined;
    let details: unknown;
    let raw: unknown = null;

    try {
      const body = await response.json();
      raw = body;
      if (body && typeof body === "object") {
        const record = body as Record<string, unknown>;
        if (typeof record.message === "string") {
          message = record.message;
        }
        if (typeof record.code === "string") {
          code = record.code;
        }
        details = record.details;
      }
    } catch {
      // non-JSON error body
    }

    return new ApiError(response.status, message, code, details, raw);
  }

  private getRequestBody(options: RequestOptions): BodyInit | undefined {
    if (options.body === undefined) {
      return undefined;
    }

    if (options.isFormData && options.body instanceof FormData) {
      return options.body;
    }

    return JSON.stringify(options.body);
  }

  private buildRequestInit(method: string, options: RequestOptions): RequestInit {
    const initBase: RequestInit = {
      method,
      body: this.getRequestBody(options),
      signal: options.signal,
    };

    // For FormData, let the browser set Content-Type with boundary.
    const withAuth = options.isFormData
      ? {
          ...this.auth.getRequestInit(initBase),
          headers: Object.fromEntries(
            Object.entries(
              (this.auth.getRequestInit(initBase).headers as Record<string, string>) ?? {},
            ).filter(([key]) => key.toLowerCase() !== "content-type"),
          ),
        }
      : this.auth.getRequestInit(initBase);

    return this.mergeHeaders(withAuth, options.headers);
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
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
      return undefined as unknown as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as T;
  }

  async stream(
    path: string,
    options: Omit<RequestOptions, "isFormData"> & { method?: "GET" | "POST" | "PATCH" } = {},
  ): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(
      this.buildUrl(path, options.params),
      this.buildRequestInit(options.method ?? "GET", {
        ...options,
        headers: {
          Accept: "text/event-stream",
          ...options.headers,
        },
      }),
    );

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

  async requestBytes(method: string, path: string): Promise<Blob> {
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
