// frontend/vite.config.ts
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import Sitemap from "vite-plugin-sitemap";

// Safely derive __dirname in Node ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rawSiteUrl =
  process.env.VITE_SITE_URL ??
  process.env.SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL ??
  "http://localhost:5173";

const siteUrl = rawSiteUrl.startsWith("http")
  ? rawSiteUrl
  : `https://${rawSiteUrl}`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    Sitemap({
      hostname: siteUrl,
      dynamicRoutes: ["/marketplace"], // Auto-discover marketplace pages
      exclude: [
        "/", // Exclude root if it redirects
        "/admin/",
        "/dashboard",
        "/inventory",
        "/orders",
        "/reports",
        "/settings",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password/",
        "/confirm-deactivation/",
        "/confirm-reactivation/",
        "/unauthorized",
      ],
      changefreq: "daily",
      priority: 0.9,
      readable: true,
      // Generate robots.txt automatically
     robots: [
  {
    userAgent: "*",
    allow: "/",
    disallow: [
      "/admin/",
      "/dashboard",
      "/inventory",
      "/orders",
      "/reports",
      "/settings",
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password/",
      "/confirm-deactivation/",
      "/confirm-reactivation/",
      "/unauthorized",
    ],
  },
],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-")) {
              return "charting";
            }
            // Return undefined for other node_modules to let Vite handle normally
            return;
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});