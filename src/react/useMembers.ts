import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { PodMember } from "../types.js";

export interface UseMembersOptions {
  client: LemmaClient;
  podId?: string;
  enabled?: boolean;
  autoLoad?: boolean;
  limit?: number;
  pageToken?: string;
}

export interface UseMembersResult {
  members: PodMember[];
  total: number;
  nextPageToken: string | null;
  isLoading: boolean;
  error: Error | null;
  refresh: (overrides?: { limit?: number; pageToken?: string }) => Promise<PodMember[]>;
}

function resolvePodId(client: LemmaClient, podId?: string): string {
  const resolved = podId ?? client.podId;
  if (!resolved) {
    throw new Error("podId is required. Pass podId or set it on LemmaClient.");
  }
  return resolved;
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useMembers({
  client,
  podId,
  enabled = true,
  autoLoad = true,
  limit = 100,
  pageToken,
}: UseMembersOptions): UseMembersResult {
  const [members, setMembers] = useState<PodMember[]>([]);
  const [total, setTotal] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (overrides: { limit?: number; pageToken?: string } = {}): Promise<PodMember[]> => {
    if (!enabled) return [];

    setIsLoading(true);
    setError(null);

    try {
      const resolvedPodId = resolvePodId(client, podId);
      const response = await client.podMembers.list(resolvedPodId, {
        limit: overrides.limit ?? limit,
        pageToken: overrides.pageToken ?? pageToken,
      });

      const nextMembers = response.items ?? [];
      setMembers(nextMembers);
      setTotal(response.total ?? nextMembers.length);
      setNextPageToken(response.next_page_token ?? null);
      return nextMembers;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load pod members.");
      setError(normalized);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [client, enabled, limit, pageToken, podId]);

  useEffect(() => {
    if (!enabled || !autoLoad) return;
    void refresh();
  }, [autoLoad, enabled, refresh]);

  return useMemo(() => ({
    members,
    total,
    nextPageToken,
    isLoading,
    error,
    refresh,
  }), [error, isLoading, members, nextPageToken, refresh, total]);
}
