import { builtinModules } from "node:module";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const NODE_BUILTINS = [
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
];

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "node20",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    ssr: "src/server.ts",
    rollupOptions: {
      external: NODE_BUILTINS,
      output: {
        entryFileNames: "server.js",
      },
    },
  },
});
