import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

// Standalone SPA build for static hosting (cPanel, Netlify static, S3, etc.).
// Does NOT use TanStack Start / SSR — outputs a plain index.html + assets bundle
// to `dist-static/`. The Lovable preview and Publish flow continue to use the
// default TanStack Start build via vite.config.ts.
export default defineConfig({
  root: path.resolve(__dirname, "static"),
  publicDir: path.resolve(__dirname, "public"),
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist-static"),
    emptyOutDir: true,
    sourcemap: false,
  },
});
