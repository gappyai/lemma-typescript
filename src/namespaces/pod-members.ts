import type { GeneratedClientAdapter } from "../generated.js";
import type { PodMemberAddRequest } from "../openapi_client/models/PodMemberAddRequest.js";
import type { PodRole } from "../openapi_client/models/PodRole.js";
import { PodMembersService } from "../openapi_client/services/PodMembersService.js";

export class PodMembersNamespace {
  constructor(private readonly client: GeneratedClientAdapter) {}

  list(
    podId: string,
    options: { limit?: number; pageToken?: string; cursor?: string } = {},
  ) {
    return this.client.request(() =>
      PodMembersService.podMemberList(podId, options.limit ?? 100, options.pageToken ?? options.cursor),
    );
  }

  add(podId: string, payload: PodMemberAddRequest) {
    return this.client.request(() => PodMembersService.podMemberAdd(podId, payload));
  }

  updateRole(podId: string, memberId: string, role: PodRole) {
    return this.client.request(() =>
      PodMembersService.podMemberUpdateRole(podId, memberId, { role }),
    );
  }

  remove(podId: string, memberId: string) {
    return this.client.request(() => PodMembersService.podMemberRemove(podId, memberId));
  }
}
