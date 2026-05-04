import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/SMARTFROTA/" : "/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(currentDir, "index.html"),
      },
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/chunks/[name]-[hash].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
}));
