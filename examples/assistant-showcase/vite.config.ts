import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "lemma-sdk/react": path.resolve(__dirname, "../../src/react/index.ts"),
      "lemma-sdk": path.resolve(__dirname, "../../src/index.ts"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "https://api.asur.work",
        changeOrigin: true,
        secure: true,
        rewrite: (incomingPath) => incomingPath.replace(/^\/api/, ""),
      },
    },
  },
});
