import type { HttpClient } from "../http.js";
import type { OrganizationRole } from "../openapi_client/models/OrganizationRole.js";
import type { PodRole } from "../openapi_client/models/PodRole.js";

export type PodJoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PodJoinRequest {
  id: string;
  pod_id: string;
  organization_id: string;
  user_id: string;
  status: PodJoinRequestStatus;
  requested_at: string;
  approved_at?: string | null;
  approved_by_user_id?: string | null;
  org_role?: OrganizationRole | null;
  pod_role?: PodRole | null;
  created_at: string;
  updated_at: string;
}

export interface PodJoinRequestListResponse {
  items: PodJoinRequest[];
  limit: number;
  total: number;
  next_page_token?: string | null;
}

export class PodJoinRequestsNamespace {
  constructor(private readonly http: HttpClient) {}

  create(podId: string) {
    return this.http.request<PodJoinRequest>("POST", `/pods/${podId}/join-requests`);
  }

  me(podId: string) {
    return this.http.request<PodJoinRequest | null>("GET", `/pods/${podId}/join-requests/me`);
  }

  list(
    podId: string,
    options: {
      status?: PodJoinRequestStatus;
      limit?: number;
      pageToken?: string;
      cursor?: string;
    } = {},
  ) {
    return this.http.request<PodJoinRequestListResponse>("GET", `/pods/${podId}/join-requests`, {
      params: {
        status_filter: options.status,
        limit: options.limit ?? 100,
        page_token: options.pageToken ?? options.cursor,
      },
    });
  }

  approve(
    podId: string,
    joinRequestId: string,
    payload: {
      orgRole?: OrganizationRole;
      podRole?: PodRole;
    } = {},
  ) {
    return this.http.request<PodJoinRequest>(
      "POST",
      `/pods/${podId}/join-requests/${joinRequestId}/approve`,
      {
        body: {
          org_role: payload.orgRole ?? "ORG_MEMBER",
          pod_role: payload.podRole ?? "POD_USER",
        },
      },
    );
  }
}
