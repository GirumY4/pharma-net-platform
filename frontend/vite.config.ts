import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

// Safely derive __dirname in Node ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true, // Helpful for debugging in production
    rollupOptions: {
      output: {
        // Safe, smart code-splitting: Only isolate heavy packages (like recharts)
        // to prevent execution order issues between React and Material UI / Emotion.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-")) {
              return "charting";
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    // 🔒 Proxy API requests during local development to avoid CORS block
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
