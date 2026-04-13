import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { JsonSchemaLike } from "../schema-form.js";
import type { Agent } from "../types.js";

export interface UseAgentInputSchemaOptions {
  client: LemmaClient;
  podId?: string;
  agentName: string;
  enabled?: boolean;
  autoLoad?: boolean;
}

export interface UseAgentInputSchemaResult {
  agent: Agent | null;
  inputSchema: JsonSchemaLike | null;
  outputSchema: JsonSchemaLike | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<Agent | null>;
}

function resolvePodClient(client: LemmaClient, podId?: string): LemmaClient {
  if (!podId || podId === client.podId) return client;
  return client.withPod(podId);
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export function useAgentInputSchema({
  client,
  podId,
  agentName,
  enabled = true,
  autoLoad = true,
}: UseAgentInputSchemaOptions): UseAgentInputSchemaResult {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trimmedAgentName = agentName.trim();
  const isEnabled = enabled && trimmedAgentName.length > 0;

  const refresh = useCallback(async (): Promise<Agent | null> => {
    if (!isEnabled) {
      setAgent(null);
      setError(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const nextAgent = await scopedClient.agents.get(trimmedAgentName);
      setAgent(nextAgent);
      return nextAgent;
    } catch (refreshError) {
      const normalized = normalizeError(refreshError, "Failed to load agent schema.");
      setError(normalized);
      setAgent(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [client, isEnabled, podId, trimmedAgentName]);

  useEffect(() => {
    if (!isEnabled) {
      setAgent(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, isEnabled, refresh]);

  return useMemo(() => ({
    agent,
    inputSchema: (agent?.input_schema ?? null) as JsonSchemaLike | null,
    outputSchema: (agent?.output_schema ?? null) as JsonSchemaLike | null,
    isLoading,
    error,
    refresh,
  }), [agent, error, isLoading, refresh]);
}
