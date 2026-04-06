/**
 * Browser bundle entry point.
 * Exposes LemmaClient as globalThis.LemmaClient.LemmaClient
 *
 * Usage in HTML:
 *   <script src="/lemma-client.js"></script>
 *   <script>
 *     const client = new window.LemmaClient.LemmaClient({ podId: "...", apiUrl: "..." });
 *   </script>
 */
export { LemmaClient } from "./client.js";
export {
  AuthManager,
  buildAuthUrl,
  buildFederatedLogoutUrl,
  clearTestingToken,
  getTestingToken,
  resolveSafeRedirectUri,
  setTestingToken,
} from "./auth.js";
export { ApiError } from "./http.js";
