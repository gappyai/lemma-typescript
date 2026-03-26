/**
 * Shared Lemma client instance for the todo app.
 *
 * - apiUrl points to /api which Vite proxies to https://localhost (SSL skip)
 * - authUrl points to the auth frontend
 * - podId is the todolist pod we created via CLI
 *
 * For testing, pass ?lemma_token=<token> in the URL or set
 *   localStorage.setItem("lemma_token", "<token>")
 * in the browser console.
 */

import { LemmaClient } from "@lemma/client";

let _client: LemmaClient | null = null;

export function getClient(): LemmaClient {
  if (!_client) {
    _client = new LemmaClient({
      apiUrl: import.meta.env.VITE_LEMMA_API_URL ?? "/api",
      authUrl: import.meta.env.VITE_LEMMA_AUTH_URL ?? "http://localhost:4173",
      podId: import.meta.env.VITE_LEMMA_POD_ID ?? "019d28b7-8730-7221-83f7-66437cd4bb5a",
    });
  }
  return _client;
}

export const DATASTORE = "default";
export const TABLE = "todos";

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}
