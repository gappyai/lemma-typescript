import { LemmaClient } from "lemma-sdk";

export interface ShowcaseConfig {
  apiUrl: string;
  authUrl: string;
  podId: string;
  assistantId: string;
  organizationId: string;
}

export function getShowcaseConfig(): ShowcaseConfig {
  return {
    apiUrl: import.meta.env.VITE_LEMMA_API_URL ?? "/api",
    authUrl: import.meta.env.VITE_LEMMA_AUTH_URL ?? "http://localhost:4173",
    podId: import.meta.env.VITE_LEMMA_POD_ID ?? "",
    assistantId: import.meta.env.VITE_LEMMA_ASSISTANT_ID ?? "",
    organizationId: import.meta.env.VITE_LEMMA_ORGANIZATION_ID ?? "",
  };
}

let client: LemmaClient | null = null;

export function getClient(): LemmaClient {
  if (!client) {
    const config = getShowcaseConfig();
    client = new LemmaClient({
      apiUrl: config.apiUrl,
      authUrl: config.authUrl,
      ...(config.podId ? { podId: config.podId } : {}),
    });
  }

  return client;
}
