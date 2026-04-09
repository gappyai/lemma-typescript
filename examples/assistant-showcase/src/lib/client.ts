import { LemmaClient } from "lemma-sdk";

export interface ShowcaseConfig {
  apiUrl: string;
  authUrl: string;
  podId: string;
  assistantName: string;
  organizationId: string;
}

export function getShowcaseConfig(): ShowcaseConfig {
  return {
    apiUrl: import.meta.env.VITE_LEMMA_API_URL ?? "https://api.asur.work",
    authUrl: import.meta.env.VITE_LEMMA_AUTH_URL ?? "https://auth.asur.work",
    podId: import.meta.env.VITE_LEMMA_POD_ID ?? "",
    assistantName: import.meta.env.VITE_LEMMA_ASSISTANT_NAME ?? "",
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
