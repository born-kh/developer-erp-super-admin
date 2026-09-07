import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
    },
  },
  server: {
    port: 5174,
    host: "127.0.0.1",
    proxy: {
      "/core/api": {
        target: "http://195.246.102.223:9595",
        changeOrigin: true,
      },
      "/accounting/api": {
        target: "http://195.246.102.223:9595",
        changeOrigin: true,
      },
    },
  },
  preview: { port: 4174, host: "127.0.0.1" },
});
