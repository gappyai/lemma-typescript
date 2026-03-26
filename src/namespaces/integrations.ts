import type { HttpClient } from "../http.js";

export class IntegrationsNamespace {
  constructor(private readonly http: HttpClient) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.http.request("GET", "/integrations/applications", { params: options });
  }
  get(applicationId: string) {
    return this.http.request("GET", `/integrations/applications/${applicationId}`);
  }

  readonly operations = {
    list: (applicationId: string) =>
      this.http.request("GET", `/integrations/applications/${applicationId}/operations`),
    get: (applicationId: string, operationName: string) =>
      this.http.request("GET", `/integrations/applications/${applicationId}/operations/${operationName}`),
    execute: (applicationId: string, operationName: string, payload: Record<string, unknown>, accountId?: string) =>
      this.http.request("POST", `/integrations/applications/${applicationId}/operations/${operationName}/execute`, {
        body: { payload, account_id: accountId },
      }),
    descriptor: (applicationId: string) =>
      this.http.request("GET", `/integrations/applications/${applicationId}/operations/descriptor`),
  };

  readonly triggers = {
    list: (options: { applicationId?: string } = {}) =>
      this.http.request("GET", "/integrations/applications/triggers", { params: { application_id: options.applicationId } }),
    get: (triggerId: string) =>
      this.http.request("GET", `/integrations/applications/triggers/${triggerId}`),
  };

  readonly accounts = {
    list: (options: { applicationId?: string } = {}) =>
      this.http.request("GET", "/integrations/accounts", { params: { application_id: options.applicationId } }),
    get: (accountId: string) =>
      this.http.request("GET", `/integrations/accounts/${accountId}`),
    delete: (accountId: string) =>
      this.http.request("DELETE", `/integrations/accounts/${accountId}`),
  };

  createConnectRequest(applicationId: string, payload: Record<string, unknown> = {}) {
    return this.http.request("POST", "/integrations/connect-requests", { body: { application_id: applicationId, ...payload } });
  }
}
