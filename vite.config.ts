import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app"),
    },
  },
  optimizeDeps: {
    exclude: [
      '@livekit/agents-monorepo',
      '@livekit/rtc-node',
    ],
  },
  ssr: {
    external: [
      '@livekit/agents-monorepo',
      '@livekit/rtc-node',
      '@std/async',
      'zod-to-json-schema',
      'heap-js',
      'uuid',
    ],
    noExternal: [
      '@livekit/rtc-node-*',
    ],
  },
});
