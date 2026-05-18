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
        manualChunks: {
          // Chunk splitting for optimal browser loading speeds
          vendor: ["react", "react-dom", "react-router-dom"],
          mui: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
          charting: ["recharts"], // Isolating heavy charting dependencies
          utils: ["axios", "lodash", "react-hook-form"],
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
