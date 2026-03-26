import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve lemma-sdk to the SDK source directly (no build step needed)
      "lemma-sdk/react": path.resolve(__dirname, "../../src/react/index.ts"),
      "lemma-sdk": path.resolve(__dirname, "../../src/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api calls to the Lemma backend, bypass self-signed cert
      "/api": {
        target: "https://localhost",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
