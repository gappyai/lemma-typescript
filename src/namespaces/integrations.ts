import type { GeneratedClientAdapter } from "../generated.js";
import type { ConnectRequestInitiateSchema } from "../openapi_client/models/ConnectRequestInitiateSchema.js";
import type { OperationExecutionRequest } from "../openapi_client/models/OperationExecutionRequest.js";
import { ApplicationsService } from "../openapi_client/services/ApplicationsService.js";
import { IntegrationsService } from "../openapi_client/services/IntegrationsService.js";

export class IntegrationsNamespace {
  constructor(private readonly client: GeneratedClientAdapter) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.client.request(() => ApplicationsService.applicationList(options.limit ?? 100, options.pageToken));
  }
  get(applicationId: string) {
    return this.client.request(() => ApplicationsService.applicationGet(applicationId));
  }

  readonly operations = {
    list: (applicationId: string) =>
      this.client.request(() => ApplicationsService.applicationOperationList(applicationId)),
    get: (applicationId: string, operationName: string) =>
      this.client.request(() => ApplicationsService.applicationOperationDetail(applicationId, operationName)),
    execute: (applicationId: string, operationName: string, payload: Record<string, unknown>, accountId?: string) => {
      const body: OperationExecutionRequest = { payload, account_id: accountId };
      return this.client.request(() => ApplicationsService.applicationOperationExecute(applicationId, operationName, body));
    },
    descriptor: (applicationId: string) =>
      this.client.request(() => ApplicationsService.applicationDescriptor(applicationId)),
  };

  readonly triggers = {
    list: (options: { applicationId?: string; search?: string; limit?: number; pageToken?: string } = {}) =>
      this.client.request(() => ApplicationsService.applicationTriggerList(
        options.applicationId,
        options.search,
        options.limit ?? 100,
        options.pageToken,
      )),
    get: (triggerId: string) =>
      this.client.request(() => ApplicationsService.applicationTriggerGet(triggerId)),
  };

  readonly accounts = {
    list: (options: { applicationId?: string; limit?: number; pageToken?: string } = {}) =>
      this.client.request(() => IntegrationsService.integrationAccountList(
        options.applicationId,
        options.limit ?? 100,
        options.pageToken,
      )),
    get: (accountId: string) =>
      this.client.request(() => IntegrationsService.integrationAccountGet(accountId)),
    credentials: (accountId: string) =>
      this.client.request(() => IntegrationsService.integrationAccountCredentialsGet(accountId)),
    delete: (accountId: string) =>
      this.client.request(() => IntegrationsService.integrationAccountDelete(accountId)),
  };

  createConnectRequest(applicationId: string) {
    const payload: ConnectRequestInitiateSchema = { application_id: applicationId };
    return this.client.request(() => IntegrationsService.integrationConnectRequestCreate(payload));
  }
}
