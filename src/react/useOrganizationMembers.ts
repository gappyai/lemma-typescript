import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { OrganizationMember } from "../types.js";

export interface UseOrganizationMembersOptions {
  client: LemmaClient;
  organizationId: string;
  enabled?: boolean;
  autoLoad?: boolean;
  limit?: number;
  pageToken?: string;
}

export interface UseOrganizationMembersResult {
  members: OrganizationMember[];
  total: number;
  nextPageToken: string | null;
  isLoading: boolean;
  error: Error | null;
  refresh: (overrides?: { limit?: number; pageToken?: string }) => Promise<OrganizationMember[]>;
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useOrganizationMembers({
  client,
  organizationId,
  enabled = true,
  autoLoad = true,
  limit = 100,
  pageToken,
}: UseOrganizationMembersOptions): UseOrganizationMembersResult {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trimmedOrganizationId = organizationId.trim();
  const isEnabled = enabled && trimmedOrganizationId.length > 0;

  const refresh = useCallback(async (overrides: { limit?: number; pageToken?: string } = {}): Promise<OrganizationMember[]> => {
    if (!isEnabled) {
      setMembers([]);
      setTotal(0);
      setNextPageToken(null);
      setError(null);
      setIsLoading(false);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.organizations.members.list(trimmedOrganizationId, {
        limit: overrides.limit ?? limit,
        pageToken: overrides.pageToken ?? pageToken,
      });
      const nextMembers = response.items ?? [];
      setMembers(nextMembers);
      setTotal(nextMembers.length);
      setNextPageToken(response.next_page_token ?? null);
      return nextMembers;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load organization members.");
      setError(normalized);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [client, isEnabled, limit, pageToken, trimmedOrganizationId]);

  useEffect(() => {
    if (!isEnabled) {
      setMembers([]);
      setTotal(0);
      setNextPageToken(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, isEnabled, refresh]);

  return useMemo(() => ({
    members,
    total,
    nextPageToken,
    isLoading,
    error,
    refresh,
  }), [error, isLoading, members, nextPageToken, refresh, total]);
}
