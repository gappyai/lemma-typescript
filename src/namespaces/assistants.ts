import type { HttpClient } from "../http.js";

export class AssistantsNamespace {
  constructor(private readonly http: HttpClient, private readonly podId: () => string) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.http.request("GET", `/pods/${this.podId()}/assistants`, { params: options });
  }
  create(payload: Record<string, unknown>) {
    return this.http.request("POST", `/pods/${this.podId()}/assistants`, { body: payload });
  }
  get(assistantId: string) {
    return this.http.request("GET", `/pods/${this.podId()}/assistants/${assistantId}`);
  }
  update(assistantId: string, payload: Record<string, unknown>) {
    return this.http.request("PATCH", `/pods/${this.podId()}/assistants/${assistantId}`, { body: payload });
  }
  delete(assistantId: string) {
    return this.http.request("DELETE", `/pods/${this.podId()}/assistants/${assistantId}`);
  }
}

export class ConversationsNamespace {
  constructor(private readonly http: HttpClient, private readonly podId: () => string) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.http.request("GET", `/pods/${this.podId()}/conversations`, { params: options });
  }
  create(payload: Record<string, unknown>) {
    return this.http.request("POST", `/pods/${this.podId()}/conversations`, { body: payload });
  }
  get(conversationId: string) {
    return this.http.request("GET", `/pods/${this.podId()}/conversations/${conversationId}`);
  }

  readonly messages = {
    list: (conversationId: string, options: { limit?: number; pageToken?: string } = {}) =>
      this.http.request("GET", `/pods/${this.podId()}/conversations/${conversationId}/messages`, { params: options }),
    send: (conversationId: string, payload: Record<string, unknown>) =>
      this.http.request("POST", `/pods/${this.podId()}/conversations/${conversationId}/messages`, { body: payload }),
  };
}
