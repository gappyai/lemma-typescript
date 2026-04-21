import type { GeneratedClientAdapter } from "../generated.js";
import type { ConnectRequestInitiateSchema } from "../openapi_client/models/ConnectRequestInitiateSchema.js";
import type { IntegrationHelperAgentRequest } from "../openapi_client/models/IntegrationHelperAgentRequest.js";
import type { OperationDetailsBatchRequest } from "../openapi_client/models/OperationDetailsBatchRequest.js";
import type { OperationExecutionRequest } from "../openapi_client/models/OperationExecutionRequest.js";
import { AgentToolsService } from "../openapi_client/services/AgentToolsService.js";
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
    discover: (applicationId: string, options: { query?: string; limit?: number } = {}) =>
      this.client.request(() => ApplicationsService.applicationOperationDiscover(
        applicationId,
        options.query,
        options.limit ?? 100,
      )),
    list: async (applicationId: string, options: { query?: string; limit?: number } = {}) => {
      const response = await this.client.request(() => ApplicationsService.applicationOperationDiscover(
        applicationId,
        options.query,
        options.limit ?? 100,
      ));
      return response.items ?? [];
    },
    get: (applicationId: string, operationName: string) =>
      this.client.request(() => ApplicationsService.applicationOperationDetail(applicationId, operationName)),
    details: (applicationId: string, operationNames?: string[]) => {
      const body: OperationDetailsBatchRequest = { operation_names: operationNames };
      return this.client.request(() => ApplicationsService.applicationOperationDetailsBatch(applicationId, body));
    },
    execute: (applicationId: string, operationName: string, payload: Record<string, unknown>, accountId?: string) => {
      const body: OperationExecutionRequest = { payload, account_id: accountId };
      return this.client.request(() => ApplicationsService.applicationOperationExecute(applicationId, operationName, body));
    },
  };

  helperAgent(
    goal: string,
    appNames: string[],
  ) {
    const body: IntegrationHelperAgentRequest = {
      app_names: appNames,
      goal,
    };
    return this.client.request(() => AgentToolsService.toolIntegrationHelperAgent(body));
  }

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
