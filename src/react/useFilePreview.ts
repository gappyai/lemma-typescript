import { useCallback, useEffect, useMemo, useState } from "react";
import type { LemmaClient } from "../client.js";
import type { DatastoreFileNamespace } from "../types.js";
import { normalizeError, resolvePodClient } from "./utils.js";

export type FilePreviewMode = "rendered" | "artifact";

export interface UseFilePreviewOptions {
  client: LemmaClient;
  podId?: string;
  path?: string | null;
  enabled?: boolean;
  autoLoad?: boolean;
  mode?: FilePreviewMode;
  artifact?: string;
  namespace?: DatastoreFileNamespace | null;
}

export interface UseFilePreviewResult {
  content: string | null;
  blob: Blob | null;
  isLoading: boolean;
  error: Error | null;
  refresh: (overrides?: {
    path?: string | null;
    mode?: FilePreviewMode;
    artifact?: string;
    namespace?: DatastoreFileNamespace | null;
  }) => Promise<string | null>;
}

export function useFilePreview({
  client,
  podId,
  path = null,
  enabled = true,
  autoLoad = true,
  mode = "rendered",
  artifact = "document.md",
  namespace,
}: UseFilePreviewOptions): UseFilePreviewResult {
  const [content, setContent] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const trimmedPath = typeof path === "string" ? path.trim() : "";
  const isEnabled = enabled && trimmedPath.length > 0;

  const refresh = useCallback(async (
    overrides: {
      path?: string | null;
      mode?: FilePreviewMode;
      artifact?: string;
      namespace?: DatastoreFileNamespace | null;
    } = {},
    signal?: AbortSignal,
  ): Promise<string | null> => {
    const nextPath = typeof overrides.path === "string" ? overrides.path.trim() : trimmedPath;
    const nextMode = overrides.mode ?? mode;
    const nextArtifact = overrides.artifact ?? artifact;
    if (!enabled || nextPath.length === 0) {
      setContent(null);
      setBlob(null);
      setError(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const scopedClient = resolvePodClient(client, podId);
      const nextNamespace = overrides.namespace ?? namespace;
      if (nextMode === "artifact") {
        const nextBlob = await scopedClient.files.converted.download(nextPath, nextArtifact, { namespace: nextNamespace });
        const text = await nextBlob.text();
        if (signal?.aborted) return null;
        setBlob(nextBlob);
        setContent(text);
        return text;
      }

      const rendered = await scopedClient.files.converted.render(nextPath, { namespace: nextNamespace });
      const text = typeof rendered === "string" ? rendered : String(rendered ?? "");
      if (signal?.aborted) return null;
      setBlob(null);
      setContent(text);
      return text;
    } catch (refreshError) {
      if (signal?.aborted) return null;
      setError(normalizeError(refreshError, "Failed to load file preview."));
      setContent(null);
      setBlob(null);
      return null;
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [artifact, client, enabled, mode, namespace, podId, trimmedPath]);

  useEffect(() => {
    if (!isEnabled) {
      setContent(null);
      setBlob(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!autoLoad) return;
    const controller = new AbortController();
    void refresh({}, controller.signal);
    return () => controller.abort();
  }, [autoLoad, isEnabled, refresh]);

  return useMemo(() => ({
    content,
    blob,
    isLoading,
    error,
    refresh,
  }), [blob, content, error, isLoading, refresh]);
}
