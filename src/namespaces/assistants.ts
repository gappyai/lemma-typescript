import type { GeneratedClientAdapter } from "../generated.js";
import { AssistantsService } from "../openapi_client/services/AssistantsService.js";
import { ConversationsService } from "../openapi_client/services/ConversationsService.js";
import type { CreateAssistantRequest } from "../openapi_client/models/CreateAssistantRequest.js";
import type { UpdateAssistantRequest } from "../openapi_client/models/UpdateAssistantRequest.js";
import type { CreateConversationRequest } from "../openapi_client/models/CreateConversationRequest.js";
import type { CreateMessageRequest } from "../openapi_client/models/CreateMessageRequest.js";

export class AssistantsNamespace {
  constructor(private readonly client: GeneratedClientAdapter, private readonly podId: () => string) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.client.request(() => AssistantsService.assistantList(this.podId(), options.limit ?? 100, options.pageToken));
  }
  create(payload: CreateAssistantRequest) {
    return this.client.request(() => AssistantsService.assistantCreate(this.podId(), payload));
  }
  get(assistantName: string) {
    return this.client.request(() => AssistantsService.assistantGet(this.podId(), assistantName));
  }
  update(assistantName: string, payload: UpdateAssistantRequest) {
    return this.client.request(() => AssistantsService.assistantUpdate(this.podId(), assistantName, payload));
  }
  delete(assistantName: string) {
    return this.client.request(() => AssistantsService.assistantDelete(this.podId(), assistantName));
  }
}

export class ConversationsNamespace {
  constructor(private readonly client: GeneratedClientAdapter, private readonly podId: () => string) {}

  list(options: { limit?: number; pageToken?: string } = {}) {
    return this.client.request(() => ConversationsService.conversationList(undefined, this.podId(), undefined, options.pageToken, options.limit ?? 20));
  }
  create(payload: Omit<CreateConversationRequest, "pod_id">) {
    return this.client.request(() => ConversationsService.conversationCreate({ ...payload, pod_id: this.podId() }));
  }
  get(conversationId: string) {
    return this.client.request(() => ConversationsService.conversationGet(conversationId, this.podId()));
  }

  readonly messages = {
    list: (conversationId: string, options: { limit?: number; pageToken?: string } = {}) =>
      this.client.request(() => ConversationsService.conversationMessageList(conversationId, this.podId(), options.pageToken, options.limit ?? 20)),
    send: (conversationId: string, payload: CreateMessageRequest) =>
      this.client.request(() => ConversationsService.conversationMessageCreate(conversationId, payload, this.podId())),
  };
}
