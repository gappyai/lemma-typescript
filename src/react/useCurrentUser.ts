import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { User } from "../types.js";

export interface UseCurrentUserOptions {
  client: LemmaClient;
  enabled?: boolean;
  autoLoad?: boolean;
}

export interface UseCurrentUserResult {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<User | null>;
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useCurrentUser({
  client,
  enabled = true,
  autoLoad = true,
}: UseCurrentUserOptions): UseCurrentUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (): Promise<User | null> => {
    if (!enabled) {
      setUser(null);
      setError(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextUser = await client.users.current();
      setUser(nextUser);
      return nextUser;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load current user.");
      setError(normalized);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client, enabled]);

  useEffect(() => {
    if (!enabled) {
      setUser(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, enabled, refresh]);

  return useMemo(() => ({
    user,
    isLoading,
    error,
    refresh,
  }), [error, isLoading, refresh, user]);
}
