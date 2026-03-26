import type { AuthManager } from "./auth.js";
import { ApiError } from "./http.js";
import { ApiError as GeneratedApiError } from "./openapi_client/core/ApiError.js";
import { OpenAPI } from "./openapi_client/core/OpenAPI.js";

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && typeof (body as Record<string, unknown>).message === "string") {
    return (body as Record<string, string>).message;
  }
  return fallback;
}

function extractCode(body: unknown): string | undefined {
  if (body && typeof body === "object" && typeof (body as Record<string, unknown>).code === "string") {
    return (body as Record<string, string>).code;
  }
  return undefined;
}

function extractDetails(body: unknown): unknown {
  if (body && typeof body === "object" && "details" in (body as Record<string, unknown>)) {
    return (body as Record<string, unknown>).details;
  }
  return undefined;
}

export class GeneratedClientAdapter {
  constructor(
    private readonly apiUrl: string,
    private readonly auth: AuthManager,
  ) {}

  private configure(): void {
    OpenAPI.BASE = this.apiUrl;
    OpenAPI.WITH_CREDENTIALS = true;
    OpenAPI.CREDENTIALS = this.auth.isTokenMode ? "omit" : "include";
    OpenAPI.TOKEN = this.auth.getBearerToken() ?? undefined;
    OpenAPI.HEADERS = undefined;
  }

  async request<T>(operation: () => PromiseLike<T>): Promise<T> {
    this.configure();

    try {
      return await operation();
    } catch (error) {
      if (error instanceof GeneratedApiError) {
        if (error.status === 401) {
          this.auth.markUnauthenticated();
        }

        throw new ApiError(
          error.status,
          extractMessage(error.body, error.message),
          extractCode(error.body),
          extractDetails(error.body),
          error.body,
        );
      }

      throw error;
    }
  }
}
