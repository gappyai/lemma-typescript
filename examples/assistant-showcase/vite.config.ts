import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "lemma-sdk/react/styles.css": path.resolve(__dirname, "../../src/react/styles.css"),
      "lemma-sdk/react": path.resolve(__dirname, "../../src/react/index.ts"),
      "lemma-sdk": path.resolve(__dirname, "../../src/index.ts"),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "https://localhost",
        changeOrigin: true,
        secure: false,
        rewrite: (incomingPath) => incomingPath.replace(/^\/api/, ""),
      },
    },
  },
});
