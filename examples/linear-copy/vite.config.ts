import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: "lemma-sdk/react",
        replacement: path.resolve(__dirname, "../../src/react/index.ts"),
      },
      {
        find: "lemma-sdk",
        replacement: path.resolve(__dirname, "../../src/index.ts"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },
})
